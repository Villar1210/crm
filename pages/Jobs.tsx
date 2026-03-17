import React, { useState, useEffect } from 'react';
import { Briefcase, MapPin, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import { Job } from '../types';

const Jobs: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const data = await api.jobs.getAll();
      setJobs(data);
    };
    fetch();
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen py-20">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-serif font-bold text-gray-900 mb-4">Trabalhe Conosco</h1>
          <p className="text-gray-600 text-lg">
            Junte-se ao time que está redefinindo o mercado imobiliário de alto padrão.
            Ambiente desafiador, comissões agressivas e crescimento real.
          </p>
        </div>

        <div className="grid gap-6 max-w-4xl mx-auto">
          {jobs.map(job => (
            <div key={job.id} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-lg transition-all">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                    <span className="bg-brand-50 text-brand-700 text-xs font-bold px-3 py-1 rounded-full uppercase">{job.type}</span>
                  </div>
                  <div className="flex items-center gap-4 text-gray-500 text-sm mb-4">
                    <span className="flex items-center gap-1"><Briefcase size={14} /> {job.department}</span>
                    <span className="flex items-center gap-1"><MapPin size={14} /> {job.location}</span>
                  </div>
                  <p className="text-gray-600 mb-6">{job.description}</p>

                  <div className="flex flex-wrap gap-2">
                    {job.requirements.map((req, i) => (
                      <span key={i} className="flex items-center gap-1 text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded border border-gray-100">
                        <CheckCircle size={10} className="text-brand-500" /> {req}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <button className="bg-brand-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-800 transition-colors shadow-lg shadow-brand-900/10">
                    Candidatar-se
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Jobs;
