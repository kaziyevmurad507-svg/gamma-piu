"""Builds two SQL files from tools/products.csv and your photos folder.

Run:  python tools/import_products.py F:\\GammaPiu
Out:  <photos>_upload/   copy of your photos: folders renamed to product slugs, file names cleaned
                         -> upload THIS folder's contents to the Storage bucket
      tools/1_products.sql  (run ONCE: wipes old products, adds new ones)
      tools/2_photos.sql    (safe to run again any time you add photos)

Photo names inside each product folder:
  1.jpg 2.jpg          -> common photos (shown when the color has no own photos)
  black-1.jpg ...      -> photos of the variant whose English name is "Black"
                          (lowercase, spaces -> dashes: "Golden rose" -> golden-rose)
"""
import csv, json, re, shutil, sys
from pathlib import Path

HERE = Path(__file__).parent
PHOTOS = Path(sys.argv[1] if len(sys.argv) > 1 else "photos")
OUT = PHOTOS.parent / (PHOTOS.name + "_upload")
IMG = {".jpg", ".jpeg", ".png", ".webp"}

def q(v):  # SQL string literal (NULL for empty)
    v = (v or "").strip()
    return "NULL" if not v else "'" + v.replace("'", "''") + "'"

def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")

rows = list(csv.DictReader(open(HERE / "products.csv", encoding="utf-8-sig"), delimiter=";"))
products, order = {}, []
for r in rows:
    if r["slug"] not in products:
        products[r["slug"]] = {"head": r, "variants": []}
        order.append(r["slug"])
    products[r["slug"]]["variants"].append(r)

# Photo folder name (cleaned) -> product slug, only for folders whose name is not already the slug
FOLDER = {"gamma-glory-iv-infrared-vibrate": "gamma-glory-iv", "korner-xl-rainbow": "rainbow-g",
          "megacosmo-2200-w": "megacosmo-2200", "megacosmo-2500-w": "megacosmo-2500", "plasma-bactericidal": "plasma",
          "relax-power-ionic-2750-watt-light-silent": "relax", "xcell-s": "xcells", "xhorizon": "horizon", "xhybrid": "hybrid"}
# Other spellings of a color used in file names -> the color name used in the table
ALIAS = {"gold-rose": "golden-rose", "lilla": "lilac"}

CAT = {  # name_az, name_ru, name_en (inserted only if the category does not exist yet)
    "clippers": ("Saçqırxanlar", "Машинки для стрижки", "Clippers"),
    "trimmers": ("Trimmerlər", "Триммеры", "Trimmers"),
    "dryers": ("Fenlər", "Фены", "Hair dryers"),
    "irons": ("Saç düzləyiciləri və maşalar", "Утюжки и плойки", "Straighteners & curling irons"),
    "shavers": ("Ülgüclər", "Шейверы", "Shavers"),
    "accessories": ("Aksesuarlar", "Насадки и аксессуары", "Accessories"),
}

# ---------- 1_products.sql ----------
s = ["begin;", "-- WARNING: removes ALL old products, variants and photo records",
     "delete from product_images;", "delete from product_variants;", "delete from products;"]
for i, (c, (az, ru, en)) in enumerate(CAT.items()):
    s.append(f"insert into categories (slug, name_az, name_ru, name_en, sort_order) values ({q(c)}, {q(az)}, {q(ru)}, {q(en)}, {i}) on conflict (slug) do nothing;")
s.append("insert into brands (slug, name) select 'gamma-plus', 'Gamma+' where not exists (select 1 from brands where name = 'Gamma+');")
for slg in order:
    h = products[slg]["head"]
    specs = {k[5:]: h[k].strip() for k in h if k and k.startswith("spec_") and h[k].strip()}
    flag = lambda k: "true" if h[k].strip() == "1" else "false"
    s.append(
        "insert into products (category_id, brand_id, slug, name_az, name_ru, name_en, description_az, description_ru, description_en, specs, is_published, is_new, is_featured) values ("
        f"(select id from categories where slug = {q(h['category'])}), (select id from brands where name = {q(h['brand'])}), {q(slg)}, "
        f"{q(h['name_az'])}, {q(h['name_ru'])}, {q(h['name_en'])}, {q(h['description_az'])}, {q(h['description_ru'])}, {q(h['description_en'])}, "
        f"{q(json.dumps(specs, ensure_ascii=False))}::jsonb, true, {flag('is_new')}, {flag('is_featured')});")  # published = true for all
    for n, v in enumerate(products[slg]["variants"]):
        s.append(
            "insert into product_variants (product_id, sku, name_az, name_ru, name_en, price, stock, is_active, sort_order) values ("
            f"(select id from products where slug = {q(slg)}), {q(v['sku'])}, {q(v['variant_az'])}, {q(v['variant_ru'])}, {q(v['variant_en'])}, "
            f"{float(v['price'].replace(',', '.'))}, {int(v['stock'])}, true, {n});")
s.append("commit;")
(HERE / "1_products.sql").write_text("\n".join(s) + "\n", encoding="utf-8")

# ---------- 2_photos.sql ----------
folders = {}  # product slug -> folder
for d in sorted(PHOTOS.iterdir()) if PHOTOS.is_dir() else []:
    if d.is_dir():
        key = slug(d.name)
        key = key if key in products else FOLDER.get(key)
        if key: folders[key] = d
        else: print(f"WARNING folder '{d.name}' matches no product, skipped")

p = ["delete from product_images;"]  # no begin/commit: the last select below shows the result right away
count, no_photo, partial = 0, [], []
for slg in order:
    vmap = {slug(v["variant_en"]): v["sku"] for v in products[slg]["variants"] if v["variant_en"]}
    found, seen = [], set()  # (group, number, file)
    for f in sorted(folders[slg].iterdir()) if slg in folders else []:
        stem = re.sub(r"\s*\(\d+\)$", "", f.stem.strip().lower())  # "gold-1 (1)" -> "gold-1"
        m = re.fullmatch(r"(?:(.+?)\s*-\s*)?(\d+)", stem.replace(" ", "-"))
        if f.suffix.lower() not in IMG or not m:
            continue
        grp = ALIAS.get(m.group(1), m.group(1))
        if grp and grp not in vmap:
            print(f"WARNING {slg}/{f.name}: no variant named '{grp}' (have: {', '.join(vmap) or 'none'}), skipped")
            continue
        if (grp, int(m.group(2))) in seen:
            print(f"WARNING {slg}/{f.name}: same number already used, skipped"); continue
        seen.add((grp, int(m.group(2)))); found.append((grp, int(m.group(2)), f))
    if not found:
        no_photo.append(slg)
    elif len(vmap) > 1:
        miss = [c for c in vmap if not any(g == c for g, _, _ in found)]
        if miss: partial.append(f"{slg}: {', '.join(miss)}")
    # common photos first, then colors in table order; the DB allows only ONE main photo per product
    rank = {None: 0, **{c: i + 1 for i, c in enumerate(vmap)}}
    found.sort(key=lambda x: (rank[x[0]], x[1]))
    for n, (grp, num, f) in enumerate(found, 1):  # n = unique sort_order inside the product, n == 1 is the main photo
        name = (f"{grp}-{num}" if grp else str(num)) + f.suffix.lower()
        (OUT / slg).mkdir(parents=True, exist_ok=True); shutil.copy2(f, OUT / slg / name)
        var = f"(select id from product_variants where sku = {q(vmap[grp])})" if grp else "NULL"
        p.append("insert into product_images (product_id, variant_id, path, sort_order, is_main) values ("
                 f"(select id from products where slug = {q(slg)}), {var}, {q(slg + '/' + name)}, {n}, {'true' if n == 1 else 'false'});")
        count += 1
p.append("select count(*) as images, count(variant_id) as color_images from product_images;")
(HERE / "2_photos.sql").write_text("\n".join(p) + "\n", encoding="utf-8")

print(f"{len(order)} products, {len(rows)} variants, {count} photos -> upload folder: {OUT}")
print("Products without any photos:", ", ".join(no_photo) or "none")
print("Colors without own photos:", "; ".join(partial) or "none")
