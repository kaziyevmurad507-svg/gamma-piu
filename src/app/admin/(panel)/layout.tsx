import Link from "next/link";
import { AdminCrumb, AdminNav } from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/admin";
import { signOut } from "../actions";

// Every admin page except the login: checks the user, draws menu and top bar
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const links = (
    <>
      <Link href="/az" className="text-action">Открыть сайт ↗</Link>
      <form action={signOut}><button type="submit" className="text-muted transition-colors hover:text-action">Выйти →</button></form>
    </>
  );
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="hidden w-56 shrink-0 flex-col gap-9 border-r border-line p-7 lg:flex">
        <div className="flex flex-col gap-1.5">
          <p className="text-2xl">gamma piu</p>
          <p className="text-[10px] text-muted">УПРАВЛЕНИЕ МАГАЗИНОМ</p>
        </div>
        <AdminNav />
        <div className="flex flex-col items-start gap-4 pt-10 text-xs">{links}</div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col gap-7 p-5 lg:p-10">
        <header className="flex items-center justify-between">
          <p className="text-xl font-bold lg:hidden">gamma piu / admin</p>
          <AdminCrumb />
          <span className="grid size-9 place-items-center rounded-full bg-lavender text-xs font-semibold">GP</span>
        </header>
        <div className="lg:hidden"><AdminNav /></div>
        {children}
        <footer className="flex flex-col gap-4">
          <div className="flex gap-5 text-xs lg:hidden">{links}</div>
          <p className="text-[11px] text-muted">Gamma Piu Baku · Управление магазином · AZN</p>
        </footer>
      </div>
    </div>
  );
}
