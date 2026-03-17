import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Briefcase, MapPin, Users, CheckCircle } from 'lucide-react';
import { api } from '../../services/api';
import { Job } from '../../types';

const JobsList: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const data = await api.jobs.getAll();
      setJobs(data);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-gray-900">Vagas & RH</h2>
          <p className="text-gray-500 text-sm">Gerencie oportunidades de carreira e banco de talentos.</p>
        </div>
        <button className="bg-brand-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-brand-700 flex items-center gap-2 shadow-lg shadow-brand-500/20">
          <Plus className="w-5 h-5" /> Nova Vaga
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar vagas..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-medium uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Título da Vaga</th>
                <th className="px-6 py-4">Departamento</th>
                <th className="px-6 py-4">Local</th>
                <th className="px-6 py-4">Candidatos</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {jobs.map(job => (
                <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-bold text-gray-900">{job.title}</p>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[0.625rem] font-bold bg-gray-100 text-gray-600 border border-gray-200 uppercase">
                        <Briefcase className="w-2.5 h-2.5" /> {job.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{job.department}</td>
                  <td className="px-6 py-4 text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {job.location}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-brand-600 font-bold">
                      <Users className="w-4 h-4" />
                      <span>12</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-50 text-green-600">
                      <CheckCircle className="w-3 h-3 mr-1.5" /> Ativa
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
        {loading && <div className="p-8 text-center text-gray-500">Carregando vagas...</div>}
      </div>
    </div>
  );
};

export default JobsList;