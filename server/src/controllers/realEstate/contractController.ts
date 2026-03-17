
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();

export const createContract = async (req: Request, res: Response) => {
    try {
        const {
            propertyId,
            ownerId, // This is OwnerProfile ID in schema? Or Person ID? Schema says ownerId -> OwnerProfile. 
            // Frontend usually sends PersonID. We need to find OwnerProfile by PersonID or expect OwnerProfileID.
            tenantPersonId,
            startDate,
            endDate,
            rentValue,
            tenantId,
            // ... other fields
            guaranteeType,
            guaranteeValue
        } = req.body;

        if (!tenantId) return res.status(400).json({ error: 'Missing tenantId' });

        console.log(`[API] Creating contract draft for property=${propertyId} tenant=${tenantId}`);

        // Ensure OwnerProfile exists for ownerId (assuming ownerId passed is actually PersonId, we might need to look it up)
        // For now assuming payload sends correct IDs as per schema

        const contract = await prisma.leaseContract.create({
            data: {
                tenantId,
                propertyId,
                ownerId,
                tenantPersonId,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                rentValue: parseFloat(rentValue),
                status: 'draft',
                durationMonths: req.body.term_months || 12, // Calculate or use input
                dayDue: req.body.due_day || 5, // Default 5th

                guaranteeType,
                guaranteeValue: guaranteeValue ? parseFloat(guaranteeValue) : undefined,

                // Map other potential fields from wizard
                condoValue: req.body.condo_amount ? parseFloat(req.body.condo_amount) : undefined,
                iptuValue: req.body.iptu_amount ? parseFloat(req.body.iptu_amount) : undefined,
            }
        });

        // Create ContractParties if needed for easy query?
        // Logic to add Owner and Tenant as parties
        await prisma.contractParty.createMany({
            data: [
                { contractId: contract.id, personId: tenantPersonId, role: 'TENANT', tenantId },
                // Owner person ID lookup needed if ownerId is profile ID
            ]
        });

        return res.status(201).json(contract);
    } catch (error) {
        console.error('[API] Error creating contract:', error);
        return res.status(500).json({ error: 'Error creating contract' });
    }
};

export const activateContract = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { tenantId } = req.body;

        console.log(`[API] Activating contract ${id}`);

        const contract = await prisma.leaseContract.findUnique({
            where: { id },
            include: { property: true }
        });

        if (!contract) return res.status(404).json({ error: 'Contract not found' });
        if (contract.status === 'active') return res.status(400).json({ error: 'Already active' });

        // 1. Update status to active
        await prisma.leaseContract.update({
            where: { id },
            data: { status: 'active' }
        });

        // 2. Update Property status to occupied
        await prisma.property.update({
            where: { id: contract.propertyId },
            data: {
                status: 'occupied',
                tenantId: tenantId // Associate tenant to property?
            }
        });

        // 3. Generate initial invoices
        // Generate for the duration or next X months? User said "gera cobranças (competência atual e futuras, configurável)"
        // Let's generate for the first 12 months or contract duration logic.
        const invoicesToCreate = [];
        let currentDate = new Date(contract.startDate);
        const dayDue = contract.dayDue;

        for (let i = 0; i < contract.durationMonths; i++) {
            // Calculate Due Date: Month of Start Date + i, Day = dayDue
            const competence = new Date(currentDate);
            competence.setMonth(competence.getMonth() + i);

            const dueDate = new Date(competence.getFullYear(), competence.getMonth(), dayDue);

            // Don't generate if invoice date is too far in past? (Maybe allow for history)

            invoicesToCreate.push({
                contractId: contract.id,
                tenantId: contract.tenantId!,
                referenceMonth: competence,
                dueDate: dueDate,
                amountRent: contract.rentValue,
                amountCondo: contract.condoValue || 0,
                amountIptu: contract.iptuValue || 0,
                amountTotal: contract.rentValue + (contract.condoValue || 0) + (contract.iptuValue || 0),
                status: 'generated',
                description: `Aluguel ${competence.getMonth() + 1}/${competence.getFullYear()}`
            });
        }

        if (invoicesToCreate.length > 0) {
            await prisma.realEstateInvoice.createMany({
                data: invoicesToCreate
            });
            console.log(`[API] Generated ${invoicesToCreate.length} invoices`);
        }

        return res.json({ success: true, message: 'Contract activated and invoices generated' });
    } catch (error) {
        console.error('[API] Error activating contract:', error);
        return res.status(500).json({ error: 'Error activating contract' });
    }
};

export const listContracts = async (req: Request, res: Response) => {
    try {
        const { tenantId, status } = req.query;

        const where: any = {
            tenantId: tenantId ? String(tenantId) : undefined
        };

        if (status) where.status = String(status);

        const contracts = await prisma.leaseContract.findMany({
            where,
            include: {
                property: true,
                owner: { include: { person: true } },
                tenant: true
            },
            orderBy: { createdAt: 'desc' }
        });
        return res.json(contracts);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error listing contracts' });
    }
};

export const getContract = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const contract = await prisma.leaseContract.findUnique({
            where: { id },
            include: {
                property: true,
                owner: { include: { person: true } },
                tenant: true,
                parties: { include: { person: true } },
                invoices: { orderBy: { dueDate: 'asc' } }
            }
        });
        if (!contract) return res.status(404).json({ error: 'Contract not found' });
        return res.json(contract);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error fetching contract' });
    }
};

export const updateContract = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const contract = await prisma.leaseContract.update({
            where: { id },
            data: req.body
        });
        return res.json(contract);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error updating contract' });
    }
};
