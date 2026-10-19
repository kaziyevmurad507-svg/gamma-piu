import { CategoriesForm } from "@/components/admin/CategoriesForm";
import { requireAdmin } from "@/lib/admin";
import { getCategoryRows } from "@/lib/admin-data";

export default async function Categories() {
  const { db } = await requireAdmin();
  return (
    <>
      <div className="flex flex-col gap-2.5">
        <h1 className="text-[34px] font-semibold leading-[1.1] lg:text-[42px]">Категории</h1>
        <p className="max-w-[640px] text-[13px] text-muted">Названия, порядок в фильтре каталога и группы сравнения (например, насадки сравниваются вместе с ножами). Скрытая категория пропадает из каталога вместе со своими товарами. Новая категория появляется в фильтре каталога, на главной плитки не добавляются.</p>
      </div>
      <CategoriesForm initial={await getCategoryRows(db)} />
    </>
  );
}
