import React, { useState } from 'react';

export default function SignatureBuilder() {
    const [recipients, setRecipients] = useState([{ id: Date.now(), name: '', email: '' }]);
    const [isOnlySigner, setIsOnlySigner] = useState(false);
    const [defineOrder, setDefineOrder] = useState(true);
    const [subject, setSubject] = useState('Por favor, assine com o DocuSign na linha pontilhada');
    const [message, setMessage] = useState('');

    const addRecipient = () => {
        setRecipients([...recipients, { id: Date.now(), name: '', email: '' }]);
    };

    const removeRecipient = (id: number) => {
        setRecipients(recipients.filter(r => r.id !== id));
    };

    return (
        <div className="min-h-screen bg-[#f4f4f4] text-[#333333] pb-24 text-[15px] font-sans" style={{ fontFamily: "'Inter', sans-serif" }}>
            {/* Header fixo / Topbar */}
            <header className="fixed top-0 left-0 w-full h-[72px] bg-white border-b border-gray-300 flex items-center justify-between px-6 z-50">
                <div className="flex items-center space-x-5">
                    <button className="text-gray-500 hover:text-gray-900 focus:outline-none transition-colors" title="Fechar">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                    </button>
                    <h1 className="text-[20px] font-medium tracking-tight mt-0.5">Configurar envelope</h1>
                </div>
                <div className="flex items-center space-x-6">
                    <button className="text-[#005cb9] font-bold text-sm tracking-wide hover:underline focus:outline-none">Ações <span className="text-xs">▼</span></button>
                    <button className="text-[#005cb9] font-bold text-sm tracking-wide hover:underline focus:outline-none">Visualizar</button>
                    <button className="text-gray-500 hover:text-gray-900 focus:outline-none">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                    </button>
                    <button className="bg-white text-[#333333] font-bold px-5 py-2.5 rounded-[2px] border border-[#cccccc] hover:bg-[#f8f8f8] transition-colors cursor-pointer text-[13px] uppercase tracking-wider">Salvar e fechar</button>
                    <button className="bg-[#ffc820] text-[#333333] font-bold px-5 py-2.5 rounded-[2px] border border-transparent hover:bg-[#ffb600] transition-colors cursor-pointer text-[13px] uppercase tracking-wider">Seguinte<span className="hidden sm:inline">: adicionar campos</span></button>
                </div>
            </header>

            {/* Container Principal do Formulário */}
            <main className="w-[880px] mx-auto mt-[104px] space-y-6">

                {/* Componente 1: Adicionar documentos */}
                <section className="bg-white border border-gray-300 rounded shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
                    <div className="px-6 py-4 flex flex-col justify-center border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-4">
                            <div className="w-[28px] h-[28px] rounded-full bg-[#1e1e1e] text-white flex items-center justify-center font-bold text-sm">1</div>
                            <h2 className="text-[18px] font-medium tracking-tight">Adicionar documentos para assinatura</h2>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="border-2 border-dashed border-[#005cb9] rounded-lg bg-[#f9fbff] py-14 px-10 flex flex-col items-center justify-center text-center transition-colors hover:bg-[#f0f7ff] cursor-pointer">
                            <svg className="w-16 h-16 text-[#005cb9] mb-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="text-[17px] text-gray-800 mb-6 font-medium">Solte seu arquivo aqui</p>
                            <div className="flex items-center justify-center space-x-4">
                                <button className="bg-white text-gray-700 text-sm font-semibold py-2 px-6 rounded border border-gray-300 shadow-sm hover:bg-gray-50 transition-all uppercase tracking-wide">
                                    Fazer upload
                                </button>
                                <button className="bg-white text-[#005cb9] text-sm font-semibold py-2 px-6 rounded border border-[#005cb9] shadow-sm hover:bg-blue-50 transition-all uppercase tracking-wide">
                                    Pegar de uma nuvem
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Componente 2: Adicionar destinatários */}
                <section className="bg-white border border-gray-300 rounded shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
                    <div className="px-6 py-4 flex flex-col justify-center border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-4">
                            <div className="w-[28px] h-[28px] rounded-full bg-[#1e1e1e] text-white flex items-center justify-center font-bold text-sm">2</div>
                            <h2 className="text-[18px] font-medium tracking-tight">Adicionar destinatários para o envelope</h2>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="flex items-center space-x-8 mb-6 ml-2">
                            <label className="flex items-center space-x-2.5 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    className="w-[18px] h-[18px] text-[#005cb9] border-gray-400 rounded focus:ring-0 cursor-pointer"
                                    checked={isOnlySigner}
                                    onChange={(e) => setIsOnlySigner(e.target.checked)}
                                />
                                <span className="text-[15px] font-medium text-gray-700 group-hover:text-black">Sou o único signatário</span>
                            </label>
                            <label className="flex items-center space-x-2.5 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    className="w-[18px] h-[18px] text-[#005cb9] border-gray-400 rounded focus:ring-0 cursor-pointer"
                                    checked={defineOrder}
                                    onChange={(e) => setDefineOrder(e.target.checked)}
                                />
                                <span className="text-[15px] font-medium text-gray-700 group-hover:text-black">Definir ordem de assinatura</span>
                            </label>
                        </div>

                        {recipients.map((recipient, index) => (
                            <div key={recipient.id} className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm flex mb-4 relative">
                                <div className="w-[42px] bg-[#f8f8f8] border-r border-gray-200 flex flex-col items-center py-4 cursor-grab">
                                    <span className="font-bold text-xs text-gray-500 mb-1">{index + 1}</span>
                                    <svg className="w-4 h-4 text-gray-400 mt-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" /></svg>
                                </div>

                                <div className="flex-1 p-5">
                                    <div className="flex gap-4">
                                        <div className="w-1/2">
                                            <label className="block text-[13px] font-bold text-[#333333] mb-1.5 uppercase tracking-wide">Nome *</label>
                                            <input
                                                type="text"
                                                placeholder="João da Silva"
                                                className="border border-[#cccccc] px-3 py-2 rounded-[2px] w-full text-[14px] outline-none transition-all focus:border-[#005cb9] focus:ring-1 focus:ring-[#005cb9]"
                                                value={recipient.name}
                                                onChange={(e) => {
                                                    const newRecipients = [...recipients];
                                                    newRecipients[index].name = e.target.value;
                                                    setRecipients(newRecipients);
                                                }}
                                            />
                                        </div>
                                        <div className="w-1/2 flex items-start gap-3">
                                            <div className="flex-1">
                                                <label className="block text-[13px] font-bold text-[#333333] mb-1.5 uppercase tracking-wide">E-mail *</label>
                                                <input
                                                    type="email"
                                                    placeholder="joao@exemplo.com"
                                                    className="border border-[#cccccc] px-3 py-2 rounded-[2px] w-full text-[14px] outline-none transition-all focus:border-[#005cb9] focus:ring-1 focus:ring-[#005cb9]"
                                                    value={recipient.email}
                                                    onChange={(e) => {
                                                        const newRecipients = [...recipients];
                                                        newRecipients[index].email = e.target.value;
                                                        setRecipients(newRecipients);
                                                    }}
                                                />
                                            </div>
                                            <div className="mt-7">
                                                <button
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                    title="Remover destinatário"
                                                    onClick={() => removeRecipient(recipient.id)}
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-5 pt-4 border-t border-gray-100 flex items-center space-x-6">
                                        <button className="text-[14px] text-[#005cb9] font-semibold flex items-center hover:underline focus:outline-none">
                                            <span className="text-lg mr-1.5 font-normal leading-none">+</span> Adicionar código de acesso
                                        </button>
                                        <button className="text-[14px] text-[#005cb9] font-semibold flex items-center hover:underline focus:outline-none">
                                            <span className="text-lg mr-1.5 font-normal leading-none">+</span> Adicionar mensagem privada
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className="mt-5">
                            <button
                                onClick={addRecipient}
                                className="bg-white text-[#333333] font-bold px-4 py-2 rounded-[2px] border border-[#cccccc] hover:bg-[#f8f8f8] transition-colors cursor-pointer flex items-center space-x-2 text-[13px] uppercase tracking-wide"
                            >
                                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M18 13h-5v5h-2v-5H6v-2h5V6h2v5h5v2z" /></svg>
                                Adicionar destinatário
                            </button>
                        </div>
                    </div>
                </section>

                {/* Componente 3: Adicionar mensagem */}
                <section className="bg-white border border-gray-300 rounded shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden mb-8">
                    <div className="px-6 py-4 flex flex-col justify-center border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-4">
                            <div className="w-[28px] h-[28px] rounded-full bg-[#1e1e1e] text-white flex items-center justify-center font-bold text-sm">3</div>
                            <h2 className="text-[18px] font-medium tracking-tight">Adicionar mensagem ao e-mail</h2>
                        </div>
                    </div>

                    <div className="p-6 space-y-5">
                        <div>
                            <label className="block text-[13px] font-bold text-[#333333] mb-1.5 uppercase tracking-wide">Assunto do e-mail</label>
                            <input
                                type="text"
                                className="border border-[#cccccc] px-3 py-2.5 rounded-[2px] w-full text-[15px] font-medium outline-none transition-all focus:border-[#005cb9] focus:ring-1 focus:ring-[#005cb9]"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                            />
                            <p className="text-[12px] text-gray-500 mt-1 ml-1 font-medium">Contagem de caracteres: {subject.length}</p>
                        </div>
                        <div>
                            <label className="block text-[13px] font-bold text-[#333333] mb-1.5 uppercase tracking-wide">Mensagem do e-mail</label>
                            <textarea
                                rows={5}
                                placeholder="Insira a mensagem"
                                className="border border-[#cccccc] p-3 rounded-[2px] w-full text-[15px] outline-none transition-all focus:border-[#005cb9] focus:ring-1 focus:ring-[#005cb9] resize-none"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            ></textarea>
                        </div>
                    </div>
                </section>

                {/* Espaçador inferior */}
                <div className="h-8"></div>

            </main>

            {/* Footer sticky simulando as ações inferiores */}
            <div className="fixed bottom-0 left-0 w-full h-[64px] bg-white border-t border-gray-300 flex items-center justify-end px-6 space-x-4 z-50">
                <button className="bg-white text-[#333333] font-bold px-6 py-2 rounded-[2px] border border-[#cccccc] hover:bg-[#f8f8f8] transition-colors cursor-pointer text-[13px] uppercase tracking-wider">Voltar</button>
                <button className="bg-[#ffc820] text-[#333333] font-bold px-6 py-2 rounded-[2px] border border-transparent hover:bg-[#ffb600] transition-colors cursor-pointer text-[13px] uppercase tracking-wider">Seguinte<span className="hidden sm:inline">: adicionar campos</span></button>
            </div>

        </div>
    );
}
