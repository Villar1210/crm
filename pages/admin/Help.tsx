import React from 'react';
import { HelpCircle, BookOpen, MessageCircle, Phone, Mail, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

const faqs = [
  {
    question: 'Como adicionar um novo imóvel?',
    answer: 'Vá em "Meus Imóveis" no menu lateral e clique em "Novo Imóvel". Preencha as informações e clique em Salvar.',
  },
  {
    question: 'Como conectar o WhatsApp?',
    answer: 'Acesse "WhatsApp" no menu e clique em "Conectar". Escaneie o QR Code com o celular em WhatsApp > Dispositivos conectados.',
  },
  {
    question: 'Como criar uma campanha de email?',
    answer: 'Vá em "Email Marketing" > "Campanhas" e clique em "Nova Campanha". Siga o assistente para configurar destinatários, template e agendamento.',
  },
  {
    question: 'Como resetar a senha de um usuário?',
    answer: 'Em "Configurações" > usuários, selecione o usuário e use a opção de redefinir senha (requer perfil admin ou super_admin).',
  },
  {
    question: 'Como configurar o envio de emails?',
    answer: 'Configure as variáveis EMAIL_PROVIDER, SMTP_HOST, SMTP_PORT, SMTP_USER e SMTP_PASS no arquivo server/.env no servidor.',
  },
];

const Help: React.FC = () => {
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <HelpCircle size={28} />
          Ajuda & Suporte
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Documentação, FAQ e informações de contato</p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <a href="https://github.com/WhiskeySockets/Baileys" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors">
          <BookOpen size={20} className="text-blue-600" />
          <div>
            <div className="font-medium text-gray-900 dark:text-white text-sm">Baileys (WhatsApp)</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">Documentação <ExternalLink size={10} /></div>
          </div>
        </a>
        <a href="https://nodemailer.com" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors">
          <BookOpen size={20} className="text-green-600" />
          <div>
            <div className="font-medium text-gray-900 dark:text-white text-sm">Nodemailer</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">Envio de email <ExternalLink size={10} /></div>
          </div>
        </a>
        <a href="https://www.prisma.io/docs" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors">
          <BookOpen size={20} className="text-purple-600" />
          <div>
            <div className="font-medium text-gray-900 dark:text-white text-sm">Prisma ORM</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">Banco de dados <ExternalLink size={10} /></div>
          </div>
        </a>
      </div>

      {/* FAQ */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-8">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">Perguntas Frequentes</h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {faqs.map((faq, i) => (
            <div key={i} className="p-5">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                aria-expanded={openFaq === i}
                className="w-full flex justify-between items-center text-left"
              >
                <span className="font-medium text-gray-900 dark:text-white text-sm">{faq.question}</span>
                {openFaq === i ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
              </button>
              {openFaq === i && (
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{faq.answer}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">Contato</h2>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <Mail size={20} className="text-blue-600" />
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Email</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">contato@ivillar.com.br</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone size={20} className="text-green-600" />
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">WhatsApp</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">(11) 9 0000-0000</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MessageCircle size={20} className="text-purple-600" />
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Sistema</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">Luxe Estate Pro v1.0</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;
