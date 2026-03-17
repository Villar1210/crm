
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, Upload, Plus } from 'lucide-react';
import { addRealEstateProperty, RealEstateProperty, realEstateOwners } from './mockData';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all';
const labelClass = 'text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block';

const cardClass = 'bg-white rounded-3xl shadow-sm border border-slate-100 p-6';
const sectionTitleClass = 'text-base font-bold text-gray-900';
const sectionSubtitleClass = 'text-sm text-slate-500 mt-0.5 mb-6';

const propertyTypeOptions = ['Apartamento', 'Casa', 'Comercial', 'Terreno', 'Lancamento', 'Rural'];
const propertyUseOptions = ['Residencial', 'Comercial', 'Misto', 'Industrial'];
const purposeOptions = [
  { value: 'locacao', label: 'Locacao' },
  { value: 'venda', label: 'Venda' },
  { value: 'ambos', label: 'Venda e Locacao' }
];
const statusOptions = [
  { value: 'vago', label: 'Vago' },
  { value: 'ocupado', label: 'Ocupado' },
  { value: 'reservado', label: 'Reservado' },
  { value: 'reformando', label: 'Em Reforma' }
];

const initialFormData = {
  codigo: '',
  titulo: '',
  tipo: 'Apartamento',
  uso: 'Residencial',
  finalidade: 'locacao',
  situacao: 'vago',
  statusFinanceiro: 'em dia',
  endereco: '',
  numero: '',
  complemento: '',
  bairro: '',
  cep: '',
  cidade: '',
  estado: '',
  latitude: '',
  longitude: '',
  torre: '',
  bloco: '',
  unidade: '',
  andar: '',
  totalAndares: '',
  quartos: '',
  suites: '',
  banheiros: '',
  vagas: '',
  metragemUtil: '',
  metragemTotal: '',
  anoConstrucao: '',
  mobiliado: false,
  aceitaPet: false,
  varanda: false,
  churrasqueira: false,
  piscina: false,
  elevador: false,
  portaria24h: false,
  arCondicionado: false,
  areaExterna: false,
  valorAluguelReferencia: '',
  valorVenda: '',
  valorCondominio: '',
  valorIptu: '',
  seguroIncendio: '',
  taxaAdministracao: '',
  comissaoIntermediacao: '',
  disponibilidade: '',
  chavesLocal: 'imobiliaria',
  exclusivo: false,
  inquilinoAtual: '',
  proprietario: '',
  responsavel: '',
  telefone: '',
  email: '',
  preferenciaContato: 'whatsapp',
  vinculadoAoSite: false,
  sitePropertyId: '',
  tourVirtualUrl: '',
  videoUrl: '',
  tags: '',
  observacoes: ''
};

type FormData = typeof initialFormData;

const RealEstatePropertyCreate: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const ownerSuggestions = useMemo(() => realEstateOwners.map(owner => owner.name), []);

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(current => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = formData.codigo ? `${formData.codigo} - ${formData.titulo}` : formData.titulo;
    const baseAddress = [formData.endereco, formData.numero].filter(Boolean).join(', ');
    const address = baseAddress || 'Endereco nao informado';

    // Mock functionality
    const newProperty: RealEstateProperty = {
      id: `re-${Date.now()}`,
      title: title.trim() || 'Nova Propriedade',
      address: address,
      type: formData.tipo,
      owner: formData.proprietario || 'Nao informado',
      status: formData.situacao as RealEstateProperty['status'],
      purpose: formData.finalidade as RealEstateProperty['purpose'],
      rent: Number(formData.valorAluguelReferencia) || 0,
      financeStatus: formData.statusFinanceiro as RealEstateProperty['financeStatus']
    };

    addRealEstateProperty(newProperty);
    navigate('/admin/gestao-imobiliaria/imoveis');
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-2 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Voltar
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Cadastrar Imovel</h1>
          <p className="text-sm text-slate-500">Preencha os dados completos para adicionar um novo imovel a base.</p>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition">
            Cancelar
          </button>
          <button
            onClick={(e) => handleSubmit(e as any)}
            className="px-5 py-2.5 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 shadow-lg shadow-brand-600/20 flex items-center gap-2 transition"
          >
            <Save className="w-4 h-4" /> Salvar Imovel
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-8">

        {/* Main Column */}
        <div className="space-y-8">

          {/* Basic Info */}
          <section className={cardClass}>
            <div className="mb-6">
              <h3 className={sectionTitleClass}>Informacoes Basicas</h3>
              <p className={sectionSubtitleClass}>Dados principais de identificacao do imovel.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Codigo Interno</label>
                <input className={inputClass} value={formData.codigo} onChange={e => updateField('codigo', e.target.value)} placeholder="Ex: AP-001" />
              </div>
              <div>
                <label className={labelClass}>Titulo do Anuncio *</label>
                <input className={inputClass} value={formData.titulo} onChange={e => updateField('titulo', e.target.value)} placeholder="Ex: Apartamento no Centro" required />
              </div>
              <div>
                <label className={labelClass}>Tipo de Imovel</label>
                <select className={inputClass} value={formData.tipo} onChange={e => updateField('tipo', e.target.value)}>
                  {propertyTypeOptions.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Uso</label>
                <select className={inputClass} value={formData.uso} onChange={e => updateField('uso', e.target.value)}>
                  {propertyUseOptions.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Finalidade</label>
                <select className={inputClass} value={formData.finalidade} onChange={e => updateField('finalidade', e.target.value)}>
                  {purposeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Tags</label>
                <input className={inputClass} value={formData.tags} onChange={e => updateField('tags', e.target.value)} placeholder="Ex: Vista Mar, Mobiliado, Oportunidade" />
              </div>
            </div>
          </section>

          {/* Address */}
          <section className={cardClass}>
            <div className="mb-6">
              <h3 className={sectionTitleClass}>Localizacao</h3>
              <p className={sectionSubtitleClass}>Endereco completo e dados de geolocalizacao.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="md:col-span-3">
                <label className={labelClass}>Logradouro</label>
                <input className={inputClass} value={formData.endereco} onChange={e => updateField('endereco', e.target.value)} placeholder="Rua, Avenida, etc" />
              </div>
              <div>
                <label className={labelClass}>Numero</label>
                <input className={inputClass} value={formData.numero} onChange={e => updateField('numero', e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Complemento</label>
                <input className={inputClass} value={formData.complemento} onChange={e => updateField('complemento', e.target.value)} placeholder="Apto, Bloco, etc" />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Bairro</label>
                <input className={inputClass} value={formData.bairro} onChange={e => updateField('bairro', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>CEP</label>
                <input className={inputClass} value={formData.cep} onChange={e => updateField('cep', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Cidade</label>
                <input className={inputClass} value={formData.cidade} onChange={e => updateField('cidade', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Estado (UF)</label>
                <input className={inputClass} value={formData.estado} onChange={e => updateField('estado', e.target.value.toUpperCase())} maxLength={2} />
              </div>
            </div>
          </section>

          {/* Structure and Values Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Structure */}
            <section className={cardClass}>
              <div className="mb-6">
                <h3 className={sectionTitleClass}>Caracteristicas</h3>
                <p className={sectionSubtitleClass}>Detalhes da estrutura do imovel.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Area Util (m²)</label>
                  <input type="number" className={inputClass} value={formData.metragemUtil} onChange={e => updateField('metragemUtil', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Area Total (m²)</label>
                  <input type="number" className={inputClass} value={formData.metragemTotal} onChange={e => updateField('metragemTotal', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Quartos</label>
                  <input type="number" className={inputClass} value={formData.quartos} onChange={e => updateField('quartos', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Suites</label>
                  <input type="number" className={inputClass} value={formData.suites} onChange={e => updateField('suites', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Banheiros</label>
                  <input type="number" className={inputClass} value={formData.banheiros} onChange={e => updateField('banheiros', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Vagas</label>
                  <input type="number" className={inputClass} value={formData.vagas} onChange={e => updateField('vagas', e.target.value)} />
                </div>
              </div>
            </section>

            {/* Values */}
            <section className={cardClass}>
              <div className="mb-6">
                <h3 className={sectionTitleClass}>Valores</h3>
                <p className={sectionSubtitleClass}>Precificacao e encargos.</p>
              </div>
              <div className="space-y-4">
                {formData.finalidade !== 'venda' && (
                  <div>
                    <label className={labelClass}>Valor Aluguel (R$)</label>
                    <input type="number" className={inputClass} value={formData.valorAluguelReferencia} onChange={e => updateField('valorAluguelReferencia', e.target.value)} />
                  </div>
                )}
                {formData.finalidade !== 'locacao' && (
                  <div>
                    <label className={labelClass}>Valor Venda (R$)</label>
                    <input type="number" className={inputClass} value={formData.valorVenda} onChange={e => updateField('valorVenda', e.target.value)} />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Condominio (R$)</label>
                    <input type="number" className={inputClass} value={formData.valorCondominio} onChange={e => updateField('valorCondominio', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>IPTU (Mensal R$)</label>
                    <input type="number" className={inputClass} value={formData.valorIptu} onChange={e => updateField('valorIptu', e.target.value)} />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Media */}
          <section className={cardClass}>
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h3 className={sectionTitleClass}>Fotos e Midia</h3>
                <p className={sectionSubtitleClass}>Anexos e links de midia.</p>
              </div>
              <button type="button" className="text-brand-600 font-semibold text-xs flex items-center gap-1 hover:underline">
                <Plus className="w-3 h-3" /> Adicionar Fotos
              </button>
            </div>
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <Upload className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-700">Clique para fazer upload</p>
              <p className="text-xs text-slate-400 mt-1">SVG, PNG, JPG ou GIF (max. 10MB)</p>
            </div>
          </section>

        </div>

        {/* Sidebar */}
        <div className="space-y-6">

          {/* Status & Availability */}
          <section className={cardClass}>
            <h3 className="font-semibold text-gray-900 mb-4">Situacao e Chaves</h3>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Situacao Atual</label>
                <select className={inputClass} value={formData.situacao} onChange={e => updateField('situacao', e.target.value)}>
                  {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Disponivel a partir de</label>
                <input type="date" className={inputClass} value={formData.disponibilidade} onChange={e => updateField('disponibilidade', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Local das Chaves</label>
                <select className={inputClass} value={formData.chavesLocal} onChange={e => updateField('chavesLocal', e.target.value)}>
                  <option value="imobiliaria">Imobiliaria</option>
                  <option value="portaria">Portaria</option>
                  <option value="proprietario">Com Proprietario</option>
                </select>
              </div>
              <label className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 text-brand-600 rounded" checked={formData.exclusivo} onChange={e => updateField('exclusivo', e.target.checked)} />
                <span className="text-sm font-medium text-slate-700">Exclusividade</span>
              </label>
            </div>
          </section>

          {/* Owner Info */}
          <section className={cardClass}>
            <h3 className="font-semibold text-gray-900 mb-4">Proprietario</h3>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Proprietario</label>
                <input
                  list="owners"
                  className={inputClass}
                  value={formData.proprietario}
                  onChange={e => updateField('proprietario', e.target.value)}
                  placeholder="Buscar proprietario..."
                />
                <datalist id="owners">
                  {ownerSuggestions.map(name => <option key={name} value={name} />)}
                </datalist>
              </div>
              <div>
                <label className={labelClass}>Email Contato</label>
                <input type="email" className={inputClass} value={formData.email} onChange={e => updateField('email', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Telefone</label>
                <input type="tel" className={inputClass} value={formData.telefone} onChange={e => updateField('telefone', e.target.value)} />
              </div>
            </div>
          </section>

          {/* Website Link */}
          <section className={cardClass}>
            <h3 className="font-semibold text-gray-900 mb-4">Site</h3>
            <label className="flex items-start gap-3 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 text-brand-600 rounded mt-0.5" checked={formData.vinculadoAoSite} onChange={e => updateField('vinculadoAoSite', e.target.checked)} />
              <div>
                <span className="text-sm font-medium text-slate-700 block">Publicar no Site</span>
                <span className="text-xs text-slate-500">Tornar este imovel visivel no site publico.</span>
              </div>
            </label>
          </section>

        </div>

      </form>
    </div>
  );
};

export default RealEstatePropertyCreate;
