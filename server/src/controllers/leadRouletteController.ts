import { Request, Response } from 'express';
import {
  assignLeadIfEligible,
  createRouletteRule,
  deleteRouletteRule,
  getRouletteAgents,
  getRouletteLogs,
  getRouletteRules,
  getRouletteSettings,
  resetRouletteAgentDay,
  simulateRoulette,
  updateRouletteAgent,
  updateRouletteRule,
  updateRouletteSettings
} from '../services/leadRouletteService';

const VALID_STRATEGIES = new Set(['round_robin', 'peso', 'prioridade_fila']);
const VALID_STATUSES = new Set(['disponivel', 'pausado', 'offline', 'limite_atingido']);
const VALID_DEFAULT_MODES = new Set(['always', 'sources']);
const VALID_TIE_BREAKERS = new Set(['least_leads', 'longest_wait', 'fixed_order']);

export const getSettings = async (_req: Request, res: Response) => {
  try {
    const settings = await getRouletteSettings();
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to load settings' });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const current = await getRouletteSettings();
    const { enabled, defaultMode, criteria, tieBreaker } = req.body || {};

    const next = {
      enabled: typeof enabled === 'boolean' ? enabled : current.enabled,
      defaultMode: VALID_DEFAULT_MODES.has(defaultMode) ? defaultMode : current.defaultMode,
      criteria: {
        ignoreLimit:
          typeof criteria?.ignoreLimit === 'boolean' ? criteria.ignoreLimit : current.criteria.ignoreLimit,
        ignoreOffline:
          typeof criteria?.ignoreOffline === 'boolean' ? criteria.ignoreOffline : current.criteria.ignoreOffline,
        respectHours:
          typeof criteria?.respectHours === 'boolean' ? criteria.respectHours : current.criteria.respectHours,
        allowSkip:
          typeof criteria?.allowSkip === 'boolean' ? criteria.allowSkip : current.criteria.allowSkip
      },
      tieBreaker: VALID_TIE_BREAKERS.has(tieBreaker) ? tieBreaker : current.tieBreaker
    };

    const updated = await updateRouletteSettings(next);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to update settings' });
  }
};

export const getRules = async (_req: Request, res: Response) => {
  try {
    const rules = await getRouletteRules();
    res.json(rules);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to load rules' });
  }
};

export const createRule = async (req: Request, res: Response) => {
  try {
    const { name, active, strategy, sources, pipelines, description } = req.body || {};
    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'Name is required' });
      return;
    }
    if (!VALID_STRATEGIES.has(strategy)) {
      res.status(400).json({ error: 'Invalid strategy' });
      return;
    }
    if (!Array.isArray(sources) || sources.length === 0) {
      res.status(400).json({ error: 'At least one source is required' });
      return;
    }
    if (!Array.isArray(pipelines) || pipelines.length === 0) {
      res.status(400).json({ error: 'At least one pipeline stage is required' });
      return;
    }

    const rule = await createRouletteRule({
      name: name.trim(),
      active: typeof active === 'boolean' ? active : true,
      strategy,
      sources,
      pipelines,
      description: typeof description === 'string' ? description.trim() : null
    });

    res.status(201).json(rule);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to create rule' });
  }
};

export const updateRule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, active, strategy, sources, pipelines, description } = req.body || {};

    if (strategy && !VALID_STRATEGIES.has(strategy)) {
      res.status(400).json({ error: 'Invalid strategy' });
      return;
    }

    const rule = await updateRouletteRule(id, {
      name: typeof name === 'string' ? name.trim() : undefined,
      active: typeof active === 'boolean' ? active : undefined,
      strategy,
      sources: Array.isArray(sources) ? sources : undefined,
      pipelines: Array.isArray(pipelines) ? pipelines : undefined,
      description: typeof description === 'string' ? description.trim() : description
    });

    res.json(rule);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to update rule' });
  }
};

export const deleteRule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deleteRouletteRule(id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to delete rule' });
  }
};

export const getAgents = async (_req: Request, res: Response) => {
  try {
    const agents = await getRouletteAgents();
    res.json(agents);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to load agents' });
  }
};

export const updateAgent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, weight, maxLeadsPerDay } = req.body || {};

    if (status && !VALID_STATUSES.has(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const nextWeight = typeof weight === 'number' ? weight : Number(weight);
    if (weight !== undefined && (!Number.isFinite(nextWeight) || nextWeight < 1)) {
      res.status(400).json({ error: 'Weight must be >= 1' });
      return;
    }

    let maxLeads: number | null | undefined;
    if (maxLeadsPerDay === '' || maxLeadsPerDay === null) {
      maxLeads = null;
    } else if (maxLeadsPerDay !== undefined) {
      const parsed = typeof maxLeadsPerDay === 'number' ? maxLeadsPerDay : Number(maxLeadsPerDay);
      if (!Number.isFinite(parsed) || parsed < 0) {
        res.status(400).json({ error: 'Daily limit must be >= 0' });
        return;
      }
      maxLeads = parsed;
    }

    const agent = await updateRouletteAgent(id, {
      status,
      weight: weight !== undefined ? nextWeight : undefined,
      maxLeadsPerDay: maxLeads
    });
    res.json(agent);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to update agent' });
  }
};

export const resetAgent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const agent = await resetRouletteAgentDay(id);
    res.json(agent);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to reset agent day' });
  }
};

export const getLogs = async (_req: Request, res: Response) => {
  try {
    const logs = await getRouletteLogs();
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to load logs' });
  }
};

export const simulate = async (req: Request, res: Response) => {
  try {
    const { source, stage, excludeAgentId } = req.body || {};
    if (!source || !stage) {
      res.status(400).json({ error: 'Source and stage are required' });
      return;
    }
    const result = await simulateRoulette({
      source,
      stage,
      excludeAgentId: excludeAgentId || null
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to simulate distribution' });
  }
};

export const assignLeadManually = async (req: Request, res: Response) => {
  try {
    const { lead } = req.body || {};
    if (!lead?.id) {
      res.status(400).json({ error: 'Lead payload is required' });
      return;
    }
    const updated = await assignLeadIfEligible(lead);
    res.json(updated || {});
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to assign lead' });
  }
};
