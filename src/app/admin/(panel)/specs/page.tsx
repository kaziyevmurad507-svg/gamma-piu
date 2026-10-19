import { SpecTypesForm } from "@/components/admin/SpecTypesForm";
import { requireAdmin } from "@/lib/admin";
import { getSpecTypeRows } from "@/lib/admin-data";

export default async function Specs() {
  const { db } = await requireAdmin();
  return (
    <>
      <div className="flex flex-col gap-2.5">
        <h1 className="text-[34px] font-semibold leading-[1.1] lg:text-[42px]">Характеристики</h1>
        <p className="max-w-[640px] text-[13px] text-muted">Типы характеристик (мощность, температура…): названия на трёх языках и порядок строк в сравнении. Значения для каждого товара задаются в форме товара.</p>
      </div>
      <SpecTypesForm initial={await getSpecTypeRows(db)} />
    </>
  );
}
