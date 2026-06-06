import { LeadStatus } from '../../../../types';

export const FUNNEL_PHASES = {
    PROSPECTION: {
        id: 1,
        title: 'Primeiro contato',
        color: 'bg-blue-600',
        statuses: [LeadStatus.NEW, LeadStatus.TRIAGE],
        questions: [
            "Você procura imóvel para moradia ou investimento?",
            "Qual região você tem preferência?",
            "Já conhece algum empreendimento na área?",
            "Qual sua expectativa de preço?",
            "Precisa de vaga? Quantos dormitórios?"
        ]
    },
    QUALIFICATION: {
        id: 2,
        title: 'Agendar visita',
        color: 'bg-cyan-500',
        statuses: [LeadStatus.QUALIFIED],
        questions: [
            "Qual sua renda familiar?",
            "Pretende financiar, usar FGTS ou comprar à vista?",
            "Já visitou algum decorado?",
            "Quando pretende se mudar ou investir?",
            "Tem mais alguém na decisão?"
        ]
    },
    OPPORTUNITY: {
        id: 3,
        title: 'Follow-up (sumido)',
        color: 'bg-amber-500',
        statuses: [LeadStatus.VISIT_SCHEDULED, LeadStatus.PROPOSAL, LeadStatus.NEGOTIATION],
        questions: [
            "O que pesa mais: localização, metragem ou valor?",
            "Prefere planta compacta ou ampla?",
            "Posso enviar vídeo do decorado?",
            "Quer que eu simule opções de pagamento?",
            "Vamos agendar sua visita?"
        ]
    },
    CLOSING: {
        id: 4,
        title: 'Proposta',
        color: 'bg-red-500',
        statuses: [LeadStatus.CLOSED],
        questions: [
            "Qual valor consegue de entrada hoje?",
            "Prefere parcelar a entrada?",
            "Podemos formalizar sua proposta?",
            "Preferência: assinatura digital ou presencial?",
            "Envio lista de documentos para adiantar?"
        ]
    }
};

export const getCurrentFunnelPhase = (status: LeadStatus) => {
    if (FUNNEL_PHASES.PROSPECTION.statuses.includes(status)) return FUNNEL_PHASES.PROSPECTION;
    if (FUNNEL_PHASES.QUALIFICATION.statuses.includes(status)) return FUNNEL_PHASES.QUALIFICATION;
    if (FUNNEL_PHASES.OPPORTUNITY.statuses.includes(status)) return FUNNEL_PHASES.OPPORTUNITY;
    if (FUNNEL_PHASES.CLOSING.statuses.includes(status)) return FUNNEL_PHASES.CLOSING;
    return FUNNEL_PHASES.PROSPECTION;
};

export const WHATSAPP_TEMPLATES = [
    { id: 1, title: '👋 Primeiro Contato', text: 'Olá [Nome], sou [Seu Nome] da NovaMorada. Vi seu interesse no imóvel [Imóvel] e gostaria de te passar mais detalhes. Podemos falar?' },
    { id: 2, title: '📅 Agendar Visita', text: 'Oi [Nome], tudo bem? Que tal agendarmos uma visita ao [Imóvel] neste sábado? Tenho um horário livre às 10h.' },
    { id: 3, title: '👀 Follow-up (Sumido)', text: 'Olá [Nome], ainda está buscando imóveis na região? Chegou uma nova opção que combina com seu perfil.' },
    { id: 4, title: '💰 Proposta', text: 'Olá [Nome], consegui uma condição especial para o [Imóvel]. Quando consegue falar?' },
];

export const LOSS_REASONS = [
    "Preço alto / Fora do orçamento",
    "Localização não atendeu",
    "Comprou com outro corretor",
    "Desistiu da compra",
    "Sem contato / Sumiu",
    "Financiamento negado",
    "Outro motivo"
];
