import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const CONFIG_ID = 'default';

const parsePipelinesPayload = (payload: any) => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.pipelines)) {
    return payload.pipelines;
  }
  return [];
};

export const getPipelines = async (_req: Request, res: Response) => {
  try {
    const rows = await prisma.$queryRaw<{ id: string; payload: string }[]>`
      SELECT id, payload
      FROM PipelineConfig
      WHERE id = ${CONFIG_ID}
      LIMIT 1
    `;
    const record = rows[0];
    if (!record?.payload) {
      res.json({ pipelines: [] });
      return;
    }
    const parsed = JSON.parse(record.payload);
    res.json({ pipelines: parsePipelinesPayload(parsed) });
  } catch (error) {
    console.error('Pipeline fetch error:', error);
    res.status(500).json({ error: 'Failed to load pipelines' });
  }
};

export const savePipelines = async (req: Request, res: Response) => {
  const pipelines = parsePipelinesPayload(req.body);
  if (!Array.isArray(pipelines)) {
    res.status(400).json({ error: 'pipelines array required' });
    return;
  }

  try {
    const payload = JSON.stringify(pipelines);
    await prisma.$executeRaw`
      INSERT INTO PipelineConfig (id, payload, createdAt, updatedAt)
      VALUES (${CONFIG_ID}, ${payload}, datetime('now'), datetime('now'))
      ON CONFLICT(id) DO UPDATE SET payload = ${payload}, updatedAt = datetime('now')
    `;
    res.json({ pipelines });
  } catch (error) {
    console.error('Pipeline save error:', error);
    res.status(500).json({ error: 'Failed to save pipelines' });
  }
};
