import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Listar todos os templates
export const getTemplates = async (req: Request, res: Response) => {
    try {
        const { category, active } = req.query;
        const userId = (req as any).user?.id;

        const where: any = {
            OR: [
                { isGlobal: true },
                { userId }
            ]
        };

        if (category) where.category = category;
        if (active !== undefined) where.active = active === 'true';

        const templates = await prisma.emailTemplate.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });

        res.json(templates);
    } catch (error) {
        console.error('Erro ao buscar templates:', error);
        res.status(500).json({ error: 'Erro ao buscar templates' });
    }
};

// Buscar template por ID
export const getTemplateById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const template = await prisma.emailTemplate.findUnique({
            where: { id }
        });

        if (!template) {
            return res.status(404).json({ error: 'Template não encontrado' });
        }

        res.json(template);
    } catch (error) {
        console.error('Erro ao buscar template:', error);
        res.status(500).json({ error: 'Erro ao buscar template' });
    }
};

// Criar novo template
export const createTemplate = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const templateData = req.body;

        // Parse de variáveis se for string
        if (typeof templateData.variables === 'string') {
            templateData.variables = templateData.variables;
        } else if (Array.isArray(templateData.variables)) {
            templateData.variables = JSON.stringify(templateData.variables);
        }

        // Parse de jsonContent se for objeto
        if (typeof templateData.jsonContent === 'object') {
            templateData.jsonContent = JSON.stringify(templateData.jsonContent);
        }

        const template = await prisma.emailTemplate.create({
            data: {
                ...templateData,
                userId,
                isSystem: false,
                isGlobal: templateData.isGlobal || false
            }
        });

        res.status(201).json(template);
    } catch (error) {
        console.error('Erro ao criar template:', error);
        res.status(500).json({ error: 'Erro ao criar template' });
    }
};

// Atualizar template
export const updateTemplate = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Parse de variáveis se necessário
        if (typeof updateData.variables === 'object') {
            updateData.variables = JSON.stringify(updateData.variables);
        }

        // Parse de jsonContent se necessário
        if (typeof updateData.jsonContent === 'object') {
            updateData.jsonContent = JSON.stringify(updateData.jsonContent);
        }

        const template = await prisma.emailTemplate.update({
            where: { id },
            data: updateData
        });

        res.json(template);
    } catch (error) {
        console.error('Erro ao atualizar template:', error);
        res.status(500).json({ error: 'Erro ao atualizar template' });
    }
};

// Deletar template
export const deleteTemplate = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Verificar se o template não é de sistema
        const template = await prisma.emailTemplate.findUnique({
            where: { id }
        });

        if (!template) {
            return res.status(404).json({ error: 'Template não encontrado' });
        }

        if (template.isSystem) {
            return res.status(403).json({ error: 'Templates de sistema não podem ser deletados' });
        }

        await prisma.emailTemplate.delete({
            where: { id }
        });

        res.json({ message: 'Template deletado com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar template:', error);
        res.status(500).json({ error: 'Erro ao deletar template' });
    }
};

// Duplicar template
export const duplicateTemplate = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.id;

        const original = await prisma.emailTemplate.findUnique({
            where: { id }
        });

        if (!original) {
            return res.status(404).json({ error: 'Template não encontrado' });
        }

        const duplicate = await prisma.emailTemplate.create({
            data: {
                name: `${original.name} (Cópia)`,
                category: original.category,
                htmlContent: original.htmlContent,
                jsonContent: original.jsonContent,
                variables: original.variables,
                isSystem: false,
                isGlobal: false,
                active: true,
                thumbnail: original.thumbnail,
                userId
            }
        });

        res.status(201).json(duplicate);
    } catch (error) {
        console.error('Erro ao duplicar template:', error);
        res.status(500).json({ error: 'Erro ao duplicar template' });
    }
};

// Renderizar template com variáveis
export const renderTemplate = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { variables } = req.body;

        const template = await prisma.emailTemplate.findUnique({
            where: { id }
        });

        if (!template) {
            return res.status(404).json({ error: 'Template não encontrado' });
        }

        let renderedHtml = template.htmlContent;

        // Substituir variáveis no HTML
        if (variables) {
            Object.keys(variables).forEach(key => {
                const regex = new RegExp(`{{${key}}}`, 'g');
                renderedHtml = renderedHtml.replace(regex, variables[key] || '');
            });
        }

        res.json({
            html: renderedHtml,
            originalHtml: template.htmlContent
        });
    } catch (error) {
        console.error('Erro ao renderizar template:', error);
        res.status(500).json({ error: 'Erro ao renderizar template' });
    }
};

// Listar categorias de templates
export const getTemplateCategories = async (_req: Request, res: Response) => {
    try {
        const categories = [
            { id: 'launch', name: 'Lançamento de Imóvel', icon: 'building' },
            { id: 'newsletter', name: 'Newsletter', icon: 'newspaper' },
            { id: 'follow_up', name: 'Follow-up', icon: 'repeat' },
            { id: 'reengagement', name: 'Reengajamento', icon: 'user-plus' },
            { id: 'institutional', name: 'Institucional', icon: 'briefcase' },
            { id: 'custom', name: 'Personalizado', icon: 'edit' }
        ];

        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar categorias' });
    }
};

// Listar variáveis disponíveis
export const getAvailableVariables = async (_req: Request, res: Response) => {
    try {
        const variables = [
            { key: 'nome', label: 'Nome do Lead', example: 'João Silva' },
            { key: 'email', label: 'Email do Lead', example: 'joao@email.com' },
            { key: 'telefone', label: 'Telefone do Lead', example: '(11) 99999-9999' },
            { key: 'corretor', label: 'Nome do Corretor', example: 'Maria Santos' },
            { key: 'imovel_nome', label: 'Nome do Imóvel', example: 'Apartamento Vista Mar' },
            { key: 'imovel_preco', label: 'Preço do Imóvel', example: 'R$ 450.000' },
            { key: 'imovel_quartos', label: 'Quartos do Imóvel', example: '3' },
            { key: 'imovel_area', label: 'Área do Imóvel', example: '85m²' },
            { key: 'imovel_endereco', label: 'Endereço do Imóvel', example: 'Rua das Flores, 123' },
            { key: 'data_atual', label: 'Data Atual', example: '20/01/2026' },
            { key: 'empresa_nome', label: 'Nome da Empresa', example: 'Ivillar Imóveis' }
        ];

        res.json(variables);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar variáveis' });
    }
};
