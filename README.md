# Africa Safari Guide (web)

Vite + React + TypeScript site with Vercel serverless functions in `/api`.

- `npm run dev` starts the site. `npx vercel dev` also runs `/api`.
- `npm run build` builds `dist/` and generates the sitemap, robots.txt and page meta.
- Copy `.env.example` to `.env.local` and fill it in. Never commit real keys.
- Payments: `VITE_PAYMENT_PROVIDER=manual` emails instructions, `dodo` uses Dodo Payments checkout.
