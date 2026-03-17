import React, { useEffect, useState } from 'react';
import AssinaturaScreen from '../../../src/modules/assinatura/AssinaturaScreen';

const AssinaturasWrapper: React.FC = () => {
    const [provider, setProvider] = useState<'docusign' | 'd4sign'>('docusign');

    useEffect(() => {
        const savedSettings = localStorage.getItem('crm_settings');
        if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            if (parsed.signatureProvider) {
                setProvider(parsed.signatureProvider);
            }
        }
    }, []);

    if (provider === 'docusign') {
        return <AssinaturaScreen />;
    }

    // Placeholder for D4Sign
    return (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-gray-200 shadow-sm mt-8 mx-auto max-w-2xl text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-blue-600 font-bold text-2xl">D4Sign</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ambiente D4Sign Selecionado</h2>
            <p className="text-gray-500 mb-6">
                Sua configuração atual do SaaS define <strong>D4Sign</strong> como o provedor padrão de assinaturas.
                A integração visual nativa com D4Sign está em desenvolvimento.
            </p>
        </div>
    );
};

export default AssinaturasWrapper;
