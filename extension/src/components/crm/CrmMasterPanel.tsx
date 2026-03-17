import { useEffect, useRef, useState, type ReactNode } from 'react';
import { WhatsAppScraper, type ChatIdentity } from '../../content/scraper';
import type { CrmSettings } from '../../types';

type MasterProfile = {
  cpf: string;
  birthDate: string;
  gender: string;
  maritalStatus: string;
  occupation: string;
  income: string;
  nationality: string;
  rg: string;
  inscription: string;
};

type MasterAddress = {
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
};

type MasterCommercial = {
  clientType: string;
  leadProfile: string;
  paymentType: string;
  sourceChannel: string;
  utm: string;
};

type MasterCompany = {
  name: string;
  cnpj: string;
  size: string;
  industry: string;
  website: string;
  linkedin: string;
  address: string;
  employees: string;
  revenue: string;
};

type MasterInterest = {
  purpose: string;
  propertyType: string;
  minArea: string;
  minBedrooms: string;
  parkingSpots: string;
  maxBudget: string;
  pets: string;
  condoMax: string;
  location: string;
  preferences: string;
};

type MasterProperty = {
  name: string;
  code: string;
  tower: string;
  floor: string;
  unit: string;
  value: string;
  link: string;
};

type MasterDeal = {
  value: string;
  probability: string;
  stage: string;
  expectedClose: string;
  status: string;
  lostReason: string;
};

type MasterProposal = {
  offeredValue: string;
  downPayment: string;
  installments: string;
  bank: string;
};

type MasterAutomation = {
  autoStatus: boolean;
  followupDays: string;
};

type MasterDocument = {
  id: string;
  name: string;
  url: string;
};

type CustomField = {
  id: string;
  label: string;
  value: string;
};

type MasterForm = {
  crmId?: string;
  chatId?: string;
  name: string;
  phone: string;
  email: string;
  status: string;
  source: string;
  tags: string[];
  notes: string;
  temperature: string;
  probability: string;
  interest: string;
  value: string;
  profile: MasterProfile;
  address: MasterAddress;
  commercial: MasterCommercial;
  company: MasterCompany;
  interestProfile: MasterInterest;
  property: MasterProperty;
  deal: MasterDeal;
  proposal: MasterProposal;
  automations: MasterAutomation;
  documents: MasterDocument[];
  customFields: CustomField[];
  lastInteraction: string;
};

type SectionKey =
  | 'profile'
  | 'address'
  | 'commercial'
  | 'company'
  | 'interestProfile'
  | 'property'
  | 'deal'
  | 'proposal';

type FetchState = 'idle' | 'loading' | 'error' | 'done';
type SyncState = 'idle' | 'syncing' | 'error' | 'done';

type SelectOption = { value: string; label: string };

type FieldDef = {
  key: string;
  label: string;
  placeholder?: string;
  type?: 'text' | 'number' | 'date' | 'email' | 'tel' | 'textarea' | 'select';
  options?: SelectOption[];
  span?: 1 | 2;
  format?: (value: any) => string;
  parse?: (value: string) => any;
};

type FieldGroup = {
  columns?: 1 | 2;
  fields: FieldDef[];
};

type SectionDef = {
  id: string;
  title: string;
  description?: string;
  scope?: 'root' | SectionKey;
  groups?: FieldGroup[];
  custom?: 'docs' | 'automations' | 'history' | 'customFields' | 'newMessage';
};

const STORAGE_PREFIX = 'ivillar_crm_master_';

const STATUS_LABELS: Record<string, string> = {
  Novo: 'Novo',
  'Em Triagem': 'Em Atendimento',
  Qualificado: 'Qualificados',
  Visita: 'Visita Agendada',
  Proposta: 'Proposta',
  'Negocia\u00e7\u00e3o': 'Negocia\u00e7\u00e3o',
  Vendido: 'Vendido',
  'N\u00e3o Qualificado': 'N\u00e3o Qualificado',
  Arquivado: 'Perdidos',
};

const DEFAULT_STATUS_OPTIONS: SelectOption[] = [
  { value: '', label: 'Selecione' },
  { value: 'Novo', label: 'Novo' },
  { value: 'Em Triagem', label: 'Em Atendimento' },
  { value: 'Qualificado', label: 'Qualificados' },
  { value: 'Visita', label: 'Visita Agendada' },
  { value: 'Proposta', label: 'Proposta' },
  { value: 'Negocia\u00e7\u00e3o', label: 'Negocia\u00e7\u00e3o' },
  { value: 'Vendido', label: 'Vendido' },
  { value: 'N\u00e3o Qualificado', label: 'N\u00e3o Qualificado' },
  { value: 'Arquivado', label: 'Perdidos' },
];

const SOURCE_OPTIONS: SelectOption[] = [
  { value: '', label: 'Selecione' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'site', label: 'Site' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'indication', label: 'Indicacao' },
  { value: 'portal', label: 'Portal' },
  { value: 'outro', label: 'Outro' },
];

const TEMP_OPTIONS: SelectOption[] = [
  { value: '', label: 'Selecione' },
  { value: 'cold', label: 'Frio' },
  { value: 'warm', label: 'Morno' },
  { value: 'hot', label: 'Quente' },
];

const normalizeTextKey = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const normalizeSourceValue = (value?: string) => {
  if (!value) return '';
  const key = normalizeTextKey(value);
  if (!key) return '';
  if (key.includes('whatsapp')) return 'whatsapp';
  if (key === 'site' || key === 'web' || key === 'website') return 'site';
  if (key === 'instagram') return 'instagram';
  if (key === 'facebook') return 'facebook';
  if (key.includes('indicacao')) return 'indication';
  if (key.includes('portal')) return 'portal';
  if (key.includes('outro') || key === 'other') return 'outro';
  return key;
};

const normalizeTemperatureValue = (value?: string) => {
  if (!value) return '';
  const key = normalizeTextKey(value);
  if (!key) return '';
  if (key.startsWith('hot') || key.startsWith('quente') || key.startsWith('alta')) return 'hot';
  if (key.startsWith('warm') || key.startsWith('morno') || key.startsWith('media')) return 'warm';
  if (key.startsWith('cold') || key.startsWith('frio') || key.startsWith('baixa')) return 'cold';
  return key;
};

const GENDER_OPTIONS: SelectOption[] = [
  { value: '', label: 'Selecione' },
  { value: 'Masculino', label: 'Masculino' },
  { value: 'Feminino', label: 'Feminino' },
  { value: 'Outro', label: 'Outro' },
  { value: 'Nao informar', label: 'Nao informar' },
];

const MARITAL_OPTIONS: SelectOption[] = [
  { value: '', label: 'Selecione' },
  { value: 'Solteiro', label: 'Solteiro' },
  { value: 'Casado', label: 'Casado' },
  { value: 'Divorciado', label: 'Divorciado' },
  { value: 'Viuvo', label: 'Viuvo' },
  { value: 'Uniao estavel', label: 'Uniao estavel' },
];

const CLIENT_TYPE_OPTIONS: SelectOption[] = [
  { value: '', label: 'Selecione' },
  { value: 'Pessoa fisica', label: 'Pessoa fisica' },
  { value: 'Pessoa juridica', label: 'Pessoa juridica' },
  { value: 'Investidor', label: 'Investidor' },
  { value: 'Outro', label: 'Outro' },
];

const PAYMENT_OPTIONS: SelectOption[] = [
  { value: '', label: 'Selecione' },
  { value: 'Financiamento', label: 'Financiamento' },
  { value: 'A vista', label: 'A vista' },
  { value: 'Consorcio', label: 'Consorcio' },
  { value: 'Permuta', label: 'Permuta' },
  { value: 'Outro', label: 'Outro' },
];

const PURPOSE_OPTIONS: SelectOption[] = [
  { value: '', label: 'Selecione' },
  { value: 'Compra', label: 'Compra' },
  { value: 'Aluguel', label: 'Aluguel' },
  { value: 'Investimento', label: 'Investimento' },
  { value: 'Temporada', label: 'Temporada' },
  { value: 'Outro', label: 'Outro' },
];

const PROPERTY_TYPE_OPTIONS: SelectOption[] = [
  { value: '', label: 'Selecione' },
  { value: 'Apartamento', label: 'Apartamento' },
  { value: 'Casa', label: 'Casa' },
  { value: 'Comercial', label: 'Comercial' },
  { value: 'Terreno', label: 'Terreno' },
  { value: 'Rural', label: 'Rural' },
];

const PETS_OPTIONS: SelectOption[] = [
  { value: '', label: 'Selecione' },
  { value: 'Sim', label: 'Sim' },
  { value: 'Nao', label: 'Nao' },
  { value: 'Indiferente', label: 'Indiferente' },
];

const COMPANY_SIZE_OPTIONS: SelectOption[] = [
  { value: '', label: 'Selecione' },
  { value: 'MEI', label: 'MEI' },
  { value: 'Pequena', label: 'Pequena' },
  { value: 'Media', label: 'Media' },
  { value: 'Grande', label: 'Grande' },
];

const DEAL_STATUS_OPTIONS: SelectOption[] = [
  { value: '', label: 'Selecione' },
  { value: 'Em andamento', label: 'Em andamento' },
  { value: 'Ganho', label: 'Ganho' },
  { value: 'Perdido', label: 'Perdido' },
  { value: 'Pausado', label: 'Pausado' },
];

const Section = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) => (
  <section className="mb-6">
    <div className="mb-3">
      <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      {description ? (
        <p className="text-[10px] text-slate-400 mt-1">{description}</p>
      ) : null}
    </div>
    <div className="space-y-3">{children}</div>
  </section>
);

type FieldInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  span?: 1 | 2;
};

type FieldSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  span?: 1 | 2;
};

type FieldTextareaProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  span?: 1 | 2;
};

const FieldInput = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  span,
}: FieldInputProps) => (
  <div className={span === 2 ? 'col-span-2' : ''}>
    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
      {label}
    </label>
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      type={type}
      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
    />
  </div>
);

const FieldSelect = ({
  label,
  value,
  onChange,
  options,
  span,
}: FieldSelectProps) => (
  <div className={span === 2 ? 'col-span-2' : ''}>
    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
      {label}
    </label>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
    >
      {options.map((option) => (
        <option key={option.value || option.label} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

const FieldTextarea = ({
  label,
  value,
  onChange,
  placeholder,
  span,
}: FieldTextareaProps) => (
  <div className={span === 2 ? 'col-span-2' : ''}>
    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
      {label}
    </label>
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs min-h-[80px] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
    />
  </div>
);

const splitCsv = (value: string) =>
  value.split(',').map((item) => item.trim()).filter(Boolean);

const normalizeList = (value: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean);
  if (typeof value === 'string') return splitCsv(value);
  return [String(value)];
};

const normalizePhone = (value: string) => value.replace(/\D/g, '');
const normalizeNameKey = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const buildStatusOptions = (
  statuses?: string[],
  options?: SelectOption[]
): SelectOption[] => {
  const normalizedOptions = (options || [])
    .filter((option) => option && option.value != null)
    .map((option) => ({
      value: String(option.value),
      label: String(option.label || STATUS_LABELS[String(option.value)] || option.value),
    }));
  const list = Array.isArray(statuses) ? statuses.filter(Boolean) : [];

  const merged: SelectOption[] = [{ value: '', label: 'Selecione' }];
  const seen = new Set<string>();

  const add = (value: string, label: string) => {
    const normalizedValue = String(value || '');
    if (!normalizedValue || seen.has(normalizedValue)) return;
    seen.add(normalizedValue);
    merged.push({ value: normalizedValue, label });
  };

  normalizedOptions.forEach((option) => add(option.value, option.label));
  list.forEach((value) => add(value, STATUS_LABELS[value] || value));
  DEFAULT_STATUS_OPTIONS.forEach((option) =>
    add(option.value, STATUS_LABELS[option.value] || option.label)
  );

  return merged.length > 1 ? merged : DEFAULT_STATUS_OPTIONS;
};

const parseMaybeJson = (value: any) => {
  if (!value) return null;
  if (typeof value === 'object') return value;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const isJsonLike =
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'));
  if (!isJsonLike) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
};

const normalizeDocuments = (value: any): MasterDocument[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => ({
      id: String(item?.id || item?.docId || `doc_${index}`),
      name: String(item?.name || item?.title || ''),
      url: String(item?.url || item?.link || ''),
    }))
    .filter((item) => item.name || item.url);
};

const normalizeCustomFields = (value: any): CustomField[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => ({
      id: String(item?.id || item?.fieldId || `custom_${index}`),
      label: String(item?.label || item?.name || ''),
      value: String(item?.value || ''),
    }))
    .filter((item) => item.label || item.value);
};

const getTimeValue = (value?: string | null) => {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const mergeValue = <T,>(current: T, incoming?: T): T => {
  if (incoming == null) return current;
  if (typeof current === 'string') {
    return current.trim() ? current : (incoming as T);
  }
  if (Array.isArray(current)) {
    return current.length ? current : (Array.isArray(incoming) ? incoming : current);
  }
  if (typeof current === 'object' && current !== null) {
    return mergeSection(current as Record<string, any>, incoming as Record<string, any>) as T;
  }
  return current ?? (incoming as T);
};

const mergeSection = <T extends Record<string, any>>(current: T, incoming?: Partial<T>): T => {
  if (!incoming) return current;
  const next = { ...current } as T;
  (Object.keys(current) as (keyof T)[]).forEach((key) => {
    next[key] = mergeValue(current[key], incoming[key] as T[keyof T]);
  });
  return next;
};

const mergeValuePreferIncoming = <T,>(current: T, incoming?: T): T => {
  if (incoming == null) return current;
  if (typeof incoming === 'string') {
    return incoming.trim() ? (incoming as T) : current;
  }
  if (Array.isArray(incoming)) {
    return incoming.length ? (incoming as T) : current;
  }
  if (typeof incoming === 'object' && incoming !== null) {
    return mergeSectionPreferIncoming(current as Record<string, any>, incoming as Record<string, any>) as T;
  }
  return (incoming ?? current) as T;
};

const mergeSectionPreferIncoming = <T extends Record<string, any>>(current: T, incoming?: Partial<T>): T => {
  if (!incoming) return current;
  const next = { ...current } as T;
  (Object.keys(current) as (keyof T)[]).forEach((key) => {
    next[key] = mergeValuePreferIncoming(current[key], incoming[key] as T[keyof T]);
  });
  return next;
};

const mergeForm = (current: MasterForm, incoming?: Partial<MasterForm>): MasterForm => {
  if (!incoming) return current;
  const merged: MasterForm = {
    ...current,
    crmId: current.crmId || incoming.crmId,
    chatId: current.chatId || incoming.chatId,
    name: mergeValue(current.name, incoming.name),
    phone: mergeValue(current.phone, incoming.phone),
    email: mergeValue(current.email, incoming.email),
    status: mergeValue(current.status, incoming.status),
    source: mergeValue(current.source, incoming.source),
    tags: mergeValue(current.tags, incoming.tags ?? []),
    notes: mergeValue(current.notes, incoming.notes),
    temperature: mergeValue(current.temperature, incoming.temperature),
    probability: mergeValue(current.probability, incoming.probability),
    interest: mergeValue(current.interest, incoming.interest),
    value: mergeValue(current.value, incoming.value),
    profile: mergeSection(current.profile, incoming.profile),
    address: mergeSection(current.address, incoming.address),
    commercial: mergeSection(current.commercial, incoming.commercial),
    company: mergeSection(current.company, incoming.company),
    interestProfile: mergeSection(current.interestProfile, incoming.interestProfile),
    property: mergeSection(current.property, incoming.property),
    deal: mergeSection(current.deal, incoming.deal),
    proposal: mergeSection(current.proposal, incoming.proposal),
    automations: mergeSection(current.automations, incoming.automations),
    documents: mergeValue(current.documents, incoming.documents ?? []),
    customFields: mergeValue(current.customFields, incoming.customFields ?? []),
    lastInteraction: mergeValue(current.lastInteraction, incoming.lastInteraction),
  };
  return {
    ...merged,
    source: normalizeSourceValue(merged.source),
    temperature: normalizeTemperatureValue(merged.temperature),
  };
};

const mergeFormPreferIncoming = (current: MasterForm, incoming?: Partial<MasterForm>): MasterForm => {
  if (!incoming) return current;
  const merged: MasterForm = {
    ...current,
    crmId: mergeValuePreferIncoming(current.crmId, incoming.crmId),
    chatId: mergeValuePreferIncoming(current.chatId, incoming.chatId),
    name: mergeValuePreferIncoming(current.name, incoming.name),
    phone: mergeValuePreferIncoming(current.phone, incoming.phone),
    email: mergeValuePreferIncoming(current.email, incoming.email),
    status: mergeValuePreferIncoming(current.status, incoming.status),
    source: mergeValuePreferIncoming(current.source, incoming.source),
    tags: mergeValuePreferIncoming(current.tags, incoming.tags ?? []),
    notes: mergeValuePreferIncoming(current.notes, incoming.notes),
    temperature: mergeValuePreferIncoming(current.temperature, incoming.temperature),
    probability: mergeValuePreferIncoming(current.probability, incoming.probability),
    interest: mergeValuePreferIncoming(current.interest, incoming.interest),
    value: mergeValuePreferIncoming(current.value, incoming.value),
    profile: mergeSectionPreferIncoming(current.profile, incoming.profile),
    address: mergeSectionPreferIncoming(current.address, incoming.address),
    commercial: mergeSectionPreferIncoming(current.commercial, incoming.commercial),
    company: mergeSectionPreferIncoming(current.company, incoming.company),
    interestProfile: mergeSectionPreferIncoming(current.interestProfile, incoming.interestProfile),
    property: mergeSectionPreferIncoming(current.property, incoming.property),
    deal: mergeSectionPreferIncoming(current.deal, incoming.deal),
    proposal: mergeSectionPreferIncoming(current.proposal, incoming.proposal),
    automations: mergeSectionPreferIncoming(current.automations, incoming.automations),
    documents: mergeValuePreferIncoming(current.documents, incoming.documents ?? []),
    customFields: mergeValuePreferIncoming(current.customFields, incoming.customFields ?? []),
    lastInteraction: mergeValuePreferIncoming(current.lastInteraction, incoming.lastInteraction),
  };
  return {
    ...merged,
    source: normalizeSourceValue(merged.source),
    temperature: normalizeTemperatureValue(merged.temperature),
  };
};

const buildStorageKeys = (chat: ChatIdentity | null) => {
  if (!chat) return [`${STORAGE_PREFIX}unknown`];
  const legacyKey = `${STORAGE_PREFIX}${chat.chatId || chat.phone || chat.name || 'unknown'}`;
  const keys = [legacyKey];
  if (chat.chatId) keys.push(`${STORAGE_PREFIX}id_${chat.chatId}`);
  if (chat.phone) keys.push(`${STORAGE_PREFIX}phone_${chat.phone}`);
  if (!chat.chatId && !chat.phone && chat.name) keys.push(`${STORAGE_PREFIX}name_${chat.name}`);
  return Array.from(new Set(keys));
};

const matchesChatIdentity = (saved: MasterForm, chat: ChatIdentity | null) => {
  if (!chat) return false;
  if (saved.chatId && chat.chatId) return saved.chatId === chat.chatId;
  const savedPhone = normalizePhone(saved.phone || '');
  const chatPhone = normalizePhone(chat.phone || '');
  if (savedPhone && chatPhone) return savedPhone === chatPhone;
  if (saved.chatId || savedPhone || chat.chatId || chatPhone) return false;
  const savedName = normalizeNameKey(saved.name || '');
  const chatName = normalizeNameKey(chat.name || '');
  return !!savedName && savedName === chatName;
};

const buildDefaultForm = (chat: ChatIdentity | null): MasterForm => ({
  crmId: undefined,
  chatId: chat?.chatId,
  name: chat?.name || '',
  phone: chat?.phone || '',
  email: '',
  status: '',
  source: chat ? 'whatsapp' : '',
  tags: [],
  notes: '',
  temperature: '',
  probability: '',
  interest: '',
  value: '',
  profile: {
    cpf: '',
    birthDate: '',
    gender: '',
    maritalStatus: '',
    occupation: '',
    income: '',
    nationality: '',
    rg: '',
    inscription: '',
  },
  address: {
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  },
  commercial: {
    clientType: '',
    leadProfile: '',
    paymentType: '',
    sourceChannel: '',
    utm: '',
  },
  company: {
    name: '',
    cnpj: '',
    size: '',
    industry: '',
    website: '',
    linkedin: '',
    address: '',
    employees: '',
    revenue: '',
  },
  interestProfile: {
    purpose: '',
    propertyType: '',
    minArea: '',
    minBedrooms: '',
    parkingSpots: '',
    maxBudget: '',
    pets: '',
    condoMax: '',
    location: '',
    preferences: '',
  },
  property: {
    name: '',
    code: '',
    tower: '',
    floor: '',
    unit: '',
    value: '',
    link: '',
  },
  deal: {
    value: '',
    probability: '',
    stage: '',
    expectedClose: '',
    status: '',
    lostReason: '',
  },
  proposal: {
    offeredValue: '',
    downPayment: '',
    installments: '',
    bank: '',
  },
  automations: {
    autoStatus: true,
    followupDays: '',
  },
  documents: [],
  customFields: [],
  lastInteraction: new Date().toISOString(),
});

const mapLeadToForm = (lead: any, chat: ChatIdentity | null): Partial<MasterForm> => {
  if (!lead) return {};
  const profileData = parseMaybeJson(lead.profile);
  const preferencesData = parseMaybeJson(lead.preferences);
  const enrichedData = parseMaybeJson(lead.enrichedData);

  const profile = (profileData && typeof profileData === 'object'
    ? profileData.profile || profileData
    : {}) as Partial<MasterProfile>;
  const preferences = (preferencesData && typeof preferencesData === 'object'
    ? preferencesData
    : {}) as Record<string, any>;
  const enriched = (enrichedData && typeof enrichedData === 'object'
    ? enrichedData
    : {}) as Record<string, any>;
  const defaults = buildDefaultForm(chat);
  const asSection = (value: any) => (value && typeof value === 'object' ? value : {});

  const profileSection = { ...defaults.profile, ...asSection(profile) };
  const addressSection = { ...defaults.address, ...asSection(preferences.address || enriched.address) };
  const commercialSection = { ...defaults.commercial, ...asSection(preferences.commercial || enriched.commercial) };
  const companySection = { ...defaults.company, ...asSection(preferences.company || enriched.company) };
  const interestSection = {
    ...defaults.interestProfile,
    ...asSection(preferences.interestProfile || preferences.interest || enriched.interestProfile),
  };
  const propertySection = { ...defaults.property, ...asSection(preferences.property || enriched.property) };
  const dealSection = { ...defaults.deal, ...asSection(preferences.deal || enriched.deal) };
  const proposalSection = { ...defaults.proposal, ...asSection(preferences.proposal || enriched.proposal) };
  const automationSection = { ...defaults.automations, ...asSection(enriched.automations || preferences.automations) };

  return {
    crmId: lead.id || lead.crmId,
    name: lead.name || chat?.name || '',
    phone: lead.phone || chat?.phone || '',
    email: lead.email || '',
    status: lead.status || '',
    source: normalizeSourceValue(lead.source || ''),
    tags: normalizeList(lead.tags),
    notes: typeof lead.notes === 'string' ? lead.notes : normalizeList(lead.notes).join('\n'),
    temperature: normalizeTemperatureValue(lead.temperature || ''),
    probability: lead.probability != null ? String(lead.probability) : '',
    interest: lead.interest || '',
    value: lead.value != null ? String(lead.value) : '',
    lastInteraction: lead.lastInteraction || '',
    profile: profileSection,
    address: addressSection,
    commercial: commercialSection,
    company: companySection,
    interestProfile: interestSection,
    property: propertySection,
    deal: dealSection,
    proposal: proposalSection,
    automations: automationSection,
    documents: normalizeDocuments(preferences.documents || enriched.documents || lead.documents),
    customFields: normalizeCustomFields(preferences.customFields || enriched.customFields || lead.customFields),
  };
};

function sendRuntimeMessage<T>(message: any): Promise<T> {
  return new Promise((resolve, reject) => {
    try {
      if (typeof chrome === 'undefined' || !chrome.runtime) {
        throw new Error('Chrome runtime not available');
      }
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        if (response && typeof response === 'object' && 'error' in response && response.error) {
          reject(new Error(String(response.error)));
          return;
        }
        resolve(response);
      });
    } catch (error) {
      reject(error);
    }
  });
}

const getCrmAppUrl = (settings: CrmSettings | null) => {
  if (!settings) return '';
  if (settings.appUrl) return settings.appUrl;
  if (!settings.baseUrl) return '';
  return settings.baseUrl.replace(/\/api\/?$/, '') + '/#/admin/crm';
};

const SECTIONS: SectionDef[] = [
  {
    id: 'dados-cliente',
    title: 'Dados do cliente',
    description: 'Cadastro principal do contato.',
    scope: 'root',
    groups: [
      {
        columns: 2,
        fields: [
          { key: 'name', label: 'Nome', placeholder: 'Nome completo' },
          { key: 'phone', label: 'Telefone', placeholder: 'WhatsApp', type: 'tel' },
        ],
      },
      {
        columns: 2,
        fields: [
          { key: 'email', label: 'Email', placeholder: 'cliente@email.com', type: 'email' },
          { key: 'status', label: 'Status do lead', type: 'select', options: DEFAULT_STATUS_OPTIONS },
        ],
      },
      {
        columns: 2,
        fields: [
          { key: 'source', label: 'Origem', type: 'select', options: SOURCE_OPTIONS },
          { key: 'temperature', label: 'Temperatura', type: 'select', options: TEMP_OPTIONS },
        ],
      },
      {
        columns: 2,
        fields: [
          { key: 'probability', label: 'Probabilidade', placeholder: '0-100', type: 'number' },
          { key: 'value', label: 'Valor estimado', placeholder: 'R$ 0,00' },
        ],
      },
      {
        columns: 2,
        fields: [
          { key: 'interest', label: 'Interesse', placeholder: 'Compra, aluguel, investimento', span: 2 },
          {
            key: 'tags',
            label: 'Tags',
            placeholder: 'VIP, quente',
            format: (value) => normalizeList(value).join(', '),
            parse: splitCsv,
            span: 2,
          },
        ],
      },
      {
        columns: 1,
        fields: [
          {
            key: 'notes',
            label: 'Observacoes internas',
            placeholder: 'Notas internas',
            type: 'textarea',
            span: 2,
          },
        ],
      },
    ],
  },
  {
    id: 'dados-pessoais',
    title: 'Dados pessoais',
    scope: 'profile',
    groups: [
      {
        columns: 2,
        fields: [
          { key: 'cpf', label: 'CPF', placeholder: '000.000.000-00' },
          { key: 'rg', label: 'RG', placeholder: '00.000.000-0' },
        ],
      },
      {
        columns: 2,
        fields: [
          { key: 'birthDate', label: 'Nascimento', type: 'date' },
          { key: 'gender', label: 'Genero', type: 'select', options: GENDER_OPTIONS },
        ],
      },
      {
        columns: 2,
        fields: [
          { key: 'maritalStatus', label: 'Estado civil', type: 'select', options: MARITAL_OPTIONS },
          { key: 'occupation', label: 'Profissao', placeholder: 'Corretor, advogado...' },
        ],
      },
      {
        columns: 2,
        fields: [
          { key: 'income', label: 'Renda mensal', placeholder: 'R$ 0,00' },
          { key: 'nationality', label: 'Nacionalidade', placeholder: 'Brasil' },
        ],
      },
      {
        columns: 1,
        fields: [
          { key: 'inscription', label: 'Inscricao', placeholder: 'CRECI, OAB...', span: 2 },
        ],
      },
    ],
  },
  {
    id: 'endereco',
    title: 'Endereco',
    scope: 'address',
    groups: [
      {
        columns: 1,
        fields: [
          { key: 'street', label: 'Rua', placeholder: 'Rua, avenida', span: 2 },
        ],
      },
      {
        columns: 2,
        fields: [
          { key: 'number', label: 'Numero', placeholder: '123' },
          { key: 'complement', label: 'Complemento', placeholder: 'Apto 45' },
        ],
      },
      {
        columns: 2,
        fields: [
          { key: 'neighborhood', label: 'Bairro', placeholder: 'Centro' },
          { key: 'city', label: 'Cidade', placeholder: 'Sao Paulo' },
        ],
      },
      {
        columns: 2,
        fields: [
          { key: 'state', label: 'Estado', placeholder: 'SP' },
          { key: 'zipCode', label: 'CEP', placeholder: '00000-000' },
        ],
      },
      {
        columns: 1,
        fields: [
          { key: 'country', label: 'Pais', placeholder: 'Brasil', span: 2 },
        ],
      },
    ],
  },
  {
    id: 'comercial',
    title: 'Comercial',
    scope: 'commercial',
    groups: [
      {
        columns: 2,
        fields: [
          { key: 'clientType', label: 'Tipo de cliente', type: 'select', options: CLIENT_TYPE_OPTIONS },
          { key: 'leadProfile', label: 'Perfil do lead', placeholder: 'Investidor, moradia' },
        ],
      },
      {
        columns: 2,
        fields: [
          { key: 'paymentType', label: 'Forma de pagamento', type: 'select', options: PAYMENT_OPTIONS },
          { key: 'sourceChannel', label: 'Canal de origem', type: 'select', options: SOURCE_OPTIONS },
        ],
      },
      {
        columns: 1,
        fields: [
          { key: 'utm', label: 'UTM', placeholder: 'utm_source=...', span: 2 },
        ],
      },
    ],
  },
  {
    id: 'empresa',
    title: 'Empresa',
    scope: 'company',
    groups: [
      {
        columns: 2,
        fields: [
          { key: 'name', label: 'Nome da empresa', placeholder: 'Empresa XYZ' },
          { key: 'cnpj', label: 'CNPJ', placeholder: '00.000.000/0000-00' },
        ],
      },
      {
        columns: 2,
        fields: [
          { key: 'size', label: 'Porte', type: 'select', options: COMPANY_SIZE_OPTIONS },
          { key: 'industry', label: 'Segmento', placeholder: 'Construcao, varejo' },
        ],
      },
      {
        columns: 2,
        fields: [
          { key: 'website', label: 'Website', placeholder: 'https://empresa.com' },
          { key: 'linkedin', label: 'Linkedin', placeholder: 'https://linkedin.com' },
        ],
      },
      {
        columns: 1,
        fields: [
          { key: 'address', label: 'Endereco da empresa', placeholder: 'Endereco completo', span: 2 },
        ],
      },
      {
        columns: 2,
        fields: [
          { key: 'employees', label: 'Funcionarios', placeholder: '0-0' },
          { key: 'revenue', label: 'Faturamento', placeholder: 'R$ 0,00' },
        ],
      },
    ],
  },
  {
    id: 'interesses',
    title: 'Interesses',
    scope: 'interestProfile',
    groups: [
      {
        columns: 2,
        fields: [
          { key: 'purpose', label: 'Finalidade', type: 'select', options: PURPOSE_OPTIONS },
          { key: 'propertyType', label: 'Tipo de imovel', type: 'select', options: PROPERTY_TYPE_OPTIONS },
        ],
      },
      {
        columns: 2,
        fields: [
          { key: 'minArea', label: 'Area minima', placeholder: 'm2' },
          { key: 'minBedrooms', label: 'Min. quartos', placeholder: '1' },
        ],
      },
      {
        columns: 2,
        fields: [
          { key: 'parkingSpots', label: 'Vagas', placeholder: '1' },
          { key: 'maxBudget', label: 'Orcamento max', placeholder: 'R$ 0,00' },
        ],
      },
      {
        columns: 2,
        fields: [
          { key: 'pets', label: 'Aceita pets', type: 'select', options: PETS_OPTIONS },
          { key: 'condoMax', label: 'Condominio max', placeholder: 'R$ 0,00' },
        ],
      },
      {
        columns: 1,
        fields: [
          { key: 'location', label: 'Localizacao desejada', placeholder: 'Bairros, cidades', span: 2 },
        ],
      },
      {
        columns: 1,
        fields: [
          {
            key: 'preferences',
            label: 'Preferencias adicionais',
            placeholder: 'Observacoes adicionais',
            type: 'textarea',
            span: 2,
          },
        ],
      },
    ],
  },
  {
    id: 'imovel',
    title: 'Imovel em negociacao',
    scope: 'property',
    groups: [
      {
        columns: 2,
        fields: [
          { key: 'name', label: 'Nome do imovel', placeholder: 'Residencial Alfa' },
          { key: 'code', label: 'Codigo', placeholder: 'IMV-0001' },
        ],
      },
      {
        columns: 2,
        fields: [
          { key: 'tower', label: 'Torre', placeholder: 'A' },
          { key: 'floor', label: 'Andar', placeholder: '10' },
        ],
      },
      {
        columns: 2,
        fields: [
          { key: 'unit', label: 'Unidade', placeholder: '1001' },
          { key: 'value', label: 'Valor', placeholder: 'R$ 0,00' },
        ],
      },
      {
        columns: 1,
        fields: [
          { key: 'link', label: 'Link do imovel', placeholder: 'https://', span: 2 },
        ],
      },
    ],
  },
  {
    id: 'negocio',
    title: 'Negocio',
    scope: 'deal',
    groups: [
      {
        columns: 2,
        fields: [
          { key: 'value', label: 'Valor do negocio', placeholder: 'R$ 0,00' },
          { key: 'probability', label: 'Probabilidade', placeholder: '0-100', type: 'number' },
        ],
      },
      {
        columns: 2,
        fields: [
          { key: 'stage', label: 'Etapa', placeholder: 'Proposta, visita' },
          { key: 'expectedClose', label: 'Fechamento previsto', type: 'date' },
        ],
      },
      {
        columns: 2,
        fields: [
          { key: 'status', label: 'Status do negocio', type: 'select', options: DEAL_STATUS_OPTIONS },
          { key: 'lostReason', label: 'Motivo de perda', type: 'textarea', span: 2 },
        ],
      },
    ],
  },
  {
    id: 'proposta',
    title: 'Proposta',
    scope: 'proposal',
    groups: [
      {
        columns: 2,
        fields: [
          { key: 'offeredValue', label: 'Valor ofertado', placeholder: 'R$ 0,00' },
          { key: 'downPayment', label: 'Entrada', placeholder: 'R$ 0,00' },
        ],
      },
      {
        columns: 2,
        fields: [
          { key: 'installments', label: 'Parcelas', placeholder: 'Ex: 120x' },
          { key: 'bank', label: 'Banco', placeholder: 'Banco XYZ' },
        ],
      },
    ],
  },
  {
    id: 'automacoes',
    title: 'Automacoes',
    description: 'Regras e follow-ups automatizados.',
    custom: 'automations',
  },
  {
    id: 'documentos',
    title: 'Documentos',
    description: 'Arquivos vinculados ao contato.',
    custom: 'docs',
  },
  {
    id: 'campos-personalizados',
    title: 'Campos personalizados',
    description: 'Informacoes extras do cliente.',
    custom: 'customFields',
  },
  {
    id: 'historico',
    title: 'Historico de conversas',
    description: 'Ultimas mensagens do WhatsApp.',
    custom: 'history',
  },
  {
    id: 'nova-mensagem',
    title: 'Enviar Mensagem',
    description: 'Enviar mensagem direta.',
    custom: 'newMessage',
  },
];

type CrmMasterPanelProps = {
  activeChat: ChatIdentity | null;
};

export function CrmMasterPanel({ activeChat }: CrmMasterPanelProps) {
  const [settings, setSettings] = useState<CrmSettings | null>(null);
  const [form, setForm] = useState<MasterForm>(() => buildDefaultForm(activeChat));
  const [fetchState, setFetchState] = useState<FetchState>('idle');
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [syncMessage, setSyncMessage] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [history, setHistory] = useState(() => WhatsAppScraper.getRecentMessages(10));
  const [statusOptions, setStatusOptions] = useState<SelectOption[]>(DEFAULT_STATUS_OPTIONS);
  const [statusSyncState, setStatusSyncState] = useState<SyncState>('idle');
  const lastFetchKeyRef = useRef('');
  const lastFetchAtRef = useRef(0);
  const lastFetchErrorAtRef = useRef(0);
  const fetchInFlightRef = useRef(false);

  // Message Sending State
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);

  const lastStatusRef = useRef(form.status);

  const crmAppUrl = getCrmAppUrl(settings);
  const lastMessage = history.length ? history[history.length - 1] : null;


  useEffect(() => {
    let active = true;
    sendRuntimeMessage<{ settings: CrmSettings }>({ type: 'GET_SETTINGS' })
      .then((response) => {
        if (!active) return;
        if (response?.settings) {
          setSettings(response.settings);
        }
      })
      .catch(() => {
        if (active) {
          setSettings({ baseUrl: '' });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    sendRuntimeMessage<{ statuses?: string[]; options?: SelectOption[] }>({
      type: 'FETCH_STATUSES',
    })
      .then((response) => {
        if (!active) return;
        setStatusOptions(buildStatusOptions(response?.statuses, response?.options));
      })
      .catch(() => {
        if (active) {
          setStatusOptions(buildStatusOptions());
        }
      });

    return () => {
      active = false;
    };
  }, [settings?.baseUrl, settings?.token]);

  useEffect(() => {
    if (!form.status) return;
    setStatusOptions((current) =>
      buildStatusOptions([form.status, ...current.map((item) => item.value)], current)
    );
  }, [form.status]);

  useEffect(() => {
    setHydrated(false);
    const defaults = buildDefaultForm(activeChat);

    if (!activeChat || typeof chrome === 'undefined' || !chrome.storage) {
      setForm(defaults);
      setHydrated(true);
      return;
    }

    const storageKeys = buildStorageKeys(activeChat);
    chrome.storage.local
      .get(storageKeys)
      .then((result) => {
        const saved = storageKeys
          .map((key) => result[key] as MasterForm | undefined)
          .find((entry) => entry && matchesChatIdentity(entry, activeChat));
        if (saved) {
          setForm(mergeForm(saved, defaults));
        } else {
          setForm(defaults);
        }
      })
      .finally(() => setHydrated(true));
  }, [activeChat?.chatId, activeChat?.phone, activeChat?.name]);

  useEffect(() => {
    if (!hydrated || !activeChat) return;
    const nextPhone = normalizePhone(activeChat.phone || '');
    const nextName = activeChat.name || '';

    setForm((prev) => {
      let changed = false;
      const next = { ...prev };

      if (!prev.phone.trim() && nextPhone) {
        next.phone = nextPhone;
        changed = true;
      }

      const currentName = prev.name.trim();
      if ((!currentName || currentName === 'Desconhecido') && nextName) {
        next.name = nextName;
        changed = true;
      }

      if (!changed) return prev;
      return { ...next, lastInteraction: new Date().toISOString() };
    });
  }, [activeChat?.phone, activeChat?.name, hydrated]);

  useEffect(() => {
    if (!activeChat) {
      setHistory([]);
      return;
    }

    const updateHistory = () => {
      setHistory(WhatsAppScraper.getRecentMessages(10));
    };

    updateHistory();
    const timer = setInterval(updateHistory, 3000);
    return () => clearInterval(timer);
  }, [activeChat?.chatId, activeChat?.phone, activeChat?.name]);

  useEffect(() => {
    if (!hydrated || !activeChat) return;
    if (typeof chrome === 'undefined' || !chrome.storage) return;
    const storageKeys = buildStorageKeys(activeChat);
    const payload = Object.fromEntries(storageKeys.map((key) => [key, form]));
    chrome.storage.local.set(payload);
  }, [form, hydrated, activeChat?.chatId, activeChat?.phone, activeChat?.name]);

  useEffect(() => {
    if (!hydrated || !activeChat) return;
    if (!activeChat.phone && !activeChat.name) return;

    const normalizedPhone = normalizePhone(activeChat.phone || '');
    const nameKey = normalizeNameKey(activeChat.name || '');
    const fetchKey = normalizedPhone
      ? `phone:${normalizedPhone}|name:${nameKey}`
      : `name:${nameKey}`;
    const now = Date.now();

    if (fetchInFlightRef.current && lastFetchKeyRef.current === fetchKey) {
      return;
    }
    if (lastFetchKeyRef.current === fetchKey && now - lastFetchAtRef.current < 4000) {
      return;
    }
    if (lastFetchErrorAtRef.current && now - lastFetchErrorAtRef.current < 15000) {
      console.log('[CRM PANEL] Fetch skipped (cooldown after error)');
      return;
    }

    let cancelled = false;
    setFetchState('loading');
    lastFetchAtRef.current = now;
    lastFetchKeyRef.current = fetchKey;
    fetchInFlightRef.current = true;

    const phoneQuery = normalizedPhone || activeChat.phone;
    const timer = setTimeout(() => {
      if (cancelled) return;

      sendRuntimeMessage<{ lead?: any }>({
        type: 'FETCH_LEAD',
        phone: phoneQuery,
        name: activeChat.name,
      })
        .then((response) => {
          if (cancelled) return;
          console.log('[CRM PANEL] Fetch response:', response);
          if (response?.lead) {
            console.log('[CRM PANEL] Lead found:', response.lead);
            setForm((current) => {
              const remoteUpdatedAt = getTimeValue(response.lead.updatedAt || response.lead.lastInteraction);
              const localUpdatedAt = getTimeValue(current.lastInteraction);
              const mapped = mapLeadToForm(response.lead, activeChat);
              console.log('[CRM PANEL] Mapped form:', mapped);
              return remoteUpdatedAt > localUpdatedAt
                ? mergeFormPreferIncoming(current, mapped)
                : mergeForm(current, mapped);
            });
          } else {
            console.log('[CRM PANEL] No lead found in fetch');
          }
          setFetchState('done');
          lastFetchErrorAtRef.current = 0;
        })
        .catch((err) => {
          console.error('[CRM PANEL] Fetch error:', err);
          lastFetchErrorAtRef.current = Date.now();
          if (!cancelled) setFetchState('error');
        })
        .finally(() => {
          fetchInFlightRef.current = false;
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [hydrated, activeChat?.phone, activeChat?.name, settings?.baseUrl, settings?.token]);

  useEffect(() => {
    if (!hydrated) return;
    if (!form.status) return;
    if (form.status === lastStatusRef.current) return;
    lastStatusRef.current = form.status;

    if (!form.crmId) {
      return;
    }

    let cancelled = false;
    setStatusSyncState('syncing');

    sendRuntimeMessage<{ lead?: any }>({
      type: 'SAVE_LEAD',
      leadId: form.crmId,
      payload: {
        status: form.status,
        lastInteraction: form.lastInteraction || new Date().toISOString(),
      },
    })
      .then(() => {
        if (cancelled) return;
        setStatusSyncState('done');
        setTimeout(() => {
          if (!cancelled) setStatusSyncState('idle');
        }, 1500);
      })
      .catch(() => {
        if (!cancelled) setStatusSyncState('error');
      });

    return () => {
      cancelled = true;
    };
  }, [form.status, form.crmId, form.lastInteraction, hydrated]);

  const markDirty = () => {
    if (syncState !== 'idle' || syncMessage) {
      setSyncState('idle');
      setSyncMessage('');
    }
  };

  const updateRoot = (key: keyof MasterForm, value: any) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
      lastInteraction: new Date().toISOString(),
    }));
    markDirty();
  };

  const updateSection = (section: SectionKey, key: string, value: any) => {
    setForm((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] as Record<string, any>),
        [key]: value,
      },
      lastInteraction: new Date().toISOString(),
    }));
    markDirty();
  };

  const updateAutomation = (key: keyof MasterAutomation, value: any) => {
    setForm((prev) => ({
      ...prev,
      automations: {
        ...prev.automations,
        [key]: value,
      },
      lastInteraction: new Date().toISOString(),
    }));
    markDirty();
  };

  const addDocument = () => {
    setForm((prev) => ({
      ...prev,
      documents: [
        ...prev.documents,
        { id: `doc_${Date.now()}`, name: '', url: '' },
      ],
    }));
    markDirty();
  };

  const updateDocument = (id: string, key: 'name' | 'url', value: string) => {
    setForm((prev) => ({
      ...prev,
      documents: prev.documents.map((doc) =>
        doc.id === id ? { ...doc, [key]: value } : doc
      ),
    }));
    markDirty();
  };

  const removeDocument = (id: string) => {
    setForm((prev) => ({
      ...prev,
      documents: prev.documents.filter((doc) => doc.id !== id),
    }));
    markDirty();
  };

  const addCustomField = () => {
    setForm((prev) => ({
      ...prev,
      customFields: [
        ...prev.customFields,
        { id: `custom_${Date.now()}`, label: '', value: '' },
      ],
    }));
    markDirty();
  };

  const updateCustomField = (id: string, key: 'label' | 'value', value: string) => {
    setForm((prev) => ({
      ...prev,
      customFields: prev.customFields.map((field) =>
        field.id === id ? { ...field, [key]: value } : field
      ),
    }));
    markDirty();
  };

  const removeCustomField = (id: string) => {
    setForm((prev) => ({
      ...prev,
      customFields: prev.customFields.filter((field) => field.id !== id),
    }));
    markDirty();
  };

  const renderField = (scope: 'root' | SectionKey, field: FieldDef) => {
    const source = scope === 'root' ? (form as Record<string, any>) : (form[scope] as Record<string, any>);
    const rawValue = source[field.key];
    const formattedValue = field.format ? field.format(rawValue) : rawValue;
    const value = formattedValue == null ? '' : String(formattedValue);
    const handleChange = (nextValue: string) => {
      const parsedValue = field.parse ? field.parse(nextValue) : nextValue;
      if (scope === 'root') {
        updateRoot(field.key as keyof MasterForm, parsedValue);
      } else {
        updateSection(scope, field.key, parsedValue);
      }
    };

    if (field.type === 'textarea') {
      return (
        <FieldTextarea
          key={`${scope}-${field.key}`}
          label={field.label}
          value={value}
          onChange={handleChange}
          placeholder={field.placeholder}
          span={field.span}
        />
      );
    }

    if (field.type === 'select') {
      const options = field.key === 'status' ? statusOptions : field.options || [];
      return (
        <FieldSelect
          key={`${scope}-${field.key}`}
          label={field.label}
          value={value}
          onChange={handleChange}
          options={options}
          span={field.span}
        />
      );
    }

    return (
      <FieldInput
        key={`${scope}-${field.key}`}
        label={field.label}
        value={value}
        onChange={handleChange}
        placeholder={field.placeholder}
        type={field.type}
        span={field.span}
      />
    );
  };

  const renderHistory = () => {
    if (history.length === 0) {
      return <p className="text-xs text-slate-400">Sem mensagens no momento.</p>;
    }

    return (
      <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-2">
        {history.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.direction === 'out' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-2 py-1 text-[11px] ${message.direction === 'out'
                ? 'bg-brand-50 text-brand-700'
                : 'bg-slate-100 text-slate-700'
                }`}
            >
              <p>{message.text}</p>
              {message.timestamp ? (
                <span className="block text-[9px] text-slate-400 mt-1">
                  {message.timestamp}
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    setSending(true);
    try {
      // 1. Focus input
      const inserted = WhatsAppScraper.insertMessage(messageText);
      if (!inserted) {
        alert('Falha ao focar no campo de mensagem. O chat está aberto?');
        return;
      }

      // 2. Click send
      // Wait a tiny bit for UI update
      await new Promise(r => setTimeout(r, 50));
      const sent = await WhatsAppScraper.clickSend();

      if (sent) {
        // Optimistically add to history
        const optimisticMsg = {
          id: 'local_' + Date.now(),
          direction: 'out' as const,
          text: messageText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setHistory(prev => [...prev, optimisticMsg]);
        setMessageText('');
      } else {
        alert('Botão de enviar não encontrado.');
      }
    } catch (e) {
      console.error('Send error:', e);
    } finally {
      setSending(false);
    }
  };

  const renderNewMessage = () => (
    <div className="space-y-3">
      <div className="relative">
        <textarea
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Digite sua mensagem... (Enter para enviar)"
          disabled={sending}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs min-h-[80px] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />
      </div>
      <div className="flex justify-end">
        <button
          onClick={handleSendMessage}
          disabled={!messageText.trim() || sending}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
        >
          {sending ? 'Enviando...' : 'Enviar'}
          {!sending && (
            <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current" aria-hidden="true">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
            </svg>
          )}
        </button>
      </div>
    </div>
  );

  const renderDocuments = () => (
    <div className="space-y-3">
      {form.documents.length === 0 ? (
        <p className="text-xs text-slate-400">Nenhum documento vinculado.</p>
      ) : null}
      {form.documents.map((doc) => (
        <div key={doc.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
          <input
            value={doc.name}
            onChange={(event) => updateDocument(doc.id, 'name', event.target.value)}
            placeholder="Nome do arquivo"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
          <input
            value={doc.url}
            onChange={(event) => updateDocument(doc.id, 'url', event.target.value)}
            placeholder="Link"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
          <button
            onClick={() => removeDocument(doc.id)}
            className="text-slate-300 hover:text-rose-500 transition text-xs"
            title="Remover"
          >
            x
          </button>
        </div>
      ))}
      <button
        onClick={addDocument}
        className="w-full rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs text-slate-500 hover:bg-slate-50 transition"
      >
        Adicionar documento
      </button>
    </div>
  );

  const renderCustomFields = () => (
    <div className="space-y-3">
      {form.customFields.length === 0 ? (
        <p className="text-xs text-slate-400">Nenhum campo personalizado.</p>
      ) : null}
      {form.customFields.map((field) => (
        <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
          <input
            value={field.label}
            onChange={(event) => updateCustomField(field.id, 'label', event.target.value)}
            placeholder="Campo"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
          <input
            value={field.value}
            onChange={(event) => updateCustomField(field.id, 'value', event.target.value)}
            placeholder="Valor"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
          <button
            onClick={() => removeCustomField(field.id)}
            className="text-slate-300 hover:text-rose-500 transition text-xs"
            title="Remover"
          >
            x
          </button>
        </div>
      ))}
      <button
        onClick={addCustomField}
        className="w-full rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs text-slate-500 hover:bg-slate-50 transition"
      >
        Adicionar campo
      </button>
    </div>
  );

  const renderAutomations = () => (
    <div className="space-y-3">
      <FieldInput
        label="Dias para follow-up"
        value={form.automations.followupDays}
        onChange={(value) => updateAutomation('followupDays', value)}
        placeholder="Ex: 3"
        type="number"
      />
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        <p className="text-[10px] font-semibold text-slate-500 uppercase">Ultima mensagem</p>
        <p className="text-xs text-slate-700 mt-1">
          {lastMessage ? lastMessage.text : 'Sem mensagens recentes.'}
        </p>
        {lastMessage?.timestamp ? (
          <p className="text-[10px] text-slate-400 mt-1">{lastMessage.timestamp}</p>
        ) : null}
      </div>
    </div>
  );

  const handleSync = async () => {
    setSyncState('syncing');
    setSyncMessage('');

    // Rule: CRM save accepts partial data; do not block saves on missing fields.
    const resolvedName = (form.name || activeChat?.name || '').trim();
    const resolvedEmail = form.email.trim();
    const resolvedPhone = normalizePhone(form.phone || activeChat?.phone || '');
    const safeName = resolvedName || resolvedPhone;

    const preferencesPayload = JSON.stringify({
      address: form.address,
      commercial: form.commercial,
      company: form.company,
      interestProfile: form.interestProfile,
      property: form.property,
      deal: form.deal,
      proposal: form.proposal,
      documents: form.documents,
      customFields: form.customFields,
    });

    const enrichedPayload = JSON.stringify({
      automations: form.automations,
      lastMessage: lastMessage
        ? {
          text: lastMessage.text,
          direction: lastMessage.direction,
          timestamp: lastMessage.timestamp,
        }
        : null,
    });

    const payload = {
      name: safeName,
      email: resolvedEmail,
      phone: resolvedPhone,
      status: form.status,
      tags: form.tags,
      notes: form.notes,
      source: normalizeSourceValue(form.source),
      temperature: normalizeTemperatureValue(form.temperature),
      probability: form.probability,
      interest: form.interest,
      value: form.value,
      lastInteraction: form.lastInteraction || new Date().toISOString(),
      profile: JSON.stringify(form.profile),
      preferences: preferencesPayload,
      enrichedData: enrichedPayload,
    };

    console.log('[CRM PANEL] Starting handleSync. Form Data:', { crmId: form.crmId, status: form.status, name: resolvedName, phone: resolvedPhone });
    try {
      console.log('[CRM PANEL] Sending SAVE_LEAD message with payload:', payload);
      const saveResponse = await sendRuntimeMessage<{ lead?: any }>({
        type: 'SAVE_LEAD',
        leadId: form.crmId,
        payload,
      });

      console.log('Salvo, enviado para o CRM', saveResponse);

      if (saveResponse?.lead?.id) {
        setForm((prev) => ({ ...prev, crmId: saveResponse.lead.id }));
      }

      setSyncState('done');
      setSyncMessage('CRM salvo e enviado.');
    } catch (error: any) {
      console.error('Erro ao enviar para o CRM:', error);
      setSyncState('error');
      setSyncMessage(error?.message || 'Falha ao sincronizar.');
    }
  };

  const lastInteractionLabel = form.lastInteraction ? form.lastInteraction.split('T')[0] : '-';
  const contactName = form.name || activeChat?.name || 'Contato';
  const contactPhone = form.phone || activeChat?.phone || '';
  const contactInitial = contactName.trim().slice(0, 1).toUpperCase() || 'C';

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase">CRM</p>
          <h2 className="text-sm font-bold text-slate-900">Dados do cliente</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => crmAppUrl && window.open(crmAppUrl, '_blank', 'noopener')}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 transition disabled:opacity-60"
            disabled={!crmAppUrl}
          >
            Abrir CRM
          </button>
          <button
            onClick={handleSync}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-semibold text-white shadow-sm shadow-emerald-200 hover:bg-emerald-700 transition disabled:opacity-60"
            disabled={syncState === 'syncing'}
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
              <path d="M17 21v-8H7v8" />
              <path d="M7 3v5h8" />
            </svg>
            {syncState === 'syncing' ? 'Salvando...' : 'Salvar CRM'}
          </button>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
          {activeChat?.avatarUrl ? (
            <img src={activeChat.avatarUrl} alt={contactName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-bold text-slate-500">{contactInitial}</span>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{contactName}</p>
          <p className="text-xs text-slate-500">{contactPhone || 'Sem telefone'}</p>
        </div>
      </div>

      <div className="px-4 py-2 border-b border-slate-100 text-[10px] text-slate-500 flex flex-wrap gap-2">
        {fetchState === 'loading' ? <span>Buscando CRM...</span> : null}
        {fetchState === 'error' ? (
          <span className="text-rose-500">Falha ao buscar CRM.</span>
        ) : null}
        {statusSyncState === 'syncing' ? <span>Atualizando status...</span> : null}
        {statusSyncState === 'done' ? (
          <span className="text-emerald-600">Status atualizado.</span>
        ) : null}
        {statusSyncState === 'error' ? (
          <span className="text-rose-500">Falha ao atualizar status.</span>
        ) : null}
        {syncState === 'done' ? (
          <span className="text-emerald-600">{syncMessage || 'CRM sincronizado.'}</span>
        ) : null}
        {syncState === 'error' ? (
          <span className="text-rose-500">{syncMessage || 'Falha ao sincronizar.'}</span>
        ) : null}
      </div>

      {!activeChat ? (
        <div className="p-4 text-xs text-slate-500">Abra um chat no WhatsApp para editar o CRM.</div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          {SECTIONS.map((section) => (
            <Section key={section.id} title={section.title} description={section.description}>
              {section.custom === 'automations' ? renderAutomations() : null}
              {section.custom === 'newMessage' ? renderNewMessage() : null}
              {section.custom === 'docs' ? renderDocuments() : null}
              {section.custom === 'customFields' ? renderCustomFields() : null}
              {section.custom === 'history' ? renderHistory() : null}
              {(section.groups || []).map((group, index) => (
                <div
                  key={`${section.id}-group-${index}`}
                  className={group.columns === 2 ? 'grid grid-cols-2 gap-2' : 'grid gap-2'}
                >
                  {group.fields.map((field) => renderField(section.scope || 'root', field))}
                </div>
              ))}
            </Section>
          ))}
        </div>
      )}

      <div className="px-4 py-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
        <span>ID CRM: {form.crmId || '-'}</span>
        <span>Ultima atualizacao: {lastInteractionLabel}</span>
      </div>
    </div>
  );
}
