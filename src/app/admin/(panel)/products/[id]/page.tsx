import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { requireAdmin } from "@/lib/admin";
import { getFormOptions, getProductForm } from "@/lib/admin-data";

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { db } = await requireAdmin();
  const { id } = await params;
  const [product, { categories, brands }] = await Promise.all([getProductForm(db, id), getFormOptions(db)]);
  if (!product) notFound();
  return (
    <>
      <h1 className="text-[34px] font-semibold leading-[1.1] lg:text-[42px]">{product.name_az}</h1>
      <ProductForm initial={product} categories={categories} brands={brands} />
    </>
  );
}
