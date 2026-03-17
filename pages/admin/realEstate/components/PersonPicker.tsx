
import React, { useState, useEffect } from 'react';
import { Plus, User } from 'lucide-react';
import { api } from '../../../../services/api';

interface Person {
    id: string;
    name: string;
    document: string;
    email: string;
    // ...
}

interface PersonPickerProps {
    type: 'OWNER' | 'TENANT' | 'GUARANTOR';
    label: string;
    value: string; // Person ID
    onChange: (personId: string, personData?: Person) => void;
    onAddNew?: () => void;
    required?: boolean;
    error?: string;
}

export const PersonPicker: React.FC<PersonPickerProps> = ({
    type,
    label,
    value,
    onChange,
    onAddNew,
    required,
    error
}) => {
    const [options, setOptions] = useState<Person[]>([]);
    const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

    // Fetch initial or search


    useEffect(() => {
        const fetchPersons = async () => {

            try {
                const data = await api.realEstate.persons.list({ type: type });
                setOptions(data);

                if (value) {
                    const found = data.find((p: Person) => p.id === value);
                    if (found) setSelectedPerson(found);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchPersons();
    }, [type, value]);

    const handleSelect = (person: Person) => {
        setSelectedPerson(person);
        onChange(person.id, person);

    };

    return (
        <div className="relative">
            <label className="block text-xs font-medium text-slate-500 mb-1">{label} {required && '*'}</label>

            {!selectedPerson ? (
                <div className="relative">
                    <select
                        className={`w-full rounded-xl border ${error ? 'border-red-300' : 'border-slate-200'} bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 appearance-none`}
                        onChange={(e) => {
                            const p = options.find(o => o.id === e.target.value);
                            if (p) handleSelect(p);
                        }}
                        value={value || ''}
                    >
                        <option value="">Selecione...</option>
                        {options.map(opt => (
                            <option key={opt.id} value={opt.id}>{opt.name} - {opt.document}</option>
                        ))}
                    </select>
                    {/* Can replace select with custom dropdown with search later if needed */}
                </div>
            ) : (
                <div className={`flex items-center justify-between p-3 rounded-xl border ${error ? 'border-red-300' : 'border-slate-200'} bg-slate-50`}>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600">
                            <User className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-700">{selectedPerson.name}</p>
                            <p className="text-xs text-slate-500">{selectedPerson.document} • {selectedPerson.email}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => { setSelectedPerson(null); onChange(''); }}
                        className="p-1 hover:bg-slate-200 rounded-full text-slate-400"
                    >
                        <span className="sr-only">Remover</span>
                        <User className="w-4 h-4 rotate-45" /> {/* Use X icon ideally, reusing User generic */}
                    </button>
                </div>
            )}

            {onAddNew && !selectedPerson && (
                <button
                    type="button"
                    onClick={onAddNew}
                    className="absolute right-2 top-8 text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                >
                    <Plus className="w-3 h-3" />
                    Novo
                </button>
            )}

            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
};
