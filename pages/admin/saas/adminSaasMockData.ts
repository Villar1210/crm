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

export const saasPlans: SaaSPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'Entrada para times pequenos e operacoes enxutas.',
    priceMonthly: 199,
    priceYearly: 1990,
    maxUsers: 5,
    maxProperties: 80,
    maxWhatsAppMessages: 2000,
    maxCampaigns: 3,
    modulesIncluded: ['crm', 'meus_imoveis', 'campanhas', 'pdf_tools']
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Para imobiliarias em crescimento com time comercial ativo.',
    priceMonthly: 699,
    priceYearly: 6990,
    maxUsers: 20,
    maxProperties: 400,
    maxWhatsAppMessages: 15000,
    maxCampaigns: 12,
    modulesIncluded: [
      'crm',
      'meus_imoveis',
      'whatsapp_marketing',
      'campanhas',
      'pdf_tools',
      'redes_sociais'
    ],
    isRecommended: true
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Cobertura completa para operacoes multi-equipe.',
    priceMonthly: 1299,
    priceYearly: 12990,
    maxUsers: 60,
    maxProperties: 1200,
    maxWhatsAppMessages: 50000,
    maxCampaigns: 40,
    modulesIncluded: [
      'crm',
      'meus_imoveis',
      'gestao_imobiliaria',
      'whatsapp_marketing',
      'campanhas',
      'pdf_tools',
      'redes_sociais'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Customizavel para grupos com necessidades avancadas.',
    priceMonthly: 2499,
    priceYearly: 24990,
    maxUsers: 200,
    maxProperties: 5000,
    maxWhatsAppMessages: 150000,
    maxCampaigns: 120,
    modulesIncluded: [
      'crm',
      'meus_imoveis',
      'gestao_imobiliaria',
      'whatsapp_marketing',
      'campanhas',
      'pdf_tools',
      'redes_sociais',
      'outro'
    ]
  }
];

export const saasAccounts: SaaSAccount[] = [
  {
    id: 'acc-1001',
    name: 'Imobiliaria Horizonte',
    type: 'imobiliaria',
    cnpjOrCpf: '12.345.678/0001-10',
    contactName: 'Fernanda Rocha',
    contactEmail: 'fernanda@horizonte.com',
    planId: 'pro',
    status: 'active',
    createdAt: addDays(-240),
    usersCount: 18,
    modulesEnabled: [
      'crm',
      'meus_imoveis',
      'whatsapp_marketing',
      'campanhas',
      'pdf_tools',
      'redes_sociais'
    ],
    deploymentType: 'saas'
  },
  {
    id: 'acc-1002',
    name: 'Construtora Vale Real',
    type: 'construtora',
    cnpjOrCpf: '84.950.111/0001-22',
    contactName: 'Ricardo Leal',
    contactEmail: 'ricardo@valereal.com',
    planId: 'enterprise',
    status: 'active',
    createdAt: addDays(-520),
    usersCount: 42,
    modulesEnabled: [
      'crm',
      'meus_imoveis',
      'gestao_imobiliaria',
      'whatsapp_marketing',
      'campanhas',
      'pdf_tools',
      'redes_sociais',
      'outro'
    ],
    deploymentType: 'enterprise',
    customDomain: 'crm.valereal.com.br',
    isWhiteLabel: true,
    notes: 'Contrato enterprise anual com suporte dedicado.'
  },
  {
    id: 'acc-1003',
    name: 'Corretor Lucas Moraes',
    type: 'corretor',
    contactName: 'Lucas Moraes',
    contactEmail: 'lucas@corretorprime.com',
    planId: 'basic',
    status: 'trial',
    createdAt: addDays(-12),
    trialEndsAt: addDays(8),
    usersCount: 2,
    modulesEnabled: ['crm', 'meus_imoveis', 'campanhas', 'pdf_tools'],
    deploymentType: 'saas'
  },
  {
    id: 'acc-1004',
    name: 'Imobiliaria Novo Lar',
    type: 'imobiliaria',
    contactName: 'Juliana Sampaio',
    contactEmail: 'juliana@novolar.com',
    planId: 'premium',
    status: 'suspended',
    createdAt: addDays(-320),
    usersCount: 26,
    modulesEnabled: [
      'crm',
      'meus_imoveis',
      'gestao_imobiliaria',
      'whatsapp_marketing',
      'campanhas',
      'pdf_tools',
    ],
    deploymentType: 'saas'
  },
  {
    id: 'acc-1005',
    name: 'Imobiliaria Alto Padrao',
    type: 'imobiliaria',
    contactName: 'Nadia Campos',
    contactEmail: 'nadia@altopadrao.com',
    planId: 'premium',
    status: 'canceled',
    createdAt: addDays(-680),
    usersCount: 12,
    modulesEnabled: [
      'crm',
      'meus_imoveis',
      'gestao_imobiliaria',
      'campanhas',
    ],
    deploymentType: 'enterprise',
    customDomain: 'crm.altopadrao.com.br',
    isWhiteLabel: true,
    notes: 'Enterprise cancelado por migracao de operacao.'
  },
  {
    id: 'acc-1006',
    name: 'Grupo Urban',
    type: 'outro',
    contactName: 'Paulo Menezes',
    contactEmail: 'paulo@grupourban.com',
    planId: 'pro',
    status: 'active',
    createdAt: addDays(-90),
    usersCount: 9,
    modulesEnabled: [
      'crm',
      'meus_imoveis',
      'whatsapp_marketing',
      'campanhas',
      'pdf_tools',
      'redes_sociais'
    ],
    deploymentType: 'saas'
  }
];

export const saasAccountUsers: SaaSAccountUser[] = [
  {
    id: 'u-2001',
    accountId: 'acc-1001',
    name: 'Fernanda Rocha',
    email: 'fernanda@horizonte.com',
    role: 'admin',
    status: 'ativo'
  },
  {
    id: 'u-2002',
    accountId: 'acc-1001',
    name: 'Bruno Cardoso',
    email: 'bruno@horizonte.com',
    role: 'gestor',
    status: 'ativo'
  },
  {
    id: 'u-2003',
    accountId: 'acc-1001',
    name: 'Camila Reis',
    email: 'camila@horizonte.com',
    role: 'corretor',
    status: 'ativo'
  },
  {
    id: 'u-2004',
    accountId: 'acc-1002',
    name: 'Ricardo Leal',
    email: 'ricardo@valereal.com',
    role: 'admin',
    status: 'ativo'
  },
  {
    id: 'u-2005',
    accountId: 'acc-1002',
    name: 'Patricia Gomes',
    email: 'patricia@valereal.com',
    role: 'financeiro',
    status: 'ativo'
  },
  {
    id: 'u-2006',
    accountId: 'acc-1002',
    name: 'Thiago Cortez',
    email: 'thiago@valereal.com',
    role: 'gestor',
    status: 'suspenso'
  },
  {
    id: 'u-2007',
    accountId: 'acc-1003',
    name: 'Lucas Moraes',
    email: 'lucas@corretorprime.com',
    role: 'admin',
    status: 'ativo'
  },
  {
    id: 'u-2008',
    accountId: 'acc-1003',
    name: 'Convite Comercial',
    email: 'comercial@corretorprime.com',
    role: 'corretor',
    status: 'convite_pendente'
  },
  {
    id: 'u-2009',
    accountId: 'acc-1004',
    name: 'Juliana Sampaio',
    email: 'juliana@novolar.com',
    role: 'admin',
    status: 'suspenso'
  },
  {
    id: 'u-2010',
    accountId: 'acc-1004',
    name: 'Marcos Reis',
    email: 'marcos@novolar.com',
    role: 'atendimento',
    status: 'suspenso'
  },
  {
    id: 'u-2011',
    accountId: 'acc-1006',
    name: 'Paulo Menezes',
    email: 'paulo@grupourban.com',
    role: 'admin',
    status: 'ativo'
  },
  {
    id: 'u-2012',
    accountId: 'acc-1006',
    name: 'Rafaela Lemos',
    email: 'rafaela@grupourban.com',
    role: 'gestor',
    status: 'ativo'
  }
];

export const saasInvoices: SaaSInvoice[] = [
  {
    id: 'inv-3101',
    accountId: 'acc-1001',
    planId: 'pro',
    amount: 699,
    status: 'pago',
    dueDate: addDays(-5),
    paidAt: addDays(-3)
  },
  {
    id: 'inv-3102',
    accountId: 'acc-1002',
    planId: 'enterprise',
    amount: 2499,
    status: 'pago',
    dueDate: addDays(-20),
    paidAt: addDays(-19)
  },
  {
    id: 'inv-3103',
    accountId: 'acc-1003',
    planId: 'basic',
    amount: 199,
    status: 'pendente',
    dueDate: addDays(5)
  },
  {
    id: 'inv-3104',
    accountId: 'acc-1004',
    planId: 'premium',
    amount: 1299,
    status: 'vencido',
    dueDate: addDays(-15)
  },
  {
    id: 'inv-3105',
    accountId: 'acc-1005',
    planId: 'premium',
    amount: 1299,
    status: 'cancelado',
    dueDate: addDays(-40)
  },
  {
    id: 'inv-3106',
    accountId: 'acc-1006',
    planId: 'pro',
    amount: 699,
    status: 'pago',
    dueDate: addDays(-2),
    paidAt: addDays(-1)
  },
  {
    id: 'inv-3107',
    accountId: 'acc-1001',
    planId: 'pro',
    amount: 699,
    status: 'pendente',
    dueDate: addDays(20)
  },
  {
    id: 'inv-3108',
    accountId: 'acc-1002',
    planId: 'enterprise',
    amount: 2499,
    status: 'pago',
    dueDate: addDays(-50),
    paidAt: addDays(-48)
  },
  {
    id: 'inv-3109',
    accountId: 'acc-1006',
    planId: 'pro',
    amount: 699,
    status: 'pendente',
    dueDate: addDays(12)
  }
];

export const saasEvents: SaaSEvent[] = [
  {
    id: 'evt-1',
    type: 'conta_criada',
    accountId: 'acc-1003',
    timestamp: addHours(-72),
    description: 'Conta Corretor Lucas Moraes criada.'
  },
  {
    id: 'evt-2',
    type: 'plano_alterado',
    accountId: 'acc-1001',
    timestamp: addHours(-50),
    description: 'Plano atualizado de Basic para Pro.'
  },
  {
    id: 'evt-3',
    type: 'modulo_ativado',
    accountId: 'acc-1002',
    timestamp: addHours(-30),
    description: 'Modulo Ferramentas PDF ativado para a conta.'
  },
  {
    id: 'evt-4',
    type: 'conta_suspensa',
    accountId: 'acc-1004',
    timestamp: addHours(-20),
    description: 'Conta suspensa por pendencias financeiras.'
  },
  {
    id: 'evt-5',
    type: 'conta_reativada',
    accountId: 'acc-1006',
    timestamp: addHours(-6),
    description: 'Conta reativada apos regularizacao.'
  }
];
