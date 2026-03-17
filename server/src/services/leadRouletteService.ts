import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SETTINGS_ID = 'default';

const DEFAULT_SETTINGS = {
  enabled: true,
  defaultMode: 'always',
  criteriaIgnoreLimit: true,
  criteriaIgnoreOffline: true,
  criteriaRespectHours: true,
  criteriaAllowSkip: false,
  tieBreaker: 'least_leads'
};

type RouletteStrategy = 'round_robin' | 'peso' | 'prioridade_fila';
type AgentStatus = 'disponivel' | 'pausado' | 'offline' | 'limite_atingido';
type TieBreaker = 'least_leads' | 'longest_wait' | 'fixed_order';
type DefaultMode = 'always' | 'sources';

type SettingsShape = {
  enabled: boolean;
  defaultMode: DefaultMode;
  criteria: {
    ignoreLimit: boolean;
    ignoreOffline: boolean;
    respectHours: boolean;
    allowSkip: boolean;
  };
  tieBreaker: TieBreaker;
};

type RouletteRuleShape = {
  id: string;
  name: string;
  active: boolean;
  strategy: RouletteStrategy;
  sources: string[];
  pipelines: string[];
  description?: string | null;
};

type RouletteAgentShape = {
  id: string;
  name: string;
  email: string;
  role: 'corretor' | 'gestor';
  status: AgentStatus;
  weight: number;
  maxLeadsPerDay?: number | null;
  leadsToday: number;
  skills?: string[];
  workingHours?: string | null;
  lastAssignedAt?: Date | null;
  orderIndex: number;
  createdAt: Date;
};

type RouletteLogShape = {
  id: string;
  leadId: string;
  leadName: string;
  source: string;
  pipelineStage: string;
  assignedTo: string;
  assignedToName: string;
  assignedAt: string;
  ruleId?: string | null;
};

const parseJsonArray = (value?: string | null): string[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map((entry) => String(entry));
    }
    return [];
  } catch {
    return [];
  }
};

const stringifyArray = (value: unknown): string => {
  if (Array.isArray(value)) {
    return JSON.stringify(value.map((item) => String(item)));
  }
  if (value == null) {
    return JSON.stringify([]);
  }
  return JSON.stringify([String(value)]);
};

const getTodayKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeTextKey = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const normalizeSourceValue = (value: string) => {
  const base = normalizeTextKey(value).replace(/[\s-]+/g, '_');
  if (!base) return '';
  if (base.includes('whatsapp')) return 'whatsapp';
  if (base === 'web' || base === 'website' || base === 'site') return 'site';
  if (base.includes('landingpage') || base.includes('landing_page')) return 'landing_page';
  if (base.includes('instagram')) return 'instagram';
  if (base.includes('facebook')) return 'facebook';
  if (base.includes('indicacao')) return 'indication';
  if (base.includes('portal')) return 'portal';
  if (base.includes('parceiro') || base === 'partner') return 'partner';
  if (base.includes('import')) return 'importado';
  if (base.includes('outro') || base === 'other') return 'outro';
  return base;
};

const isWithinWorkingHours = (workingHours?: string | null, now = new Date()) => {
  if (!workingHours) return true;
  const parts = workingHours.split('-').map((part) => part.trim());
  if (parts.length !== 2) return true;

  const parseTime = (value: string) => {
    const [hour, minute] = value.split(':').map((item) => Number(item));
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
    return hour * 60 + minute;
  };

  const start = parseTime(parts[0]);
  const end = parseTime(parts[1]);
  if (start == null || end == null) return true;

  const current = now.getHours() * 60 + now.getMinutes();
  if (start <= end) {
    return current >= start && current <= end;
  }
  return current >= start || current <= end;
};

const formatSettings = (settings: any): SettingsShape => ({
  enabled: Boolean(settings.enabled),
  defaultMode: (settings.defaultMode || 'always') as DefaultMode,
  criteria: {
    ignoreLimit: Boolean(settings.criteriaIgnoreLimit),
    ignoreOffline: Boolean(settings.criteriaIgnoreOffline),
    respectHours: Boolean(settings.criteriaRespectHours),
    allowSkip: Boolean(settings.criteriaAllowSkip)
  },
  tieBreaker: (settings.tieBreaker || 'least_leads') as TieBreaker
});

const formatRule = (rule: any): RouletteRuleShape => ({
  id: rule.id,
  name: rule.name,
  active: Boolean(rule.active),
  strategy: rule.strategy as RouletteStrategy,
  sources: parseJsonArray(rule.sources),
  pipelines: parseJsonArray(rule.pipelines),
  description: rule.description
});

const formatAgentRole = (role: string) => (role === 'agent' ? 'corretor' : 'gestor') as 'corretor' | 'gestor';

const ensureDailyCount = async (config: any) => {
  if (!config) {
    return { leadsToday: 0, status: 'offline' as AgentStatus };
  }

  const todayKey = getTodayKey();
  if (config.leadsTodayDate !== todayKey) {
    const nextStatus = config.status === 'limite_atingido' ? 'disponivel' : config.status;
    await prisma.leadRouletteAgent.update({
      where: { id: config.id },
      data: {
        leadsToday: 0,
        leadsTodayDate: todayKey,
        status: nextStatus
      }
    });
    return { leadsToday: 0, status: nextStatus as AgentStatus };
  }

  return { leadsToday: config.leadsToday ?? 0, status: config.status as AgentStatus };
};

const buildAgents = async (): Promise<RouletteAgentShape[]> => {
  const users = await prisma.user.findMany({
    where: { role: { in: ['agent', 'admin', 'super_admin'] } },
    orderBy: { name: 'asc' }
  });

  if (!users.length) return [];

  const configs = await prisma.leadRouletteAgent.findMany({
    where: { userId: { in: users.map((user) => user.id) } }
  });
  const configMap = new Map(configs.map((config) => [config.userId, config]));

  const agents: RouletteAgentShape[] = [];
  for (const user of users) {
    const config = configMap.get(user.id);
    const { leadsToday, status } = await ensureDailyCount(config);

    agents.push({
      id: user.id,
      name: user.name,
      email: user.email,
      role: formatAgentRole(user.role),
      status: status || 'offline',
      weight: config?.weight ?? 1,
      maxLeadsPerDay: config?.maxLeadsPerDay ?? null,
      leadsToday,
      skills: parseJsonArray(config?.skills),
      workingHours: config?.workingHours ?? null,
      lastAssignedAt: config?.lastAssignedAt ?? null,
      orderIndex: config?.orderIndex ?? user.createdAt.getTime(),
      createdAt: user.createdAt
    });
  }

  return agents;
};

const pickTieBreaker = (tieBreaker: TieBreaker, a: RouletteAgentShape, b: RouletteAgentShape) => {
  if (tieBreaker === 'least_leads') {
    if (a.leadsToday !== b.leadsToday) return a.leadsToday - b.leadsToday;
    return a.name.localeCompare(b.name);
  }

  if (tieBreaker === 'longest_wait') {
    const aTime = a.lastAssignedAt ? new Date(a.lastAssignedAt).getTime() : 0;
    const bTime = b.lastAssignedAt ? new Date(b.lastAssignedAt).getTime() : 0;
    if (aTime !== bTime) return aTime - bTime;
    return a.name.localeCompare(b.name);
  }

  if (a.orderIndex !== b.orderIndex) return a.orderIndex - b.orderIndex;
  return a.name.localeCompare(b.name);
};

const pickAgent = (
  candidates: RouletteAgentShape[],
  strategy: RouletteStrategy,
  tieBreaker: TieBreaker
) => {
  const sorted = [...candidates].sort((a, b) => {
    if (strategy === 'peso') {
      if (b.weight !== a.weight) return b.weight - a.weight;
      return pickTieBreaker(tieBreaker, a, b);
    }

    if (strategy === 'prioridade_fila') {
      if (a.orderIndex !== b.orderIndex) return a.orderIndex - b.orderIndex;
      return a.name.localeCompare(b.name);
    }

    if (a.leadsToday !== b.leadsToday) return a.leadsToday - b.leadsToday;
    return pickTieBreaker(tieBreaker, a, b);
  });

  return sorted[0];
};

const isUnattendedStatus = (status?: string | null) => {
  if (!status) return false;
  return normalizeTextKey(status) === 'novo';
};

const filterBySkills = (candidates: RouletteAgentShape[], source: string) => {
  const normalizedSource = normalizeSourceValue(source);
  const skilled = candidates.filter((agent) =>
    (agent.skills || []).some((skill) => normalizeSourceValue(skill) === normalizedSource)
  );
  return skilled.length ? skilled : candidates;
};

const filterBySkipCriteria = async (candidates: RouletteAgentShape[]) => {
  if (!candidates.length) return candidates;
  const leads = await prisma.lead.findMany({
    where: { assignedTo: { in: candidates.map((agent) => agent.id) } },
    orderBy: { updatedAt: 'desc' },
    select: { assignedTo: true, status: true, updatedAt: true }
  });

  const latestLeadMap = new Map<string, { status: string | null }>();
  for (const lead of leads) {
    if (!lead.assignedTo) continue;
    if (!latestLeadMap.has(lead.assignedTo)) {
      latestLeadMap.set(lead.assignedTo, { status: lead.status });
    }
  }

  return candidates.filter((agent) => {
    const lastLead = latestLeadMap.get(agent.id);
    if (!lastLead) return true;
    return !isUnattendedStatus(lastLead.status);
  });
};

export const getRouletteSettings = async () => {
  const settings = await prisma.leadRouletteSettings.upsert({
    where: { id: SETTINGS_ID },
    update: {},
    create: {
      id: SETTINGS_ID,
      ...DEFAULT_SETTINGS
    }
  });

  return formatSettings(settings);
};

export const updateRouletteSettings = async (next: SettingsShape) => {
  const updateData = {
    enabled: next.enabled,
    defaultMode: next.defaultMode,
    criteriaIgnoreLimit: next.criteria.ignoreLimit,
    criteriaIgnoreOffline: next.criteria.ignoreOffline,
    criteriaRespectHours: next.criteria.respectHours,
    criteriaAllowSkip: next.criteria.allowSkip,
    tieBreaker: next.tieBreaker
  };

  const settings = await prisma.leadRouletteSettings.upsert({
    where: { id: SETTINGS_ID },
    update: updateData,
    create: {
      id: SETTINGS_ID,
      ...DEFAULT_SETTINGS,
      ...updateData
    }
  });

  return formatSettings(settings);
};

export const getRouletteRules = async (): Promise<RouletteRuleShape[]> => {
  const rules = await prisma.leadRouletteRule.findMany({
    orderBy: [{ orderIndex: 'asc' }, { createdAt: 'desc' }]
  });
  return rules.map(formatRule);
};

export const createRouletteRule = async (payload: {
  name: string;
  active?: boolean;
  strategy: RouletteStrategy;
  sources: string[];
  pipelines: string[];
  description?: string | null;
}) => {
  const orderAgg = await prisma.leadRouletteRule.aggregate({
    _max: { orderIndex: true }
  });
  const orderIndex = (orderAgg._max.orderIndex ?? 0) + 1;

  const rule = await prisma.leadRouletteRule.create({
    data: {
      name: payload.name,
      active: payload.active ?? true,
      strategy: payload.strategy,
      sources: stringifyArray(payload.sources),
      pipelines: stringifyArray(payload.pipelines),
      description: payload.description ?? null,
      orderIndex
    }
  });
  return formatRule(rule);
};

export const updateRouletteRule = async (id: string, payload: {
  name?: string;
  active?: boolean;
  strategy?: RouletteStrategy;
  sources?: string[];
  pipelines?: string[];
  description?: string | null;
}) => {
  const updateData: any = {};
  if (payload.name !== undefined) updateData.name = payload.name;
  if (payload.active !== undefined) updateData.active = payload.active;
  if (payload.strategy !== undefined) updateData.strategy = payload.strategy;
  if (payload.sources !== undefined) updateData.sources = stringifyArray(payload.sources);
  if (payload.pipelines !== undefined) updateData.pipelines = stringifyArray(payload.pipelines);
  if (payload.description !== undefined) updateData.description = payload.description ?? null;

  const rule = await prisma.leadRouletteRule.update({
    where: { id },
    data: updateData
  });
  return formatRule(rule);
};

export const deleteRouletteRule = async (id: string) => {
  await prisma.leadRouletteRule.delete({ where: { id } });
};

export const getRouletteAgents = async (): Promise<RouletteAgentShape[]> => {
  return buildAgents();
};

export const updateRouletteAgent = async (userId: string, payload: {
  status?: AgentStatus;
  weight?: number;
  maxLeadsPerDay?: number | null;
  skills?: string[];
  workingHours?: string | null;
}) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error('User not found');
  }

  const updateData: any = {};
  if (payload.status !== undefined) updateData.status = payload.status;
  if (payload.weight !== undefined) updateData.weight = payload.weight;
  if (payload.maxLeadsPerDay !== undefined) updateData.maxLeadsPerDay = payload.maxLeadsPerDay;
  if (payload.skills !== undefined) updateData.skills = stringifyArray(payload.skills);
  if (payload.workingHours !== undefined) updateData.workingHours = payload.workingHours;

  const config = await prisma.leadRouletteAgent.upsert({
    where: { userId },
    update: updateData,
    create: {
      userId,
      status: payload.status ?? 'offline',
      weight: payload.weight ?? 1,
      maxLeadsPerDay: payload.maxLeadsPerDay ?? null,
      skills: payload.skills ? stringifyArray(payload.skills) : JSON.stringify([]),
      workingHours: payload.workingHours ?? null,
      leadsToday: 0,
      leadsTodayDate: getTodayKey(),
      orderIndex: 0
    }
  });

  const daily = await ensureDailyCount(config);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: formatAgentRole(user.role),
    status: daily.status,
    weight: config.weight ?? 1,
    maxLeadsPerDay: config.maxLeadsPerDay ?? null,
    leadsToday: daily.leadsToday,
    skills: parseJsonArray(config.skills),
    workingHours: config.workingHours ?? null,
    lastAssignedAt: config.lastAssignedAt ?? null,
    orderIndex: config.orderIndex ?? 0,
    createdAt: user.createdAt
  } satisfies RouletteAgentShape;
};

export const resetRouletteAgentDay = async (userId: string) => {
  const config = await prisma.leadRouletteAgent.findUnique({ where: { userId } });
  if (!config) {
    throw new Error('Agent not configured');
  }

  const updated = await prisma.leadRouletteAgent.update({
    where: { userId },
    data: {
      leadsToday: 0,
      leadsTodayDate: getTodayKey(),
      status: config.status === 'limite_atingido' ? 'disponivel' : config.status
    }
  });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error('User not found');
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: formatAgentRole(user.role),
    status: updated.status as AgentStatus,
    weight: updated.weight ?? 1,
    maxLeadsPerDay: updated.maxLeadsPerDay ?? null,
    leadsToday: updated.leadsToday ?? 0,
    skills: parseJsonArray(updated.skills),
    workingHours: updated.workingHours ?? null,
    lastAssignedAt: updated.lastAssignedAt ?? null,
    orderIndex: updated.orderIndex ?? 0,
    createdAt: user.createdAt
  } satisfies RouletteAgentShape;
};

export const getRouletteLogs = async (): Promise<RouletteLogShape[]> => {
  const logs = await prisma.leadRouletteLog.findMany({
    orderBy: { assignedAt: 'desc' }
  });

  if (!logs.length) return [];

  const userIds = Array.from(new Set(logs.map((log) => log.assignedTo)));
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } }
  });
  const userMap = new Map(users.map((user) => [user.id, user]));

  return logs.map((log) => ({
    id: log.id,
    leadId: log.leadId,
    leadName: log.leadName,
    source: log.source,
    pipelineStage: log.pipelineStage,
    assignedTo: log.assignedTo,
    assignedToName: userMap.get(log.assignedTo)?.name || 'N/A',
    assignedAt: log.assignedAt.toISOString(),
    ruleId: log.ruleId
  }));
};

const selectRouletteCandidate = async (params: {
  source: string;
  stage: string;
  excludeAgentId?: string | null;
}) => {
  const settings = await getRouletteSettings();
  if (!settings.enabled) {
    return { settings, message: 'Roleta desativada no momento.' };
  }

  const rules = await getRouletteRules();
  const activeRules = rules.filter((rule) => rule.active);
  const normalizedSource = normalizeSourceValue(params.source);
  const matchedRule = activeRules.find(
    (rule) =>
      rule.pipelines.includes(params.stage) &&
      rule.sources.some((source) => normalizeSourceValue(source) === normalizedSource)
  );

  if (!matchedRule && settings.defaultMode === 'sources') {
    return { settings, message: 'Nenhuma regra ativa cobre esta fonte e estagio.' };
  }

  let candidates = await buildAgents();

  candidates = candidates.filter((agent) => agent.status !== 'pausado');
  if (params.excludeAgentId) {
    candidates = candidates.filter((agent) => agent.id !== params.excludeAgentId);
  }
  if (settings.criteria.ignoreOffline) {
    candidates = candidates.filter((agent) => agent.status !== 'offline');
  }
  if (settings.criteria.ignoreLimit) {
    candidates = candidates.filter((agent) => {
      if (!agent.maxLeadsPerDay) return true;
      return agent.leadsToday < agent.maxLeadsPerDay && agent.status !== 'limite_atingido';
    });
  }
  if (settings.criteria.respectHours) {
    candidates = candidates.filter((agent) => isWithinWorkingHours(agent.workingHours));
  }

  candidates = filterBySkills(candidates, params.source);

  if (settings.criteria.allowSkip) {
    candidates = await filterBySkipCriteria(candidates);
  }

  if (!candidates.length) {
    return { settings, rule: matchedRule, message: 'Nenhum corretor disponivel para este cenario.' };
  }

  const strategy = matchedRule?.strategy ?? 'round_robin';
  const selected = pickAgent(candidates, strategy as RouletteStrategy, settings.tieBreaker);

  return { settings, rule: matchedRule, agent: selected };
};

export const simulateRoulette = async (params: {
  source: string;
  stage: string;
  excludeAgentId?: string | null;
}) => {
  const result = await selectRouletteCandidate(params);

  if (!result.agent) {
    return {
      message: result.message || 'Nenhum corretor disponivel.',
      rule: result.rule
    };
  }

  return {
    message: `Este lead seria distribuido para: ${result.agent.name}.`,
    agent: result.agent,
    rule: result.rule
  };
};

export const assignLeadIfEligible = async (lead: {
  id: string;
  name?: string | null;
  source?: string | null;
  status?: string | null;
  assignedTo?: string | null;
}) => {
  if (lead.assignedTo) return null;

  const rawSource = lead.source || 'outro';
  const source = normalizeSourceValue(rawSource) || rawSource;
  const stage = lead.status || 'Novo';

  const result = await selectRouletteCandidate({ source, stage });
  if (!result.agent) {
    return null;
  }

  const now = new Date();
  const todayKey = getTodayKey();

  const updatedLead = await prisma.$transaction(async (tx) => {
    const config = await tx.leadRouletteAgent.findUnique({
      where: { userId: result.agent!.id }
    });

    const baseLeadsToday = config?.leadsTodayDate === todayKey ? config?.leadsToday ?? 0 : 0;
    const nextLeadsToday = baseLeadsToday + 1;
    const maxLeads = config?.maxLeadsPerDay ?? null;
    const nextStatus =
      maxLeads && nextLeadsToday >= maxLeads ? 'limite_atingido' : config?.status || 'disponivel';

    await tx.leadRouletteAgent.upsert({
      where: { userId: result.agent!.id },
      update: {
        leadsToday: nextLeadsToday,
        leadsTodayDate: todayKey,
        lastAssignedAt: now,
        status: nextStatus
      },
      create: {
        userId: result.agent!.id,
        status: nextStatus,
        weight: result.agent!.weight ?? 1,
        maxLeadsPerDay: result.agent!.maxLeadsPerDay ?? null,
        leadsToday: nextLeadsToday,
        leadsTodayDate: todayKey,
        skills: JSON.stringify(result.agent!.skills || []),
        workingHours: result.agent!.workingHours ?? null,
        lastAssignedAt: now,
        orderIndex: result.agent!.orderIndex ?? 0
      }
    });

    await tx.leadRouletteLog.create({
      data: {
        leadId: lead.id,
        leadName: lead.name || 'Lead sem nome',
        source,
        pipelineStage: stage,
        assignedTo: result.agent!.id,
        ruleId: result.rule?.id ?? null,
        assignedAt: now
      }
    });

    return tx.lead.update({
      where: { id: lead.id },
      data: { assignedTo: result.agent!.id }
    });
  });

  return updatedLead;
};
