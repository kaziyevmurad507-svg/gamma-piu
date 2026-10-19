import { notFound } from "next/navigation";
import { PhotoManager } from "@/components/admin/PhotoManager";
import { ProductForm } from "@/components/admin/ProductForm";
import { requireAdmin } from "@/lib/admin";
import { getFormOptions, getProductForm, getProductImages } from "@/lib/admin-data";

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { db } = await requireAdmin();
  const { id } = await params;
  const [product, { categories, brands }, images] = await Promise.all([getProductForm(db, id), getFormOptions(db), getProductImages(db, id)]);
  if (!product) notFound();
  return (
    <>
      <h1 className="text-[34px] font-semibold leading-[1.1] lg:text-[42px]">{product.name_az}</h1>
      <ProductForm initial={product} categories={categories} brands={brands} />
      <PhotoManager productId={product.id!} slug={product.slug} images={images}
        groups={[{ id: null, label: "Общие фото", file: "common" }, ...product.variants.map((v) => ({ id: v.id, label: v.name_ru || v.name_az || v.sku, file: v.sku }))]} />
    </>
  );
}
