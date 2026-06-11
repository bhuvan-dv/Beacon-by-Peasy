import { Dashboard } from "@/components/Dashboard";
import { BRAND_NAME, HANS_KOMBUCHA_INVENTORY } from "@/lib/inventory";

/**
 * Server component. All interactivity lives in <Dashboard>; this shell just
 * renders the top bar and hands the (static) inventory to the client.
 */
export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex h-16 max-w-[1100px] items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
              <span className="text-lg font-semibold tracking-tight text-slate-900">
                Peasy
              </span>
            </div>
            <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
              Beacon
            </span>
          </div>
          <span className="text-sm font-medium text-slate-600">
            {BRAND_NAME}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] px-4 py-8">
        <Dashboard items={HANS_KOMBUCHA_INVENTORY} />
      </main>
    </div>
  );
}
