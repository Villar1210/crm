import React, { useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

type SubmenuItem = {
  key: string;
  label: string;
  to?: string;
  onClick?: () => void;
};

type TabItem = {
  label: string;
  to: string;
  exact?: boolean;
  submenu?: SubmenuItem[];
};

const RealEstateLayout: React.FC = () => {
  const location = useLocation();
  const basePath = '/admin/gestao-imobiliaria';
  const tabsContainerRef = useRef<HTMLDivElement | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [submenuPosition, setSubmenuPosition] = useState<{ left: number; top: number } | null>(null);

  const tabs: TabItem[] = [
    {
      label: 'Dashboard',
      to: basePath,
      exact: true
    },
    {
      label: 'Imoveis',
      to: `${basePath}/imoveis`,
      submenu: [
        { key: 'all', label: 'Todos os imoveis', to: `${basePath}/imoveis` },
        { key: 'create', label: 'Cadastrar imoveis novos', to: `${basePath}/imoveis/novo` },
        { key: 'import', label: 'Importar imoveis', to: `${basePath}/imoveis?importar=1` },
        { key: 'export', label: 'Exportar imoveis', to: `${basePath}/imoveis?exportar=1` },
        { key: 'reports', label: 'Relatorios de imoveis', to: `${basePath}/imoveis/relatorios` }
      ]
    },
    {
      label: 'Contratos',
      to: `${basePath}/contratos`,
      submenu: [
        { key: 'all', label: 'Todos os contratos', to: `${basePath}/contratos` },
        { key: 'create', label: 'Cadastrar contrato', to: `${basePath}/contratos/novo` }
      ]
    },
    {
      label: 'Proprietarios',
      to: `${basePath}/proprietarios`,
      submenu: [
        { key: 'all', label: 'Todos os proprietarios', to: `${basePath}/proprietarios` },
        { key: 'create', label: 'Cadastrar proprietario', to: `${basePath}/proprietarios/novo` }
      ]
    },
    {
      label: 'Moradores / Inquilinos',
      to: `${basePath}/moradores`,
      submenu: [
        { key: 'all', label: 'Todos os moradores', to: `${basePath}/moradores` },
        { key: 'create', label: 'Cadastrar morador', to: `${basePath}/moradores/novo` }
      ]
    },
    {
      label: 'Financeiro',
      to: `${basePath}/financeiro`,
      submenu: [
        { key: 'receber', label: 'Contas a receber', to: `${basePath}/financeiro?tab=receber` },
        { key: 'pagar', label: 'Contas a pagar', to: `${basePath}/financeiro?tab=pagar` },
        { key: 'create', label: 'Registrar lancamento', to: `${basePath}/financeiro/nova-cobranca` }
      ]
    },
    {
      label: 'Ocupacao',
      to: `${basePath}/ocupacao`,
      submenu: [
        { key: 'all', label: 'Mapa de ocupacao', to: `${basePath}/ocupacao` },
        { key: 'create', label: 'Atualizar unidade', to: `${basePath}/ocupacao?novo=1` } // No specific route yet
      ]
    },
    {
      label: 'Chamados / Manutencoes',
      to: `${basePath}/manutencoes`,
      submenu: [
        { key: 'all', label: 'Todos os chamados', to: `${basePath}/manutencoes` },
        { key: 'create', label: 'Abrir chamado', to: `${basePath}/manutencoes/novo` }
      ]
    },
    {
      label: 'Vistorias',
      to: `${basePath}/vistorias`,
      submenu: [
        { key: 'all', label: 'Agenda de vistorias', to: `${basePath}/vistorias` },
        { key: 'create', label: 'Agendar vistoria', to: `${basePath}/vistorias/novo` }
      ]
    },
    {
      label: 'Documentos',
      to: `${basePath}/documentos`,
      submenu: [
        { key: 'all', label: 'Todos os documentos', to: `${basePath}/documentos` },
        { key: 'create', label: 'Novo documento', to: `${basePath}/documentos?novo=1` } // No specific route yet
      ]
    },
    {
      label: 'Relatorios',
      to: `${basePath}/relatorios`,
      submenu: [
        { key: 'all', label: 'Lista de relatorios', to: `${basePath}/relatorios` },
        { key: 'create', label: 'Gerar relatorio', to: `${basePath}/relatorios?novo=1` } // No specific route yet
      ]
    }
  ];

  const clearCloseTimeout = () => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const openSubmenuAt = (key: string, anchor: HTMLElement) => {
    if (!tabsContainerRef.current) {
      return;
    }

    const containerRect = tabsContainerRef.current.getBoundingClientRect();
    const anchorRect = anchor.getBoundingClientRect();

    setSubmenuPosition({
      left: anchorRect.left - containerRect.left,
      top: anchorRect.bottom - containerRect.top + 8
    });
    setOpenSubmenu(key);
  };

  const scheduleCloseSubmenu = () => {
    clearCloseTimeout();
    closeTimeoutRef.current = window.setTimeout(() => {
      setOpenSubmenu(null);
    }, 120);
  };

  const activeSubmenu = tabs.find(tab => tab.to === openSubmenu);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-bold text-gray-900">Gestao Imobiliaria</h2>
        <p className="text-gray-500 text-sm">
          Administre imoveis, contratos, proprietarios, moradores e financeiro.
        </p>
      </div>

      <div
        ref={tabsContainerRef}
        className="bg-white rounded-3xl shadow-sm border border-slate-100 p-2 relative overflow-visible"
      >
        <div className="flex gap-2 overflow-x-auto md:overflow-visible pb-1">
          {tabs.map(tab => {
            const active = tab.exact ? location.pathname === tab.to : location.pathname.startsWith(tab.to);
            const hasSubmenu = Boolean(tab.submenu);
            return (
              <div
                key={tab.to}
                className="relative"
                onMouseEnter={event => {
                  if (!hasSubmenu) {
                    return;
                  }
                  clearCloseTimeout();
                  openSubmenuAt(tab.to, event.currentTarget);
                }}
                onMouseLeave={() => {
                  if (!hasSubmenu) {
                    return;
                  }
                  scheduleCloseSubmenu();
                }}
              >
                <Link
                  to={tab.to}
                  className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold transition ${active ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  {tab.label}
                </Link>
              </div>
            );
          })}
        </div>

        {activeSubmenu && submenuPosition && (
          <div
            className="absolute z-30 w-56 rounded-2xl border border-slate-200 bg-white py-1 shadow-lg"
            style={{ left: submenuPosition.left, top: submenuPosition.top }}
            onMouseEnter={clearCloseTimeout}
            onMouseLeave={scheduleCloseSubmenu}
          >
            {activeSubmenu.submenu?.map(item => (
              item.to ? (
                <Link
                  key={item.key}
                  to={item.to}
                  onClick={() => setOpenSubmenu(null)}
                  className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  {item.label}
                </Link>
              ) : (
                <button
                  key={item.key}
                  type="button"
                  onClick={item.onClick}
                  className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  {item.label}
                </button>
              )
            ))}
          </div>
        )}
      </div>

      <Outlet />
    </div>
  );
};

export default RealEstateLayout;
