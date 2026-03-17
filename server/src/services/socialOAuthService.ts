import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { requestJson } from './httpClient';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-123';
const META_API_VERSION = process.env.META_API_VERSION || 'v19.0';
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

type SupportedProvider = 'facebook' | 'instagram' | 'linkedin';

type OAuthConfig = {
  authUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  scopeSeparator: string;
};

type OAuthState = {
  provider: SupportedProvider;
  returnTo?: string;
};

const getAllowedOrigins = () => {
  const raw = process.env.SOCIAL_ALLOWED_REDIRECTS || 'http://localhost:5173,http://localhost:3001';
  return raw.split(',').map((value) => value.trim()).filter(Boolean);
};

const getDefaultReturnTo = () =>
  process.env.SOCIAL_DEFAULT_RETURN || '/admin/marketing';

const sanitizeReturnTo = (returnTo?: string) => {
  if (!returnTo) {
    return getDefaultReturnTo();
  }
  try {
    if (returnTo.startsWith('/')) {
      return returnTo;
    }
    const parsed = new URL(returnTo);
    const allowed = getAllowedOrigins();
    if (allowed.includes(parsed.origin)) {
      return returnTo;
    }
  } catch {
    return getDefaultReturnTo();
  }
  return getDefaultReturnTo();
};

const createStateToken = (state: OAuthState) =>
  jwt.sign(state, JWT_SECRET, { expiresIn: '10m' });

const parseStateToken = (token: string): OAuthState => {
  const decoded = jwt.verify(token, JWT_SECRET);
  return decoded as OAuthState;
};

const getProviderConfig = (provider: SupportedProvider): OAuthConfig => {
  if (provider === 'facebook' || provider === 'instagram') {
    const clientId = process.env.META_CLIENT_ID || '';
    const clientSecret = process.env.META_CLIENT_SECRET || '';
    const redirectUri = process.env.META_REDIRECT_URI || '';
    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('Meta OAuth not configured');
    }
    const scopes =
      provider === 'facebook'
        ? ['pages_show_list', 'pages_manage_posts', 'pages_read_engagement']
        : [
          'instagram_basic',
          'pages_show_list',
          'pages_read_engagement',
          'instagram_content_publish'
        ];
    return {
      authUrl: `https://www.facebook.com/${META_API_VERSION}/dialog/oauth`,
      tokenUrl: `${META_API_BASE}/oauth/access_token`,
      clientId,
      clientSecret,
      redirectUri,
      scopes,
      scopeSeparator: ','
    };
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID || '';
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET || '';
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI || '';
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('LinkedIn OAuth not configured');
  }
  return {
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    clientId,
    clientSecret,
    redirectUri,
    scopes: ['r_liteprofile', 'r_emailaddress', 'w_member_social'],
    scopeSeparator: ' '
  };
};

const getProviderFromParam = (provider: string): SupportedProvider => {
  if (provider === 'facebook' || provider === 'instagram' || provider === 'linkedin') {
    return provider;
  }
  throw new Error('Provider not supported');
};

const upsertConnection = async (
  provider: SupportedProvider,
  data: {
    name: string;
    externalId?: string;
    profileUrl?: string;
  }
) => {
  return prisma.socialAccountConnection.upsert({
    where: { provider },
    update: {
      name: data.name,
      status: 'connected',
      externalId: data.externalId,
      profileUrl: data.profileUrl,
      connectedAt: new Date()
    },
    create: {
      provider,
      name: data.name,
      status: 'connected',
      externalId: data.externalId,
      profileUrl: data.profileUrl,
      connectedAt: new Date()
    }
  });
};

const upsertToken = async (
  connectionId: string,
  provider: SupportedProvider,
  tokenData: {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date | null;
    tokenType?: string;
    scope?: string;
    accountId?: string;
    meta?: Record<string, any>;
  }
) => {
  return prisma.socialIntegrationToken.upsert({
    where: { connectionId },
    update: {
      provider,
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiresAt: tokenData.expiresAt || undefined,
      tokenType: tokenData.tokenType,
      scope: tokenData.scope,
      accountId: tokenData.accountId,
      meta: tokenData.meta ? JSON.stringify(tokenData.meta) : null
    },
    create: {
      provider,
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiresAt: tokenData.expiresAt || undefined,
      tokenType: tokenData.tokenType,
      scope: tokenData.scope,
      accountId: tokenData.accountId,
      meta: tokenData.meta ? JSON.stringify(tokenData.meta) : null,
      connectionId
    }
  });
};

const exchangeToken = async (config: OAuthConfig, code: string) => {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    client_secret: config.clientSecret
  }).toString();

  return requestJson<any>(config.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
};

const exchangeMetaLongToken = async (accessToken: string, config: OAuthConfig) => {
  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: config.clientId,
    client_secret: config.clientSecret,
    fb_exchange_token: accessToken
  }).toString();

  try {
    return await requestJson<any>(`${META_API_BASE}/oauth/access_token?${params}`, {
      method: 'GET'
    });
  } catch (error) {
    return null;
  }
};

const fetchMetaPages = async (accessToken: string) => {
  return requestJson<{ data: any[] }>(
    `${META_API_BASE}/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${accessToken}`,
    { method: 'GET' }
  );
};

const fetchInstagramProfile = async (igUserId: string, accessToken: string) => {
  return requestJson<{ username?: string }>(
    `${META_API_BASE}/${igUserId}?fields=username&access_token=${accessToken}`,
    { method: 'GET' }
  );
};

const fetchLinkedInProfile = async (accessToken: string) => {
  return requestJson<any>('https://api.linkedin.com/v2/me', {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` }
  });
};

export const socialOAuthService = {
  getAuthUrl: (providerParam: string, returnTo?: string) => {
    const provider = getProviderFromParam(providerParam);
    const config = getProviderConfig(provider);
    const safeReturn = sanitizeReturnTo(returnTo);
    const stateToken = createStateToken({ provider, returnTo: safeReturn });
    const scopeValue = config.scopes.join(config.scopeSeparator);

    const authUrl = new URL(config.authUrl);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', config.clientId);
    authUrl.searchParams.set('redirect_uri', config.redirectUri);
    authUrl.searchParams.set('state', stateToken);
    authUrl.searchParams.set('scope', scopeValue);

    return { url: authUrl.toString(), returnTo: safeReturn };
  },

  handleCallback: async (providerParam: string, code: string, stateToken: string) => {
    const provider = getProviderFromParam(providerParam);
    const state = parseStateToken(stateToken);
    if (state.provider !== provider) {
      throw new Error('Invalid OAuth state');
    }

    const config = getProviderConfig(provider);
    const tokenResponse = await exchangeToken(config, code);
    const shortToken = tokenResponse.access_token as string;
    const tokenType = tokenResponse.token_type as string | undefined;
    const scope = tokenResponse.scope as string | undefined;
    const expiresIn = Number(tokenResponse.expires_in || 0);
    let accessToken = shortToken;
    let expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;

    if (provider === 'facebook' || provider === 'instagram') {
      const longToken = await exchangeMetaLongToken(shortToken, config);
      if (longToken?.access_token) {
        accessToken = longToken.access_token;
        const longExpiresIn = Number(longToken.expires_in || 0);
        expiresAt = longExpiresIn ? new Date(Date.now() + longExpiresIn * 1000) : null;
      }

      const pages = await fetchMetaPages(accessToken);
      const desiredPageId = process.env.META_PAGE_ID;
      const page =
        pages.data.find((item) => item.id === desiredPageId) || pages.data[0];
      if (!page) {
        throw new Error('No Facebook pages available');
      }

      const pageId = page.id;
      const pageName = page.name;
      const pageToken = page.access_token;
      const igAccountId = page.instagram_business_account?.id;

      if (provider === 'instagram' && !igAccountId) {
        throw new Error('Instagram business account not linked');
      }

      let accountName = pageName;
      let profileUrl: string | undefined;
      let accountId: string | undefined;
      const meta: Record<string, any> = {
        pageId,
        pageName,
        igUserId: igAccountId
      };

      if (provider === 'instagram' && igAccountId) {
        const igProfile = await fetchInstagramProfile(igAccountId, pageToken);
        const username = igProfile.username;
        accountName = username ? `@${username}` : 'Instagram';
        profileUrl = username ? `https://instagram.com/${username}` : undefined;
        accountId = igAccountId;
      } else {
        profileUrl = `https://facebook.com/${pageId}`;
        accountId = pageId;
      }

      const connection = await upsertConnection(provider, {
        name: accountName,
        externalId: accountId,
        profileUrl
      });

      await upsertToken(connection.id, provider, {
        accessToken: pageToken,
        expiresAt,
        tokenType,
        scope,
        accountId,
        meta
      });

      return { returnTo: sanitizeReturnTo(state.returnTo), connection };
    }

    const linkedInProfile = await fetchLinkedInProfile(accessToken);
    const firstName = linkedInProfile.localizedFirstName || '';
    const lastName = linkedInProfile.localizedLastName || '';
    const vanityName = linkedInProfile.vanityName;
    const fullName = `${firstName} ${lastName}`.trim() || 'LinkedIn';
    const accountId = linkedInProfile.id;
    const profileUrl = vanityName ? `https://www.linkedin.com/in/${vanityName}` : undefined;

    const connection = await upsertConnection(provider, {
      name: fullName,
      externalId: accountId,
      profileUrl
    });

    await upsertToken(connection.id, provider, {
      accessToken,
      refreshToken: tokenResponse.refresh_token,
      expiresAt,
      tokenType,
      scope,
      accountId,
      meta: {}
    });

    return { returnTo: sanitizeReturnTo(state.returnTo), connection };
  },

  disconnectProvider: async (providerParam: string) => {
    const provider = getProviderFromParam(providerParam);
    const connection = await prisma.socialAccountConnection.findUnique({
      where: { provider }
    });
    if (!connection) {
      return null;
    }

    await prisma.socialIntegrationToken.deleteMany({
      where: { connectionId: connection.id }
    });

    const updated = await prisma.socialAccountConnection.update({
      where: { id: connection.id },
      data: {
        status: 'disconnected',
        externalId: null,
        profileUrl: null,
        connectedAt: null
      }
    });

    return updated;
  }
};

