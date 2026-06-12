import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, StarOff, FileBarChart, Clock } from "lucide-react";
import { REPORTS, getReport } from "@/lib/reports/registry";
import { useSavedReports, getRecentReports, getFavoriteReports, toggleFavoriteReport } from "@/hooks/reports";

export default function ReportsHub() {
  const [q, setQ] = useState("");
  const [favs, setFavs] = useState<string[]>(() => getFavoriteReports());
  const recents = getRecentReports();
  const { data: saved = [] } = useSavedReports();

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return REPORTS.filter((r) => !term || r.title.toLowerCase().includes(term) || r.module.toLowerCase().includes(term) || r.description.toLowerCase().includes(term));
  }, [q]);

  const grouped = useMemo(() => {
    const m = new Map<string, typeof REPORTS>();
    filtered.forEach((r) => {
      const arr = m.get(r.module) || [];
      arr.push(r); m.set(r.module, arr);
    });
    return Array.from(m.entries());
  }, [filtered]);

  const onToggleFav = (k: string) => setFavs(toggleFavoriteReport(k));

  const ReportTile = ({ k }: { k: string }) => {
    const r = getReport(k);
    if (!r) return null;
    const isFav = favs.includes(k);
    return (
      <Card className="hover:bg-accent/40 transition-colors">
        <CardContent className="p-4 flex gap-3 items-start">
          <Link to={`${r.modulePath}/reports/${r.key}`} className="flex gap-3 items-start flex-1 min-w-0">
            <div className="rounded-md bg-primary/10 text-primary p-2 shrink-0"><FileBarChart className="h-5 w-5" /></div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium truncate">{r.title}</h3>
                <Badge variant="secondary" className="text-[10px]">{r.module}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.description}</p>
            </div>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => onToggleFav(k)} aria-label="Toggle favorite">
            {isFav ? <Star className="h-4 w-4 fill-current text-yellow-500" /> : <StarOff className="h-4 w-4 text-muted-foreground" />}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <AppLayout title="Reports" subtitle="Hub">
      <div className="p-3 md:p-6 space-y-6 max-w-7xl mx-auto">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Reports Hub</h1>
          <p className="text-sm text-muted-foreground">All reports across modules. Filter with search, favorite the ones you use often.</p>
          <Input placeholder="Search reports…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-md" />
        </div>

        {saved.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Saved configurations</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {saved.slice(0, 6).map((s) => {
                const r = getReport(s.report_key);
                return r ? (
                  <Link key={s.id} to={`${r.modulePath}/reports/${r.key}`}>
                    <Card className="hover:bg-accent/40 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2"><h3 className="font-medium truncate">{s.name}</h3></div>
                        <p className="text-xs text-muted-foreground mt-1 truncate">{r.title} — {r.module}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ) : null;
              })}
            </div>
          </section>
        )}

        {favs.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Favorites</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {favs.map((k) => <ReportTile key={k} k={k} />)}
            </div>
          </section>
        )}

        {recents.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide flex items-center gap-2"><Clock className="h-4 w-4" />Recent</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recents.slice(0, 6).map((k) => <ReportTile key={k} k={k} />)}
            </div>
          </section>
        )}

        {grouped.map(([module, items]) => (
          <section key={module}>
            <h2 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">{module}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((r) => <ReportTile key={r.key} k={r.key} />)}
            </div>
          </section>
        ))}
      </div>
    </AppLayout>
  );
}