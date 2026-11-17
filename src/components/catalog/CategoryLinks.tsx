import { Link } from "@/i18n/navigation";
import type { Category } from "@/lib/categories";

export function CategoryLinks({ categories, title, current }: { categories: Category[]; title: string; current?: string }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      <nav aria-label={title} className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Link key={category.slug} href={`/catalog/${category.slug}`} aria-current={category.slug === current ? "page" : undefined}
            className={`rounded-full border px-4 py-3 text-sm transition-colors ${category.slug === current ? "border-action bg-action-soft font-semibold text-action" : "border-line hover:border-action hover:text-action"}`}>
            {category.name}
          </Link>
        ))}
      </nav>
    </section>
  );
}
