import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { assignLeadIfEligible } from '../services/leadRouletteService';

const prisma = new PrismaClient();

const parseJsonArray = (value?: string | null) => {
    if (!value) return [];
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const parseNotes = (value?: string | null) => {
    if (!value) return [];
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed : [value];
    } catch {
        return [value];
    }
};

const formatLead = (lead: any) => ({
    ...lead,
    tags: parseJsonArray(lead.tags),
    notes: parseNotes(lead.notes),
});

const normalizeTextKey = (value: string) => {
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
};

const normalizeSourceValue = (value: unknown) => {
    if (value == null) return null;
    const key = normalizeTextKey(String(value));
    if (!key) return null;
    if (key.includes('whatsapp')) return 'whatsapp';
    if (key === 'site' || key === 'web' || key === 'website') return 'site';
    if (key === 'instagram') return 'instagram';
    if (key === 'facebook') return 'facebook';
    if (key.includes('indicacao')) return 'indication';
    if (key.includes('portal')) return 'portal';
    if (key.includes('outro') || key === 'other') return 'outro';
    return key;
};

const normalizeTemperatureValue = (value: unknown) => {
    if (value == null) return null;
    const key = normalizeTextKey(String(value));
    if (!key) return null;
    if (key.startsWith('hot') || key.startsWith('quente') || key.startsWith('alta')) return 'hot';
    if (key.startsWith('warm') || key.startsWith('morno') || key.startsWith('media')) return 'warm';
    if (key.startsWith('cold') || key.startsWith('frio') || key.startsWith('baixa')) return 'cold';
    return key;
};

const normalizePhoneValue = (value: unknown) => {
    if (value == null) return null;
    const digits = String(value).replace(/\D/g, '');
    return digits ? digits : null;
};

const buildLeadCreateData = (body: any) => {
    const {
        name,
        email,
        phone,
        status,
        tags,
        notes,
        source,
        temperature,
        probability,
        interest,
        value,
        profile,
        preferences,
        enrichedData,
        lastInteraction
    } = body || {};

    const normalizeOptional = (value: unknown) => {
        if (value == null) return null;
        if (typeof value !== 'string') return null;
        const trimmed = value.trim();
        return trimmed ? trimmed : null;
    };
    const normalizeNumber = (value: unknown) => {
        if (value == null || value === '') return null;
        const parsed = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
        return Number.isFinite(parsed) ? parsed : null;
    };
    const normalizeJsonField = (value: unknown) => {
        if (value == null) return null;
        if (typeof value === 'string') {
            const trimmed = value.trim();
            return trimmed ? trimmed : null;
        }
        try {
            return JSON.stringify(value);
        } catch {
            return null;
        }
    };
    const normalizeDate = (value: unknown) => {
        if (!value) return null;
        const date = new Date(String(value));
        return Number.isNaN(date.getTime()) ? null : date;
    };

    const nameValue = normalizeOptional(name);
    const emailValue = normalizeOptional(email);
    const phoneValue = normalizePhoneValue(phone);
    const sourceValue = normalizeSourceValue(source);
    const temperatureValue = normalizeTemperatureValue(temperature);
    const probabilityValue = normalizeNumber(probability);
    const valueValue = normalizeNumber(value);
    const interestValue = normalizeOptional(interest);
    const profileValue = normalizeJsonField(profile);
    const preferencesValue = normalizeJsonField(preferences);
    const enrichedValue = normalizeJsonField(enrichedData);
    const lastInteractionValue = normalizeDate(lastInteraction);
    const normalizedTags = Array.isArray(tags)
        ? JSON.stringify(tags)
        : tags
            ? JSON.stringify([String(tags)])
            : JSON.stringify([]);
    const normalizedNotes = Array.isArray(notes)
        ? JSON.stringify(notes)
        : typeof notes === 'string'
            ? notes.trim()
            : null;
    const ownerIdValue = normalizeOptional(body.ownerId);

    return {
        name: nameValue,
        email: emailValue,
        phone: phoneValue,
        status: !status || status === 'Selecione' ? 'Novo' : status,
        source: sourceValue || undefined,
        temperature: temperatureValue || undefined,
        probability: probabilityValue === null ? undefined : Math.round(probabilityValue),
        interest: interestValue || undefined,
        value: valueValue === null ? undefined : valueValue,
        profile: profileValue || undefined,
        preferences: preferencesValue || undefined,
        enrichedData: enrichedValue || undefined,
        lastInteraction: lastInteractionValue || undefined,
        tags: normalizedTags,

        notes: normalizedNotes,
        ownerId: ownerIdValue || undefined
    };
};

export const getLeads = async (req: Request, res: Response) => {
    try {
        const { phone, name, query, ownerId } = req.query;

        // DEBUG: Explicitly log the request params to trace leakage
        console.log('[API] getLeads request:', { phone, name, query, ownerId });

        // STRICT SECURITY: If this is a general fetch (no specific phone) and NO ownerId is provided,
        // return EMPTY to prevent showing all database contacts to an unidentified user.
        if (!phone && !ownerId) {
            console.warn('[API] Blocked global fetch without ownerId');
            return res.json([]);
        }
        const search = String(query || '').trim();
        const phoneSearch = String(phone || '').trim();
        const phoneDigits = normalizePhoneValue(phoneSearch);
        const nameSearch = String(name || '').trim();
        const orFilters: any[] = [];

        if (search) {
            orFilters.push(
                { phone: { contains: search } },
                { name: { contains: search } },
                { email: { contains: search } }
            );
        }

        if (nameSearch) {
            orFilters.push({ name: { contains: nameSearch } });
        }

        const whereClause: any = {};
        if (phoneDigits) {
            whereClause.phone = { contains: phoneDigits };
        } else if (orFilters.length > 0) {
            whereClause.OR = orFilters;
        }
        if (ownerId) {
            whereClause.ownerId = String(ownerId);
        }

        let leads;
        try {
            leads = await prisma.lead.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                include: { tasks: true, documents: true } // Include tasks and documents
            });
        } catch (error: any) {
            const message = error?.message || '';
            if (message.includes('no such table') && message.includes('Task')) {
                leads = await prisma.lead.findMany({
                    where: whereClause,
                    orderBy: { createdAt: 'desc' },
                    include: { documents: true }
                });
            } else {
                throw error;
            }
        }
        // Parse JSON fields for frontend compatibility if necessary, 
        // but the frontend service usually expects full objects.
        // Since we store as string in SQLite, we might need to parse them back to JSON objects if the frontend expects real JSON.
        // For now returning as is, frontend might need adjustment or we parse here.

        const parsedLeads = leads.map(formatLead);

        res.json(parsedLeads);
    } catch (error: any) {
        console.error('Lead fetch failed:', error);
        res.status(500).json({ error: error?.message || 'Failed to fetch leads' });
    }
};

export const createLead = async (req: Request, res: Response) => {
    try {
        const createData = buildLeadCreateData(req.body);



        if (!createData.phone) {
            // If no phone, just create (unlikely for sync)
            const lead = await prisma.lead.create({ data: createData });
            const assignedLead = await assignLeadIfEligible(lead);
            res.status(201).json(formatLead(assignedLead || lead));
            return;
        }

        // CUSTOM UPSERT: Check if lead exists for this Owner + Phone
        const whereCondition: any = { phone: createData.phone };
        if (createData.ownerId) {
            whereCondition.ownerId = createData.ownerId;
        } else {
            // For global leads (no owner), check if any global lead exists with this phone
            whereCondition.ownerId = null;
        }

        const existing = await prisma.lead.findFirst({
            where: whereCondition
        });

        if (existing) {
            const updated = await prisma.lead.update({
                where: { id: existing.id },
                data: createData
            });
            const assignedLead = await assignLeadIfEligible(updated);
            res.status(200).json(formatLead(assignedLead || updated));
        } else {
            const created = await prisma.lead.create({ data: createData });
            const assignedLead = await assignLeadIfEligible(created);
            res.status(201).json(formatLead(assignedLead || created));
        }
    } catch (error) {
        console.error('Lead create failed:', error);
        res.status(500).json({ error: 'Failed to create lead' });
    }
};

export const updateLead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = req.body || {};
        const updateData: any = {};
        const hasOwn = (key: string) => Object.prototype.hasOwnProperty.call(data, key);
        const normalizeOptional = (value: unknown) => {
            if (value == null) return null;
            if (typeof value !== 'string') return null;
            const trimmed = value.trim();
            return trimmed ? trimmed : null;
        };
        const normalizeNumber = (value: unknown) => {
            if (value == null || value === '') return null;
            const parsed = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
            return Number.isFinite(parsed) ? parsed : null;
        };
        const normalizeJsonField = (value: unknown) => {
            if (value == null) return null;
            if (typeof value === 'string') {
                const trimmed = value.trim();
                return trimmed ? trimmed : null;
            }
            try {
                return JSON.stringify(value);
            } catch {
                return null;
            }
        };
        const normalizeDate = (value: unknown) => {
            if (!value) return null;
            const date = new Date(String(value));
            return Number.isNaN(date.getTime()) ? null : date;
        };
        if (hasOwn('name')) {
            updateData.name = normalizeOptional(data.name);
        }
        if (hasOwn('email')) {
            updateData.email = normalizeOptional(data.email);
        }
        if (hasOwn('phone')) {
            updateData.phone = normalizePhoneValue(data.phone);
        }
        if (hasOwn('status')) {
            const normalized = normalizeOptional(data.status);
            if (normalized) updateData.status = normalized;
        }
        if (hasOwn('source')) {
            const normalizedSource = normalizeSourceValue(data.source);
            if (normalizedSource) updateData.source = normalizedSource;
        }
        if (hasOwn('temperature')) {
            updateData.temperature = normalizeTemperatureValue(data.temperature);
        }
        if (hasOwn('probability')) {
            const parsed = normalizeNumber(data.probability);
            updateData.probability = parsed === null ? null : Math.round(parsed);
        }
        if (hasOwn('interest')) {
            updateData.interest = normalizeOptional(data.interest);
        }
        if (hasOwn('value')) {
            updateData.value = normalizeNumber(data.value);
        }
        if (hasOwn('profile')) {
            updateData.profile = normalizeJsonField(data.profile);
        }
        if (hasOwn('preferences')) {
            updateData.preferences = normalizeJsonField(data.preferences);
        }
        if (hasOwn('enrichedData')) {
            updateData.enrichedData = normalizeJsonField(data.enrichedData);
        }
        if (hasOwn('lastInteraction')) {
            const parsed = normalizeDate(data.lastInteraction);
            if (parsed) updateData.lastInteraction = parsed;
        }
        if (hasOwn('tags')) {
            if (data.tags == null || data.tags === '') {
                updateData.tags = JSON.stringify([]);
            } else if (Array.isArray(data.tags)) {
                updateData.tags = JSON.stringify(data.tags);
            } else {
                updateData.tags = JSON.stringify([String(data.tags)]);
            }
        }
        if (hasOwn('notes')) {
            if (Array.isArray(data.notes)) {
                updateData.notes = JSON.stringify(data.notes);
            } else if (typeof data.notes === 'string') {
                updateData.notes = data.notes.trim() || null;
            } else if (data.notes == null) {
                updateData.notes = null;
            } else {
                updateData.notes = String(data.notes);
            }
        }
        if (hasOwn('assignedTo')) {
            updateData.assignedTo = normalizeOptional(data.assignedTo);
        }

        if (!Object.keys(updateData).length) {
            const existing = await prisma.lead.findUnique({ where: { id }, include: { documents: true } });
            if (!existing) {
                res.status(404).json({ error: 'Lead not found' });
                return;
            }
            res.json(formatLead(existing));
            return;
        }

        try {
            const lead = await prisma.lead.update({
                where: { id },
                data: updateData,
                include: { documents: true }
            });
            res.json(formatLead(lead));
        } catch (error: any) {
            if (error?.code === 'P2025') {
                const created = await prisma.lead.create({
                    data: buildLeadCreateData(data),
                });
                res.status(201).json(formatLead(created));
                return;
            }
            console.error('Lead update failed:', error);
            res.status(500).json({ error: 'Failed to update lead' });
        }
    } catch (error) {
        console.error('Lead update failed:', error);
        res.status(500).json({ error: 'Failed to update lead' });
    }
};



export const deleteAllLeads = async (req: Request, res: Response) => {
    try {
        const { ownerId } = req.query;

        if (!ownerId) {
            res.status(400).json({ error: 'ownerId is required for bulk deletion' });
            return;
        }

        const result = await prisma.lead.deleteMany({
            where: { ownerId: String(ownerId) }
        });

        console.log(`[API] Deleted ${result.count} leads for owner ${ownerId}`);
        res.status(200).json({ count: result.count });
    } catch (error) {
        console.error('Delete all leads failed:', error);
        res.status(500).json({ error: 'Failed to delete leads' });
    }
};

export const deleteLead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.lead.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete lead' });
    }
};

export const uploadDocument = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const file = req.file;

        if (!file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        const document = await prisma.leadDocument.create({
            data: {
                leadId: id,
                name: file.originalname,
                url: `/uploads/${file.filename}`,
                type: file.mimetype.split('/')[1] || 'unknown',
                uploadedAt: new Date()
            }
        });

        res.status(201).json(document);
    } catch (error) {
        console.error('Upload failed:', error);
        res.status(500).json({ error: 'Failed to upload document' });
    }
};
