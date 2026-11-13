# Public deployment

Public URL: https://gammapiu.az

`www.gammapiu.az`, `gammapiu.store`, `www.gammapiu.store`, and
`gamma-piu.vercel.app` redirect permanently (308) to this domain, preserving
paths and query strings. HTTP redirects to HTTPS. Vercel manages the TLS
certificate and its renewal. DNS uses `ns1.vercel-dns.com` and
`ns2.vercel-dns.com`; registration remains at online.az.

Vercel project: `gamma-piu` in `kaziyevmurad507-svg`.
Dashboard: https://vercel.com/kaziyevmurad507-svg/gamma-piu

The GitHub repository `kaziyevmurad507-svg/gamma-piu` is connected to Vercel.
Pushes to `main` create production deployments. Check the deployment status and
public URL after a push; a pushed commit alone does not prove a successful release.

## Configuration

- Next.js framework preset; Node.js 24.x; build command `npm run build`.
- The prebuild validator uses `VERCEL_ENV=production` for strict checks.
- Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
  `NEXT_PUBLIC_WHATSAPP`, and `NEXT_PUBLIC_SITE_URL` in the Vercel project.
- `NEXT_PUBLIC_SITE_URL=https://gammapiu.az`; Supabase Auth Site URL uses the same origin.
- Fluid Compute is enabled. Functions use `fra1`, beside the Supabase
  database in `eu-central-1`. Public data is cached for 60 seconds, with
  invalidation from admin changes. Cart validation fetches fresh data.
- Production uses Supabase project `gdytsgxxojtbsrhmlzlu` (Gamma Piu Frankfurt).
  The previous Sydney project is retained for rollback; see `POLISH-PLAN.md`.

## Billing

Vercel Pro is active. Extra-usage notifications are set at $10/month,
with alerts at 50/75/100% and automatic pausing disabled. This threshold
does not include the subscription. Supabase has its own plan and limits.

## Release checks

Run the browser suite against the public deployment:

```powershell
$env:PLAYWRIGHT_BASE_URL = 'https://gammapiu.az'
npx playwright test --workers=3
```

Tests intercept WhatsApp navigation and do not send messages. Confirm the
canonical URLs and sitemap use the public hostname, anonymous visitors can view
the storefront, `/admin` requires sign-in, and missing root assets return 404.
Inspect logs for the specific deployment to distinguish fixed errors from older
release logs.

To roll back, select a known good production deployment in Vercel and use its
rollback action. Revert the corresponding Git commit before the next release.
Attaching a future domain also requires updating `NEXT_PUBLIC_SITE_URL` and
redeploying so canonical URLs and sitemap change together.
