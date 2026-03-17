import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const parseRange = (range?: string) => {
    const now = new Date();
    const end = new Date(now);
    const start = new Date(now);
    const key = range === 'week' || range === 'month' ? range : 'today';

    if (key === 'today') {
        start.setHours(0, 0, 0, 0);
    } else if (key === 'week') {
        const day = start.getDay();
        const diff = (day + 6) % 7; // Monday start
        start.setDate(start.getDate() - diff);
        start.setHours(0, 0, 0, 0);
    } else {
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
    }

    return { start, end, key };
};

const average = (values: number[]) =>
    values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

const normalizeDigits = (value?: string | null) => {
    if (!value) return '';
    return String(value).replace(/\D/g, '');
};

const normalizeNameKey = (value?: string | null) => {
    if (!value) return '';
    return String(value)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
};

const isSystemPhone = (digits: string) => {
    if (!digits) return false;
    if (/^1\d{3}5550\d{3}$/.test(digits)) return true;
    if (/^\d{3}5550\d{3}$/.test(digits)) return true;
    return false;
};

const isSystemName = (name?: string | null) => {
    const key = normalizeNameKey(name);
    if (!key) return false;
    return (
        key.includes('meta ai') ||
        key.includes('whatsapp') ||
        key.includes('support') ||
        key.includes('status') ||
        key.includes('messages to self') ||
        key.includes('mensagens para mim')
    );
};

const isSystemChatId = (chatId?: string | null) => {
    if (!chatId) return false;
    return (
        chatId.includes('@g.us') ||
        chatId.includes('status@broadcast') ||
        chatId.includes('broadcast') ||
        chatId.includes('newsletter')
    );
};

const buildSummary = async (ownerId: string, rangeKey: string) => {
    const { start, end, key } = parseRange(rangeKey);

    const events = await prisma.attendanceEvent.findMany({
        where: {
            ownerId,
            timestamp: {
                gte: start,
                lte: end
            }
        },
        orderBy: { timestamp: 'asc' }
    });

    const chatIds = Array.from(new Set(events.map((event) => event.chatId)));
    const hasHistory = new Set<string>();

    if (chatIds.length) {
        const prior = await prisma.attendanceEvent.findMany({
            where: {
                ownerId,
                chatId: { in: chatIds },
                timestamp: { lt: start }
            },
            select: { chatId: true },
            distinct: ['chatId']
        });
        prior.forEach((item) => hasHistory.add(item.chatId));
    }

    const eventsByChat = new Map<string, typeof events>();
    const inboundChats = new Set<string>();
    events.forEach((event) => {
        const list = eventsByChat.get(event.chatId) || [];
        list.push(event);
        eventsByChat.set(event.chatId, list);
        if (event.direction === 'in') inboundChats.add(event.chatId);
    });

    const novosChats = new Set<string>();
    const retornosChats = new Set<string>();
    inboundChats.forEach((chatId) => {
        if (hasHistory.has(chatId)) {
            retornosChats.add(chatId);
        } else {
            novosChats.add(chatId);
        }
    });

    const responseTimes: number[] = [];
    const firstResponseTimes: number[] = [];
    const atendidosChats = new Set<string>();

    eventsByChat.forEach((list, chatId) => {
        let firstInbound: Date | null = null;

        for (const event of list) {
            if (event.direction === 'in' && !firstInbound) {
                firstInbound = event.timestamp;
            }

            if (firstInbound && event.direction === 'out') {
                const diff = (event.timestamp.getTime() - firstInbound.getTime()) / 1000;
                responseTimes.push(diff);
                atendidosChats.add(chatId);
                if (novosChats.has(chatId)) {
                    firstResponseTimes.push(diff);
                }
                break; // only first response per chat
            }
        }
    });

    const lastEvents = await prisma.$queryRaw<
        Array<{
            chatId: string;
            name: string | null;
            phone: string | null;
            timestamp: Date | string;
            direction: string;
        }>
    >`
        SELECT chatId, name, phone, timestamp, direction
        FROM (
            SELECT chatId,
                   name,
                   phone,
                   timestamp,
                   direction,
                   createdAt,
                   ROW_NUMBER() OVER (PARTITION BY chatId ORDER BY timestamp DESC, createdAt DESC) AS rn
            FROM AttendanceEvent
            WHERE ownerId = ${ownerId}
        ) ranked
        WHERE rn = 1
    `;

    const pendingMap = new Map<
        string,
        {
            chatId: string;
            name: string;
            phone?: string;
            waitingSeconds: number;
            timestamp: Date;
        }
    >();

    lastEvents.forEach((event) => {
        if (event.direction !== 'in') return;
        if (isSystemChatId(event.chatId) || isSystemName(event.name)) return;
        const timestamp = event.timestamp instanceof Date ? event.timestamp : new Date(event.timestamp);
        if (Number.isNaN(timestamp.getTime())) return;
        const waitingSeconds = (end.getTime() - timestamp.getTime()) / 1000;
        const phoneDigits = normalizeDigits(event.phone || event.chatId);
        const normalizedPhone =
            phoneDigits.length >= 8 && phoneDigits.length <= 15 && !isSystemPhone(phoneDigits) ? phoneDigits : '';
        const name = event.name || event.phone || 'Contato';
        const nameKey = normalizeNameKey(name);
        const dedupeKey = normalizedPhone || nameKey || event.chatId;
        if (!dedupeKey) return;

        const entry = {
            chatId: event.chatId,
            name,
            phone: event.phone || undefined,
            waitingSeconds: waitingSeconds < 0 ? 0 : waitingSeconds,
            timestamp
        };
        const existing = pendingMap.get(dedupeKey);
        if (!existing || entry.timestamp > existing.timestamp) {
            pendingMap.set(dedupeKey, entry);
        }
    });

    const pendingAll = Array.from(pendingMap.values()).sort((a, b) => b.waitingSeconds - a.waitingSeconds);

    const targetSeconds = 300;
    const responsePct = responseTimes.length
        ? (responseTimes.filter((value) => value <= targetSeconds).length / responseTimes.length) * 100
        : 0;
    const firstPct = firstResponseTimes.length
        ? (firstResponseTimes.filter((value) => value <= targetSeconds).length / firstResponseTimes.length) * 100
        : 0;

    return {
        range: key,
        updatedAt: end.toISOString(),
        counts: {
            novos: novosChats.size,
            retornos: retornosChats.size,
            atendidos: atendidosChats.size,
            semResposta: pendingAll.length
        },
        response: {
            averageSeconds: average(responseTimes),
            targetSeconds,
            pctWithinTarget: responsePct
        },
        firstResponse: {
            averageSeconds: average(firstResponseTimes),
            targetSeconds,
            pctWithinTarget: firstPct,
            newLeadCount: novosChats.size
        },
        pending: pendingAll.slice(0, 20)
    };
};

export const attendanceController = {
    saveEvents: async (req: Request, res: Response) => {
        try {
            const { ownerId, events } = req.body || {};
            if (!ownerId) {
                res.status(400).json({ error: 'ownerId required' });
                return;
            }
            if (!Array.isArray(events) || !events.length) {
                res.json({ count: 0 });
                return;
            }

            const payload = events
                .map((event: any) => {
                    if (!event?.chatId || !event?.messageId || !event?.direction || !event?.timestamp) {
                        return null;
                    }
                    const timestamp = new Date(String(event.timestamp));
                    if (Number.isNaN(timestamp.getTime())) {
                        return null;
                    }
                    return {
                        ownerId: String(ownerId),
                        chatId: String(event.chatId),
                        messageId: String(event.messageId),
                        direction: String(event.direction) === 'out' ? 'out' : 'in',
                        timestamp,
                        name: event.name ? String(event.name) : null,
                        phone: event.phone ? String(event.phone) : null
                    };
                })
                .filter(Boolean) as any[];

            if (!payload.length) {
                res.json({ count: 0 });
                return;
            }

            const existing = await prisma.attendanceEvent.findMany({
                where: {
                    ownerId: String(ownerId),
                    messageId: { in: payload.map((item) => item.messageId) }
                },
                select: { messageId: true }
            });
            const existingIds = new Set(existing.map((item) => item.messageId));
            const toInsert = payload.filter((item) => !existingIds.has(item.messageId));

            if (!toInsert.length) {
                res.json({ count: 0 });
                return;
            }

            const result = await prisma.attendanceEvent.createMany({
                data: toInsert
            });

            res.json({ count: result.count });
        } catch (error: any) {
            console.error('Attendance save failed:', error);
            res.status(500).json({ error: error?.message || 'Failed to save attendance events' });
        }
    },

    getSummary: async (req: Request, res: Response) => {
        try {
            const ownerId = String(req.query.ownerId || '').trim();
            if (!ownerId) {
                res.status(400).json({ error: 'ownerId required' });
                return;
            }
            const range = String(req.query.range || 'today');
            const summary = await buildSummary(ownerId, range);
            res.json(summary);
        } catch (error: any) {
            console.error('Attendance summary failed:', error);
            res.status(500).json({ error: error?.message || 'Failed to fetch attendance summary' });
        }
    }
};
