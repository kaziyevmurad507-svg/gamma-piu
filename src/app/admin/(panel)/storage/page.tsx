import { requireAdmin } from "@/lib/admin";
import { btnClass } from "@/components/ui/Button";
import { retryStorageCleanup } from "./actions";

export default async function StorageCleanup({ searchParams }: { searchParams: Promise<{ removed?: string; pending?: string }> }) {
  const { db } = await requireAdmin();
  const { data, error, count } = await db.from("storage_cleanup_queue")
    .select("path, attempts, last_error", { count: "exact" }).order("created_at").limit(100);
  const params = await searchParams;
  const removed = Number(params.removed);
  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <h1 className="text-3xl font-semibold">Очистка фотографий</h1>
      <p className="text-sm text-muted">Здесь только фотографии из удалённых или заменённых записей. Файлы, на которые ещё ссылается каталог, сохраняются. Повторная попытка обрабатывает до 100 файлов.</p>
      {params.removed !== undefined && Number.isInteger(removed) && removed >= 0 && removed <= 100 && (
        <p role="status" className="rounded-card bg-media p-4 text-sm">
          Удалено файлов: {removed}.{params.pending === "1" ? " В очереди остались файлы. Используемые фотографии будут сохранены." : " Обработка завершена."}
        </p>
      )}
      {error ? <p role="alert" className="text-danger">Не удалось прочитать очередь. Файлы сохранены; попробуйте обновить страницу.</p> : (
        <>
          <p className="text-sm">В очереди: {count ?? 0}</p>
          <form action={retryStorageCleanup}>
            <button type="submit" className={btnClass()} disabled={!data?.length}>Повторить очистку</button>
          </form>
          <ul className="flex flex-col divide-y divide-line rounded-card border border-line px-4">
            {data?.map((row) => <li key={row.path} className="py-3 text-sm">
              <p className="break-all">{row.path}</p>
              <p className="text-muted">Попыток с ошибкой: {row.attempts}</p>
              {row.last_error && <p className="break-words text-danger">{row.last_error}</p>}
            </li>)}
          </ul>
        </>
      )}
    </div>
  );
}
