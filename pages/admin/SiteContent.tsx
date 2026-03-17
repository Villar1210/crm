
import React, { useState, useEffect } from 'react';
import { Edit2, Eye, EyeOff, LayoutTemplate, Save } from 'lucide-react';
import { api } from '../../services/api';
import { HeroSlide } from '../../types';

const SiteContent: React.FC = () => {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const data = await api.content.getHeroSlides();
      setSlides(data);
      setLoading(false);
    };
    fetch();
  }, []);

  const toggleActive = (id: string) => {
    setSlides(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  const handleSave = async (slide: HeroSlide) => {
    setEditingId(null);
    await api.content.updateHeroSlide(slide);
  };

  const updateSlideField = (id: string, field: keyof HeroSlide, value: any) => {
    setSlides(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="mb-8">
        <h2 className="text-2xl font-serif font-bold text-gray-900">Gestão do Site</h2>
        <p className="text-gray-500">Personalize o conteúdo da página inicial.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-brand-600" /> Banner Principal (Hero)
          </h3>
        </div>

        <div className="divide-y divide-gray-100">
          {slides.map(slide => (
            <div key={slide.id} className="p-6 flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-64 h-36 rounded-lg overflow-hidden bg-gray-100 relative group">
                <img src={slide.image} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="text-white text-xs font-bold border border-white px-3 py-1 rounded">Alterar Imagem</button>
                </div>
              </div>

              <div className="flex-1 space-y-4">
                {editingId === slide.id ? (
                  <>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">Título</label>
                      <input
                        type="text"
                        value={slide.title}
                        onChange={(e) => updateSlideField(slide.id, 'title', e.target.value)}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">Subtítulo</label>
                      <textarea
                        value={slide.subtitle}
                        onChange={(e) => updateSlideField(slide.id, 'subtitle', e.target.value)}
                        className="w-full p-2 border rounded"
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Texto do Botão</label>
                        <input
                          type="text"
                          value={slide.buttonText}
                          onChange={(e) => updateSlideField(slide.id, 'buttonText', e.target.value)}
                          className="w-full p-2 border rounded"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Link</label>
                        <input
                          type="text"
                          value={slide.link}
                          onChange={(e) => updateSlideField(slide.id, 'link', e.target.value)}
                          className="w-full p-2 border rounded"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <h4 className="font-bold text-lg text-gray-900">{slide.title}</h4>
                    <p className="text-gray-500 text-sm mb-3">{slide.subtitle}</p>
                    <div className="flex gap-2">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 border border-gray-200">Botão: {slide.buttonText}</span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 border border-gray-200">Link: {slide.link}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-row md:flex-col gap-2 justify-start md:justify-center border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                {editingId === slide.id ? (
                  <button onClick={() => handleSave(slide)} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center justify-center gap-2 w-full">
                    <Save className="w-[1.125rem] h-[1.125rem]" /> Salvar
                  </button>
                ) : (
                  <button onClick={() => setEditingId(slide.id)} className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2 w-full">
                    <Edit2 className="w-[1.125rem] h-[1.125rem]" /> Editar
                  </button>
                )}

                <button
                  onClick={() => toggleActive(slide.id)}
                  className={`p-2 rounded-lg flex items-center justify-center gap-2 w-full ${slide.active ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                >
                  {slide.active ? <><Eye className="w-[1.125rem] h-[1.125rem]" /> Visível</> : <><EyeOff className="w-[1.125rem] h-[1.125rem]" /> Oculto</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SiteContent;
