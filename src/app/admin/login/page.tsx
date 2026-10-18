import { LoginForm } from "./LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { e } = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center p-5">
      <div className="flex w-full max-w-[400px] flex-col gap-8 rounded-bento border border-line p-8">
        <div className="flex flex-col gap-1.5">
          <p className="text-2xl">gamma piu</p>
          <p className="text-[10px] text-muted">УПРАВЛЕНИЕ МАГАЗИНОМ</p>
        </div>
        <LoginForm notice={e === "denied" ? "У этого аккаунта нет доступа к админке" : undefined} />
      </div>
    </main>
  );
}
