import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Listar todas as listas
export const getLists = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;

        const lists = await prisma.emailList.findMany({
            where: { userId },
            include: {
                _count: {
                    select: { contacts: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Parse segmentRules
        const parsed = lists.map(list => ({
            ...list,
            segmentRules: list.segmentRules ? JSON.parse(list.segmentRules) : null
        }));

        res.json(parsed);
    } catch (error) {
        console.error('Erro ao buscar listas:', error);
        res.status(500).json({ error: 'Erro ao buscar listas' });
    }
};

// Buscar lista por ID
export const getListById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const list = await prisma.emailList.findUnique({
            where: { id },
            include: {
                contacts: true
            }
        });

        if (!list) {
            return res.status(404).json({ error: 'Lista não encontrada' });
        }

        const parsed = {
            ...list,
            segmentRules: list.segmentRules ? JSON.parse(list.segmentRules) : null,
            contacts: list.contacts.map((c: any) => ({
                ...c,
                customFields: c.customFields ? JSON.parse(c.customFields) : null
            }))
        };

        res.json(parsed);
    } catch (error) {
        console.error('Erro ao buscar lista:', error);
        res.status(500).json({ error: 'Erro ao buscar lista' });
    }
};

// Criar nova lista
export const createList = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { name, description, type, segmentRules } = req.body;

        const list = await prisma.emailList.create({
            data: {
                name,
                description,
                type,
                segmentRules: segmentRules ? JSON.stringify(segmentRules) : null,
                contactCount: 0,
                userId
            }
        });

        res.status(201).json(list);
    } catch (error) {
        console.error('Erro ao criar lista:', error);
        res.status(500).json({ error: 'Erro ao criar lista' });
    }
};

// Atualizar lista
export const updateList = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (updateData.segmentRules) {
            updateData.segmentRules = JSON.stringify(updateData.segmentRules);
        }

        const list = await prisma.emailList.update({
            where: { id },
            data: updateData
        });

        res.json(list);
    } catch (error) {
        console.error('Erro ao atualizar lista:', error);
        res.status(500).json({ error: 'Erro ao atualizar lista' });
    }
};

// Deletar lista
export const deleteList = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.emailList.delete({
            where: { id }
        });

        res.json({ message: 'Lista deletada com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar lista:', error);
        res.status(500).json({ error: 'Erro ao deletar lista' });
    }
};

// Sincronizar lista com CRM
export const syncListWithCRM = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.id;

        const list = await prisma.emailList.findUnique({
            where: { id }
        });

        if (!list) {
            return res.status(404).json({ error: 'Lista não encontrada' });
        }

        // Buscar leads do usuário
        const leads = await prisma.lead.findMany({
            where: {
                assignedTo: userId,
                email: { not: null }
            }
        });

        // Aplicar regras de segmentação se for lista dinâmica
        let filteredLeads = leads;

        if (list.type === 'dynamic' && list.segmentRules) {
            const rules = JSON.parse(list.segmentRules);

            filteredLeads = leads.filter(lead => {
                let matches = true;

                if (rules.status && !rules.status.includes(lead.status)) matches = false;
                if (rules.temperature && !rules.temperature.includes(lead.temperature)) matches = false;
                if (rules.source && !rules.source.includes(lead.source)) matches = false;

                return matches;
            });
        }

        // Criar ou atualizar contatos
        let addedCount = 0;

        for (const lead of filteredLeads) {
            if (!lead.email) continue;

            const existing = await prisma.emailContact.findFirst({
                where: {
                    email: lead.email,
                    listId: id
                }
            });

            if (!existing) {
                await prisma.emailContact.create({
                    data: {
                        leadId: lead.id,
                        email: lead.email,
                        name: lead.name || undefined,
                        status: 'active',
                        consentDate: new Date(),
                        consentSource: 'crm_sync',
                        listId: id
                    }
                });
                addedCount++;
            }
        }

        // Atualizar contagem
        const totalContacts = await prisma.emailContact.count({
            where: { listId: id }
        });

        await prisma.emailList.update({
            where: { id },
            data: { contactCount: totalContacts }
        });

        res.json({
            message: 'Sincronização concluída',
            addedCount,
            totalContacts
        });
    } catch (error) {
        console.error('Erro ao sincronizar lista:', error);
        res.status(500).json({ error: 'Erro ao sincronizar lista' });
    }
};

// Importar contatos do CSV
export const importContactsCSV = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { contacts } = req.body;

        if (!Array.isArray(contacts)) {
            return res.status(400).json({ error: 'Formato inválido' });
        }

        let addedCount = 0;
        let skippedCount = 0;

        for (const contact of contacts) {
            if (!contact.email) {
                skippedCount++;
                continue;
            }

            const existing = await prisma.emailContact.findFirst({
                where: {
                    email: contact.email,
                    listId: id
                }
            });

            if (existing) {
                skippedCount++;
                continue;
            }

            await prisma.emailContact.create({
                data: {
                    email: contact.email,
                    name: contact.name || undefined,
                    status: 'active',
                    consentDate: new Date(),
                    consentSource: 'csv_import',
                    customFields: contact.customFields ? JSON.stringify(contact.customFields) : null,
                    listId: id
                }
            });
            addedCount++;
        }

        // Atualizar contagem
        const totalContacts = await prisma.emailContact.count({
            where: { listId: id }
        });

        await prisma.emailList.update({
            where: { id },
            data: { contactCount: totalContacts }
        });

        res.json({
            message: 'Importação concluída',
            addedCount,
            skippedCount,
            totalContacts
        });
    } catch (error) {
        console.error('Erro ao importar contatos:', error);
        res.status(500).json({ error: 'Erro ao importar contatos' });
    }
};

// Listar contatos
export const getContacts = async (req: Request, res: Response) => {
    try {
        const { listId, status } = req.query;

        const where: any = {};

        if (listId) where.listId = listId;
        if (status) where.status = status;

        const contacts = await prisma.emailContact.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });

        const parsed = contacts.map(c => ({
            ...c,
            customFields: c.customFields ? JSON.parse(c.customFields) : null
        }));

        res.json(parsed);
    } catch (error) {
        console.error('Erro ao buscar contatos:', error);
        res.status(500).json({ error: 'Erro ao buscar contatos' });
    }
};

// Adicionar contato
export const addContact = async (req: Request, res: Response) => {
    try {
        const { listId, email, name, customFields } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email é obrigatório' });
        }

        // Verificar se já existe
        const existing = await prisma.emailContact.findFirst({
            where: { email, listId }
        });

        if (existing) {
            return res.status(409).json({ error: 'Contato já existe nesta lista' });
        }

        const contact = await prisma.emailContact.create({
            data: {
                email,
                name,
                status: 'active',
                consentDate: new Date(),
                consentSource: 'manual',
                customFields: customFields ? JSON.stringify(customFields) : null,
                listId
            }
        });

        // Atualizar contagem da lista
        if (listId) {
            const totalContacts = await prisma.emailContact.count({
                where: { listId }
            });

            await prisma.emailList.update({
                where: { id: listId },
                data: { contactCount: totalContacts }
            });
        }

        res.status(201).json(contact);
    } catch (error) {
        console.error('Erro ao adicionar contato:', error);
        res.status(500).json({ error: 'Erro ao adicionar contato' });
    }
};

// Remover contato
export const removeContact = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const contact = await prisma.emailContact.findUnique({
            where: { id }
        });

        if (!contact) {
            return res.status(404).json({ error: 'Contato não encontrado' });
        }

        await prisma.emailContact.delete({
            where: { id }
        });

        // Atualizar contagem da lista
        if (contact.listId) {
            const totalContacts = await prisma.emailContact.count({
                where: { listId: contact.listId }
            });

            await prisma.emailList.update({
                where: { id: contact.listId },
                data: { contactCount: totalContacts }
            });
        }

        res.json({ message: 'Contato removido com sucesso' });
    } catch (error) {
        console.error('Erro ao remover contato:', error);
        res.status(500).json({ error: 'Erro ao remover contato' });
    }
};

// Descadastrar contato (opt-out)
export const unsubscribeContact = async (req: Request, res: Response) => {
    try {
        const { email, reason } = req.body;

        const contacts = await prisma.emailContact.findMany({
            where: { email }
        });

        if (contacts.length === 0) {
            return res.status(404).json({ error: 'Contato não encontrado' });
        }

        // Descadastrar de todas as listas
        await prisma.emailContact.updateMany({
            where: { email },
            data: {
                status: 'unsubscribed',
                unsubscribeDate: new Date(),
                unsubscribeReason: reason || 'Solicitação do usuário'
            }
        });

        res.json({ message: 'Descadastrado com sucesso de todas as listas' });
    } catch (error) {
        console.error('Erro ao descadastrar contato:', error);
        res.status(500).json({ error: 'Erro ao descadastrar contato' });
    }
};

// Atualizar status do contato
export const updateContactStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, reason } = req.body;

        const updateData: any = { status };

        if (status === 'unsubscribed') {
            updateData.unsubscribeDate = new Date();
            updateData.unsubscribeReason = reason;
        }

        const contact = await prisma.emailContact.update({
            where: { id },
            data: updateData
        });

        res.json(contact);
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        res.status(500).json({ error: 'Erro ao atualizar status' });
    }
};
