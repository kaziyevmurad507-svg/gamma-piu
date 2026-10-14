# Gamma Piu: project handoff (read first)

Online store for professional barber/hairdresser supplies, Baku. Orders are completed via WhatsApp (no online payment). Currency AZN, free delivery in Baku. Languages: AZ (default), RU, EN.
Owner: Murad (QA engineer, works on Windows, builds in steps with Claude in chat, not with an agent).

## How to work with Murad
- Reply in Russian. Give very simple, sequential instructions: what to do, what result to expect, what to replace, what to keep. Red marks in VS Code confuse him.
- Code style: minimal, non-redundant, beginner-friendly English comments.
- Per step: read the Figma frames he sends, build files, verify with `npx tsc --noEmit` on a clone of this repo, send a zip whose paths mirror the repo. He unzips into the project root, pushes, tells you.
- Never guess names. Clone this repo and read the real files. Do not ask him for tokens/keys.

## Stack
Next.js 16.4 (App Router, Turbopack, `proxy.ts` instead of middleware), React 19, TypeScript, Tailwind v4 (tokens in `src/app/globals.css` `@theme`), next-intl 4, Supabase (DB, Storage), lucide-react. See `AGENTS.md`: Next 16 APIs differ from older ones, docs are in `node_modules/next/dist/docs/`.
Windows quirk: `next dev` needs env `SWC_NATIVE_BINDING_CACHE=C:\swc-cache`.

## Env (.env.local, never committed)
`NEXT_PUBLIC_SUPABASE_URL` (https://<ref>.supabase.co), `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_WHATSAPP` (digits only, 994...). Image host of Supabase must be in `next.config` `images.remotePatterns`.

## Design
Figma: https://www.figma.com/design/hQVHlh3scdhoDOgjLMiEtZ/Gamma-Piu (file key hQVHlh3scdhoDOgjLMiEtZ). Screenshots of every page: `design/*.png`.
Frames: Homepage D 3:38237 / M 3:38573, Catalog D 3:38903 / M 3:39172, Product D 3:39381 / M 3:39604. Favorites, Compare, Cart, Admin frames: ask for links.
Tokens: colors canvas, ink, muted, action (+hover, pressed, soft), disabled, lavender, cream, media, line, danger, ok(+soft), warn(+soft); radii `rounded-panel` 20, `rounded-card` 24, `rounded-bento` 32; `shadow-soft`; font Inter. Breakpoint: base = mobile (390), `lg:` = desktop (1440, content max 1440 with px-16).

## Data model (Supabase)
- `categories(id, parent_id, slug unique, name_az/ru/en, sort_order)`; fixed slugs used in code: clippers, trimmers, dryers, scissors, shavers, blades, accessories (`src/lib/categories.ts`, names in messages `Categories.*`).
- `brands(id, slug, name)`.
- `products(id, category_id, brand_id, slug unique, name_*, description_*, specs jsonb, is_published, is_new, is_featured, created_at, updated_at)`. No price/stock on products.
- `product_variants(id, product_id, sku unique, name_*, price numeric, stock int, is_active, image_path, sort_order)`: variants are the options (color etc.); price/stock live here.
- `product_images(id, product_id, path, sort_order, is_main)`; files in public Storage bucket `product-images`, folder = product slug.
- `admins` table exists (for step 8). RLS: public read of published products / active variants.
- Derived on the site: card price = min active variant price, stock = sum of active variants, hidden if no active variant. Stock status: 0 out, 1-3 limited, more in stock (`src/lib/stock.ts`).

## Code map (src)
- `app/[locale]/`: `layout.tsx` (Header, main, Footer), `page.tsx` (home), `catalog/page.tsx`, `product/[slug]/page.tsx`.
- `components/ui`: Button, Chip, Input, Quantity, StockBadge (props `status`, `label`), Section (`Container`, `SectionHead`). `lib/cn.ts` class merge.
- `components/layout`: Header (client, mobile menu), Footer, LocaleSwitcher. `components/home/*`: Hero, Categories, ProductSection, Editorial, Ordering (delivery, steps, FAQ with `<details>`).
- `components/catalog/CatalogForm.tsx`: one client `<form>`; filters/search/sort write to the URL (`q, cat, min, max, avail, color, sort`), server page re-renders. Mobile filters = full-screen sheet.
- `components/product`: ProductCard + ProductGrid, ProductGallery, ProductPurchase (variant, qty), ProductInfo (specs, box contents, WhatsApp question), ProductActions (**stubs** for favorite / add to cart).
- `lib/catalog.ts` (`getProducts`, `getFeatured`, `getNew`), `lib/product.ts` (`getProduct`, `getRelated`), `lib/i18n-field.ts` (`pick(row, field, locale)`), `lib/whatsapp.ts` (`WA_URL`), `lib/supabase/server.ts` (`createClient`), `i18n/navigation.ts` (`Link`, `usePathname`, `useRouter`; always use these, not next/link).
- Messages: `messages/{az,ru,en}.json`, namespaces Nav, Footer, Categories, Colors, Stock, Product, Specs, Home, Catalog (+ earlier ones). Always add keys to all three languages. RU/EN plural with ICU.
- Specs jsonb: key -> string or `{az,ru,en}`; labels from `Specs.<key>`; `box` = box contents text; `color` used by catalog color filter.

## Decisions
Compare limit = 3 products. Cart/favorites/compare need no login. Order = WhatsApp message (step 7). Product photos: folders by slug in Storage plus SQL insert into `product_images`.

## Roadmap
0 setup, 1 DB, 2 i18n, 3 design system, 4 header/home/catalog, 5 product page: **done**.
6 favorites / compare (max 3) / cart (stubs in ProductActions, ProductPurchase, ProductCard; icons in Header need counters; pages `/favorites`, `/compare`, `/cart`),
7 WhatsApp order, 8 admin `/admin` (multi-photo upload, main photo), 9 SEO (metadata, sitemap, robots), 10 Playwright tests, 11 deploy (Vercel).

## Open items
Delete `src/app/proxy.ts` (duplicate of `src/proxy.ts`), `src/components/LanguageSwitcher.tsx`, `src/components/ui/KitPreview.tsx`. Header link `/about` has no page. Home marketing blocks (Boosted 390 AZN, iQ Perfetto 590 AZN) are static in messages. Remove "Nümunə kataloq" sample notice (Footer, product page) before launch. Catalog color filter reads `specs.color`. Price range slider in the design is replaced by Min/Max inputs.
