import { ProductForm } from "@/components/admin/ProductForm";
import { requireAdmin } from "@/lib/admin";
import { emptyProduct, getFormOptions } from "@/lib/admin-data";

export default async function NewProduct() {
  const { db } = await requireAdmin();
  const { categories, brands, specTypes } = await getFormOptions(db);
  return (
    <>
      <h1 className="text-[34px] font-semibold leading-[1.1] lg:text-[42px]">Новый товар</h1>
      <ProductForm initial={emptyProduct} categories={categories} brands={brands} specTypes={specTypes} />
    </>
  );
}
