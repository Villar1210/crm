import {
  FinancialEntry,
  LeaseContract,
  RealEstateClient,
  RealEstateOwner,
  RealEstateProperty,
  RealEstateResident,
  RealEstateTenant
} from '../types/realEstate';

export const realEstateClientsMock: RealEstateClient[] = [
  {
    id: 'cli-001',
    nome: 'Marcos Oliveira',
    tipo: 'proprietario',
    documento: '123.456.789-00',
    telefone: '(11) 98888-1122',
    email: 'marcos.oliveira@ivillar.com'
  },
  {
    id: 'cli-002',
    nome: 'Juliana Ramos',
    tipo: 'inquilino',
    documento: '987.654.321-00',
    telefone: '(11) 97777-5544',
    email: 'juliana.ramos@ivillar.com'
  },
  {
    id: 'cli-003',
    nome: 'Fernando Lima',
    tipo: 'morador',
    documento: '222.333.444-55',
    telefone: '(11) 96666-7788',
    email: 'fernando.lima@ivillar.com'
  },
  {
    id: 'cli-004',
    nome: 'Carlos Medeiros',
    tipo: 'proprietario',
    documento: '55.666.777/0001-10',
    telefone: '(41) 98888-2211',
    email: 'carlos.medeiros@ivillar.com'
  },
  {
    id: 'cli-005',
    nome: 'Patricia Souza',
    tipo: 'inquilino',
    documento: '111.222.333-44',
    telefone: '(41) 95555-3311',
    email: 'patricia.souza@ivillar.com'
  },
  {
    id: 'cli-006',
    nome: 'Equipe Manutencao',
    tipo: 'outro',
    documento: '44.555.666/0001-20',
    telefone: '(11) 93333-2211',
    email: 'manutencao@ivillar.com'
  },
  {
    id: 'cli-007',
    nome: 'Rafaela Mendes',
    tipo: 'morador',
    documento: '321.654.987-00',
    telefone: '(21) 98888-9933',
    email: 'rafaela.mendes@ivillar.com'
  },
  {
    id: 'cli-008',
    nome: 'Marina Castro',
    tipo: 'inquilino',
    documento: '654.321.987-11',
    telefone: '(21) 97777-6622',
    email: 'marina.castro@ivillar.com'
  }
];

export const realEstatePropertiesMock: RealEstateProperty[] = [
  {
    id: 'prop-001',
    codigo: 'IMV-001',
    titulo: 'Apto Central Park',
    endereco: 'Rua das Palmeiras, 120',
    cidade: 'Sao Paulo',
    estado: 'SP',
    tipo: 'apartamento',
    uso: 'residencial',
    bloco: 'A',
    unidade: '101',
    metragemUtil: 78,
    metragemTotal: 95,
    valorAluguelReferencia: 3800,
    vinculadoAoSite: true,
    sitePropertyId: '1',
    observacoes: 'Apartamento com varanda e vaga dupla.'
  },
  {
    id: 'prop-002',
    codigo: 'IMV-002',
    titulo: 'Casa Jardim Botanico',
    endereco: 'Rua do Bosque, 45',
    cidade: 'Curitiba',
    estado: 'PR',
    tipo: 'casa',
    uso: 'residencial',
    unidade: 'Casa principal',
    metragemUtil: 180,
    metragemTotal: 210,
    valorAluguelReferencia: 4500,
    vinculadoAoSite: true,
    sitePropertyId: '2',
    observacoes: 'Casa com quintal amplo e churrasqueira.'
  },
  {
    id: 'prop-003',
    codigo: 'IMV-003',
    titulo: 'Sala Comercial Paulista',
    endereco: 'Av. Paulista, 1000',
    cidade: 'Sao Paulo',
    estado: 'SP',
    tipo: 'sala_comercial',
    uso: 'comercial',
    bloco: 'Torre B',
    unidade: '1205',
    metragemUtil: 45,
    metragemTotal: 55,
    valorAluguelReferencia: 3200,
    vinculadoAoSite: false,
    sitePropertyId: null
  },
  {
    id: 'prop-004',
    codigo: 'IMV-004',
    titulo: 'Galpao Logistico Sul',
    endereco: 'Rod. BR-116, km 210',
    cidade: 'Itapecerica',
    estado: 'SP',
    tipo: 'galpao',
    uso: 'comercial',
    metragemUtil: 980,
    metragemTotal: 1100,
    valorAluguelReferencia: 18000,
    vinculadoAoSite: false,
    sitePropertyId: null,
    observacoes: 'Area com docas e pe direito alto.'
  },
  {
    id: 'prop-005',
    codigo: 'IMV-005',
    titulo: 'Apartamento Vista Mar',
    endereco: 'Rua Atlantica, 900',
    cidade: 'Florianopolis',
    estado: 'SC',
    tipo: 'apartamento',
    uso: 'residencial',
    torre: '1',
    bloco: 'C',
    unidade: '702',
    metragemUtil: 92,
    metragemTotal: 110,
    valorAluguelReferencia: 5200,
    vinculadoAoSite: true,
    sitePropertyId: 'rent2'
  }
];

export const realEstateOwnersMock: RealEstateOwner[] = [
  {
    id: 'owner-001',
    clienteId: 'cli-001',
    propriedadesIds: ['prop-001', 'prop-003'],
    contaBancaria: 'Banco 001 - Ag 1234 - CC 56789-0',
    percentualPadraoImobiliaria: 10
  },
  {
    id: 'owner-002',
    clienteId: 'cli-004',
    propriedadesIds: ['prop-002', 'prop-004', 'prop-005'],
    contaBancaria: 'Banco 237 - Ag 3321 - CC 99887-1',
    percentualPadraoImobiliaria: 8
  }
];

export const realEstateTenantsMock: RealEstateTenant[] = [
  {
    id: 'tenant-001',
    clienteId: 'cli-002',
    situacaoFinanceira: 'em_dia'
  },
  {
    id: 'tenant-002',
    clienteId: 'cli-005',
    situacaoFinanceira: 'inadimplente'
  },
  {
    id: 'tenant-003',
    clienteId: 'cli-008',
    situacaoFinanceira: 'negociando'
  }
];

export const realEstateResidentsMock: RealEstateResident[] = [
  {
    id: 'resident-001',
    clienteId: 'cli-003',
    propertyId: 'prop-001',
    unidade: '101'
  },
  {
    id: 'resident-002',
    clienteId: 'cli-007',
    propertyId: 'prop-002',
    unidade: 'Casa principal'
  }
];

export const realEstateContractsMock: LeaseContract[] = [
  {
    id: 'ctr-001',
    propertyId: 'prop-001',
    unidade: '101',
    ownerId: 'owner-001',
    tenantId: 'tenant-001',
    dataInicio: '2025-10-01',
    dataFim: '2026-09-30',
    valorAluguel: 3800,
    percentualImobiliaria: 10,
    status: 'ativo'
  },
  {
    id: 'ctr-002',
    propertyId: 'prop-002',
    unidade: 'Casa principal',
    ownerId: 'owner-002',
    tenantId: 'tenant-002',
    dataInicio: '2024-06-01',
    valorAluguel: 4500,
    percentualImobiliaria: 8,
    status: 'em_negociacao'
  },
  {
    id: 'ctr-003',
    propertyId: 'prop-003',
    unidade: '1205',
    ownerId: 'owner-001',
    tenantId: 'tenant-003',
    dataInicio: '2024-01-10',
    dataFim: '2024-12-31',
    valorAluguel: 3200,
    percentualImobiliaria: 10,
    status: 'encerrado'
  }
];

export const realEstateFinancialEntriesMock: FinancialEntry[] = [
  {
    id: 'fin-001',
    contractId: 'ctr-001',
    tipo: 'receber',
    dataVencimento: '2026-01-05',
    dataPagamento: '2026-01-06',
    valor: 3800,
    descricao: 'Aluguel janeiro',
    pago: true,
    referenciaMes: '2026-01'
  },
  {
    id: 'fin-002',
    contractId: 'ctr-001',
    tipo: 'receber',
    dataVencimento: '2026-02-05',
    valor: 3800,
    descricao: 'Aluguel fevereiro',
    pago: false,
    referenciaMes: '2026-02'
  },
  {
    id: 'fin-003',
    contractId: 'ctr-001',
    tipo: 'pagar',
    dataVencimento: '2026-01-10',
    dataPagamento: '2026-01-11',
    valor: 3420,
    descricao: 'Repasse janeiro',
    pago: true,
    referenciaMes: '2026-01'
  },
  {
    id: 'fin-004',
    contractId: 'ctr-002',
    tipo: 'receber',
    dataVencimento: '2026-01-07',
    valor: 4500,
    descricao: 'Aluguel janeiro',
    pago: false,
    referenciaMes: '2026-01'
  },
  {
    id: 'fin-005',
    contractId: 'ctr-002',
    tipo: 'pagar',
    dataVencimento: '2026-01-12',
    valor: 4140,
    descricao: 'Repasse janeiro',
    pago: false,
    referenciaMes: '2026-01'
  },
  {
    id: 'fin-006',
    contractId: 'ctr-003',
    tipo: 'receber',
    dataVencimento: '2024-11-05',
    dataPagamento: '2024-11-06',
    valor: 3200,
    descricao: 'Aluguel novembro',
    pago: true,
    referenciaMes: '2024-11'
  },
  {
    id: 'fin-007',
    contractId: 'ctr-003',
    tipo: 'pagar',
    dataVencimento: '2024-11-10',
    dataPagamento: '2024-11-12',
    valor: 2880,
    descricao: 'Repasse novembro',
    pago: true,
    referenciaMes: '2024-11'
  }
];
