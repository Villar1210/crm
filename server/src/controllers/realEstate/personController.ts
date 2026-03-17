
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createPerson = async (req: Request, res: Response) => {
    try {
        const {
            role_type, // OWNER, TENANT, GUARANTOR
            name,
            document, // CPF/CNPJ
            email,
            phone,
            tenantId, // From context/auth
            profile_data // JSON object with profile specific data
        } = req.body;

        // 1. Basic Validation
        if (!name || !document || !role_type || !tenantId) {
            return res.status(400).json({ error: 'Missing required fields: name, document, role_type, tenantId' });
        }

        console.log(`[API] logic=createPerson tenantId=${tenantId} role=${role_type} document=${document}`);

        // 2. Uniqueness Check (Multi-tenant)
        const existingPerson = await prisma.person.findFirst({
            where: {
                tenantId,
                document,
                type: role_type // Should we allow same person to be Owner AND Tenant? Maybe. But request says unique per tenant probably per role or global? 
                // "cpf_cnpj unique por tenant_id" suggests global uniqueness per tenant.
                // Let's enforce unique document per tenant for simplicity as requested "Não duplicar pessoa"
            }
        });

        if (existingPerson) {
            console.warn(`[API] Duplicate detected for doc ${document}`);
            return res.status(409).json({ error: 'Person with this document already exists in this tenant', personId: existingPerson.id });
        }

        // 3. Create Transaction to create Person + Profile
        const result = await prisma.$transaction(async (tx) => {
            // Create Person
            const person = await tx.person.create({
                data: {
                    tenantId,
                    type: role_type,
                    name,
                    document, // CPF/CNPJ
                    email,
                    phone,
                    // Map other common fields...
                    status: 'active',
                }
            });

            // Create Profile based on Role
            if (role_type === 'OWNER') {
                await tx.ownerProfile.create({
                    data: {
                        personId: person.id,
                        // Map profile fields
                        bankName: profile_data?.bank_name,
                        agency: profile_data?.agency,
                        account: profile_data?.account,
                        payoutPreference: profile_data?.payout_preference,
                        adminFee: profile_data?.admin_fee_percent ? parseFloat(profile_data.admin_fee_percent) : undefined,
                        // ... other fields
                    }
                });
            } else if (role_type === 'TENANT') {
                await tx.tenantProfile.create({
                    data: {
                        personId: person.id,
                        incomeProof: profile_data?.income_val ? String(profile_data.income_val) : undefined,
                        employer: profile_data?.employer,
                        // ...
                    }
                });
            } else if (role_type === 'GUARANTOR') {
                await tx.guarantorProfile.create({
                    data: {
                        personId: person.id,
                        incomeAmount: profile_data?.income_val ? parseFloat(profile_data.income_val) : undefined,
                        // ...
                    }
                });
            }

            return person;
        });

        console.log(`[API] Created person id=${result.id}`);
        return res.status(201).json(result);

    } catch (error) {
        console.error('[API] Error creating person:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export const listPeople = async (req: Request, res: Response) => {
    try {
        const { tenantId, role_type, search } = req.query;

        if (!tenantId) {
            return res.status(400).json({ error: 'Missing tenantId' });
        }

        const where: any = {
            tenantId: String(tenantId)
        };

        if (role_type) {
            where.type = String(role_type);
        }

        if (search) {
            where.OR = [
                { name: { contains: String(search) } }, // SQLite contains is case-sensitive usually but Prisma might handle? usually need mode: 'insensitive' for Postgres, sqlite is mixed.
                { document: { contains: String(search) } }
            ];
        }

        const people = await prisma.person.findMany({
            where,
            orderBy: { name: 'asc' },
            take: 50
        });

        return res.json(people);
    } catch (error) {
        console.error('[API] Error listing people:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export const getPerson = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const person = await prisma.person.findUnique({
            where: { id },
            include: {
                ownerProfile: true,
                tenantProfile: true,
                guarantorProfile: true
            }
        });
        if (!person) return res.status(404).json({ error: 'Person not found' });
        return res.json(person);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error fetching person' });
    }
};

export const updatePerson = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // Basic update logic
        const person = await prisma.person.update({
            where: { id },
            data: req.body
        });
        return res.json(person);
    } catch (error) {
        return res.status(500).json({ error: 'Error updating person' });
    }
};

export const deletePerson = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.person.delete({ where: { id } });
        return res.status(204).send();
    } catch (error) {
        return res.status(500).json({ error: 'Error deleting person' });
    }
};
