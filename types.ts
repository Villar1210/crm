

// Enums mirroring database constraints
export enum PropertyType {
  APARTMENT = 'Apartamento',
  HOUSE = 'Casa',
  COMMERCIAL = 'Comercial',
  LAND = 'Terreno',
  LAUNCH = 'Lançamento'
}

export enum LeadStatus {
  NEW = 'Novo',
  TRIAGE = 'Em Triagem',
  QUALIFIED = 'Qualificado',
  VISIT_SCHEDULED = 'Visita',
  PROPOSAL = 'Proposta',
  NEGOTIATION = 'Negociação',
  CLOSED = 'Vendido',
  DISQUALIFIED = 'Não Qualificado', // Status para descarte (sem perfil, contato errado)
  LOST = 'Arquivado'
}

// Data Models
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'super_admin' | 'buyer' | 'agent';
  team?: 'Vendas' | 'Locação' | 'Lançamentos'; // Novo: Times
  avatar?: string;
  phone?: string;
  favorites?: string[]; // IDs of favorited properties
}

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  buttonText: string;
  active: boolean;
  order: number;
}

export interface LaunchDetails {
  deliveryDate: string;
  constructionProgress: number; // 0 to 100
  stage: 'Fundação' | 'Estrutura' | 'Alvenaria' | 'Acabamento';
}

export interface Property {
  id: string;
  title: string;
  description: string;

  // Financials
  businessType: 'SALE' | 'RENT' | 'BOTH'; // Venda, Locação ou Ambos
  price: number; // Valor de Venda
  rentPrice?: number; // Valor do Aluguel
  condoPrice?: number; // Valor do Condomínio
  iptuPrice?: number; // Valor do IPTU (mensal)

  type: PropertyType;
  bedrooms: number;
  bathrooms: number;
  suites: number;
  area: number;
  address: string;
  city: string;
  state: string;
  images: string[];
  featured: boolean;
  published?: boolean;
  realEstateLinked?: boolean;
  realEstateLinkId?: string;
  status: 'active' | 'sold' | 'rented' | 'pending';
  features: string[];
  launchDetails?: LaunchDetails; // Optional, only for launches
  campaignIds?: string[]; // IDs of campaigns this property belongs to
}

export type ActivityType = 'call' | 'meeting' | 'email' | 'visit' | 'whatsapp' | 'lunch' | 'proposal' | 'system_log';

export interface Task {
  id: string;
  title: string;
  dueDate: string; // ISO Date YYYY-MM-DD
  dueTime?: string; // HH:MM
  completed: boolean;
  type: ActivityType;
  notes?: string;
  createdAt: string;
}

export interface LeadDocument {
  id: string;
  name: string;
  url: string;
  type: 'pdf' | 'image' | 'doc';
  uploadedAt: string;
}

export interface LeadEnrichedData {
  jobTitle?: string;
  company?: string;
  linkedin?: string;
  instagram?: string;
  estimatedIncome?: string;
  location?: string;
  propertyId?: string;
  propertyCode?: string;
  propertyLink?: string;
  propertyAddress?: string;
  // Master Profile Extensions
  inscription?: string; // Inscrição Estadual/Municipal
  revenue?: string;
  employees?: number;
  industry?: string;
  website?: string;
  clientType?: 'buyer' | 'seller' | 'investor' | 'company';
  leadProfile?: 'A' | 'B' | 'C' | 'D';
  paymentType?: 'cash' | 'financing' | 'exchange';
  description?: string;
  salutation?: string;
}

// RD Station Style Profile Data
export interface LeadAddress {
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface LeadPreferences {
  propertyType?: string[];
  minBedrooms?: number;
  minArea?: number;
  maxBudget?: number;
  purpose?: 'live' | 'invest';
  financing?: boolean;
  parkingSpots?: number;
  pets?: boolean;
}

export interface LeadProfile {
  cpf?: string;
  rg?: string;
  birthDate?: string;
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
  occupation?: string;
  nationality?: string;
  children?: number;
  pets?: boolean;
  income?: number;
  language?: string;
  gender?: 'M' | 'F' | 'O';
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: LeadStatus;
  interest: string;
  notes: string[]; // Legacy simple notes
  tasks: Task[]; // New: Task Management (Activities)
  tags: string[]; // New: Segmentation Tags
  createdAt: string;
  source: 'site' | 'whatsapp' | 'instagram' | 'facebook' | 'indication' | 'portal';
  value?: number;

  // CRM Intelligence
  temperature?: 'hot' | 'warm' | 'cold'; // hot=compra em 30d, warm=90d, cold=curioso
  lastInteraction?: string; // ISO date
  probability?: number; // 0-100%
  assignedTo?: string; // agent id (User ID)
  lostReason?: string; // Motivo da perda (se status for LOST ou DISQUALIFIED)

  // Enterprise Features
  score?: number; // 0-100 Lead Scoring
  documents?: LeadDocument[]; // GED
  enrichedData?: LeadEnrichedData; // Data Enrichment
  scriptData?: Record<string, boolean>; // Persistência do roteiro de perguntas (Question Text -> Checked)

  // Detailed Registration (Cadastro Completo)
  profile?: LeadProfile;
  address?: LeadAddress;
  preferences?: LeadPreferences;
  linkedPropertyIds?: string[];
  ignoredPropertyIds?: string[];
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  discountPercentage?: number;
  startDate: string;
  endDate?: string;
  active: boolean;
  image: string;
  properties?: Property[];
  ctaLink?: string;
}

export interface Job {
  id: string;
  title: string;
  type: 'CLT' | 'PJ' | 'Estágio';
  description: string;
  department: string;
  requirements: string[];
  benefits: string[];
  location: string;
  active: boolean;
}

// --- MARKETING & SOCIAL MEDIA ---

export interface SocialPost {
  id: string;
  content: string;
  image?: string;
  platforms: ('instagram' | 'facebook' | 'linkedin')[];
  scheduledDate: string; // ISO
  status: 'published' | 'scheduled' | 'draft';
  likes?: number;
  comments?: number;
}

export type AdPlatform = 'meta' | 'google' | 'linkedin' | 'tiktok';

export type AdObjective = 'reach' | 'traffic' | 'leads' | 'messages';

export interface AdsDashboardStats {
  totalInvestment: number;
  totalReach: number;
  totalClicks: number;
  activeCampaigns: number;
}

// --- WHATSAPP INTEGRATION ---
export interface WhatsAppCredentials {
  phoneNumberId: string;
  accessToken: string;
  businessAccountId?: string;
}

export interface WhatsAppMessage {
  id: string;
  wa_id?: string;
  text: string;
  body?: string; // Alias for text from wa-web.js
  sender: 'agent' | 'user';
  from?: string; // Raw sender ID
  timestamp: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  type: 'text' | 'image' | 'audio' | 'document' | 'template' | 'property';
  mediaUrl?: string; // For image/audio/doc
  metadata?: any; // Extra data like duration, property info
}

export interface WhatsAppChat {
  id: string; // Internal or Phone Number
  phoneNumber: string; // Only digits
  name: string;
  avatar?: string;
  unreadCount: number;
  lastMessage: string;
  lastMessageTime: string;
  stage?: string; // Funnel stage
  tags: string[];
  messages: WhatsAppMessage[];
}

export interface WhatsAppTemplate {
  name: string;
  language: string;
  components: any[];
}


export interface AdCampaign {
  id: string;
  name: string;
  platform: AdPlatform;
  status: 'active' | 'paused' | 'ended';
  objective: AdObjective;
  dailyBudget: number;
  totalBudget: number;
  spent: number;
  impressions: number;
  clicks: number;
  leads: number;
  cpl?: number;
  ctr?: number;
  propertyId?: string; // Linked property
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt?: string;
  thumbnail: string;
}

// --- WHATSAPP STATION (WaSeller Clone) ---

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'agent' | 'system';
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

export interface ChatConversation {
  id: string;
  leadId: string; // Links to CRM Lead
  leadName: string;
  leadAvatar?: string;
  lastMessage: string;
  unreadCount: number;
  lastActivity: string;
  assignedTo?: string; // Agent ID
  tags: string[];
  messages: ChatMessage[];
  status: 'open' | 'waiting' | 'closed';
  stage?: 'new' | 'talking' | 'proposal' | 'won' | 'lost'; // Kanban Stage
  notes?: string[];
}

// --- SYSTEM SETTINGS ---
export interface CRMSettings {
  allowDefaultPipelineDeletion: boolean;
  enableProfileMaster: boolean;
  enableProfileWA: boolean;
  enableProfileSF: boolean;
  enableProfilePD: boolean;
  enableProfileRD: boolean;
  defaultProfile: 'MASTER' | 'WA' | 'SF' | 'PD' | 'RD';
  // WhatsApp Integration Mode (Global Default)
  whatsappIntegrationMode: 'platform' | 'official' | 'extension';
  // Automations
  enableAutomations: boolean;
  automationStagnancyDays: number; // Days to consider a lead "stagnant"
  // E-Sign Settings
}

export type ActionType = 'link' | 'route' | 'function';

export interface LinkTreeAction {
  id: string;
  label: string;
  icon: any;
  type: ActionType;
  value: string;
  primary?: boolean;
}

// --- TYPES FOR PIPELINES ---
export interface PipelineStage {
  id: string;
  title: string;
  color: string; // Tailwind border color class
  bgClass?: string;
}

export interface PipelineGroup {
  id: string;
  title: string;
  color: string; // Hex or Tailwind class for the grouping line
  stageIds: string[];
}

export interface Pipeline {
  id: string;
  title: string;
  isDefault: boolean;
  stages: PipelineStage[];
  groups?: PipelineGroup[];
}

// --- DEEP PERSONALIZATION TYPES ---

export interface TemplateVariable {
  key: string; // e.g. "lead.name"
  label: string; // e.g. "Nome do Lead"
  type: 'text' | 'date' | 'number' | 'currency';
  category: 'lead' | 'property' | 'deal' | 'custom' | 'system';
  fallback?: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  category: 'birthday' | 'renewal' | 'reminder' | 'follow_up' | 'custom';
  content: string; // "Olá {{lead.name}}..."
  channel: 'whatsapp' | 'email' | 'sms';
  status: 'active' | 'draft';
  variables: string[]; // List of variable keys used
  createdAt: string;
  updatedAt: string;
}

export type TriggerEvent =
  | 'birthday'
  | 'deal_won'
  | 'deal_lost'
  | 'payment_due'
  | 'renewal_due'
  | 'stage_change'
  | 'stagnant_lead'
  | 'new_lead'
  | 'visit_scheduled'
  | 'custom';

export interface TriggerCondition {
  field: string; // e.g. "lead.temperature"
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'not_equals';
  value: any;
}

export interface ScheduleConfig {
  frequency: 'daily' | 'weekly' | 'monthly' | 'once';
  time?: string; // "09:00"
  daysOfWeek?: number[];
  dayOfMonth?: number;
}

export interface TriggerAction {
  type: 'send_message' | 'create_task' | 'change_stage';
  delay?: number; // minutes
  targetChannels: ('whatsapp' | 'email' | 'sms')[];
}

export interface AutomationTrigger {
  id: string;
  name: string;
  event: TriggerEvent;
  conditions?: TriggerCondition[];
  action: TriggerAction;
  templateId: string;
  enabled: boolean;
  schedule?: ScheduleConfig;
  lastRun?: string;
  nextRun?: string;
}

// --- EMAIL MARKETING MODULE ---

export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  preheader?: string;
  senderName: string;
  senderEmail: string;
  replyTo?: string;
  type: 'manual' | 'automation';
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'failed';
  templateId?: string;
  htmlContent?: string;
  jsonContent?: any;
  segmentId?: string;
  segmentRules?: any;
  recipientCount: number;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  bouncedCount: number;
  unsubscribedCount: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  abTestEnabled: boolean;
  abTestConfig?: any;
  scheduledAt?: string;
  sentAt?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  category: 'launch' | 'newsletter' | 'follow_up' | 'reengagement' | 'institutional' | 'custom';
  htmlContent: string;
  jsonContent?: any;
  variables: string[];
  isSystem: boolean;
  isGlobal: boolean;
  active: boolean;
  thumbnail?: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailRecipient {
  id: string;
  campaignId: string;
  leadId?: string;
  email: string;
  name?: string;
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed';
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  bouncedAt?: string;
  unsubscribedAt?: string;
  openCount: number;
  clickCount: number;
  device?: string;
  location?: string;
  userAgent?: string;
  createdAt: string;
}

export interface EmailMetrics {
  id: string;
  campaignId: string;
  linkUrl: string;
  linkText?: string;
  clickCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface EmailAutomationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater' | 'less';
  value: any;
}

export interface EmailAutomationAction {
  type: 'send_email' | 'create_task' | 'change_status' | 'add_tag';
  delay?: number;
  config: any;
}

export interface EmailAutomation {
  id: string;
  name: string;
  trigger: 'new_lead' | 'status_change' | 'property_favorited' | 'appointment_scheduled' | 'stagnant_lead' | 'birthday' | 'custom';
  conditions?: EmailAutomationCondition[];
  actions: EmailAutomationAction[];
  templateId: string;
  enabled: boolean;
  scheduleFrequency?: 'immediate' | 'daily' | 'weekly' | 'monthly';
  scheduleDelay?: number;
  lastRun?: string;
  nextRun?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailList {
  id: string;
  name: string;
  description?: string;
  type: 'static' | 'dynamic';
  segmentRules?: any;
  contactCount: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailContact {
  id: string;
  leadId?: string;
  email: string;
  name?: string;
  status: 'active' | 'inactive' | 'unsubscribed' | 'bounced';
  consentDate?: string;
  consentSource?: string;
  unsubscribeDate?: string;
  unsubscribeReason?: string;
  customFields?: Record<string, any>;
  listId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailDashboardStats {
  totalSent: number;
  avgOpenRate: number;
  avgClickRate: number;
  avgBounceRate: number;
  totalUnsubscribed: number;
  activeCampaigns: number;
  lastCampaign?: EmailCampaign;
  chartData: {
    date: string;
    sent: number;
    opened: number;
    clicked: number;
  }[];
}

export interface EmailEditorBlock {
  id: string;
  type: 'text' | 'image' | 'button' | 'divider' | 'list' | 'html' | 'property';
  content: any;
  styles?: Record<string, any>;
}

