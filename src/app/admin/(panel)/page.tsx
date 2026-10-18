import Image from "next/image";
import Link from "next/link";
import { AlertCircle, MessageCircle, Package, PackageX, Pencil, Plus, Search } from "lucide-react";
import { btnClass } from "@/components/ui/Button";
import { StockBadge } from "@/components/ui/StockBadge";
import { requireAdmin } from "@/lib/admin";
import { getAdminProducts } from "@/lib/admin-data";
import { money } from "@/lib/money";

const STOCK_LABEL = { in_stock: "В наличии", limited: "Мало", out: "Нет в наличии" } as const;
const SHOWN = 4; // rows in the stock list
const card = "flex items-center gap-4 rounded-card p-6 lg:flex-col lg:items-start lg:justify-center";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { db } = await requireAdmin();
  const q = ((await searchParams).q ?? "").trim().toLowerCase().slice(0, 80);
  const all = await getAdminProducts(db);

  const hidden = all.filter((p) => !p.published).length;
  const low = all.filter((p) => p.published && p.variants > 0 && p.status !== "in_stock");
  const found = q ? all.filter((p) => p.name.toLowerCase().includes(q) || p.skus.some((s) => s.includes(q))) : all;
  const date = new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Baku" });
  const wa = process.env.NEXT_PUBLIC_WHATSAPP;

  return (
    <>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
        <div className="flex flex-col gap-2.5 lg:flex-1">
          <h1 className="text-[34px] font-semibold leading-[1.1] lg:text-[42px]">Обзор магазина.</h1>
          <p className="text-[13px] text-muted">{date}</p>
        </div>
        <Link href="/admin/products/new" className={btnClass()}><Plus size={20} />Добавить товар</Link>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className={`${card} bg-media lg:flex-1`}>
          <div className="flex flex-1 flex-col gap-2 lg:w-full lg:flex-none">
            <p className="text-[13px] text-muted">Каталог</p>
            <p className="text-4xl font-semibold">{all.length}</p>
            <p className="text-xs text-muted">Опубликовано: {all.length - hidden}</p>
          </div>
          <Package size={24} className="text-action" />
        </div>
        <div className={`${card} bg-media lg:flex-1`}>
          <div className="flex flex-1 flex-col gap-2 lg:w-full lg:flex-none">
            <p className="text-[13px] text-muted">Не опубликовано</p>
            <p className="text-4xl font-semibold">{hidden}</p>
            <p className="text-xs text-muted">{hidden ? "Скрыты на сайте" : "Все товары на сайте"}</p>
          </div>
          <PackageX size={24} className="text-action" />
        </div>
        <div className={`${card} bg-cream lg:flex-1`}>
          <div className="flex flex-1 flex-col gap-2 lg:w-full lg:flex-none">
            <p className="text-[13px] text-muted">Мало на складе</p>
            <p className="text-4xl font-semibold">{low.length}</p>
            <p className="text-xs text-muted">
              {low.length
                ? `${low[0].name} · ${low[0].stock ? `осталось ${low[0].stock}` : "нет в наличии"}${low.length > 1 ? ` и ещё ${low.length - 1}` : ""}`
                : "Всё в порядке"}
            </p>
          </div>
          <AlertCircle size={24} className="text-action" />
        </div>
      </div>

      <section className="flex flex-col gap-5 rounded-bento bg-media p-5 lg:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <h2 className="text-[25px] font-medium lg:flex-1">Товары и склад</h2>
          <form className="flex h-[52px] items-center gap-2.5 rounded-card border border-line bg-canvas px-[18px] transition-colors focus-within:border-action lg:w-80">
            <Search size={20} className="shrink-0 text-muted" />
            <input name="q" defaultValue={q} placeholder="Название или SKU" aria-label="Поиск по товарам" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted" />
          </form>
        </div>

        {found.slice(0, SHOWN).map((p) => (
          <div key={p.id} className="flex flex-col gap-3 border-b border-line py-3 lg:flex-row lg:items-center">
            <div className="flex min-w-0 items-center gap-3.5 lg:flex-1">
              <div className="relative h-16 w-[62px] shrink-0 overflow-hidden rounded-panel bg-media">
                {p.image && <Image src={p.image} alt="" fill sizes="62px" className="object-contain p-2" />}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Link href={`/admin/products/${p.id}`} className="text-sm font-medium hover:text-action">{p.name}</Link>
                <p className="text-[11px] text-muted">{p.category} · вариантов: {p.variants}{!p.published && " · не опубликован"}</p>
              </div>
            </div>
            <div className="flex items-center justify-between lg:w-[430px]">
              <p className="text-sm">{p.price === null ? "—" : money(p.price)}</p>
              <p className="text-xs text-muted">{p.stock} шт.</p>
              <StockBadge status={p.status} label={STOCK_LABEL[p.status]} />
              <Link href={`/admin/products/${p.id}`} aria-label={`Изменить: ${p.name}`} className="text-action transition-opacity hover:opacity-70"><Pencil size={18} /></Link>
            </div>
          </div>
        ))}
        {!found.length && <p className="py-6 text-center text-sm text-muted">Ничего не найдено</p>}
        <p className="text-xs text-muted">Показано {Math.min(SHOWN, found.length)} из {found.length}{q && ` (всего товаров: ${all.length})`} · <Link href="/admin/products" className="text-action">Весь каталог →</Link></p>
      </section>

      <div className="flex flex-col gap-5 lg:flex-row">
        <div className="flex flex-col gap-3 rounded-card bg-cream p-6 lg:flex-1">
          <p className="flex items-center gap-2.5 text-[17px] font-medium"><MessageCircle size={20} />Интеграция с WhatsApp</p>
          <p className="text-[13px] text-muted">
            {wa ? `Заказы из корзины приходят в чат WhatsApp: +${wa}.` : "Номер не задан. Добавьте NEXT_PUBLIC_WHATSAPP в .env.local (только цифры, 994...), иначе кнопка заказа не заработает."}
          </p>
        </div>
        <div className="flex flex-col gap-3 rounded-card bg-lavender p-6 lg:flex-1">
          <p className="text-[17px] font-medium">Настройки магазина</p>
          <p className="text-[13px]">Доставка по Баку · 0 AZN</p>
          <p className="text-[13px]">Основной язык · Azərbaycanca</p>
          <p className="text-xs text-muted">Другие языки: Русский / English</p>
        </div>
      </div>
    </>
  );
}
