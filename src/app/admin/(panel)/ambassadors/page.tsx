import { AmbassadorsForm } from "@/components/admin/AmbassadorsForm";
import { requireAdmin } from "@/lib/admin";
import { getAmbassadorRows } from "@/lib/admin-data";

export default async function Ambassadors() {
  const { db } = await requireAdmin();
  return (
    <>
      <div className="flex flex-col gap-2.5">
        <h1 className="text-[34px] font-semibold leading-[1.1] lg:text-[42px]">Амбассадоры</h1>
        <p className="max-w-[640px] text-[13px] text-muted">Блок на главной странице: фото, имя, подпись (город или роль) и Instagram. Порядок здесь = порядок на сайте. Если ни один амбассадор не показан, блок на главной не появляется.</p>
      </div>
      <AmbassadorsForm initial={await getAmbassadorRows(db)} />
    </>
  );
}
