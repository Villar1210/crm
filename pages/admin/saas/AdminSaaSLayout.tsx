import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Building2, CreditCard, LayoutDashboard, Layers, ToggleRight, Settings } from 'lucide-react';

const AdminSaaSLayout: React.FC = () => {
  const location = useLocation();
  const basePath = '/admin/saas';

  const tabs = [
    {
      label: 'Dashboard',
      to: basePath,
      exact: true,
      icon: LayoutDashboard
    },
    {
      label: 'Contas',
      to: `${basePath}/contas`,
      icon: Building2
    },
    {
      label: 'Planos',
      to: `${basePath}/planos`,
      icon: Layers
    },
    {
      label: 'Modulos',
      to: `${basePath}/modulos`,
      icon: ToggleRight
    },
    {
      label: 'Billing',
      to: `${basePath}/billing`,
      icon: CreditCard
    },
    {
      label: 'Configurações',
      to: `${basePath}/settings`,
      icon: Settings
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-bold text-gray-900">
          Administracao Geral (SaaS)
        </h2>
        <p className="text-gray-500 text-sm">
          Controle de contas, planos, modulos e billing da plataforma.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-2">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map(tab => {
            const active = tab.exact
              ? location.pathname === tab.to
              : location.pathname.startsWith(tab.to);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold transition ${active
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      <Outlet />
    </div>
  );
};

export default AdminSaaSLayout;
