export interface RealEstateClient {
  id: string;
  nome: string;
  tipo: 'proprietario' | 'inquilino' | 'morador' | 'outro';
  documento?: string;
  telefone?: string;
  email?: string;
  observacoes?: string;
}

export interface RealEstateProperty {
  id: string;
  codigo: string;
  titulo: string;
  endereco: string;
  cidade: string;
  estado: string;
  tipo:
    | 'apartamento'
    | 'casa'
    | 'sala_comercial'
    | 'galpao'
    | 'terreno'
    | 'outro';
  uso: 'residencial' | 'comercial' | 'misto';
  torre?: string;
  bloco?: string;
  unidade?: string;
  metragemUtil?: number;
  metragemTotal?: number;
  valorAluguelReferencia?: number;
  vinculadoAoSite?: boolean;
  sitePropertyId?: string | null;
  observacoes?: string;
}

export interface RealEstateOwner {
  id: string;
  clienteId: string;
  propriedadesIds: string[];
  contaBancaria?: string;
  percentualPadraoImobiliaria?: number;
}

export interface RealEstateTenant {
  id: string;
  clienteId: string;
  situacaoFinanceira?: 'em_dia' | 'inadimplente' | 'negociando';
  observacoes?: string;
}

export interface RealEstateResident {
  id: string;
  clienteId: string;
  propertyId: string;
  unidade?: string;
  observacoes?: string;
}

export interface LeaseContract {
  id: string;
  propertyId: string;
  unidade?: string;
  ownerId: string;
  tenantId: string;
  dataInicio: string;
  dataFim?: string;
  valorAluguel: number;
  percentualImobiliaria: number;
  status: 'ativo' | 'encerrado' | 'rescindido' | 'em_negociacao';
}

export interface FinancialEntry {
  id: string;
  contractId: string;
  tipo: 'receber' | 'pagar';
  dataVencimento: string;
  dataPagamento?: string;
  valor: number;
  descricao?: string;
  pago: boolean;
  referenciaMes?: string;
}
