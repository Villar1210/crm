// Stub do emailService — integração SendGrid pendente
export const sendEmail = async (_to: string, _subject: string, _body: string): Promise<boolean> => {
    console.log('[EmailService] SendGrid não configurado — email não enviado');
    return false;
};

export default { sendEmail };
