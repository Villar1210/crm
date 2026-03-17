<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1xpX_ATQgsyk_9OTghuuRkZd4xbT1a89A

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Social OAuth Setup (Meta + LinkedIn)

Create a `server/.env` file with the OAuth credentials:

```
META_CLIENT_ID=your_meta_app_id
META_CLIENT_SECRET=your_meta_app_secret
META_REDIRECT_URI=http://localhost:3001/api/social/oauth/instagram/callback
META_PAGE_ID=your_facebook_page_id

LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:3001/api/social/oauth/linkedin/callback

SOCIAL_ALLOWED_REDIRECTS=http://localhost:5173
SOCIAL_DEFAULT_RETURN=/admin/marketing
```

Notes:
- Meta redirect URI can be reused for Facebook or Instagram. If you connect Facebook, replace the redirect URI with `/api/social/oauth/facebook/callback`.
- Instagram publishing requires a business or creator account linked to a Facebook page.
- OAuth + postagem ativa: Facebook, Instagram e LinkedIn. Outros provedores seguem com a UI, mas estao marcados como "Em breve".
