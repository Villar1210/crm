
import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';


interface PersonPickerProps {
    type: 'OWNER' | 'TENANT' | 'GUARANTOR';
    onSelect: (person: any) => void;
    selectedId?: string;
    label?: string;
    onCreateNew?: () => void;
}

const PersonPicker: React.FC<PersonPickerProps> = ({ type, onSelect, selectedId, label, onCreateNew }) => {
    const [people, setPeople] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    // Mock data loading - replace with API call
    useEffect(() => {
        if (isOpen) {
            // api.people.list({ type }).then(setPeople);
            // Mocking for now
            setPeople([
                { id: 'p1', name: 'João Silva', cpf: '123.456.789-00', type: 'OWNER' },
                { id: 'p2', name: 'Maria Souza', cpf: '987.654.321-00', type: 'TENANT' },
            ].filter(p => p.type === type));
        }
    }, [isOpen, type]);

    const selectedPerson = people.find(p => p.id === selectedId);

    return (
        <div className="relative">
            <label className="block text-xs font-medium text-slate-500 mb-1">{label || `Selecionar ${type === 'OWNER' ? 'Proprietário' : 'Inquilino'}`}</label>

            {selectedPerson ? (
                <div className="p-3 border border-brand-200 bg-brand-50 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold">
                            {selectedPerson.name.charAt(0)}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-brand-900">{selectedPerson.name}</p>
                            <p className="text-xs text-brand-600">{selectedPerson.cpf}</p>
                        </div>
                    </div>
                    <button onClick={() => onSelect(null)} className="text-xs text-brand-700 hover:underline">Trocar</button>
                </div>
            ) : (
                <>
                    <div
                        onClick={() => setIsOpen(!isOpen)}
                        className="w-full pl-3 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm cursor-pointer flex items-center justify-between text-gray-500"
                    >
                        <span>Buscar pessoa...</span>
                        <Search className="w-4 h-4" />
                    </div>
                    {isOpen && (
                        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-100 shadow-xl rounded-xl p-2">
                            <input
                                className="w-full text-sm p-2 border-b mb-2 outline-none"
                                placeholder="Filtrar..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                            {people.map(p => (
                                <div key={p.id} onClick={() => { onSelect(p); setIsOpen(false); }} className="p-2 hover:bg-slate-50 cursor-pointer rounded">
                                    <p className="text-sm font-medium">{p.name}</p>
                                    <p className="text-xs text-gray-500">{p.cpf}</p>
                                </div>
                            ))}
                            {onCreateNew && (
                                <div onClick={onCreateNew} className="p-2 border-t mt-1 text-center text-brand-600 text-sm font-semibold cursor-pointer hover:bg-brand-50 rounded">
                                    + Cadastrar Novo
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default PersonPicker;
