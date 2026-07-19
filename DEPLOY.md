# Deploy Buketboxd to Vercel

## Prerequisites

1. Supabase project **buketboxd** (`kfdsagnqpirgkiyeuwqp`) with schema + RLS applied
2. Auth providers enabled (Email + optional Google)
3. Auth redirect URLs include your Vercel domain + `/auth/callback`

## One-time CLI deploy

```bash
npx vercel login
npx vercel link
npx vercel env add NEXT_PUBLIC_SUPABASE_URL
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
npx vercel env add NEXT_PUBLIC_SITE_URL
npx vercel --prod
```

Values (already in local `.env.local`):

- `NEXT_PUBLIC_SUPABASE_URL` = `https://kfdsagnqpirgkiyeuwqp.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (anon key from Supabase dashboard)
- `NEXT_PUBLIC_SITE_URL` = your production URL, e.g. `https://buketboxd.vercel.app`

## Dashboard deploy

1. Push this repo to GitHub
2. Import in [vercel.com/new](https://vercel.com/new)
3. Framework: Next.js (auto-detected)
4. Add the three env vars above
5. Deploy

## Post-deploy checklist

- [ ] Supabase Auth → URL configuration → Site URL = production URL
- [ ] Redirect URLs include `https://YOUR_DOMAIN/auth/callback`
- [ ] Google OAuth (optional): add production callback in Google Cloud Console
- [ ] Smoke test: signup → onboarding → log a read → view article → follow → home feed
