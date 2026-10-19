import Image from "next/image";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { AdminSearch } from "@/components/admin/AdminSearch";
import { btnClass } from "@/components/ui/Button";
import { StockBadge } from "@/components/ui/StockBadge";
import { requireAdmin } from "@/lib/admin";
import { getAdminProducts } from "@/lib/admin-data";
import { getCategories } from "@/lib/category-data";
import { cn } from "@/lib/cn";
import { money } from "@/lib/money";

const STOCK_LABEL = { in_stock: "В наличии", limited: "Мало", out: "Нет в наличии" } as const;
const STATUS = [["", "Все"], ["pub", "На сайте"], ["hid", "Скрытые"]] as const;
type Params = { q?: string; cat?: string; st?: string };

export default async function Products({ searchParams }: { searchParams: Promise<Params> }) {
  const { db } = await requireAdmin();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().toLowerCase().slice(0, 80);
  const [all, cats] = await Promise.all([getAdminProducts(db), getCategories("ru")]);

  const list = all.filter((p) =>
    (!q || p.name.toLowerCase().includes(q) || p.skus.some((s) => s.includes(q))) &&
    (!sp.cat || p.categorySlug === sp.cat) &&
    (sp.st === "pub" ? p.published : sp.st === "hid" ? !p.published : true));

  // Link that changes one filter and keeps the others
  const href = (patch: Params) => {
    const next = new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as [string, string][]);
    return `/admin/products${next.size ? `?${next}` : ""}`;
  };
  const chip = (on: boolean) => cn("flex h-11 shrink-0 items-center rounded-full px-4 text-[13px] transition-colors", on ? "bg-action-soft font-semibold text-action" : "bg-media hover:bg-action-soft hover:text-action");

  return (
    <>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
        <h1 className="text-[34px] font-semibold leading-[1.1] lg:flex-1 lg:text-[42px]">Товары</h1>
        <Link href="/admin/products/new" className={btnClass()}><Plus size={20} />Добавить товар</Link>
      </div>

      <AdminSearch className="lg:max-w-md" />

      <div className="flex flex-col gap-2">
        <div className="flex gap-2 overflow-x-auto">
          {STATUS.map(([v, label]) => <Link key={v} href={href({ st: v })} className={chip((sp.st ?? "") === v)}>{label}</Link>)}
        </div>
        <div className="flex gap-2 overflow-x-auto">
          <Link href={href({ cat: "" })} className={chip(!sp.cat)}>Все категории</Link>
          {cats.map((c) => <Link key={c.slug} href={href({ cat: c.slug })} className={chip(sp.cat === c.slug)}>{c.name}</Link>)}
        </div>
      </div>

      <section className="flex flex-col rounded-bento bg-media p-5 lg:p-7">
        {list.map((p) => (
          <div key={p.id} className="flex flex-col gap-3 border-b border-line py-3 last:border-b-0 lg:flex-row lg:items-center">
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
        {!list.length && <p className="py-6 text-center text-sm text-muted">Ничего не найдено</p>}
        <p className="pt-4 text-xs text-muted">Показано {list.length} из {all.length}</p>
      </section>
    </>
  );
}
