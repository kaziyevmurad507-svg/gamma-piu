# Gamma Piu: project handoff (read first)

Online store for professional barber/hairdresser supplies, Baku. Orders are completed via WhatsApp (no online payment). Currency AZN, free delivery in Baku. Languages: AZ (default), RU, EN.
Owner: Murad (QA engineer, works on Windows, builds in steps with Claude in chat, not with an agent).

## How to work with Murad
- Reply in Russian. Give very simple, sequential instructions: what to do, what result to expect, what to replace, what to keep. Red marks in VS Code confuse him.
- Code style: minimal, non-redundant, beginner-friendly English comments.
- Per step: read the Figma frames he sends, build files, verify with `npx tsc --noEmit` (and `npx eslint src`) on a clone of this repo, send a zip whose paths mirror the repo. He unzips into the project root, pushes, tells you.
- Zip rule (learned in step 6, files got lost twice): send ONE zip with every changed file since his last commit, never several small partial zips; list what is inside; give him a check command (`grep`/`ls`) to confirm files landed; tell him to delete `.next` and hard-refresh (Ctrl+F5) when something looks unchanged. Diff against HIS latest commit (clone again), not an old clone.
- He gives feedback as numbered lists; answer point by point; ask one short question when a product decision is needed (he decides, e.g. compare rules). Say honestly what was not tested (no Supabase env in the sandbox: home page and DB pages cannot be opened there; `/az/cart`, `/az/compare`, `/az/favorites`, `/az/about` can).
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
- `categories(id, parent_id, slug unique, name_az/ru/en, sort_order, is_hidden, compare_group)`: loaded from the DB (step 8 part 1, migration `supabase/002_categories.sql`). `compare_group` = slug of another category whose group this one joins (accessories -> blades), null = own group. Hidden category = not in the filter and its products are not shown. Server: `lib/category-data.ts` `getCategories(locale)`; client: `useCategories()` from `components/layout/CategoriesProvider` (set in the locale layout). Products/cart lines carry `categoryName` (localized) and `group`.
- `brands(id, slug, name)`.
- `products(id, category_id, brand_id, slug unique, name_*, description_*, specs jsonb, is_published, is_new, is_featured, created_at, updated_at)`. No price/stock on products.
- `product_variants(id, product_id, sku unique, name_*, price numeric, stock int, is_active, image_path, sort_order)`: variants are the options (color etc.); price/stock live here.
- `product_images(id, product_id, variant_id null, path, sort_order, is_main)` (one is_main per product); files in public Storage bucket `product-images`, folder = product slug.
- `admins` table exists (for step 8). RLS: public read of published products / active variants.
- Derived on the site: card price = min active variant price, stock = sum of active variants, hidden if no active variant. Stock status: 0 out, 1-3 limited, more in stock (`src/lib/stock.ts`).

## Code map (src)
- `app/[locale]/`: `layout.tsx` (Header, main, Footer), `page.tsx` (home), `catalog/page.tsx`, `product/[slug]/page.tsx`.
- `components/ui`: Button (`Button`, `IconButton`, `btnClass(variant)` = ONE source of button look; variants primary/secondary/success/bare; `bare` = shape only, you add colors), LinkButton (Link with btnClass), Chip, Input, Quantity (number pops on click), StockBadge (props `status`, `label`), Section (`Container`, `SectionHead`, `SeeAllLink` blue pill), PageIntro (breadcrumb + title + chip + text, plus `Skeleton`), Select (custom dropdown, keyboard + outside click; replaces native select). `lib/cn.ts` is a plain class joiner, NOT tailwind-merge: two conflicting utilities on one element (e.g. `bg-canvas` + `bg-action`) are unpredictable, use conditional strings or `bare`.
- `components/layout`: Header (client, mobile menu), Footer, LocaleSwitcher. `components/home/*`: Hero, Categories, ProductSection, Editorial, Ordering (delivery, steps, FAQ with `<details>`).
- `components/catalog/CatalogForm.tsx`: one client `<form>`; filters/search/sort write to the URL (`q, cat, min, max, avail, color, sort`), server page re-renders. Mobile filters = full-screen sheet.
- `components/product`: ProductCard + ProductGrid, ProductGallery, ProductPurchase (variant, qty), ProductInfo (specs, box contents, WhatsApp question), ProductActions (FavoriteButton, CompareButton, ReplaceNotice, `useCompare`, AddToCartButton: all real now).
- `lib/catalog.ts` (`getProducts`, `getFeatured`, `getNew`), `lib/product.ts` (`getProduct`, `getRelated`), `lib/i18n-field.ts` (`pick(row, field, locale)`), `lib/whatsapp.ts` (`WA_URL`), `lib/supabase/server.ts` (`createClient`), `i18n/navigation.ts` (`Link`, `usePathname`, `useRouter`; always use these, not next/link).
- Step 6 files: pages `app/[locale]/{favorites,compare,cart,about}/page.tsx` are thin server pages (metadata) that render client views `components/{favorites/FavoritesView,compare/CompareView,cart/CartView}.tsx`. `components/layout/Toast.tsx` (global, mounted in `[locale]/layout.tsx`): "added to cart" with link, "removed" with Undo.
- Client state `lib/store.ts` (localStorage key `gp-store`, `useSyncExternalStore`): `{fav: productIds, cmp: productIds, cmpGroup, cart: [{id: variantId, qty}]}`. Hook `useStore()` returns state + `ready` (false on server/hydration, so pages show a Skeleton, not a false "empty"). Actions: toggleFav, toggleCompare(id, group) -> "ok"|"full"|"other", replaceCompare, removeCompare, addToCart, setQty, removeFromCart, restoreLine, announceRemoved. Events: `gp:added`, `gp:removed`.
- Data for those pages: server actions `lib/actions.ts` (`loadProducts(locale, ids)`, `loadCartLines(locale, ids)`) called through hook `lib/use-loaded.ts` (keeps the loader in a ref; passing an inline function used to refetch on every render). `lib/catalog.ts` `getProducts` accepts `ids`, `Product` has `variantId` (= cheapest variant, the one the card price belongs to) and `specs`; `getProductsByIds`. `lib/cart.ts` `getCartLines` (variants + product + main photo). `lib/money.ts` `money(n)` -> "1 120 AZN". `lib/use-flash.ts` `useFlash()` = true for 1.5 s (button "Added").
- `lib/categories.ts`: color filter (`COLOR_GROUPS`, `colorOf`), `SORTS`, type `Category`, helpers `groupName`, `groupSlugs`. The old hardcoded `CATEGORIES`, `compareGroup`, `groupCats` and messages `Categories.*` are gone.
- Messages: `messages/{az,ru,en}.json`, namespaces Nav, Footer, Categories, Colors, Stock, Product, Specs, Home, Catalog, Favorites, Compare, Cart, About (+ earlier ones). Always add keys to all three languages. RU/EN plural with ICU.
- Specs jsonb: key -> string or `{az,ru,en}`; labels and row order come from table `spec_types(key unique, label_az/ru/en, sort_order)` (migration `supabase/003_spec_types.sql`, 10 seeded keys). Server `lib/spec-data.ts` `getSpecTypes(locale)`, client `useSpecTypes()` (provider in the locale layout), helpers `specLabel`, `specOrder` in `lib/specs.ts`; unknown keys show as the key with spaces. Messages `Specs.*` are gone. `box` = box contents text; `color` used by the catalog color filter.

## Decisions
- Compare: max 3 products, only inside one category group (blades + accessories = one group). Adding a product from another group asks "replace the list?" (closes on outside click / Esc). Compare matrix: equal rows green (`ok-soft`), different rows cream, "only differences" switch; "Add product" opens the catalog filtered to the same group.
- Cart/favorites/compare need no login, live in the browser. Card "Səbətə" adds the cheapest variant (the one whose price is shown). Cart line quantity max = variant stock (10 when stock is 0 = on order). Header counters: favorites (red), cart = total units, compare.
- Cart page: steps 01 Səbət / 02 WhatsApp / 03 Təsdiq are static for now (step 1 active). Idea for step 7: after clicking order, step 02 becomes active; step 03 cannot be known by the site until orders reach the admin. The order button currently only opens the WhatsApp chat (`WA_URL`), no message text.
- Price filter stays Min/Max inputs (he declined slider and quick-range chips).
- Order = WhatsApp message (step 7). Product photos: folders by slug in Storage plus SQL insert into `product_images`.

## UI behavior rules (keep consistent, reuse, do not invent new ones)
- Buttons: `btnClass`. Hover: primary gets blue shadow, secondary turns blue; press = `active:scale-[0.97]`. Success state (green + check, 1.5 s) after "add to cart".
- Shared utilities in `globals.css` (`@utility`): `link-text`, `link-accent`, `tile-hover` (whole tile is a link), `photo-btn` (round button on a photo), `field-hover`; `.checkbox` (white check, blue). Motion tokens: `animate-bump|pop|heart|rise|drop`, all ease-in-out. Native hand cursor restored for buttons. `prefers-reduced-motion` disables keyframe animations only (hover transitions stay).
- Heart/favorite active = red (`danger`); compare active = blue. Product card: photo zooms on hover, name turns blue; card has heart + compare round buttons. Lists/cards appear with `animate-rise`; removing a cart line fades and collapses it, then Undo toast.
- Native `<select>` is not used any more; use `components/ui/Select`.

## Roadmap
0 setup, 1 DB, 2 i18n, 3 design system, 4 header/home/catalog, 5 product page, 6 favorites / compare / cart (+ hover and motion polish): **done**.
7 WhatsApp order (NEXT: build the message text from the cart lines: product name, variant, qty, line price, total, language of the page; open `WA_URL?text=`; decide cart step 02 behavior; no payment on site), 8 admin `/admin` (multi-photo upload, main photo), 9 SEO (metadata, sitemap, robots), 10 Playwright tests, 11 deploy (Vercel).

## Open items
Delete `src/app/proxy.ts` (duplicate of `src/proxy.ts`), `src/components/LanguageSwitcher.tsx`, `src/components/ui/KitPreview.tsx`. `/about` is a simple placeholder built only from facts already on the site (replace when he sends a design or text). Not yet in design/: Favorites, Compare, Cart screenshots; empty states, toast, ReplaceNotice, custom Select open state, switch ON state, header counters are NOT in Figma (added by Claude, he accepted). Compare on mobile with 3 products gets narrow. Other home blocks (accessories, help, delivery cards) have no hover effect yet (offered, he did not answer). Home marketing blocks (Boosted 390 AZN, iQ Perfetto 590 AZN) are static in messages. Remove "Nümunə kataloq" sample notice (Footer, product page) before launch. Catalog color filter reads `specs.color`. Price range slider in the design is replaced by Min/Max inputs.

## Step 7 and 8a (done 2026-10-18)
- Step 7: WhatsApp order from the cart works (text in the page language, `NEXT_PUBLIC_WHATSAPP` in `.env.local`).
- Step 8a = real catalog: 31 products / 53 variants / about 248 photos in Supabase, all published, stock 10, prices from `tools/products.csv`. Photos: bucket `product-images/<slug>/<color>-<n>.jpg` (common photos `<n>.jpg`). Delivered as zip `gamma-piu-step8-v7` (check it is in his commit).
- DB: `product_images.variant_id` (uuid, null = common photo, migration `supabase/001_variant_images.sql`). Constraint `one_main_image`: only ONE `is_main` per product, `sort_order` is sequential per product. `product_variants.image_path` is unused. Run photo SQL in the SQL Editor WITHOUT begin/commit (that showed Success but inserted 0 rows once).
- Code: `ProductMain.tsx` keeps the chosen variant; the gallery shows only that color's photos (else the common ones), arrows + scrolling thumbnails. Card and cart use the photo/price of the chosen variant. Color filter = 11 colors derived from the variant English name (`COLOR_GROUPS` / `colorOf` in `src/lib/categories.ts`); with a color filter the card shows that color's photo, price and stock. Category `irons` added. Photo frames are white with a border; round buttons on photos are soft blue (`bg-action-soft text-action`). Home tile "iQ Perfetto" uses `public/images/dryer-perfetto.png`.
- `tools/`: `products.csv` (UTF-8, `;`), `import_products.py` (`python tools/import_products.py F:\GammaPiu` -> `F:\GammaPiu_upload` + `1_products.sql` + `2_photos.sql`), `upload_photos.mjs` (`node --env-file=.env.local tools/upload_photos.mjs F:\GammaPiu_upload`, key only in env `SUPABASE_SERVICE_KEY`), `3_descriptions.sql` (RU/EN descriptions, check with him). `1_products.sql` WIPES all products (and his stock/price edits): never run it again. To add photos later: put them in the source folder, run the script, upload, run only `2_photos.sql`.
- Added variants not in his original CSV: hybrid-mini +Black; donna-keratin-glory Black/Gold/Golden rose/Lilac; x-hybrid-cordless Black/Golden rose (SKUs changed); glamour Green renamed Teal. No photos yet: megacosmo-2200, megacosmo-2500, donna-keratin, rainbow-antistatic, turbostar green. To confirm: clipper-shorty "fırçasız" (brushless) motor.
- Specs on the site are almost empty (labels exist for power, temperature, rpm, size, motor, battery_life, charge_time, blade_width, weight, use). Offer not yet answered: extract specs from the descriptions into one SQL.

## NEXT: step 8 admin (his requirement 2026-10-18)
He wants to add/edit product specs and add NEW CATEGORIES from the admin. Plan (his answers pending):
1. Categories from the DB instead of the hardcoded `CATEGORIES`, `Categories.*` messages and `compareGroup` in `src/lib/categories.ts`: use `categories.name_az/ru/en`, add `sort_order`, a hidden flag and `compare_group`. Filter, card, cart, compare, breadcrumbs read from the DB. Home tiles stay 6 fixed (grid-cols-6).
2. Table `spec_types` (key + label az/ru/en); values stay in `products.specs` (string or {az,ru,en}); compare rows align by key; labels fall back to messages `Specs.*`.
3. `/admin`: Supabase Auth + `admins` table; product list/form, variants, photos per color with a main photo, specs editor, categories section.
Do 1 and 2 first (no UI), then the admin. Ask him: Figma admin frame link (or build in the site style); should a new category get a home tile automatically (proposal: no, only in the catalog filter); a category with products can only be hidden, not deleted (proposal: yes).


## Admin (step 8, in progress)
- Done: part 1 categories from DB, part 2 spec_types, part 3 admin shell (login, menu, dashboard). Admin UI is Russian only (his decision), no language switch, no orders (orders live in WhatsApp, not in DB).
- `/admin` is its own root layout (`src/app/admin/layout.tsx`, no `/az` prefix). `src/proxy.ts` refreshes the Supabase session for `/admin*`, intl for the rest. Login `/admin/login` (email + password, Supabase Auth, server actions in `src/app/admin/actions.ts`). Pages inside `src/app/admin/(panel)/` are protected by `(panel)/layout.tsx` -> `requireAdmin()` (`lib/admin.ts`: logged in + `rpc('is_admin')`).
- DB (migration `supabase/004_admin.sql`): function `is_admin()` (table `admins` has ONE column `user_id uuid`), RLS on admins (no direct reads), policy "admin all" (read+write) on products, product_variants, product_images, categories, brands, spec_types. Visitors still see only published/active rows.
- Menu items live in `components/admin/AdminNav.tsx` (`ITEMS`): add a line when a page appears. Data helper `lib/admin-data.ts` `getAdminProducts(db)`. Admin reuses `Button`, `Input`, `StockBadge`.
- Dashboard (Figma 3:40670 desktop, 3:40856 mobile): kept metrics (catalog, unpublished, low stock), stock list with search (name or SKU) + pencil links, "Add product" button, "all catalog" link, WhatsApp and store settings cards. Left out on purpose: orders block + orders metric + menu item, language switch, bell, mobile menu icon (pills row replaces it).
- Step 4 done: `/admin/products` (list, search by name/SKU, filter chips by status and category), `/admin/products/new`, `/admin/products/[id]` (form `components/admin/ProductForm.tsx`: names az/ru/en, slug (editable only on create, it names the photo folder), category, brand, descriptions, flags published/new/featured, variants: sku, price, stock, names, active, add/delete). Server actions `app/admin/(panel)/products/actions.ts`: `saveProduct` (validates, update or insert, removed variants deleted, variants upserted by id, new product rolled back if variants fail), `deleteProduct` (deletes image rows, variants, product; Storage files stay). Every action calls `requireAdmin()` and RLS protects too. Form types and loaders in `lib/admin-data.ts` (`ProductFormData`, `getProductForm`, `getFormOptions`). Specs and photos are NOT touched by the form.
- NEXT: step 5 photos per color (upload to Storage bucket `product-images`, folder = product slug, main photo, delete files), 6 specs editor + categories section (deleting a category with products is allowed by his decision: delete products first, with a confirm), 7 mobile polish + cleanup.
