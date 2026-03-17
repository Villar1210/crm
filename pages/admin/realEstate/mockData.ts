// TODO: replace mock data with API integration.
export type RealEstateKpis = {
  totalProperties: number;
  occupiedProperties: number;
  vacantProperties: number;
  occupancyRate: number;
  lateTenants: number;
  receivableMonth: number;
  payableOwners: number;
};

export const realEstateKpis: RealEstateKpis = {
  totalProperties: 248,
  occupiedProperties: 196,
  vacantProperties: 52,
  occupancyRate: 79,
  lateTenants: 14,
  receivableMonth: 482000,
  payableOwners: 316000
};

export const revenueExpenseSeries = [
  { month: 'Jan', revenue: 420000, expense: 260000 },
  { month: 'Fev', revenue: 455000, expense: 275000 },
  { month: 'Mar', revenue: 498000, expense: 291000 },
  { month: 'Abr', revenue: 472000, expense: 283000 },
  { month: 'Mai', revenue: 515000, expense: 302000 },
  { month: 'Jun', revenue: 489000, expense: 295000 }
];

export const delinquencySeries = [
  { month: 'Jan', rate: 4.8 },
  { month: 'Fev', rate: 4.2 },
  { month: 'Mar', rate: 3.6 },
  { month: 'Abr', rate: 3.9 },
  { month: 'Mai', rate: 3.1 },
  { month: 'Jun', rate: 3.4 }
];

export type RealEstateProperty = {
  id: string;
  title: string;
  address: string;
  type: string;
  owner: string;
  status: 'ocupado' | 'vago' | 'reservado';
  purpose: 'locacao' | 'venda' | 'ambos';
  rent: number;
  financeStatus: 'em dia' | 'atrasado';
  sitePropertyId?: string;
};

export const realEstateProperties: RealEstateProperty[] = [
  {
    id: 're-001',
    title: 'Apto 1202 - Vista Parque',
    address: 'Rua das Palmeiras, 1202 - Jardins',
    type: 'Apartamento',
    owner: 'Helena Duarte',
    status: 'ocupado',
    purpose: 'locacao',
    rent: 4200,
    financeStatus: 'em dia'
  },
  {
    id: 're-002',
    title: 'Casa Térrea - Alameda Sul',
    address: 'Alameda Sul, 88 - Moema',
    type: 'Casa',
    owner: 'Grupo Nobile',
    status: 'vago',
    purpose: 'locacao',
    rent: 7800,
    financeStatus: 'em dia'
  },
  {
    id: 're-003',
    title: 'Sala Comercial 1406',
    address: 'Av. Paulista, 1406 - Bela Vista',
    type: 'Comercial',
    owner: 'Ricardo Moraes',
    status: 'ocupado',
    purpose: 'ambos',
    rent: 6100,
    financeStatus: 'atrasado'
  },
  {
    id: 're-004',
    title: 'Loft 35A - Skyline',
    address: 'Rua Harmonia, 315 - Vila Madalena',
    type: 'Loft',
    owner: 'Isadora Vilela',
    status: 'reservado',
    purpose: 'locacao',
    rent: 3500,
    financeStatus: 'em dia'
  },
  {
    id: 're-005',
    title: 'Cobertura 501',
    address: 'Rua da Serra, 501 - Morumbi',
    type: 'Cobertura',
    owner: 'Helena Duarte',
    status: 'ocupado',
    purpose: 'venda',
    rent: 9800,
    financeStatus: 'em dia'
  },
  {
    id: 're-006',
    title: 'Apto 408 - Parque Central',
    address: 'Av. Central, 408 - Vila Mariana',
    type: 'Apartamento',
    owner: 'Patrícia Silveira',
    status: 'vago',
    purpose: 'locacao',
    rent: 3200,
    financeStatus: 'em dia'
  },
  {
    id: 're-007',
    title: 'Studio 210 - Urban Mix',
    address: 'Rua Augusta, 210 - Consolação',
    type: 'Studio',
    owner: 'Ribeiro Holdings',
    status: 'ocupado',
    purpose: 'ambos',
    rent: 2800,
    financeStatus: 'em dia'
  },
  {
    id: 're-008',
    title: 'Casa Comercial 12',
    address: 'Rua Faria Lima, 12 - Pinheiros',
    type: 'Comercial',
    owner: 'Grupo Nobile',
    status: 'reservado',
    purpose: 'locacao',
    rent: 12000,
    financeStatus: 'atrasado'
  }
];

const REAL_ESTATE_PROPERTIES_STORAGE_KEY = 'ivillar_real_estate_properties';

const readStoredRealEstateProperties = (): RealEstateProperty[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = localStorage.getItem(REAL_ESTATE_PROPERTIES_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as RealEstateProperty[];
    }
    return [];
  } catch (error) {
    console.warn('Failed to read stored real estate properties', error);
    return [];
  }
};

export const getRealEstateProperties = (): RealEstateProperty[] => {
  const stored = readStoredRealEstateProperties();
  const storedIds = new Set(stored.map(item => item.id));
  const base = realEstateProperties.filter(item => !storedIds.has(item.id));
  return [...stored, ...base];
};

export const addRealEstateProperty = (property: RealEstateProperty) => {
  if (typeof window === 'undefined') {
    return;
  }
  const stored = readStoredRealEstateProperties();
  const next = [property, ...stored];
  localStorage.setItem(REAL_ESTATE_PROPERTIES_STORAGE_KEY, JSON.stringify(next));
};

export const upsertRealEstateProperty = (property: RealEstateProperty) => {
  if (typeof window === 'undefined') {
    return;
  }
  const stored = readStoredRealEstateProperties();
  const index = stored.findIndex(item => item.id === property.id);
  const next =
    index >= 0
      ? [...stored.slice(0, index), property, ...stored.slice(index + 1)]
      : [property, ...stored];
  localStorage.setItem(REAL_ESTATE_PROPERTIES_STORAGE_KEY, JSON.stringify(next));
};

export type RealEstateOwner = {
  id: string;
  name: string;
  type: 'PF' | 'PJ';
  propertiesCount: number;
  receivableMonth: number;
  status: 'em dia' | 'pendencias';
  document: string;
  phone: string;
  email: string;
};

export const realEstateOwners: RealEstateOwner[] = [
  {
    id: 'owner-01',
    name: 'Helena Duarte',
    type: 'PF',
    propertiesCount: 8,
    receivableMonth: 48200,
    status: 'em dia',
    document: '123.456.789-00',
    phone: '(11) 99876-5544',
    email: 'helena.duarte@email.com'
  },
  {
    id: 'owner-02',
    name: 'Grupo Nobile',
    type: 'PJ',
    propertiesCount: 12,
    receivableMonth: 88500,
    status: 'pendencias',
    document: '12.345.678/0001-90',
    phone: '(11) 3322-1144',
    email: 'financeiro@nobile.com.br'
  },
  {
    id: 'owner-03',
    name: 'Ricardo Moraes',
    type: 'PF',
    propertiesCount: 4,
    receivableMonth: 21700,
    status: 'em dia',
    document: '987.654.321-10',
    phone: '(11) 99123-9912',
    email: 'ricardo.moraes@email.com'
  },
  {
    id: 'owner-04',
    name: 'Patrícia Silveira',
    type: 'PF',
    propertiesCount: 3,
    receivableMonth: 12400,
    status: 'em dia',
    document: '321.654.987-00',
    phone: '(11) 98811-2200',
    email: 'patricia.silveira@email.com'
  },
  {
    id: 'owner-05',
    name: 'Ribeiro Holdings',
    type: 'PJ',
    propertiesCount: 6,
    receivableMonth: 35600,
    status: 'pendencias',
    document: '22.334.556/0001-12',
    phone: '(11) 3001-8899',
    email: 'contato@ribeiroholdings.com.br'
  }
];

export const ownerDetails: Record<string, {
  properties: { name: string; address: string; status: string }[];
  summary: { totalRent: number; totalTransfers: number; pending: number };
}> = {
  'owner-01': {
    properties: [
      { name: 'Apto 1202 - Vista Parque', address: 'Rua das Palmeiras, 1202', status: 'Ocupado' },
      { name: 'Cobertura 501', address: 'Rua da Serra, 501', status: 'Ocupado' }
    ],
    summary: { totalRent: 62000, totalTransfers: 51000, pending: 1200 }
  },
  'owner-02': {
    properties: [
      { name: 'Casa Térrea - Alameda Sul', address: 'Alameda Sul, 88', status: 'Vago' },
      { name: 'Sala Comercial 1406', address: 'Av. Paulista, 1406', status: 'Ocupado' }
    ],
    summary: { totalRent: 88500, totalTransfers: 70200, pending: 5400 }
  },
  'owner-03': {
    properties: [
      { name: 'Loft 35A - Skyline', address: 'Rua Harmonia, 315', status: 'Reservado' }
    ],
    summary: { totalRent: 21700, totalTransfers: 18000, pending: 0 }
  },
  'owner-04': {
    properties: [
      { name: 'Apto 408 - Parque Central', address: 'Av. Central, 408', status: 'Vago' }
    ],
    summary: { totalRent: 12400, totalTransfers: 10200, pending: 0 }
  },
  'owner-05': {
    properties: [
      { name: 'Studio 210 - Urban Mix', address: 'Rua Augusta, 210', status: 'Ocupado' },
      { name: 'Sala Comercial 1406', address: 'Av. Paulista, 1406', status: 'Ocupado' }
    ],
    summary: { totalRent: 35600, totalTransfers: 28900, pending: 1800 }
  }
};

export type RealEstateTenant = {
  id: string;
  name: string;
  property: string;
  owner: string;
  financeStatus: 'em dia' | 'atrasado' | 'inadimplente';
  contractStart: string;
  contractEnd: string;
};

export const realEstateTenants: RealEstateTenant[] = [
  {
    id: 'tenant-01',
    name: 'Marcos Almeida',
    property: 'Apto 1202 - Vista Parque',
    owner: 'Helena Duarte',
    financeStatus: 'em dia',
    contractStart: '12/02/2024',
    contractEnd: '12/02/2026'
  },
  {
    id: 'tenant-02',
    name: 'Juliana Souza',
    property: 'Sala Comercial 1406',
    owner: 'Ricardo Moraes',
    financeStatus: 'atrasado',
    contractStart: '01/08/2023',
    contractEnd: '01/08/2025'
  },
  {
    id: 'tenant-03',
    name: 'Gabriel Costa',
    property: 'Loft 35A - Skyline',
    owner: 'Isadora Vilela',
    financeStatus: 'inadimplente',
    contractStart: '15/04/2024',
    contractEnd: 'Indeterminado'
  },
  {
    id: 'tenant-04',
    name: 'Ana Paula Ribeiro',
    property: 'Studio 210 - Urban Mix',
    owner: 'Ribeiro Holdings',
    financeStatus: 'em dia',
    contractStart: '05/03/2024',
    contractEnd: '05/03/2026'
  },
  {
    id: 'tenant-05',
    name: 'Lucas Andrade',
    property: 'Apto 408 - Parque Central',
    owner: 'Patrícia Silveira',
    financeStatus: 'atrasado',
    contractStart: '20/01/2023',
    contractEnd: '20/01/2025'
  }
];

export type RealEstateContract = {
  id: string;
  code: string;
  property: string;
  owner: string;
  tenant: string;
  startDate: string;
  endDate: string;
  rent: number;
  status: 'ativo' | 'vencido' | 'a vencer' | 'rescindido';
  adjustmentIndex: string;
  nextAdjustment: string;
  guaranteeType: string;
};

export const realEstateContracts: RealEstateContract[] = [
  {
    id: 'ctr-001',
    code: 'CT-2024-001',
    property: 'Apto 1202 - Vista Parque',
    owner: 'Helena Duarte',
    tenant: 'Marcos Almeida',
    startDate: '12/02/2024',
    endDate: '12/02/2026',
    rent: 4200,
    status: 'ativo',
    adjustmentIndex: 'IGP-M',
    nextAdjustment: '12/02/2025',
    guaranteeType: 'Seguro fiança'
  },
  {
    id: 'ctr-002',
    code: 'CT-2023-021',
    property: 'Sala Comercial 1406',
    owner: 'Ricardo Moraes',
    tenant: 'Juliana Souza',
    startDate: '01/08/2023',
    endDate: '01/08/2025',
    rent: 6100,
    status: 'a vencer',
    adjustmentIndex: 'IPCA',
    nextAdjustment: '01/08/2024',
    guaranteeType: 'Fiador'
  },
  {
    id: 'ctr-003',
    code: 'CT-2022-088',
    property: 'Casa Térrea - Alameda Sul',
    owner: 'Grupo Nobile',
    tenant: 'N/A',
    startDate: '01/01/2022',
    endDate: '01/01/2024',
    rent: 7800,
    status: 'vencido',
    adjustmentIndex: 'IGP-M',
    nextAdjustment: '01/01/2024',
    guaranteeType: 'Caução'
  },
  {
    id: 'ctr-004',
    code: 'CT-2024-014',
    property: 'Studio 210 - Urban Mix',
    owner: 'Ribeiro Holdings',
    tenant: 'Ana Paula Ribeiro',
    startDate: '05/03/2024',
    endDate: '05/03/2026',
    rent: 2800,
    status: 'ativo',
    adjustmentIndex: 'IPCA',
    nextAdjustment: '05/03/2025',
    guaranteeType: 'Seguro fiança'
  },
  {
    id: 'ctr-005',
    code: 'CT-2023-044',
    property: 'Apto 408 - Parque Central',
    owner: 'Patrícia Silveira',
    tenant: 'Lucas Andrade',
    startDate: '20/01/2023',
    endDate: '20/01/2025',
    rent: 3200,
    status: 'a vencer',
    adjustmentIndex: 'IGP-M',
    nextAdjustment: '20/01/2024',
    guaranteeType: 'Fiador'
  }
];

export type RealEstateCharge = {
  id: string;
  party: string;
  property: string;
  competence: string;
  amount: number;
  dueDate: string;
  status: 'em aberto' | 'pago' | 'em atraso' | 'pendente';
};

export const realEstateReceivables: RealEstateCharge[] = [
  {
    id: 'rcv-01',
    party: 'Marcos Almeida',
    property: 'Apto 1202 - Vista Parque',
    competence: '07/2024',
    amount: 4200,
    dueDate: '10/07/2024',
    status: 'pago'
  },
  {
    id: 'rcv-02',
    party: 'Juliana Souza',
    property: 'Sala Comercial 1406',
    competence: '07/2024',
    amount: 6100,
    dueDate: '12/07/2024',
    status: 'em atraso'
  },
  {
    id: 'rcv-03',
    party: 'Gabriel Costa',
    property: 'Loft 35A - Skyline',
    competence: '07/2024',
    amount: 3500,
    dueDate: '08/07/2024',
    status: 'em aberto'
  },
  {
    id: 'rcv-04',
    party: 'Ana Paula Ribeiro',
    property: 'Studio 210 - Urban Mix',
    competence: '07/2024',
    amount: 2800,
    dueDate: '10/07/2024',
    status: 'pago'
  },
  {
    id: 'rcv-05',
    party: 'Lucas Andrade',
    property: 'Apto 408 - Parque Central',
    competence: '07/2024',
    amount: 3200,
    dueDate: '11/07/2024',
    status: 'em atraso'
  }
];

export const realEstatePayables: RealEstateCharge[] = [
  {
    id: 'pay-01',
    party: 'Helena Duarte',
    property: 'Apto 1202 - Vista Parque',
    competence: '07/2024',
    amount: 3200,
    dueDate: '15/07/2024',
    status: 'pendente'
  },
  {
    id: 'pay-02',
    party: 'Ricardo Moraes',
    property: 'Sala Comercial 1406',
    competence: '07/2024',
    amount: 4700,
    dueDate: '16/07/2024',
    status: 'pendente'
  },
  {
    id: 'pay-03',
    party: 'Patrícia Silveira',
    property: 'Apto 408 - Parque Central',
    competence: '07/2024',
    amount: 2400,
    dueDate: '17/07/2024',
    status: 'pendente'
  },
  {
    id: 'pay-04',
    party: 'Ribeiro Holdings',
    property: 'Studio 210 - Urban Mix',
    competence: '07/2024',
    amount: 2100,
    dueDate: '18/07/2024',
    status: 'pendente'
  }
];

export type RealEstateOccupancyItem = {
  id: string;
  development: string;
  block: string;
  unit: string;
  status: 'ocupado' | 'vago' | 'reservado';
  tenant: string;
  owner: string;
};

export const realEstateOccupancy: RealEstateOccupancyItem[] = [
  {
    id: 'occ-01',
    development: 'Horizon Residence',
    block: 'Bloco A',
    unit: 'A-1202',
    status: 'ocupado',
    tenant: 'Marcos Almeida',
    owner: 'Helena Duarte'
  },
  {
    id: 'occ-02',
    development: 'Horizon Residence',
    block: 'Bloco A',
    unit: 'A-1405',
    status: 'vago',
    tenant: '-',
    owner: 'Grupo Nobile'
  },
  {
    id: 'occ-03',
    development: 'Skyline',
    block: 'Bloco 1',
    unit: '35A',
    status: 'reservado',
    tenant: 'Gabriel Costa',
    owner: 'Isadora Vilela'
  },
  {
    id: 'occ-04',
    development: 'Parque Central',
    block: 'Bloco B',
    unit: 'B-408',
    status: 'vago',
    tenant: '-',
    owner: 'Patrícia Silveira'
  },
  {
    id: 'occ-05',
    development: 'Urban Mix',
    block: 'Bloco Único',
    unit: '210',
    status: 'ocupado',
    tenant: 'Ana Paula Ribeiro',
    owner: 'Ribeiro Holdings'
  },
  {
    id: 'occ-06',
    development: 'Horizon Residence',
    block: 'Bloco B',
    unit: 'B-805',
    status: 'ocupado',
    tenant: 'Mariana Lopes',
    owner: 'Helena Duarte'
  }
];

export type RealEstateMaintenanceTicket = {
  id: string;
  ticketNumber: string;
  property: string;
  tenant: string;
  type: string;
  status: 'aberto' | 'em andamento' | 'resolvido';
  openedAt: string;
  description: string;
  updates: { date: string; note: string }[];
  estimatedCost: number;
  finalCost: number;
  chargeTo: string;
};

export const realEstateMaintenance: RealEstateMaintenanceTicket[] = [
  {
    id: 'mnt-01',
    ticketNumber: 'CH-2041',
    property: 'Apto 1202 - Vista Parque',
    tenant: 'Marcos Almeida',
    type: 'Manutenção',
    status: 'em andamento',
    openedAt: '03/07/2024',
    description: 'Problema no aquecedor e vazamento leve no banheiro social.',
    updates: [
      { date: '03/07/2024', note: 'Chamado aberto e enviado para prestador.' },
      { date: '05/07/2024', note: 'Visita técnica realizada, aguardando peça.' }
    ],
    estimatedCost: 480,
    finalCost: 0,
    chargeTo: 'Proprietário'
  },
  {
    id: 'mnt-02',
    ticketNumber: 'CH-2038',
    property: 'Sala Comercial 1406',
    tenant: 'Juliana Souza',
    type: 'Problema técnico',
    status: 'aberto',
    openedAt: '01/07/2024',
    description: 'Ar-condicionado não liga.',
    updates: [{ date: '01/07/2024', note: 'Aguardando orçamento.' }],
    estimatedCost: 1200,
    finalCost: 0,
    chargeTo: 'Inquilino'
  },
  {
    id: 'mnt-03',
    ticketNumber: 'CH-2045',
    property: 'Apto 408 - Parque Central',
    tenant: 'Lucas Andrade',
    type: 'Manutenção',
    status: 'resolvido',
    openedAt: '25/06/2024',
    description: 'Troca de torneira e ajuste hidráulico.',
    updates: [
      { date: '25/06/2024', note: 'Chamado registrado.' },
      { date: '27/06/2024', note: 'Serviço concluído.' }
    ],
    estimatedCost: 250,
    finalCost: 220,
    chargeTo: 'Proprietário'
  }
];

export type RealEstateInspection = {
  id: string;
  type: string;
  property: string;
  date: string;
  responsible: string;
  status: 'pendente' | 'concluida';
  items: string[];
  notes: string;
  photos: string[];
};

export const realEstateInspections: RealEstateInspection[] = [
  {
    id: 'insp-01',
    type: 'Pré-locação',
    property: 'Casa Térrea - Alameda Sul',
    date: '10/07/2024',
    responsible: 'Equipe Técnica',
    status: 'pendente',
    items: ['Paredes', 'Janelas', 'Instalação elétrica'],
    notes: 'Aguardando confirmação do proprietário.',
    photos: ['foto-1', 'foto-2']
  },
  {
    id: 'insp-02',
    type: 'Pós-locação',
    property: 'Loft 35A - Skyline',
    date: '20/06/2024',
    responsible: 'Vistoria Externa',
    status: 'concluida',
    items: ['Portas', 'Pintura', 'Hidráulica'],
    notes: 'Sem avarias relevantes.',
    photos: ['foto-3']
  },
  {
    id: 'insp-03',
    type: 'Periódica',
    property: 'Apto 1202 - Vista Parque',
    date: '05/07/2024',
    responsible: 'Equipe Técnica',
    status: 'pendente',
    items: ['Iluminação', 'Pisos', 'Janelas'],
    notes: 'Vistoria agendada para 08/07.',
    photos: ['foto-4', 'foto-5']
  }
];

export type RealEstateDocument = {
  id: string;
  name: string;
  docType: string;
  relatedTo: string;
  uploadedAt: string;
};

export const realEstateDocuments: RealEstateDocument[] = [
  {
    id: 'doc-01',
    name: 'Contrato CT-2024-001.pdf',
    docType: 'Contrato',
    relatedTo: 'CT-2024-001 - Apto 1202',
    uploadedAt: '15/02/2024'
  },
  {
    id: 'doc-02',
    name: 'Laudo Vistoria - Casa Alameda.pdf',
    docType: 'Laudo de vistoria',
    relatedTo: 'Casa Térrea - Alameda Sul',
    uploadedAt: '10/07/2024'
  },
  {
    id: 'doc-03',
    name: 'RG Helena Duarte.pdf',
    docType: 'RG/CPF',
    relatedTo: 'Helena Duarte',
    uploadedAt: '08/01/2024'
  },
  {
    id: 'doc-04',
    name: 'Contrato CT-2024-014.pdf',
    docType: 'Contrato',
    relatedTo: 'CT-2024-014 - Studio 210',
    uploadedAt: '05/03/2024'
  },
  {
    id: 'doc-05',
    name: 'Laudo Vistoria - Apto 1202.pdf',
    docType: 'Laudo de vistoria',
    relatedTo: 'Apto 1202 - Vista Parque',
    uploadedAt: '05/07/2024'
  }
];

export type RealEstateReport = {
  id: string;
  title: string;
  description: string;
};

export const realEstateReports: RealEstateReport[] = [
  {
    id: 'rep-01',
    title: 'Imóveis ocupados x vagos',
    description: 'Distribuição atual de ocupação do portfólio.'
  },
  {
    id: 'rep-02',
    title: 'Inadimplência geral',
    description: 'Evolução da inadimplência mês a mês.'
  },
  {
    id: 'rep-03',
    title: 'Contratos a vencer',
    description: 'Contratos que vencem nos próximos 30/60/90 dias.'
  },
  {
    id: 'rep-04',
    title: 'Inquilinos em atraso',
    description: 'Resumo de inquilinos com pagamentos pendentes.'
  },
  {
    id: 'rep-05',
    title: 'Fluxo de caixa (resumo)',
    description: 'Receitas, despesas e saldo do mês.'
  },
  {
    id: 'rep-06',
    title: 'Extrato por proprietário',
    description: 'Resumo financeiro individual por proprietário.'
  }
];

export const realEstateReportDetails: Record<string, { columns: string[]; rows: string[][] }> = {
  'rep-01': {
    columns: ['Situação', 'Quantidade'],
    rows: [
      ['Ocupados', '196'],
      ['Vagos', '52'],
      ['Reservados', '12']
    ]
  },
  'rep-02': {
    columns: ['Mês', 'Inadimplência'],
    rows: [
      ['Abr', '3,9%'],
      ['Mai', '3,1%'],
      ['Jun', '3,4%']
    ]
  },
  'rep-03': {
    columns: ['Contrato', 'Vencimento'],
    rows: [
      ['CT-2024-001', '12/02/2026'],
      ['CT-2023-021', '01/08/2025'],
      ['CT-2022-088', '01/01/2024']
    ]
  },
  'rep-04': {
    columns: ['Inquilino', 'Imóvel', 'Status'],
    rows: [
      ['Juliana Souza', 'Sala Comercial 1406', 'Em atraso'],
      ['Lucas Andrade', 'Apto 408 - Parque Central', 'Em atraso'],
      ['Gabriel Costa', 'Loft 35A - Skyline', 'Inadimplente']
    ]
  },
  'rep-05': {
    columns: ['Competência', 'Receitas', 'Despesas', 'Saldo'],
    rows: [
      ['Mai/2024', 'R$ 515.000', 'R$ 302.000', 'R$ 213.000'],
      ['Jun/2024', 'R$ 489.000', 'R$ 295.000', 'R$ 194.000'],
      ['Jul/2024', 'R$ 482.000', 'R$ 316.000', 'R$ 166.000']
    ]
  },
  'rep-06': {
    columns: ['Proprietário', 'Aluguéis', 'Repasses', 'Pendências'],
    rows: [
      ['Helena Duarte', 'R$ 62.000', 'R$ 51.000', 'R$ 1.200'],
      ['Grupo Nobile', 'R$ 88.500', 'R$ 70.200', 'R$ 5.400'],
      ['Ribeiro Holdings', 'R$ 35.600', 'R$ 28.900', 'R$ 1.800']
    ]
  }
};
