export type SaaSModuleKey =
  | 'crm'
  | 'meus_imoveis'
  | 'gestao_imobiliaria'
  | 'whatsapp_marketing'
  | 'redes_sociais'
  | 'campanhas'
  | 'pdf_tools'
  | 'outro';

export type SaaSModule = {
  key: SaaSModuleKey;
  name: string;
  description: string;
};

export type SaaSPlan = {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly?: number;
  maxUsers?: number;
  maxProperties?: number;
  maxWhatsAppMessages?: number;
  maxCampaigns?: number;
  modulesIncluded: SaaSModuleKey[];
  isRecommended?: boolean;
};

export type SaaSAccountStatus = 'trial' | 'active' | 'suspended' | 'canceled';

export type SaaSDeploymentType = 'saas' | 'enterprise';

export type SaaSAccount = {
  id: string;
  name: string;
  type: 'imobiliaria' | 'construtora' | 'corretor' | 'outro';
  cnpjOrCpf?: string;
  contactName: string;
  contactEmail: string;
  planId: string;
  status: SaaSAccountStatus;
  createdAt: string;
  trialEndsAt?: string;
  usersCount: number;
  modulesEnabled: SaaSModuleKey[];
  deploymentType: SaaSDeploymentType;
  customDomain?: string;
  isWhiteLabel?: boolean;
  notes?: string;
};

export type SaaSAccountUser = {
  id: string;
  accountId: string;
  name: string;
  email: string;
  role: 'admin' | 'gestor' | 'corretor' | 'atendimento' | 'financeiro';
  status: 'ativo' | 'suspenso' | 'convite_pendente';
};

export type SaaSInvoiceStatus = 'pago' | 'pendente' | 'vencido' | 'cancelado';

export type SaaSInvoice = {
  id: string;
  accountId: string;
  planId: string;
  amount: number;
  status: SaaSInvoiceStatus;
  dueDate: string;
  paidAt?: string;
};

export type SaaSEvent = {
  id: string;
  type:
    | 'conta_criada'
    | 'plano_alterado'
    | 'modulo_ativado'
    | 'modulo_desativado'
    | 'conta_suspensa'
    | 'conta_reativada'
    | 'conta_cancelada'
    | 'fatura_paga'
    | 'fatura_cancelada';
  accountId: string;
  timestamp: string;
  description: string;
};

const toDate = (date: Date) => date.toISOString().split('T')[0];

const addDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toDate(date);
};

const addHours = (hours: number) => {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date.toISOString();
};

export const saasModules: SaaSModule[] = [
  {
    key: 'crm',
    name: 'CRM & Leads',
    description: 'Gestao de leads, funil e atendimento.'
  },
  {
    key: 'meus_imoveis',
    name: 'Meus Imoveis',
    description: 'Cadastro, vitrine e distribuicao de imoveis.'
  },
  {
    key: 'gestao_imobiliaria',
    name: 'Gestao Imobiliaria',
    description: 'Contratos, financeiro, ocupacao e manutencao.'
  },
  {
    key: 'whatsapp_marketing',
    name: 'WhatsApp Marketing',
    description: 'Disparos, funis e automacoes no WhatsApp.'
  },
  {
    key: 'redes_sociais',
    name: 'Redes Sociais',
    description: 'Calendario editorial e performance de posts.'
  },
  {
    key: 'campanhas',
    name: 'Campanhas',
    description: 'Landing pages, captacao e campanhas pagas.'
  },
  {
    key: 'pdf_tools',
    name: 'Ferramentas PDF',
    description: 'Geracao e compartilhamento de documentos.'
  },
  {
    key: 'outro',
    name: 'Modulo Extra',
    description: 'Funcionalidades beta e recursos futuros.'
  }
];

export const saasModuleMap = saasModules.reduce<Record<SaaSModuleKey, SaaSModule>>(
  (acc, module) => {
    acc[module.key] = module;
    return acc;
  },
  {} as Record<SaaSModuleKey, SaaSModule>
);

export const saasPlans: SaaSPlan[] = [];

export const saasAccounts: SaaSAccount[] = [];

export const saasAccountUsers: SaaSAccountUser[] = [];

export const saasInvoices: SaaSInvoice[] = [];

export const saasEvents: SaaSEvent[] = [];
