import React, { useMemo, useState } from 'react';
import { MOCK_PROPERTIES } from '../../../constants';
import {
  FinancialEntry,
  LeaseContract,
  RealEstateClient,
  RealEstateOwner,
  RealEstateProperty,
  RealEstateResident,
  RealEstateTenant
} from '../../../types/realEstate';
import {
  realEstateClientsMock,
  realEstateContractsMock,
  realEstateFinancialEntriesMock,
  realEstateOwnersMock,
  realEstatePropertiesMock,
  realEstateResidentsMock,
  realEstateTenantsMock
} from '../../../mocks/realEstateMocks';

type RealEstateSection =
  | 'cadastros_clientes_cadastrar'
  | 'cadastros_clientes_listar'
  | 'cadastros_imoveis_cadastrar'
  | 'cadastros_imoveis_listar'
  | 'cadastros_proprietarios_cadastrar'
  | 'cadastros_proprietarios_listar'
  | 'cadastros_moradores_cadastrar'
  | 'cadastros_moradores_listar'
  | 'cadastros_inquilinos_cadastrar'
  | 'cadastros_inquilinos_listar'
  | 'contratos_listar'
  | 'contratos_relatorio'
  | 'financeiro_receber'
  | 'financeiro_pagar'
  | 'financeiro_extrato_imovel'
  | 'relatorios_ocupacao'
  | 'relatorios_inadimplencia'
  | 'relatorios_receita_proprietario';

type CadastroEntity = 'clientes' | 'imoveis' | 'proprietarios' | 'moradores' | 'inquilinos';
type CadastroMode = 'cadastrar' | 'listar';
type EntryStatus = 'pago' | 'aberto' | 'vencido';

const sectionTitles: Record<RealEstateSection, string> = {
  cadastros_clientes_cadastrar: 'Cadastros / Clientes / Cadastrar',
  cadastros_clientes_listar: 'Cadastros / Clientes / Consultar',
  cadastros_imoveis_cadastrar: 'Cadastros / Imoveis / Cadastrar',
  cadastros_imoveis_listar: 'Cadastros / Imoveis / Consultar',
  cadastros_proprietarios_cadastrar: 'Cadastros / Proprietarios / Cadastrar',
  cadastros_proprietarios_listar: 'Cadastros / Proprietarios / Consultar',
  cadastros_moradores_cadastrar: 'Cadastros / Moradores / Cadastrar',
  cadastros_moradores_listar: 'Cadastros / Moradores / Consultar',
  cadastros_inquilinos_cadastrar: 'Cadastros / Inquilinos / Cadastrar',
  cadastros_inquilinos_listar: 'Cadastros / Inquilinos / Consultar',
  contratos_listar: 'Contratos / Contratos de Locacao',
  contratos_relatorio: 'Contratos / Relatorio de Contratos',
  financeiro_receber: 'Financeiro / Contas a Receber',
  financeiro_pagar: 'Financeiro / Contas a Pagar',
  financeiro_extrato_imovel: 'Financeiro / Extrato por Imovel / Unidade',
  relatorios_ocupacao: 'Relatorios / Ocupacao por Imovel / Unidade',
  relatorios_inadimplencia: 'Relatorios / Inadimplencia',
  relatorios_receita_proprietario: 'Relatorios / Receita por Proprietario'
};

const menuGroups: {
  id: 'cadastros' | 'contratos' | 'financeiro' | 'relatorios';
  label: string;
  items: { label: string; sections: RealEstateSection[] }[];
}[] = [
    {
      id: 'cadastros',
      label: 'Cadastros',
      items: [
        { label: 'Clientes', sections: ['cadastros_clientes_listar', 'cadastros_clientes_cadastrar'] },
        { label: 'Imoveis', sections: ['cadastros_imoveis_listar', 'cadastros_imoveis_cadastrar'] },
        { label: 'Proprietarios', sections: ['cadastros_proprietarios_listar', 'cadastros_proprietarios_cadastrar'] },
        { label: 'Moradores', sections: ['cadastros_moradores_listar', 'cadastros_moradores_cadastrar'] },
        { label: 'Inquilinos', sections: ['cadastros_inquilinos_listar', 'cadastros_inquilinos_cadastrar'] }
      ]
    },
    {
      id: 'contratos',
      label: 'Contratos',
      items: [
        { label: 'Contratos de Locacao', sections: ['contratos_listar'] },
        { label: 'Relatorio de Contratos', sections: ['contratos_relatorio'] }
      ]
    },
    {
      id: 'financeiro',
      label: 'Financeiro',
      items: [
        { label: 'Contas a Receber', sections: ['financeiro_receber'] },
        { label: 'Contas a Pagar', sections: ['financeiro_pagar'] },
        { label: 'Extrato por Imovel / Unidade', sections: ['financeiro_extrato_imovel'] }
      ]
    },
    {
      id: 'relatorios',
      label: 'Relatorios',
      items: [
        { label: 'Ocupacao por Imovel / Unidade', sections: ['relatorios_ocupacao'] },
        { label: 'Inadimplencia', sections: ['relatorios_inadimplencia'] },
        { label: 'Receita por Proprietario', sections: ['relatorios_receita_proprietario'] }
      ]
    }
  ];

const cardClass = 'rounded-2xl bg-white shadow-sm border border-slate-100 p-5';
const inputClass =
  'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500';
const labelClass = 'text-xs font-medium text-slate-500';
const tableHeadClass = 'px-4 py-2 text-left text-[0.6875rem] font-semibold uppercase tracking-wide text-slate-400';
const tableCellClass = 'px-4 py-3 text-sm text-slate-700';
const buttonPrimaryClass =
  'inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition';
const buttonSecondaryClass =
  'inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition';

const clientTypeLabels: Record<RealEstateClient['tipo'], string> = {
  proprietario: 'Proprietario',
  inquilino: 'Inquilino',
  morador: 'Morador',
  outro: 'Outro'
};

const propertyTypeLabels: Record<RealEstateProperty['tipo'], string> = {
  apartamento: 'Apartamento',
  casa: 'Casa',
  sala_comercial: 'Sala comercial',
  galpao: 'Galpao',
  terreno: 'Terreno',
  outro: 'Outro'
};

const propertyUseLabels: Record<RealEstateProperty['uso'], string> = {
  residencial: 'Residencial',
  comercial: 'Comercial',
  misto: 'Misto'
};

const tenantStatusLabels: Record<'em_dia' | 'inadimplente' | 'negociando', string> = {
  em_dia: 'Em dia',
  inadimplente: 'Inadimplente',
  negociando: 'Negociando'
};

const tenantStatusStyles: Record<'em_dia' | 'inadimplente' | 'negociando', string> = {
  em_dia: 'bg-emerald-50 text-emerald-700',
  inadimplente: 'bg-rose-50 text-rose-600',
  negociando: 'bg-amber-50 text-amber-700'
};

const contractStatusLabels: Record<LeaseContract['status'], string> = {
  ativo: 'Ativo',
  encerrado: 'Encerrado',
  rescindido: 'Rescindido',
  em_negociacao: 'Em negociacao'
};

const contractStatusStyles: Record<LeaseContract['status'], string> = {
  ativo: 'bg-emerald-50 text-emerald-700',
  encerrado: 'bg-slate-100 text-slate-600',
  rescindido: 'bg-rose-50 text-rose-600',
  em_negociacao: 'bg-amber-50 text-amber-700'
};

const entryStatusLabels: Record<EntryStatus, string> = {
  pago: 'Pago',
  aberto: 'Em aberto',
  vencido: 'Vencido'
};

const entryStatusStyles: Record<EntryStatus, string> = {
  pago: 'bg-emerald-50 text-emerald-700',
  aberto: 'bg-amber-50 text-amber-700',
  vencido: 'bg-rose-50 text-rose-600'
};

const clientTypeOptions = Object.entries(clientTypeLabels).map(([value, label]) => ({
  value: value as RealEstateClient['tipo'],
  label
}));

const propertyTypeOptions = Object.entries(propertyTypeLabels).map(([value, label]) => ({
  value: value as RealEstateProperty['tipo'],
  label
}));

const propertyUseOptions = Object.entries(propertyUseLabels).map(([value, label]) => ({
  value: value as RealEstateProperty['uso'],
  label
}));

const tenantStatusOptions = Object.entries(tenantStatusLabels).map(([value, label]) => ({
  value: value as RealEstateTenant['situacaoFinanceira'],
  label
}));

const contractStatusOptions = Object.entries(contractStatusLabels).map(([value, label]) => ({
  value: value as LeaseContract['status'],
  label
}));

const formatCurrency = (value?: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '-';
  }
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (value?: string) => {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return date.toLocaleDateString('pt-BR');
};

const formatReference = (value?: string) => {
  if (!value) {
    return '-';
  }
  return value.replace('-', '/');
};

const parseNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

const RealEstateHub: React.FC = () => {
  const [activeSection, setActiveSection] = useState<RealEstateSection>('cadastros_clientes_listar');
  const [openGroups, setOpenGroups] = useState<
    Record<'cadastros' | 'contratos' | 'financeiro' | 'relatorios', boolean>
  >({
    cadastros: true,
    contratos: true,
    financeiro: true,
    relatorios: true
  });

  const [clients, setClients] = useState<RealEstateClient[]>(realEstateClientsMock);
  const [properties, setProperties] = useState<RealEstateProperty[]>(realEstatePropertiesMock);
  const [owners, setOwners] = useState<RealEstateOwner[]>(realEstateOwnersMock);
  const [tenants, setTenants] = useState<RealEstateTenant[]>(realEstateTenantsMock);
  const [residents, setResidents] = useState<RealEstateResident[]>(realEstateResidentsMock);
  const [contracts, setContracts] = useState<LeaseContract[]>(realEstateContractsMock);
  const [financialEntries] = useState<FinancialEntry[]>(realEstateFinancialEntriesMock);

  // TODO: integrar com backend para carregar e persistir dados da gestao imobiliaria.

  const initialClientForm = {
    nome: '',
    tipo: 'proprietario' as RealEstateClient['tipo'],
    documento: '',
    telefone: '',
    email: '',
    observacoes: ''
  };

  const initialPropertyForm = {
    codigo: '',
    titulo: '',
    endereco: '',
    cidade: '',
    estado: '',
    tipo: 'apartamento' as RealEstateProperty['tipo'],
    uso: 'residencial' as RealEstateProperty['uso'],
    torre: '',
    bloco: '',
    unidade: '',
    metragemUtil: '',
    metragemTotal: '',
    valorAluguelReferencia: '',
    vinculadoAoSite: false,
    sitePropertyId: '',
    observacoes: ''
  };

  const initialOwnerForm = {
    clienteId: '',
    propriedadesIds: [] as string[],
    percentualPadraoImobiliaria: '',
    contaBancaria: ''
  };

  const initialResidentForm = {
    clienteId: '',
    propertyId: '',
    unidade: '',
    observacoes: ''
  };

  const initialTenantForm = {
    clienteId: '',
    situacaoFinanceira: 'em_dia' as RealEstateTenant['situacaoFinanceira'],
    observacoes: ''
  };

  const initialContractForm = {
    propertyId: '',
    unidade: '',
    ownerId: '',
    tenantId: '',
    dataInicio: '',
    dataFim: '',
    valorAluguel: '',
    percentualImobiliaria: '',
    status: 'ativo' as LeaseContract['status']
  };

  const [clientForm, setClientForm] = useState(initialClientForm);
  const [propertyForm, setPropertyForm] = useState(initialPropertyForm);
  const [ownerForm, setOwnerForm] = useState(initialOwnerForm);
  const [residentForm, setResidentForm] = useState(initialResidentForm);
  const [tenantForm, setTenantForm] = useState(initialTenantForm);
  const [contractForm, setContractForm] = useState(initialContractForm);
  const [showContractForm, setShowContractForm] = useState(false);

  const [clientSearch, setClientSearch] = useState('');
  const [clientTypeFilter, setClientTypeFilter] = useState<'todos' | RealEstateClient['tipo']>('todos');
  const [propertySearch, setPropertySearch] = useState('');
  const [propertyLinkFilter, setPropertyLinkFilter] = useState<'todos' | 'vinculado' | 'nao_vinculado'>('todos');
  const [ownerSearch, setOwnerSearch] = useState('');
  const [residentSearch, setResidentSearch] = useState('');
  const [tenantSearch, setTenantSearch] = useState('');
  const [tenantStatusFilter, setTenantStatusFilter] = useState<'todos' | RealEstateTenant['situacaoFinanceira']>('todos');
  const [contractSearch, setContractSearch] = useState('');
  const [contractStatusFilter, setContractStatusFilter] = useState<'todos' | LeaseContract['status']>('todos');
  const [reportStatus, setReportStatus] = useState<'todos' | LeaseContract['status']>('todos');
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [reportPropertyId, setReportPropertyId] = useState('');
  const [reportOwnerId, setReportOwnerId] = useState('');
  const [reportTenantId, setReportTenantId] = useState('');
  const [receivableMonth, setReceivableMonth] = useState('');
  const [receivableStatus, setReceivableStatus] = useState<'todos' | 'em_aberto' | 'pagos' | 'vencidos'>('todos');
  const [payableMonth, setPayableMonth] = useState('');
  const [payableStatus, setPayableStatus] = useState<'todos' | 'pendente' | 'pagos'>('todos');
  const [extractPropertyId, setExtractPropertyId] = useState('');
  const [extractUnit, setExtractUnit] = useState('');

  const clientMap = useMemo(() => new Map(clients.map(client => [client.id, client])), [clients]);
  const ownerMap = useMemo(() => new Map(owners.map(owner => [owner.id, owner])), [owners]);
  const tenantMap = useMemo(() => new Map(tenants.map(tenant => [tenant.id, tenant])), [tenants]);
  const propertyMap = useMemo(() => new Map(properties.map(property => [property.id, property])), [properties]);
  const contractMap = useMemo(() => new Map(contracts.map(contract => [contract.id, contract])), [contracts]);

  const cadastroInfo = useMemo(() => {
    if (!activeSection.startsWith('cadastros_')) {
      return null;
    }
    const parts = activeSection.split('_');
    if (parts.length < 3) {
      return null;
    }
    return {
      entity: parts[1] as CadastroEntity,
      mode: parts[2] as CadastroMode
    };
  }, [activeSection]);

  const getClientName = (clientId?: string) => {
    if (!clientId) {
      return '-';
    }
    return clientMap.get(clientId)?.nome ?? '-';
  };

  const getOwnerName = (ownerId?: string) => {
    if (!ownerId) {
      return '-';
    }
    const owner = ownerMap.get(ownerId);
    if (!owner) {
      return '-';
    }
    return getClientName(owner.clienteId);
  };

  const getTenantName = (tenantId?: string) => {
    if (!tenantId) {
      return '-';
    }
    const tenant = tenantMap.get(tenantId);
    if (!tenant) {
      return '-';
    }
    return getClientName(tenant.clienteId);
  };

  const getPropertyLabel = (propertyId?: string) => {
    if (!propertyId) {
      return '-';
    }
    const property = propertyMap.get(propertyId);
    if (!property) {
      return '-';
    }
    return `${property.titulo} (${property.cidade}/${property.estado})`;
  };

  const getPropertyUnitParts = (property: RealEstateProperty) => {
    const parts: string[] = [];
    if (property.torre) {
      parts.push(`Torre ${property.torre}`);
    }
    if (property.bloco) {
      parts.push(`Bloco ${property.bloco}`);
    }
    if (property.unidade) {
      parts.push(`Unidade ${property.unidade}`);
    }
    return parts;
  };

  const getPropertyUnitLabel = (propertyId?: string, unit?: string) => {
    if (!propertyId) {
      return '-';
    }
    const property = propertyMap.get(propertyId);
    if (!property) {
      return '-';
    }
    if (unit) {
      return `${property.titulo} - ${unit}`;
    }
    const parts = getPropertyUnitParts(property);
    return parts.length ? `${property.titulo} - ${parts.join(' / ')}` : property.titulo;
  };

  const proprietarioClients = useMemo(() => clients.filter(client => client.tipo === 'proprietario'), [clients]);
  const moradorClients = useMemo(() => clients.filter(client => client.tipo === 'morador'), [clients]);
  const inquilinoClients = useMemo(() => clients.filter(client => client.tipo === 'inquilino'), [clients]);

  const activeContractsByTenant = useMemo(() => {
    const counts = new Map<string, number>();
    contracts.forEach(contract => {
      if (contract.status === 'ativo') {
        counts.set(contract.tenantId, (counts.get(contract.tenantId) ?? 0) + 1);
      }
    });
    return counts;
  }, [contracts]);

  const filteredClients = useMemo(() => {
    const query = clientSearch.trim().toLowerCase();
    return clients.filter(client => {
      const matchesType = clientTypeFilter === 'todos' || client.tipo === clientTypeFilter;
      const matchesSearch =
        !query ||
        client.nome.toLowerCase().includes(query) ||
        (client.documento ?? '').toLowerCase().includes(query) ||
        (client.email ?? '').toLowerCase().includes(query);
      return matchesType && matchesSearch;
    });
  }, [clients, clientSearch, clientTypeFilter]);

  const filteredProperties = useMemo(() => {
    const query = propertySearch.trim().toLowerCase();
    return properties.filter(property => {
      const matchesLink =
        propertyLinkFilter === 'todos' ||
        (propertyLinkFilter === 'vinculado' && property.vinculadoAoSite) ||
        (propertyLinkFilter === 'nao_vinculado' && !property.vinculadoAoSite);
      const matchesSearch =
        !query ||
        property.titulo.toLowerCase().includes(query) ||
        property.codigo.toLowerCase().includes(query) ||
        property.endereco.toLowerCase().includes(query) ||
        property.cidade.toLowerCase().includes(query);
      return matchesLink && matchesSearch;
    });
  }, [properties, propertySearch, propertyLinkFilter]);

  const filteredOwners = useMemo(() => {
    const query = ownerSearch.trim().toLowerCase();
    return owners.filter(owner => {
      const name = getClientName(owner.clienteId).toLowerCase();
      return !query || name.includes(query);
    });
  }, [owners, ownerSearch, clientMap]);

  const filteredResidents = useMemo(() => {
    const query = residentSearch.trim().toLowerCase();
    return residents.filter(resident => {
      const name = getClientName(resident.clienteId).toLowerCase();
      const propertyLabel = getPropertyLabel(resident.propertyId).toLowerCase();
      return !query || name.includes(query) || propertyLabel.includes(query);
    });
  }, [residents, residentSearch, clientMap, propertyMap]);

  const filteredTenants = useMemo(() => {
    const query = tenantSearch.trim().toLowerCase();
    return tenants.filter(tenant => {
      const name = getClientName(tenant.clienteId).toLowerCase();
      const matchesSearch = !query || name.includes(query);
      const matchesStatus = tenantStatusFilter === 'todos' || tenant.situacaoFinanceira === tenantStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tenants, tenantSearch, tenantStatusFilter, clientMap]);

  const filteredContracts = useMemo(() => {
    const query = contractSearch.trim().toLowerCase();
    return contracts.filter(contract => {
      const matchesStatus = contractStatusFilter === 'todos' || contract.status === contractStatusFilter;
      const propertyLabel = getPropertyLabel(contract.propertyId).toLowerCase();
      const ownerName = getOwnerName(contract.ownerId).toLowerCase();
      const tenantName = getTenantName(contract.tenantId).toLowerCase();
      const matchesSearch =
        !query ||
        propertyLabel.includes(query) ||
        ownerName.includes(query) ||
        tenantName.includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [contracts, contractSearch, contractStatusFilter, propertyMap, ownerMap, tenantMap, clientMap]);

  const reportContracts = useMemo(() => {
    const start = reportStartDate ? new Date(reportStartDate) : null;
    const end = reportEndDate ? new Date(reportEndDate) : null;

    return contracts.filter(contract => {
      if (reportStatus !== 'todos' && contract.status !== reportStatus) {
        return false;
      }
      if (reportPropertyId && contract.propertyId !== reportPropertyId) {
        return false;
      }
      if (reportOwnerId && contract.ownerId !== reportOwnerId) {
        return false;
      }
      if (reportTenantId && contract.tenantId !== reportTenantId) {
        return false;
      }
      if (start) {
        const startDate = new Date(contract.dataInicio);
        if (startDate < start) {
          return false;
        }
      }
      if (end) {
        const endDate = contract.dataFim ? new Date(contract.dataFim) : null;
        if (endDate && endDate > end) {
          return false;
        }
        if (!endDate && new Date(contract.dataInicio) > end) {
          return false;
        }
      }
      return true;
    });
  }, [contracts, reportStatus, reportStartDate, reportEndDate, reportPropertyId, reportOwnerId, reportTenantId]);

  const reportTotalValue = useMemo(
    () => reportContracts.reduce((sum, contract) => sum + contract.valorAluguel, 0),
    [reportContracts]
  );

  const matchesMonth = (entry: FinancialEntry, month: string) => {
    if (!month) {
      return true;
    }
    const reference = entry.referenciaMes ?? entry.dataVencimento.slice(0, 7);
    return reference === month;
  };

  const receivableEntries = useMemo(() => {
    const now = new Date();
    return financialEntries.filter(entry => {
      if (entry.tipo !== 'receber') {
        return false;
      }
      if (!matchesMonth(entry, receivableMonth)) {
        return false;
      }
      const isOverdue = !entry.pago && new Date(entry.dataVencimento) < now;
      if (receivableStatus === 'em_aberto') {
        return !entry.pago && !isOverdue;
      }
      if (receivableStatus === 'pagos') {
        return entry.pago;
      }
      if (receivableStatus === 'vencidos') {
        return !entry.pago && isOverdue;
      }
      return true;
    });
  }, [financialEntries, receivableMonth, receivableStatus]);

  const receivableSummary = useMemo(() => {
    const now = new Date();
    return financialEntries.reduce(
      (acc, entry) => {
        if (entry.tipo !== 'receber' || !matchesMonth(entry, receivableMonth)) {
          return acc;
        }
        const isOverdue = !entry.pago && new Date(entry.dataVencimento) < now;
        if (entry.pago) {
          acc.paid += entry.valor;
        } else if (isOverdue) {
          acc.overdue += entry.valor;
        } else {
          acc.open += entry.valor;
        }
        return acc;
      },
      { open: 0, paid: 0, overdue: 0 }
    );
  }, [financialEntries, receivableMonth]);

  const payableEntries = useMemo(() => {
    return financialEntries.filter(entry => {
      if (entry.tipo !== 'pagar') {
        return false;
      }
      if (!matchesMonth(entry, payableMonth)) {
        return false;
      }
      if (payableStatus === 'pendente') {
        return !entry.pago;
      }
      if (payableStatus === 'pagos') {
        return entry.pago;
      }
      return true;
    });
  }, [financialEntries, payableMonth, payableStatus]);

  const payableSummary = useMemo(() => {
    return financialEntries.reduce(
      (acc, entry) => {
        if (entry.tipo !== 'pagar' || !matchesMonth(entry, payableMonth)) {
          return acc;
        }
        if (entry.pago) {
          acc.paid += entry.valor;
        } else {
          acc.open += entry.valor;
        }
        return acc;
      },
      { open: 0, paid: 0 }
    );
  }, [financialEntries, payableMonth]);

  const extractContracts = useMemo(() => {
    if (!extractPropertyId) {
      return [];
    }
    return contracts.filter(contract => contract.propertyId === extractPropertyId);
  }, [contracts, extractPropertyId]);

  const extractEntries = useMemo(() => {
    if (!extractPropertyId) {
      return [];
    }
    const unitQuery = extractUnit.trim().toLowerCase();
    const contractIds = new Set(
      extractContracts
        .filter(contract => !unitQuery || (contract.unidade ?? '').toLowerCase().includes(unitQuery))
        .map(contract => contract.id)
    );
    return financialEntries.filter(entry => contractIds.has(entry.contractId));
  }, [financialEntries, extractContracts, extractPropertyId, extractUnit]);

  const extractSummary = useMemo(() => {
    return extractEntries.reduce(
      (acc, entry) => {
        if (entry.tipo === 'receber') {
          acc.revenue += entry.valor;
        } else {
          acc.expense += entry.valor;
        }
        return acc;
      },
      { revenue: 0, expense: 0 }
    );
  }, [extractEntries]);

  const extractResult = extractSummary.revenue - extractSummary.expense;

  // TODO: usar total de unidades real por imovel/unidade.
  const occupancyData = useMemo(() => {
    const activeByProperty = contracts.reduce((acc, contract) => {
      if (contract.status === 'ativo') {
        acc[contract.propertyId] = (acc[contract.propertyId] ?? 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return properties.map(property => {
      const occupiedUnits = activeByProperty[property.id] ?? 0;
      const totalUnits = 1;
      const rate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
      return { property, occupiedUnits, totalUnits, rate };
    });
  }, [properties, contracts]);

  const delinquencyEntries = useMemo(() => {
    const now = new Date();
    return financialEntries.filter(
      entry => entry.tipo === 'receber' && !entry.pago && new Date(entry.dataVencimento) < now
    );
  }, [financialEntries]);

  const delinquencyTotal = useMemo(
    () => delinquencyEntries.reduce((sum, entry) => sum + entry.valor, 0),
    [delinquencyEntries]
  );

  const revenueByOwner = useMemo(() => {
    return owners.map(owner => {
      const ownerContracts = contracts.filter(contract => contract.ownerId === owner.id);
      const contractIds = new Set(ownerContracts.map(contract => contract.id));
      const ownerReceivables = financialEntries.filter(
        entry => entry.tipo === 'receber' && contractIds.has(entry.contractId)
      );
      const receitaBruta = ownerReceivables.reduce((sum, entry) => sum + entry.valor, 0);
      const taxaTotal = ownerReceivables.reduce((sum, entry) => {
        const contract = contractMap.get(entry.contractId);
        const percent = contract?.percentualImobiliaria ?? 0;
        return sum + entry.valor * (percent / 100);
      }, 0);
      return {
        owner,
        contratos: ownerContracts.length,
        receitaBruta,
        taxaTotal,
        receitaLiquida: receitaBruta - taxaTotal
      };
    });
  }, [owners, contracts, financialEntries, contractMap]);

  const getEntryStatus = (entry: FinancialEntry): EntryStatus => {
    if (entry.pago) {
      return 'pago';
    }
    const isOverdue = new Date(entry.dataVencimento) < new Date();
    return isOverdue ? 'vencido' : 'aberto';
  };

  const toggleGroup = (groupId: 'cadastros' | 'contratos' | 'financeiro' | 'relatorios') => {
    setOpenGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const handleCreateClient = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!clientForm.nome.trim()) {
      return;
    }
    const newClient: RealEstateClient = {
      id: makeId('cli'),
      nome: clientForm.nome.trim(),
      tipo: clientForm.tipo,
      documento: clientForm.documento.trim() || undefined,
      telefone: clientForm.telefone.trim() || undefined,
      email: clientForm.email.trim() || undefined,
      observacoes: clientForm.observacoes.trim() || undefined
    };
    // TODO: enviar cadastro de cliente para o backend.
    setClients(current => [newClient, ...current]);
    setClientForm(initialClientForm);
  };

  const handleCreateProperty = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!propertyForm.codigo.trim() || !propertyForm.titulo.trim()) {
      return;
    }
    const newProperty: RealEstateProperty = {
      id: makeId('prop'),
      codigo: propertyForm.codigo.trim(),
      titulo: propertyForm.titulo.trim(),
      endereco: propertyForm.endereco.trim(),
      cidade: propertyForm.cidade.trim(),
      estado: propertyForm.estado.trim().toUpperCase(),
      tipo: propertyForm.tipo,
      uso: propertyForm.uso,
      torre: propertyForm.torre.trim() || undefined,
      bloco: propertyForm.bloco.trim() || undefined,
      unidade: propertyForm.unidade.trim() || undefined,
      metragemUtil: parseNumber(propertyForm.metragemUtil),
      metragemTotal: parseNumber(propertyForm.metragemTotal),
      valorAluguelReferencia: parseNumber(propertyForm.valorAluguelReferencia),
      vinculadoAoSite: propertyForm.vinculadoAoSite,
      sitePropertyId: propertyForm.vinculadoAoSite ? propertyForm.sitePropertyId || null : null,
      observacoes: propertyForm.observacoes.trim() || undefined
    };
    // TODO: enviar cadastro de imovel da gestao para o backend.
    setProperties(current => [newProperty, ...current]);
    setPropertyForm(initialPropertyForm);
  };

  const toggleOwnerProperty = (propertyId: string) => {
    setOwnerForm(current => {
      const exists = current.propriedadesIds.includes(propertyId);
      const propriedadesIds = exists
        ? current.propriedadesIds.filter(id => id !== propertyId)
        : [...current.propriedadesIds, propertyId];
      return { ...current, propriedadesIds };
    });
  };

  const handleCreateOwner = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!ownerForm.clienteId) {
      return;
    }
    const newOwner: RealEstateOwner = {
      id: makeId('owner'),
      clienteId: ownerForm.clienteId,
      propriedadesIds: ownerForm.propriedadesIds,
      contaBancaria: ownerForm.contaBancaria.trim() || undefined,
      percentualPadraoImobiliaria: parseNumber(ownerForm.percentualPadraoImobiliaria)
    };
    // TODO: enviar cadastro de proprietario para o backend.
    setOwners(current => [newOwner, ...current]);
    setOwnerForm(initialOwnerForm);
  };

  const handleCreateResident = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!residentForm.clienteId || !residentForm.propertyId) {
      return;
    }
    const newResident: RealEstateResident = {
      id: makeId('resident'),
      clienteId: residentForm.clienteId,
      propertyId: residentForm.propertyId,
      unidade: residentForm.unidade.trim() || undefined,
      observacoes: residentForm.observacoes.trim() || undefined
    };
    // TODO: enviar cadastro de morador para o backend.
    setResidents(current => [newResident, ...current]);
    setResidentForm(initialResidentForm);
  };

  const handleCreateTenant = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!tenantForm.clienteId) {
      return;
    }
    const newTenant: RealEstateTenant = {
      id: makeId('tenant'),
      clienteId: tenantForm.clienteId,
      situacaoFinanceira: tenantForm.situacaoFinanceira,
      observacoes: tenantForm.observacoes.trim() || undefined
    };
    // TODO: enviar cadastro de inquilino para o backend.
    setTenants(current => [newTenant, ...current]);
    setTenantForm(initialTenantForm);
  };

  const handleCreateContract = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!contractForm.propertyId || !contractForm.ownerId || !contractForm.tenantId || !contractForm.dataInicio) {
      return;
    }
    const newContract: LeaseContract = {
      id: makeId('ctr'),
      propertyId: contractForm.propertyId,
      unidade: contractForm.unidade.trim() || undefined,
      ownerId: contractForm.ownerId,
      tenantId: contractForm.tenantId,
      dataInicio: contractForm.dataInicio,
      dataFim: contractForm.dataFim || undefined,
      valorAluguel: parseNumber(contractForm.valorAluguel) ?? 0,
      percentualImobiliaria: parseNumber(contractForm.percentualImobiliaria) ?? 0,
      status: contractForm.status
    };
    // TODO: enviar novo contrato para o backend.
    setContracts(current => [newContract, ...current]);
    setContractForm(initialContractForm);
    setShowContractForm(false);
  };

  const renderCadastroToggle = () => {
    if (!cadastroInfo) {
      return null;
    }
    return (
      <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
        <button
          type="button"
          onClick={() => setActiveSection(`cadastros_${cadastroInfo.entity}_cadastrar` as RealEstateSection)}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${cadastroInfo.mode === 'cadastrar' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-white'
            }`}
        >
          Cadastrar
        </button>
        <button
          type="button"
          onClick={() => setActiveSection(`cadastros_${cadastroInfo.entity}_listar` as RealEstateSection)}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${cadastroInfo.mode === 'listar' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-white'
            }`}
        >
          Consultar
        </button>
      </div>
    );
  };

  const renderClientesForm = () => (
    <div className={cardClass}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Cadastro de clientes</h3>
          <p className="text-xs text-slate-500">
            Registre clientes da gestao (proprietarios, inquilinos e moradores).
          </p>
        </div>
      </div>
      <form className="space-y-4" onSubmit={handleCreateClient}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Nome *</label>
            <input
              className={inputClass}
              value={clientForm.nome}
              onChange={event => setClientForm(current => ({ ...current, nome: event.target.value }))}
            />
          </div>
          <div>
            <label className={labelClass}>Tipo</label>
            <select
              className={inputClass}
              value={clientForm.tipo}
              onChange={event =>
                setClientForm(current => ({ ...current, tipo: event.target.value as RealEstateClient['tipo'] }))
              }
            >
              {clientTypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>CPF/CNPJ</label>
            <input
              className={inputClass}
              value={clientForm.documento}
              onChange={event => setClientForm(current => ({ ...current, documento: event.target.value }))}
            />
          </div>
          <div>
            <label className={labelClass}>Telefone</label>
            <input
              className={inputClass}
              value={clientForm.telefone}
              onChange={event => setClientForm(current => ({ ...current, telefone: event.target.value }))}
            />
          </div>
          <div>
            <label className={labelClass}>E-mail</label>
            <input
              className={inputClass}
              value={clientForm.email}
              onChange={event => setClientForm(current => ({ ...current, email: event.target.value }))}
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Observacoes</label>
          <textarea
            className={`${inputClass} min-h-[6rem]`}
            value={clientForm.observacoes}
            onChange={event => setClientForm(current => ({ ...current, observacoes: event.target.value }))}
          />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className={buttonSecondaryClass} onClick={() => setClientForm(initialClientForm)}>
            Limpar
          </button>
          <button type="submit" className={buttonPrimaryClass}>
            Salvar cliente
          </button>
        </div>
      </form>
    </div>
  );

  const renderClientesList = () => (
    <div className={cardClass}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Clientes cadastrados</h3>
          <p className="text-xs text-slate-500">Base atual de clientes da gestao.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            className={inputClass}
            placeholder="Buscar por nome ou documento"
            value={clientSearch}
            onChange={event => setClientSearch(event.target.value)}
          />
          <select
            className={inputClass}
            value={clientTypeFilter}
            onChange={event => setClientTypeFilter(event.target.value as 'todos' | RealEstateClient['tipo'])}
          >
            <option value="todos">Todos os tipos</option>
            {clientTypeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        {filteredClients.length === 0 ? (
          <div className="text-sm text-slate-500">Nenhum cliente encontrado.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className={tableHeadClass}>Nome</th>
                <th className={tableHeadClass}>Tipo</th>
                <th className={tableHeadClass}>Documento</th>
                <th className={tableHeadClass}>Telefone</th>
                <th className={tableHeadClass}>E-mail</th>
                <th className={tableHeadClass}>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map(client => (
                <tr key={client.id} className="border-t border-slate-100">
                  <td className={tableCellClass}>{client.nome}</td>
                  <td className={tableCellClass}>{clientTypeLabels[client.tipo]}</td>
                  <td className={tableCellClass}>{client.documento ?? '-'}</td>
                  <td className={tableCellClass}>{client.telefone ?? '-'}</td>
                  <td className={tableCellClass}>{client.email ?? '-'}</td>
                  <td className={tableCellClass}>
                    <div className="flex items-center gap-3 text-xs font-semibold">
                      <button type="button" className="text-brand-600 hover:text-brand-700">
                        Editar
                      </button>
                      <button type="button" className="text-slate-500 hover:text-slate-700">
                        Ver detalhes
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  const renderImoveisForm = () => (
    <div className={cardClass}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Cadastro de imoveis</h3>
          <p className="text-xs text-slate-500">
            Base independente da gestao imobiliaria, com opcao de vinculo ao site.
          </p>
        </div>
      </div>
      <form className="space-y-4" onSubmit={handleCreateProperty}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Codigo interno *</label>
            <input
              className={inputClass}
              value={propertyForm.codigo}
              onChange={event => setPropertyForm(current => ({ ...current, codigo: event.target.value }))}
            />
          </div>
          <div>
            <label className={labelClass}>Titulo *</label>
            <input
              className={inputClass}
              value={propertyForm.titulo}
              onChange={event => setPropertyForm(current => ({ ...current, titulo: event.target.value }))}
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Endereco completo</label>
          <input
            className={inputClass}
            value={propertyForm.endereco}
            onChange={event => setPropertyForm(current => ({ ...current, endereco: event.target.value }))}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Cidade</label>
            <input
              className={inputClass}
              value={propertyForm.cidade}
              onChange={event => setPropertyForm(current => ({ ...current, cidade: event.target.value }))}
            />
          </div>
          <div>
            <label className={labelClass}>Estado (UF)</label>
            <input
              className={inputClass}
              value={propertyForm.estado}
              onChange={event =>
                setPropertyForm(current => ({ ...current, estado: event.target.value.toUpperCase() }))
              }
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Tipo de imovel</label>
            <select
              className={inputClass}
              value={propertyForm.tipo}
              onChange={event =>
                setPropertyForm(current => ({
                  ...current,
                  tipo: event.target.value as RealEstateProperty['tipo']
                }))
              }
            >
              {propertyTypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Uso</label>
            <select
              className={inputClass}
              value={propertyForm.uso}
              onChange={event =>
                setPropertyForm(current => ({
                  ...current,
                  uso: event.target.value as RealEstateProperty['uso']
                }))
              }
            >
              {propertyUseOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Torre</label>
            <input
              className={inputClass}
              value={propertyForm.torre}
              onChange={event => setPropertyForm(current => ({ ...current, torre: event.target.value }))}
            />
          </div>
          <div>
            <label className={labelClass}>Bloco</label>
            <input
              className={inputClass}
              value={propertyForm.bloco}
              onChange={event => setPropertyForm(current => ({ ...current, bloco: event.target.value }))}
            />
          </div>
          <div>
            <label className={labelClass}>Unidade</label>
            <input
              className={inputClass}
              value={propertyForm.unidade}
              onChange={event => setPropertyForm(current => ({ ...current, unidade: event.target.value }))}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Metragem util</label>
            <input
              type="number"
              className={inputClass}
              value={propertyForm.metragemUtil}
              onChange={event => setPropertyForm(current => ({ ...current, metragemUtil: event.target.value }))}
            />
          </div>
          <div>
            <label className={labelClass}>Metragem total</label>
            <input
              type="number"
              className={inputClass}
              value={propertyForm.metragemTotal}
              onChange={event => setPropertyForm(current => ({ ...current, metragemTotal: event.target.value }))}
            />
          </div>
          <div>
            <label className={labelClass}>Valor aluguel referencia</label>
            <input
              type="number"
              className={inputClass}
              value={propertyForm.valorAluguelReferencia}
              onChange={event =>
                setPropertyForm(current => ({ ...current, valorAluguelReferencia: event.target.value }))
              }
            />
          </div>
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              checked={propertyForm.vinculadoAoSite}
              onChange={event =>
                setPropertyForm(current => ({
                  ...current,
                  vinculadoAoSite: event.target.checked,
                  sitePropertyId: event.target.checked ? current.sitePropertyId : ''
                }))
              }
            />
            Vincular a um imovel do site
          </label>
          {propertyForm.vinculadoAoSite && (
            <div className="mt-3">
              <label className={labelClass}>Imovel do site</label>
              <select
                className={inputClass}
                value={propertyForm.sitePropertyId}
                onChange={event => setPropertyForm(current => ({ ...current, sitePropertyId: event.target.value }))}
              >
                <option value="">Selecione um imovel</option>
                {MOCK_PROPERTIES.map(property => (
                  <option key={property.id} value={property.id}>
                    {property.title} - {property.city}/{property.state}
                  </option>
                ))}
              </select>
              {/* TODO: integrar com backend para vinculo com imoveis do site. */}
            </div>
          )}
        </div>
        <div>
          <label className={labelClass}>Observacoes</label>
          <textarea
            className={`${inputClass} min-h-[6rem]`}
            value={propertyForm.observacoes}
            onChange={event => setPropertyForm(current => ({ ...current, observacoes: event.target.value }))}
          />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className={buttonSecondaryClass} onClick={() => setPropertyForm(initialPropertyForm)}>
            Limpar
          </button>
          <button type="submit" className={buttonPrimaryClass}>
            Salvar imovel
          </button>
        </div>
      </form>
    </div>
  );

  const renderImoveisList = () => (
    <div className={cardClass}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Imoveis cadastrados</h3>
          <p className="text-xs text-slate-500">Controle de imoveis da gestao imobiliaria.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            className={inputClass}
            placeholder="Buscar por titulo, codigo ou endereco"
            value={propertySearch}
            onChange={event => setPropertySearch(event.target.value)}
          />
          <select
            className={inputClass}
            value={propertyLinkFilter}
            onChange={event => setPropertyLinkFilter(event.target.value as 'todos' | 'vinculado' | 'nao_vinculado')}
          >
            <option value="todos">Todos</option>
            <option value="vinculado">Vinculado ao site</option>
            <option value="nao_vinculado">Nao vinculado</option>
          </select>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        {filteredProperties.length === 0 ? (
          <div className="text-sm text-slate-500">Nenhum imovel encontrado.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className={tableHeadClass}>Codigo</th>
                <th className={tableHeadClass}>Titulo</th>
                <th className={tableHeadClass}>Endereco</th>
                <th className={tableHeadClass}>Tipo / Uso</th>
                <th className={tableHeadClass}>Unidade</th>
                <th className={tableHeadClass}>Vinculo site</th>
                <th className={tableHeadClass}>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {filteredProperties.map(property => {
                const unitParts = getPropertyUnitParts(property);
                return (
                  <tr key={property.id} className="border-t border-slate-100">
                    <td className={tableCellClass}>{property.codigo}</td>
                    <td className={tableCellClass}>{property.titulo}</td>
                    <td className={tableCellClass}>
                      {property.cidade}/{property.estado}
                    </td>
                    <td className={tableCellClass}>
                      {propertyTypeLabels[property.tipo]} / {propertyUseLabels[property.uso]}
                    </td>
                    <td className={tableCellClass}>{unitParts.length ? unitParts.join(' / ') : '-'}</td>
                    <td className={tableCellClass}>{property.vinculadoAoSite ? 'Sim' : 'Nao'}</td>
                    <td className={tableCellClass}>
                      <div className="flex items-center gap-3 text-xs font-semibold">
                        <button type="button" className="text-brand-600 hover:text-brand-700">
                          Editar
                        </button>
                        <button type="button" className="text-slate-500 hover:text-slate-700">
                          Ver contratos
                        </button>
                        <button type="button" className="text-slate-500 hover:text-slate-700">
                          Ver financeiro
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  const renderProprietariosForm = () => (
    <div className={cardClass}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Cadastro de proprietarios</h3>
          <p className="text-xs text-slate-500">Vincule clientes proprietarios aos imoveis.</p>
        </div>
      </div>
      <form className="space-y-4" onSubmit={handleCreateOwner}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Cliente proprietario</label>
            <select
              className={inputClass}
              value={ownerForm.clienteId}
              onChange={event => setOwnerForm(current => ({ ...current, clienteId: event.target.value }))}
            >
              <option value="">Selecione um cliente</option>
              {proprietarioClients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Percentual padrao da imobiliaria (%)</label>
            <input
              type="number"
              className={inputClass}
              value={ownerForm.percentualPadraoImobiliaria}
              onChange={event =>
                setOwnerForm(current => ({ ...current, percentualPadraoImobiliaria: event.target.value }))
              }
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Dados bancarios</label>
            <input
              className={inputClass}
              value={ownerForm.contaBancaria}
              onChange={event => setOwnerForm(current => ({ ...current, contaBancaria: event.target.value }))}
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Imoveis vinculados</label>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {properties.length === 0 ? (
              <p className="text-xs text-slate-500">Nenhum imovel cadastrado ainda.</p>
            ) : (
              properties.map(property => (
                <label key={property.id} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    checked={ownerForm.propriedadesIds.includes(property.id)}
                    onChange={() => toggleOwnerProperty(property.id)}
                  />
                  <span>{property.titulo}</span>
                </label>
              ))
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className={buttonSecondaryClass} onClick={() => setOwnerForm(initialOwnerForm)}>
            Limpar
          </button>
          <button type="submit" className={buttonPrimaryClass}>
            Salvar proprietario
          </button>
        </div>
      </form>
    </div>
  );

  const renderProprietariosList = () => (
    <div className={cardClass}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Proprietarios cadastrados</h3>
          <p className="text-xs text-slate-500">Resumo de proprietarios e seus imoveis.</p>
        </div>
        <input
          className={inputClass}
          placeholder="Buscar por nome"
          value={ownerSearch}
          onChange={event => setOwnerSearch(event.target.value)}
        />
      </div>
      <div className="mt-4 overflow-x-auto">
        {filteredOwners.length === 0 ? (
          <div className="text-sm text-slate-500">Nenhum proprietario encontrado.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className={tableHeadClass}>Proprietario</th>
                <th className={tableHeadClass}>Qtde de imoveis</th>
                <th className={tableHeadClass}>Taxa padrao</th>
                <th className={tableHeadClass}>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {filteredOwners.map(owner => (
                <tr key={owner.id} className="border-t border-slate-100">
                  <td className={tableCellClass}>{getClientName(owner.clienteId)}</td>
                  <td className={tableCellClass}>{owner.propriedadesIds.length}</td>
                  <td className={tableCellClass}>
                    {typeof owner.percentualPadraoImobiliaria === 'number'
                      ? `${owner.percentualPadraoImobiliaria}%`
                      : '-'}
                  </td>
                  <td className={tableCellClass}>
                    <div className="flex items-center gap-3 text-xs font-semibold">
                      <button type="button" className="text-brand-600 hover:text-brand-700">
                        Editar
                      </button>
                      <button type="button" className="text-slate-500 hover:text-slate-700">
                        Ver extrato
                      </button>
                      <button type="button" className="text-slate-500 hover:text-slate-700">
                        Ver contratos
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  const renderMoradoresForm = () => (
    <div className={cardClass}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Cadastro de moradores</h3>
          <p className="text-xs text-slate-500">Controle de pessoas residentes por unidade.</p>
        </div>
      </div>
      <form className="space-y-4" onSubmit={handleCreateResident}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Cliente morador</label>
            <select
              className={inputClass}
              value={residentForm.clienteId}
              onChange={event => setResidentForm(current => ({ ...current, clienteId: event.target.value }))}
            >
              <option value="">Selecione um cliente</option>
              {moradorClients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Imovel</label>
            <select
              className={inputClass}
              value={residentForm.propertyId}
              onChange={event => setResidentForm(current => ({ ...current, propertyId: event.target.value }))}
            >
              <option value="">Selecione um imovel</option>
              {properties.map(property => (
                <option key={property.id} value={property.id}>
                  {property.titulo} - {property.cidade}/{property.estado}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Unidade</label>
            <input
              className={inputClass}
              value={residentForm.unidade}
              onChange={event => setResidentForm(current => ({ ...current, unidade: event.target.value }))}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Observacoes</label>
            <textarea
              className={`${inputClass} min-h-[6rem]`}
              value={residentForm.observacoes}
              onChange={event => setResidentForm(current => ({ ...current, observacoes: event.target.value }))}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className={buttonSecondaryClass} onClick={() => setResidentForm(initialResidentForm)}>
            Limpar
          </button>
          <button type="submit" className={buttonPrimaryClass}>
            Salvar morador
          </button>
        </div>
      </form>
    </div>
  );

  const renderMoradoresList = () => (
    <div className={cardClass}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Moradores cadastrados</h3>
          <p className="text-xs text-slate-500">Lista de moradores vinculados a unidades.</p>
        </div>
        <input
          className={inputClass}
          placeholder="Buscar por nome ou imovel"
          value={residentSearch}
          onChange={event => setResidentSearch(event.target.value)}
        />
      </div>
      <div className="mt-4 overflow-x-auto">
        {filteredResidents.length === 0 ? (
          <div className="text-sm text-slate-500">Nenhum morador encontrado.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className={tableHeadClass}>Morador</th>
                <th className={tableHeadClass}>Imovel / Unidade</th>
                <th className={tableHeadClass}>Situacao</th>
                <th className={tableHeadClass}>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {filteredResidents.map(resident => (
                <tr key={resident.id} className="border-t border-slate-100">
                  <td className={tableCellClass}>{getClientName(resident.clienteId)}</td>
                  <td className={tableCellClass}>{getPropertyUnitLabel(resident.propertyId, resident.unidade)}</td>
                  <td className={tableCellClass}>Ativo</td>
                  <td className={tableCellClass}>
                    <div className="flex items-center gap-3 text-xs font-semibold">
                      <button type="button" className="text-brand-600 hover:text-brand-700">
                        Editar
                      </button>
                      <button type="button" className="text-slate-500 hover:text-slate-700">
                        Ver detalhes
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  const renderInquilinosForm = () => (
    <div className={cardClass}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Cadastro de inquilinos</h3>
          <p className="text-xs text-slate-500">Controle de situacao financeira e contratos ativos.</p>
        </div>
      </div>
      <form className="space-y-4" onSubmit={handleCreateTenant}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Cliente inquilino</label>
            <select
              className={inputClass}
              value={tenantForm.clienteId}
              onChange={event => setTenantForm(current => ({ ...current, clienteId: event.target.value }))}
            >
              <option value="">Selecione um cliente</option>
              {inquilinoClients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Situacao financeira</label>
            <select
              className={inputClass}
              value={tenantForm.situacaoFinanceira}
              onChange={event =>
                setTenantForm(current => ({
                  ...current,
                  situacaoFinanceira: event.target.value as RealEstateTenant['situacaoFinanceira']
                }))
              }
            >
              {tenantStatusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className={labelClass}>Observacoes</label>
          <textarea
            className={`${inputClass} min-h-[6rem]`}
            value={tenantForm.observacoes}
            onChange={event => setTenantForm(current => ({ ...current, observacoes: event.target.value }))}
          />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className={buttonSecondaryClass} onClick={() => setTenantForm(initialTenantForm)}>
            Limpar
          </button>
          <button type="submit" className={buttonPrimaryClass}>
            Salvar inquilino
          </button>
        </div>
      </form>
    </div>
  );

  const renderInquilinosList = () => (
    <div className={cardClass}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Inquilinos cadastrados</h3>
          <p className="text-xs text-slate-500">Acompanhe situacao financeira e contratos.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            className={inputClass}
            placeholder="Buscar por nome"
            value={tenantSearch}
            onChange={event => setTenantSearch(event.target.value)}
          />
          <select
            className={inputClass}
            value={tenantStatusFilter}
            onChange={event =>
              setTenantStatusFilter(event.target.value as 'todos' | RealEstateTenant['situacaoFinanceira'])
            }
          >
            <option value="todos">Todas as situacoes</option>
            {tenantStatusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        {filteredTenants.length === 0 ? (
          <div className="text-sm text-slate-500">Nenhum inquilino encontrado.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className={tableHeadClass}>Inquilino</th>
                <th className={tableHeadClass}>Situacao financeira</th>
                <th className={tableHeadClass}>Contratos ativos</th>
                <th className={tableHeadClass}>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.map(tenant => {
                const status = tenant.situacaoFinanceira ?? 'em_dia';
                return (
                  <tr key={tenant.id} className="border-t border-slate-100">
                    <td className={tableCellClass}>{getClientName(tenant.clienteId)}</td>
                    <td className={tableCellClass}>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold ${tenantStatusStyles[status]
                          }`}
                      >
                        {tenantStatusLabels[status]}
                      </span>
                    </td>
                    <td className={tableCellClass}>{activeContractsByTenant.get(tenant.id) ?? 0}</td>
                    <td className={tableCellClass}>
                      <div className="flex items-center gap-3 text-xs font-semibold">
                        <button type="button" className="text-brand-600 hover:text-brand-700">
                          Ver contratos
                        </button>
                        <button type="button" className="text-slate-500 hover:text-slate-700">
                          Ver financeiro
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  const renderContratosList = () => (
    <div className="space-y-6">
      <div className={cardClass}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Novo contrato</h3>
            <p className="text-xs text-slate-500">Cadastre contratos de locacao e dados principais.</p>
          </div>
          <button
            type="button"
            className={buttonPrimaryClass}
            onClick={() => setShowContractForm(current => !current)}
          >
            {showContractForm ? 'Fechar formulario' : 'Novo contrato'}
          </button>
        </div>
        {showContractForm && (
          <form className="mt-4 space-y-4" onSubmit={handleCreateContract}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Imovel</label>
                <select
                  className={inputClass}
                  value={contractForm.propertyId}
                  onChange={event => setContractForm(current => ({ ...current, propertyId: event.target.value }))}
                >
                  <option value="">Selecione um imovel</option>
                  {properties.map(property => (
                    <option key={property.id} value={property.id}>
                      {property.titulo} - {property.cidade}/{property.estado}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Unidade</label>
                <input
                  className={inputClass}
                  value={contractForm.unidade}
                  onChange={event => setContractForm(current => ({ ...current, unidade: event.target.value }))}
                />
              </div>
              <div>
                <label className={labelClass}>Proprietario</label>
                <select
                  className={inputClass}
                  value={contractForm.ownerId}
                  onChange={event => setContractForm(current => ({ ...current, ownerId: event.target.value }))}
                >
                  <option value="">Selecione um proprietario</option>
                  {owners.map(owner => (
                    <option key={owner.id} value={owner.id}>
                      {getClientName(owner.clienteId)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Inquilino</label>
                <select
                  className={inputClass}
                  value={contractForm.tenantId}
                  onChange={event => setContractForm(current => ({ ...current, tenantId: event.target.value }))}
                >
                  <option value="">Selecione um inquilino</option>
                  {tenants.map(tenant => (
                    <option key={tenant.id} value={tenant.id}>
                      {getClientName(tenant.clienteId)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Data inicio</label>
                <input
                  type="date"
                  className={inputClass}
                  value={contractForm.dataInicio}
                  onChange={event => setContractForm(current => ({ ...current, dataInicio: event.target.value }))}
                />
              </div>
              <div>
                <label className={labelClass}>Data termino</label>
                <input
                  type="date"
                  className={inputClass}
                  value={contractForm.dataFim}
                  onChange={event => setContractForm(current => ({ ...current, dataFim: event.target.value }))}
                />
              </div>
              <div>
                <label className={labelClass}>Valor do aluguel</label>
                <input
                  type="number"
                  className={inputClass}
                  value={contractForm.valorAluguel}
                  onChange={event => setContractForm(current => ({ ...current, valorAluguel: event.target.value }))}
                />
              </div>
              <div>
                <label className={labelClass}>Percentual imobiliaria (%)</label>
                <input
                  type="number"
                  className={inputClass}
                  value={contractForm.percentualImobiliaria}
                  onChange={event =>
                    setContractForm(current => ({ ...current, percentualImobiliaria: event.target.value }))
                  }
                />
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <select
                  className={inputClass}
                  value={contractForm.status}
                  onChange={event =>
                    setContractForm(current => ({
                      ...current,
                      status: event.target.value as LeaseContract['status']
                    }))
                  }
                >
                  {contractStatusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className={buttonSecondaryClass}
                onClick={() => {
                  setContractForm(initialContractForm);
                  setShowContractForm(false);
                }}
              >
                Cancelar
              </button>
              <button type="submit" className={buttonPrimaryClass}>
                Salvar contrato
              </button>
            </div>
          </form>
        )}
      </div>

      <div className={cardClass}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Contratos cadastrados</h3>
            <p className="text-xs text-slate-500">Acompanhe contratos ativos e encerrados.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              className={inputClass}
              placeholder="Buscar por imovel ou cliente"
              value={contractSearch}
              onChange={event => setContractSearch(event.target.value)}
            />
            <select
              className={inputClass}
              value={contractStatusFilter}
              onChange={event => setContractStatusFilter(event.target.value as 'todos' | LeaseContract['status'])}
            >
              <option value="todos">Todos os status</option>
              {contractStatusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          {filteredContracts.length === 0 ? (
            <div className="text-sm text-slate-500">Nenhum contrato encontrado.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className={tableHeadClass}>Codigo</th>
                  <th className={tableHeadClass}>Imovel / Unidade</th>
                  <th className={tableHeadClass}>Proprietario</th>
                  <th className={tableHeadClass}>Inquilino</th>
                  <th className={tableHeadClass}>Periodo</th>
                  <th className={tableHeadClass}>Valor</th>
                  <th className={tableHeadClass}>Status</th>
                  <th className={tableHeadClass}>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {filteredContracts.map(contract => (
                  <tr key={contract.id} className="border-t border-slate-100">
                    <td className={tableCellClass}>{contract.id}</td>
                    <td className={tableCellClass}>{getPropertyUnitLabel(contract.propertyId, contract.unidade)}</td>
                    <td className={tableCellClass}>{getOwnerName(contract.ownerId)}</td>
                    <td className={tableCellClass}>{getTenantName(contract.tenantId)}</td>
                    <td className={tableCellClass}>
                      {formatDate(contract.dataInicio)} - {contract.dataFim ? formatDate(contract.dataFim) : 'Indeterminado'}
                    </td>
                    <td className={tableCellClass}>{formatCurrency(contract.valorAluguel)}</td>
                    <td className={tableCellClass}>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold ${contractStatusStyles[contract.status]
                          }`}
                      >
                        {contractStatusLabels[contract.status]}
                      </span>
                    </td>
                    <td className={tableCellClass}>
                      <div className="flex items-center gap-3 text-xs font-semibold">
                        <button type="button" className="text-brand-600 hover:text-brand-700">
                          Editar
                        </button>
                        <button type="button" className="text-slate-500 hover:text-slate-700">
                          Ver financeiro
                        </button>
                        <button type="button" className="text-rose-500 hover:text-rose-600">
                          Encerrar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );

  const renderContratosReport = () => (
    <div className={cardClass}>
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Relatorio de contratos</h3>
        <p className="text-xs text-slate-500">Use os filtros para gerar o resumo.</p>
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>Status</label>
          <select
            className={inputClass}
            value={reportStatus}
            onChange={event => setReportStatus(event.target.value as 'todos' | LeaseContract['status'])}
          >
            <option value="todos">Todos</option>
            {contractStatusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Data inicio</label>
          <input
            type="date"
            className={inputClass}
            value={reportStartDate}
            onChange={event => setReportStartDate(event.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>Data fim</label>
          <input
            type="date"
            className={inputClass}
            value={reportEndDate}
            onChange={event => setReportEndDate(event.target.value)}
          />
        </div>
      </div>
      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>Imovel</label>
          <select
            className={inputClass}
            value={reportPropertyId}
            onChange={event => setReportPropertyId(event.target.value)}
          >
            <option value="">Todos</option>
            {properties.map(property => (
              <option key={property.id} value={property.id}>
                {property.titulo}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Proprietario</label>
          <select
            className={inputClass}
            value={reportOwnerId}
            onChange={event => setReportOwnerId(event.target.value)}
          >
            <option value="">Todos</option>
            {owners.map(owner => (
              <option key={owner.id} value={owner.id}>
                {getClientName(owner.clienteId)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Inquilino</label>
          <select
            className={inputClass}
            value={reportTenantId}
            onChange={event => setReportTenantId(event.target.value)}
          >
            <option value="">Todos</option>
            {tenants.map(tenant => (
              <option key={tenant.id} value={tenant.id}>
                {getClientName(tenant.clienteId)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        {reportContracts.length === 0 ? (
          <div className="text-sm text-slate-500">Nenhum contrato encontrado.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className={tableHeadClass}>Codigo</th>
                <th className={tableHeadClass}>Imovel</th>
                <th className={tableHeadClass}>Proprietario</th>
                <th className={tableHeadClass}>Inquilino</th>
                <th className={tableHeadClass}>Periodo</th>
                <th className={tableHeadClass}>Valor mensal</th>
                <th className={tableHeadClass}>Status</th>
              </tr>
            </thead>
            <tbody>
              {reportContracts.map(contract => (
                <tr key={contract.id} className="border-t border-slate-100">
                  <td className={tableCellClass}>{contract.id}</td>
                  <td className={tableCellClass}>{getPropertyUnitLabel(contract.propertyId, contract.unidade)}</td>
                  <td className={tableCellClass}>{getOwnerName(contract.ownerId)}</td>
                  <td className={tableCellClass}>{getTenantName(contract.tenantId)}</td>
                  <td className={tableCellClass}>
                    {formatDate(contract.dataInicio)} - {contract.dataFim ? formatDate(contract.dataFim) : 'Indeterminado'}
                  </td>
                  <td className={tableCellClass}>{formatCurrency(contract.valorAluguel)}</td>
                  <td className={tableCellClass}>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold ${contractStatusStyles[contract.status]
                        }`}
                    >
                      {contractStatusLabels[contract.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>Total mensal dos contratos filtrados:</span>
        <span className="font-semibold text-slate-900">{formatCurrency(reportTotalValue)}</span>
      </div>
    </div>
  );

  const renderFinanceiroReceber = () => (
    <div className={cardClass}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Contas a receber</h3>
          <p className="text-xs text-slate-500">Controle de lancamentos e situacao financeira.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="month"
            className={inputClass}
            value={receivableMonth}
            onChange={event => setReceivableMonth(event.target.value)}
          />
          <select
            className={inputClass}
            value={receivableStatus}
            onChange={event => setReceivableStatus(event.target.value as 'todos' | 'em_aberto' | 'pagos' | 'vencidos')}
          >
            <option value="todos">Todos</option>
            <option value="em_aberto">Em aberto</option>
            <option value="pagos">Pagos</option>
            <option value="vencidos">Vencidos</option>
          </select>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        {receivableEntries.length === 0 ? (
          <div className="text-sm text-slate-500">Nenhum lancamento encontrado.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className={tableHeadClass}>Vencimento</th>
                <th className={tableHeadClass}>Contrato</th>
                <th className={tableHeadClass}>Inquilino</th>
                <th className={tableHeadClass}>Valor</th>
                <th className={tableHeadClass}>Status</th>
                <th className={tableHeadClass}>Pagamento</th>
                <th className={tableHeadClass}>Referencia</th>
              </tr>
            </thead>
            <tbody>
              {receivableEntries.map(entry => {
                const contract = contractMap.get(entry.contractId);
                const status = getEntryStatus(entry);
                return (
                  <tr key={entry.id} className="border-t border-slate-100">
                    <td className={tableCellClass}>{formatDate(entry.dataVencimento)}</td>
                    <td className={tableCellClass}>
                      {contract ? getPropertyUnitLabel(contract.propertyId, contract.unidade) : '-'}
                    </td>
                    <td className={tableCellClass}>{contract ? getTenantName(contract.tenantId) : '-'}</td>
                    <td className={tableCellClass}>{formatCurrency(entry.valor)}</td>
                    <td className={tableCellClass}>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold ${entryStatusStyles[status]
                          }`}
                      >
                        {entryStatusLabels[status]}
                      </span>
                    </td>
                    <td className={tableCellClass}>{entry.dataPagamento ? formatDate(entry.dataPagamento) : '-'}</td>
                    <td className={tableCellClass}>{formatReference(entry.referenciaMes)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-500">
        <div>
          <span>Total em aberto</span>
          <p className="text-sm font-semibold text-slate-900 mt-1">{formatCurrency(receivableSummary.open)}</p>
        </div>
        <div>
          <span>Total pago</span>
          <p className="text-sm font-semibold text-slate-900 mt-1">{formatCurrency(receivableSummary.paid)}</p>
        </div>
        <div>
          <span>Total vencido</span>
          <p className="text-sm font-semibold text-slate-900 mt-1">{formatCurrency(receivableSummary.overdue)}</p>
        </div>
      </div>
    </div>
  );

  const renderFinanceiroPagar = () => (
    <div className={cardClass}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Contas a pagar</h3>
          <p className="text-xs text-slate-500">Repasses e despesas previstas.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="month"
            className={inputClass}
            value={payableMonth}
            onChange={event => setPayableMonth(event.target.value)}
          />
          <select
            className={inputClass}
            value={payableStatus}
            onChange={event => setPayableStatus(event.target.value as 'todos' | 'pendente' | 'pagos')}
          >
            <option value="todos">Todos</option>
            <option value="pendente">Pendentes</option>
            <option value="pagos">Pagos</option>
          </select>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        {payableEntries.length === 0 ? (
          <div className="text-sm text-slate-500">Nenhum lancamento encontrado.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className={tableHeadClass}>Vencimento</th>
                <th className={tableHeadClass}>Proprietario</th>
                <th className={tableHeadClass}>Imovel</th>
                <th className={tableHeadClass}>Valor</th>
                <th className={tableHeadClass}>Status</th>
                <th className={tableHeadClass}>Pagamento</th>
              </tr>
            </thead>
            <tbody>
              {payableEntries.map(entry => {
                const contract = contractMap.get(entry.contractId);
                const status = getEntryStatus(entry);
                return (
                  <tr key={entry.id} className="border-t border-slate-100">
                    <td className={tableCellClass}>{formatDate(entry.dataVencimento)}</td>
                    <td className={tableCellClass}>{contract ? getOwnerName(contract.ownerId) : '-'}</td>
                    <td className={tableCellClass}>
                      {contract ? getPropertyUnitLabel(contract.propertyId, contract.unidade) : '-'}
                    </td>
                    <td className={tableCellClass}>{formatCurrency(entry.valor)}</td>
                    <td className={tableCellClass}>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold ${entryStatusStyles[status]
                          }`}
                      >
                        {entryStatusLabels[status]}
                      </span>
                    </td>
                    <td className={tableCellClass}>{entry.dataPagamento ? formatDate(entry.dataPagamento) : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-500">
        <div>
          <span>Total pendente</span>
          <p className="text-sm font-semibold text-slate-900 mt-1">{formatCurrency(payableSummary.open)}</p>
        </div>
        <div>
          <span>Total pago</span>
          <p className="text-sm font-semibold text-slate-900 mt-1">{formatCurrency(payableSummary.paid)}</p>
        </div>
      </div>
    </div>
  );

  const renderFinanceiroExtrato = () => (
    <div className={cardClass}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Extrato por imovel / unidade</h3>
          <p className="text-xs text-slate-500">Selecione um imovel para detalhar receitas e despesas.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <select
            className={inputClass}
            value={extractPropertyId}
            onChange={event => setExtractPropertyId(event.target.value)}
          >
            <option value="">Selecione um imovel</option>
            {properties.map(property => (
              <option key={property.id} value={property.id}>
                {property.titulo}
              </option>
            ))}
          </select>
          <input
            className={inputClass}
            placeholder="Unidade (opcional)"
            value={extractUnit}
            onChange={event => setExtractUnit(event.target.value)}
          />
        </div>
      </div>
      {extractPropertyId ? (
        <>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-500">
            <div>
              <span>Receita total</span>
              <p className="text-sm font-semibold text-slate-900 mt-1">{formatCurrency(extractSummary.revenue)}</p>
            </div>
            <div>
              <span>Despesa total</span>
              <p className="text-sm font-semibold text-slate-900 mt-1">{formatCurrency(extractSummary.expense)}</p>
            </div>
            <div>
              <span>Resultado liquido</span>
              <p className="text-sm font-semibold text-slate-900 mt-1">{formatCurrency(extractResult)}</p>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            {extractEntries.length === 0 ? (
              <div className="text-sm text-slate-500">Nenhum lancamento encontrado.</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className={tableHeadClass}>Data</th>
                    <th className={tableHeadClass}>Tipo</th>
                    <th className={tableHeadClass}>Contrato</th>
                    <th className={tableHeadClass}>Descricao</th>
                    <th className={tableHeadClass}>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {extractEntries.map(entry => {
                    const contract = contractMap.get(entry.contractId);
                    return (
                      <tr key={entry.id} className="border-t border-slate-100">
                        <td className={tableCellClass}>{formatDate(entry.dataVencimento)}</td>
                        <td className={tableCellClass}>{entry.tipo === 'receber' ? 'Receber' : 'Pagar'}</td>
                        <td className={tableCellClass}>
                          {contract ? getPropertyUnitLabel(contract.propertyId, contract.unidade) : '-'}
                        </td>
                        <td className={tableCellClass}>{entry.descricao ?? '-'}</td>
                        <td className={tableCellClass}>{formatCurrency(entry.valor)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
          Selecione um imovel para visualizar o extrato.
        </div>
      )}
    </div>
  );

  const renderRelatorioOcupacao = () => (
    <div className={cardClass}>
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Ocupacao por imovel / unidade</h3>
        <p className="text-xs text-slate-500">Taxa de ocupacao baseada em contratos ativos.</p>
      </div>
      <div className="mt-4 overflow-x-auto">
        {occupancyData.length === 0 ? (
          <div className="text-sm text-slate-500">Nenhum imovel encontrado.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className={tableHeadClass}>Imovel</th>
                <th className={tableHeadClass}>Unidades</th>
                <th className={tableHeadClass}>Locadas</th>
                <th className={tableHeadClass}>Ocupacao</th>
              </tr>
            </thead>
            <tbody>
              {occupancyData.map(item => (
                <tr key={item.property.id} className="border-t border-slate-100">
                  <td className={tableCellClass}>{item.property.titulo}</td>
                  <td className={tableCellClass}>{item.totalUnits}</td>
                  <td className={tableCellClass}>{item.occupiedUnits}</td>
                  <td className={tableCellClass}>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-brand-600" style={{ width: `${item.rate}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-slate-700">{item.rate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  const renderRelatorioInadimplencia = () => (
    <div className={cardClass}>
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Inadimplencia</h3>
        <p className="text-xs text-slate-500">Lancamentos vencidos e nao pagos.</p>
      </div>
      <div className="mt-4 overflow-x-auto">
        {delinquencyEntries.length === 0 ? (
          <div className="text-sm text-slate-500">Nenhum registro em aberto.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className={tableHeadClass}>Inquilino</th>
                <th className={tableHeadClass}>Imovel</th>
                <th className={tableHeadClass}>Mes</th>
                <th className={tableHeadClass}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {delinquencyEntries.map(entry => {
                const contract = contractMap.get(entry.contractId);
                return (
                  <tr key={entry.id} className="border-t border-slate-100">
                    <td className={tableCellClass}>
                      {contract ? getTenantName(contract.tenantId) : '-'}
                    </td>
                    <td className={tableCellClass}>
                      {contract ? getPropertyUnitLabel(contract.propertyId, contract.unidade) : '-'}
                    </td>
                    <td className={tableCellClass}>{formatReference(entry.referenciaMes)}</td>
                    <td className={tableCellClass}>{formatCurrency(entry.valor)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>Total em inadimplencia:</span>
        <span className="font-semibold text-slate-900">{formatCurrency(delinquencyTotal)}</span>
      </div>
    </div>
  );

  const renderRelatorioReceita = () => (
    <div className={cardClass}>
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Receita por proprietario</h3>
        <p className="text-xs text-slate-500">Resumo de receitas e taxas por proprietario.</p>
      </div>
      <div className="mt-4 overflow-x-auto">
        {revenueByOwner.length === 0 ? (
          <div className="text-sm text-slate-500">Nenhum proprietario encontrado.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className={tableHeadClass}>Proprietario</th>
                <th className={tableHeadClass}>Contratos</th>
                <th className={tableHeadClass}>Receita bruta</th>
                <th className={tableHeadClass}>Taxa imobiliaria</th>
                <th className={tableHeadClass}>Receita liquida</th>
              </tr>
            </thead>
            <tbody>
              {revenueByOwner.map(item => (
                <tr key={item.owner.id} className="border-t border-slate-100">
                  <td className={tableCellClass}>{getClientName(item.owner.clienteId)}</td>
                  <td className={tableCellClass}>{item.contratos}</td>
                  <td className={tableCellClass}>{formatCurrency(item.receitaBruta)}</td>
                  <td className={tableCellClass}>{formatCurrency(item.taxaTotal)}</td>
                  <td className={tableCellClass}>{formatCurrency(item.receitaLiquida)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  const renderSection = () => {
    if (cadastroInfo) {
      if (cadastroInfo.entity === 'clientes') {
        return cadastroInfo.mode === 'cadastrar' ? renderClientesForm() : renderClientesList();
      }
      if (cadastroInfo.entity === 'imoveis') {
        return cadastroInfo.mode === 'cadastrar' ? renderImoveisForm() : renderImoveisList();
      }
      if (cadastroInfo.entity === 'proprietarios') {
        return cadastroInfo.mode === 'cadastrar' ? renderProprietariosForm() : renderProprietariosList();
      }
      if (cadastroInfo.entity === 'moradores') {
        return cadastroInfo.mode === 'cadastrar' ? renderMoradoresForm() : renderMoradoresList();
      }
      if (cadastroInfo.entity === 'inquilinos') {
        return cadastroInfo.mode === 'cadastrar' ? renderInquilinosForm() : renderInquilinosList();
      }
    }

    if (activeSection === 'contratos_listar') {
      return renderContratosList();
    }
    if (activeSection === 'contratos_relatorio') {
      return renderContratosReport();
    }
    if (activeSection === 'financeiro_receber') {
      return renderFinanceiroReceber();
    }
    if (activeSection === 'financeiro_pagar') {
      return renderFinanceiroPagar();
    }
    if (activeSection === 'financeiro_extrato_imovel') {
      return renderFinanceiroExtrato();
    }
    if (activeSection === 'relatorios_ocupacao') {
      return renderRelatorioOcupacao();
    }
    if (activeSection === 'relatorios_inadimplencia') {
      return renderRelatorioInadimplencia();
    }
    if (activeSection === 'relatorios_receita_proprietario') {
      return renderRelatorioReceita();
    }

    return null;
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[260px_1fr] gap-6">
      <aside className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4">
        {menuGroups.map(group => {
          const isOpen = openGroups[group.id];
          return (
            <div
              key={group.id}
              className="border-b border-slate-100 pb-3 mb-3 last:border-b-0 last:pb-0 last:mb-0"
            >
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                <span>{group.label}</span>
                <span className="text-slate-400">{isOpen ? '-' : '+'}</span>
              </button>
              {isOpen && (
                <div className="mt-3 space-y-1">
                  {group.items.map(item => {
                    const isActive = item.sections.includes(activeSection);
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => setActiveSection(item.sections[0])}
                        className={`w-full text-left rounded-xl px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-brand-50 text-brand-800' : 'text-slate-600 hover:bg-slate-50'
                          }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </aside>

      <div className="space-y-6">
        <div className={cardClass}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs text-slate-500">Gestao Imobiliaria</p>
              <h2 className="text-lg font-semibold text-slate-900">{sectionTitles[activeSection]}</h2>
            </div>
            {renderCadastroToggle()}
          </div>
        </div>

        {renderSection()}
      </div>
    </div>
  );
};

export default RealEstateHub;
