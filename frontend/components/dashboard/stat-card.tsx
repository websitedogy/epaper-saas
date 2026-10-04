import { ArrowUpRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type StatCardProps = {
  title: string;
  value: string;
  trend?: string;
  accent?: string;
  active?: boolean;
  onClick?: () => void;
};

export function StatCard({
  title,
  value,
  trend,
  accent = "bg-sky-50 text-sky-700",
  active = false,
  onClick,
}: StatCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full rounded-xl border text-left transition-all duration-200",
        active ? "border-slate-900 bg-slate-900 text-white shadow-md" : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm",
      ].join(" ")}
    >
      <Card className="border-0 bg-transparent shadow-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className={active ? "text-sm font-medium text-slate-100" : "text-sm font-medium text-slate-500"}>{title}</CardTitle>
          <div className={`rounded-md p-2 ${active ? "bg-white/10 text-white" : accent}`}>
            <ArrowUpRight className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className={active ? "text-3xl font-semibold text-white" : "text-3xl font-semibold text-slate-900"}>{value}</div>
          {trend ? <p className={active ? "mt-2 text-xs text-slate-200" : "mt-2 text-xs text-slate-500"}>{trend}</p> : null}
        </CardContent>
      </Card>
    </button>
  );
}
