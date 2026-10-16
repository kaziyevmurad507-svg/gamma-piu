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
- `categories(id, parent_id, slug unique, name_az/ru/en, sort_order)`; fixed slugs used in code: clippers, trimmers, dryers, scissors, shavers, blades, accessories (`src/lib/categories.ts`, names in messages `Categories.*`).
- `brands(id, slug, name)`.
- `products(id, category_id, brand_id, slug unique, name_*, description_*, specs jsonb, is_published, is_new, is_featured, created_at, updated_at)`. No price/stock on products.
- `product_variants(id, product_id, sku unique, name_*, price numeric, stock int, is_active, image_path, sort_order)`: variants are the options (color etc.); price/stock live here.
- `product_images(id, product_id, path, sort_order, is_main)`; files in public Storage bucket `product-images`, folder = product slug.
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
- `lib/categories.ts`: `compareGroup(cat)` (accessories -> blades) and `groupCats(group)`.
- Messages: `messages/{az,ru,en}.json`, namespaces Nav, Footer, Categories, Colors, Stock, Product, Specs, Home, Catalog, Favorites, Compare, Cart, About (+ earlier ones). Always add keys to all three languages. RU/EN plural with ICU.
- Specs jsonb: key -> string or `{az,ru,en}`; labels from `Specs.<key>`; `box` = box contents text; `color` used by catalog color filter.

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
0 setup, 1 DB, 2 i18n, 3 design system, 4 header/home/catalog, 5 product page, 6 favorites / compare / cart (+ hover and motion polish): **done** (pending his push of the last zip `step6-complete`).
7 WhatsApp order (NEXT: build the message text from the cart lines: product name, variant, qty, line price, total, language of the page; open `WA_URL?text=`; decide cart step 02 behavior; no payment on site), 8 admin `/admin` (multi-photo upload, main photo), 9 SEO (metadata, sitemap, robots), 10 Playwright tests, 11 deploy (Vercel).

## Open items
Delete `src/app/proxy.ts` (duplicate of `src/proxy.ts`), `src/components/LanguageSwitcher.tsx`, `src/components/ui/KitPreview.tsx`. `/about` is a simple placeholder built only from facts already on the site (replace when he sends a design or text). Not yet in design/: Favorites, Compare, Cart screenshots; empty states, toast, ReplaceNotice, custom Select open state, switch ON state, header counters are NOT in Figma (added by Claude, he accepted). Compare on mobile with 3 products gets narrow. Other home blocks (accessories, help, delivery cards) have no hover effect yet (offered, he did not answer). Home marketing blocks (Boosted 390 AZN, iQ Perfetto 590 AZN) are static in messages. Remove "Nümunə kataloq" sample notice (Footer, product page) before launch. Catalog color filter reads `specs.color`. Price range slider in the design is replaced by Min/Max inputs.
