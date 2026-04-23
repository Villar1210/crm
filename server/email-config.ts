/**
 * Email Service Configuration
 *
 * Setup centralizado de email com suporte a múltiplos providers
 * Gmail, SendGrid, ou SMTP genérico
 */

export type EmailProvider = 'gmail' | 'sendgrid' | 'smtp' | 'mock';

interface SMTPConfig {
    host: string;
    port: number;
    secure: boolean;
    auth: {
        user: string;
        pass: string;
    };
}

interface EmailConfigOptions {
    provider: EmailProvider;
    from: string;
    replyTo?: string;
    debug?: boolean;
}

// ─────────────────────────────────────────────────
// SMTP CONFIGURATIONS
// ─────────────────────────────────────────────────

const SMTP_CONFIGS: Record<EmailProvider, (env: NodeJS.ProcessEnv) => SMTPConfig | null> = {
    // Gmail SMTP
    gmail: (env) => ({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: env.GMAIL_USER || '',
            pass: env.GMAIL_PASS || '', // Use App Password, not account password
        },
    }),

    // SendGrid SMTP
    sendgrid: (env) => ({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
            user: 'apikey',
            pass: env.SENDGRID_API_KEY || '',
        },
    }),

    // Generic SMTP
    smtp: (env) => ({
        host: env.SMTP_HOST || '',
        port: parseInt(env.SMTP_PORT || '587', 10),
        secure: env.SMTP_SECURE === 'true',
        auth: {
            user: env.SMTP_USER || '',
            pass: env.SMTP_PASS || '',
        },
    }),

    // Mock (for testing)
    mock: () => ({
        host: 'localhost',
        port: 1025,
        secure: false,
        auth: {
            user: 'test',
            pass: 'test',
        },
    }),
};

// ─────────────────────────────────────────────────
// GET CONFIG
// ─────────────────────────────────────────────────

export function getEmailConfig(): {
    config: SMTPConfig;
    provider: EmailProvider;
    from: string;
    debug: boolean;
} {
    const env = process.env;
    const provider: EmailProvider = (env.EMAIL_PROVIDER || 'smtp') as EmailProvider;
    const debug = env.EMAIL_DEBUG === 'true' || env.NODE_ENV === 'development';

    const configFn = SMTP_CONFIGS[provider];
    if (!configFn) {
        throw new Error(\`Unknown email provider: \${provider}\`);
    }

    const config = configFn(env);
    if (!config || !config.auth.user || !config.auth.pass) {
        if (provider === 'mock') {
            console.warn('⚠️  Using mock email provider (testing only)');
        } else {
            throw new Error(\`Email configuration incomplete for provider: \${provider}\`);
        }
    }

    return {
        config,
        provider,
        from: env.SMTP_FROM || 'noreply@ivillar.com.br',
        debug,
    };
}

// ─────────────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────────────

export function validateEmailConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
        const { config, provider } = getEmailConfig();

        // Validate SMTP host
        if (!config.host) {
            errors.push('SMTP_HOST is not configured');
        }

        // Validate auth
        if (!config.auth.user) {
            errors.push(\`Email user is not configured for provider: \${provider}\`);
        }
        if (!config.auth.pass) {
            errors.push(\`Email password is not configured for provider: \${provider}\`);
        }

        // Warn about insecure connection in production
        if (!config.secure && process.env.NODE_ENV === 'production') {
            errors.push(
                'Warning: Using insecure SMTP connection in production. Set SMTP_SECURE=true'
            );
        }
    } catch (error) {
        errors.push(\`Email configuration error: \${String(error)}\`);
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

// ─────────────────────────────────────────────────
// HELPER: GET PROVIDER INFO
// ─────────────────────────────────────────────────

export function getProviderInfo(provider: EmailProvider): {
    name: string;
    docs: string;
    setup: string;
} {
    const info: Record
        EmailProvider,
        {
            name: string;
            docs: string;
            setup: string;
        }
    > = {
        gmail: {
            name: 'Gmail SMTP',
            docs: 'https://support.google.com/accounts/answer/185833',
            setup: 'Use App Password from Google Account > Security > App Passwords',
        },
        sendgrid: {
            name: 'SendGrid API',
            docs: 'https://sendgrid.com/docs/for-developers/sending-email/smtp-service',
            setup: 'Get API key from SendGrid Dashboard > Settings > API Keys',
        },
        smtp: {
            name: 'Generic SMTP',
            docs: 'https://nodemailer.com/smtp',
            setup: 'Configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env',
        },
        mock: {
            name: 'Mock (Testing)',
            docs: 'https://nodemailer.com/smtp/testing',
            setup: 'Use for local development with Mailhog or Ethereal',
        },
    };

    return info[provider];
}

// ─────────────────────────────────────────────────
// EMAIL TEMPLATES CONFIG
// ─────────────────────────────────────────────────

export const EMAIL_TEMPLATES = {
    VERIFICATION: {
        subject: 'Verifique seu email - IVILLAR CRM',
        template: 'verification-email',
    },
    PASSWORD_RESET: {
        subject: 'Recuperar sua senha - IVILLAR CRM',
        template: 'password-reset',
    },
    TWO_FACTOR: {
        subject: 'Autenticação em 2 fatores ativada - IVILLAR CRM',
        template: 'two-factor-welcome',
    },
    WELCOME: {
        subject: 'Bem-vindo ao IVILLAR CRM',
        template: 'welcome',
    },
    PASSWORD_CHANGED: {
        subject: 'Sua senha foi alterada - IVILLAR CRM',
        template: 'password-changed',
    },
    ACCOUNT_SUSPENDED: {
        subject: 'Sua conta foi suspensa - IVILLAR CRM',
        template: 'account-suspended',
    },
};

// ─────────────────────────────────────────────────
// EMAIL RATE LIMITING CONFIG
// ─────────────────────────────────────────────────

export const EMAIL_RATE_LIMITS = {
    VERIFICATION: {
        maxAttempts: 5,
        windowMs: 60 * 60 * 1000, // 1 hour
        description: 'Máximo 5 tentativas de envio de email de verificação por hora',
    },
    PASSWORD_RESET: {
        maxAttempts: 3,
        windowMs: 60 * 60 * 1000, // 1 hour
        description: 'Máximo 3 tentativas de reset de senha por hora',
    },
    GENERAL: {
        maxAttempts: 10,
        windowMs: 60 * 60 * 1000, // 1 hour
        description: 'Máximo 10 emails por hora',
    },
};

// ─────────────────────────────────────────────────
// RETRY CONFIG
// ─────────────────────────────────────────────────

export const EMAIL_RETRY_CONFIG = {
    maxRetries: 3,
    retryDelayMs: 1000,
    backoffMultiplier: 2, // Exponential backoff
};
