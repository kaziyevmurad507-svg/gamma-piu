# Public deployment

Public URL: https://gamma-piu.vercel.app

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
- `NEXT_PUBLIC_SITE_URL=https://gamma-piu.vercel.app` until a custom domain is attached.
- Fluid Compute is enabled. Functions use `syd1`, beside the existing Supabase
  database in `ap-southeast-2`. Public data is cached for 60 seconds, with
  invalidation from admin changes. Cart validation fetches fresh data.
- Supabase remains the existing project; deploying the website does not migrate
  the database, Storage, or administrator accounts.

## Billing

Vercel Pro was selected by the owner at $20/month base price. Activation requires
the owner's billing details in Vercel. Verify the current plan in Billing;
deployment success does not confirm the subscription. Extra usage and taxes may
increase the charge. Supabase has its own plan and limits.

## Release checks

Run the browser suite against the public deployment:

```powershell
$env:PLAYWRIGHT_BASE_URL = 'https://gamma-piu.vercel.app'
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
