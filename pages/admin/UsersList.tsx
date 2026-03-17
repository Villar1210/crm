
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Filter, Shield, User, Briefcase, Users } from 'lucide-react';
import { api } from '../../services/api';
import { User as UserType } from '../../types';

const UsersList: React.FC = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const data = await api.users.getAll();
      setUsers(data);
      setLoading(false);
    };
    fetch();
  }, []);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800"><Shield className="w-2.5 h-2.5" /> Admin</span>;
      case 'super_admin':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800"><Shield className="w-2.5 h-2.5" /> Super Admin</span>;
      case 'agent':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800"><Briefcase className="w-2.5 h-2.5" /> Corretor</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800"><User className="w-2.5 h-2.5" /> Cliente</span>;
    }
  };

  const getTeamBadge = (team?: string) => {
    if (!team) return <span className="text-gray-400 text-xs">-</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200"><Users className="w-2.5 h-2.5" /> {team}</span>
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-gray-900">Gestão de Usuários</h2>
          <p className="text-gray-500 text-sm">Controle de acesso para administradores, corretores e clientes.</p>
        </div>
        <button className="bg-brand-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-brand-700 flex items-center gap-2 shadow-lg shadow-brand-500/20">
          <Plus className="w-5 h-5" /> Adicionar Usuário
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
            <Filter className="w-[1.125rem] h-[1.125rem]" /> Filtrar Cargo
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-medium uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Usuário</th>
                <th className="px-6 py-4">Contato</th>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Nível de Acesso</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <img src={user.avatar} alt="" className="w-10 h-10 rounded-full border border-gray-200" />
                      <div>
                        <p className="font-bold text-gray-900">{user.name}</p>
                        <p className="text-gray-500 text-xs">ID: {user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-900">{user.email}</p>
                    <p className="text-gray-500 text-xs">{user.phone || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    {getTeamBadge(user.team)}
                  </td>
                  <td className="px-6 py-4">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-50 text-green-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span>
                      Ativo
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                        <Edit2 className="w-[1.125rem] h-[1.125rem]" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-[1.125rem] h-[1.125rem]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading && <div className="p-8 text-center text-gray-500">Carregando usuários...</div>}
      </div>
    </div>
  );
};

export default UsersList;
