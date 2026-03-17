
import React, { useState, useEffect } from 'react';
import { Search, Building2 } from 'lucide-react';
import { api } from '../../services/api';

interface PropertyPickerProps {
    onSelect: (property: any) => void;
    selectedId?: string;
    label?: string;
}

const inputClass = 'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500';

const PropertyPicker: React.FC<PropertyPickerProps> = ({ onSelect, selectedId, label = "Selecionar Imóvel" }) => {
    const [properties, setProperties] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && properties.length === 0) {
            setLoading(true);
            api.properties.getAll()
                .then(setProperties)
                .finally(() => setLoading(false));
        }
    }, [isOpen]);

    const filtered = properties.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.address.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedProperty = properties.find(p => p.id === selectedId);

    return (
        <div className="relative">
            <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>

            {selectedProperty ? (
                <div className="p-3 border border-brand-200 bg-brand-50 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-brand-100">
                            <Building2 className="w-5 h-5 text-brand-600" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-brand-900">{selectedProperty.title}</p>
                            <p className="text-xs text-brand-600">{selectedProperty.address}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => onSelect(null)}
                        className="text-xs font-semibold text-brand-700 hover:underline"
                    >
                        Trocar
                    </button>
                </div>
            ) : (
                <div className="relative">
                    <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            readOnly
                            placeholder="Buscar imovel..."
                            className={inputClass + " pl-9 cursor-pointer"}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(true);
                            }}
                        />
                    </div>

                    {isOpen && (
                        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-100 shadow-xl rounded-xl max-h-60 overflow-y-auto p-1">
                            <input
                                autoFocus
                                placeholder="Digite para filtrar..."
                                className="w-full text-sm p-2 border-b border-gray-100 outline-none mb-1"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            {loading ? (
                                <div className="p-3 text-center text-xs text-gray-500">Carregando...</div>
                            ) : filtered.length === 0 ? (
                                <div className="p-3 text-center text-xs text-gray-500">Nenhum imovel encontrado</div>
                            ) : (
                                filtered.map(p => (
                                    <div
                                        key={p.id}
                                        onClick={() => {
                                            onSelect(p);
                                            setIsOpen(false);
                                            setSearchTerm('');
                                        }}
                                        className="p-2 hover:bg-slate-50 rounded-lg cursor-pointer flex items-center gap-3"
                                    >
                                        <div className="p-2 rounded-full bg-gray-100"><Building2 className="w-4 h-4 text-gray-500" /></div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{p.title}</p>
                                            <p className="text-xs text-gray-500">{p.address}</p>
                                        </div>
                                        {p.status === 'occupied' && (
                                            <span className="ml-auto text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Ocupado</span>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PropertyPicker;
