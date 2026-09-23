# Cloaket.org / Musiclet

**Musiclet** – a Blooket-inspired music quiz platform.
Coded and owned by Ethan32.

Live link (after deploying):
- GitHub repo: https://github.com/EthanM32122/cloaket
- Recommended free host: Vercel → import this repo → get `https://cloaket.vercel.app`
- Then add custom domain **cloaket.org** in Vercel settings (if you own the domain).

## Features
- Landing page matching the original design (checkered background, logo, LOGIN! / REGISTER buttons)
- Working Register page
- Working Login page
- Simple dashboard after login
- Accounts saved in browser localStorage

## How to run locally
1. Open `index.html` in any browser
2. Or use a local server: `npx serve .`

## Deploy on Vercel (free & recommended for custom domain)
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. **Add New… → Project**
3. Import **EthanM32122/cloaket**
4. Deploy (defaults are fine)
5. In Project Settings → Domains, add `cloaket.org` (requires you to own the domain and point DNS)

## Files
- `index.html` – pages (landing / register / login / dashboard)
- `styles.css` – all styling
- `app.js` – login/register logic + localStorage
