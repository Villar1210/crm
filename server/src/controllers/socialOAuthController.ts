import { Request, Response } from 'express';
import { socialOAuthService } from '../services/socialOAuthService';

export const startOAuth = (req: Request, res: Response) => {
    try {
        const { provider } = req.params;
        const { returnTo } = req.query;
        const { url } = socialOAuthService.getAuthUrl(provider, String(returnTo || ''));
        res.redirect(url);
    } catch (error: any) {
        console.error('OAuth start failed:', error);
        res.status(400).json({ error: error?.message || 'OAuth start failed' });
    }
};

export const oauthCallback = async (req: Request, res: Response) => {
    try {
        const { provider } = req.params;
        const { code, state } = req.query;

        if (!code || !state) {
            res.status(400).send('Missing OAuth parameters');
            return;
        }

        const result = await socialOAuthService.handleCallback(
            provider,
            String(code),
            String(state)
        );

        res.redirect(result.returnTo);
    } catch (error: any) {
        console.error('OAuth callback failed:', error);
        res.status(400).send(error?.message || 'OAuth callback failed');
    }
};

export const disconnectOAuth = async (req: Request, res: Response) => {
    try {
        const { provider } = req.params;
        const updated = await socialOAuthService.disconnectProvider(provider);
        if (!updated) {
            res.status(404).json({ error: 'Connection not found' });
            return;
        }
        res.json(updated);
    } catch (error: any) {
        console.error('OAuth disconnect failed:', error);
        res.status(400).json({ error: error?.message || 'OAuth disconnect failed' });
    }
};

