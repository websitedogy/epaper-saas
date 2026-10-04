"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Bot, FileText, FolderPlus, Layers3, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiFetch } from "@/lib/api";
import { editionStatusLabel } from "@/lib/editions";

type TenantProfile = {
  name: string;
  customer?: {
    name: string;
    domain_name: string | null;
    paper_name: string | null;
  };
};

const statDefinitions = [
  { key: "categories", label: "Categories", icon: FolderPlus },
  { key: "sub_categories", label: "Sub Categories", icon: Layers3 },
  { key: "editions", label: "Editions", icon: FileText },
  { key: "ai_tasks", label: "AI tasks", icon: Bot },
] as const;

type DashboardData = {
  stats: {
    categories: number;
    sub_categories: number;
    editions: number;
    published_editions?: number;
    pending_editions?: number;
    ai_tasks: number;
    ai_tasks_pending: number;
  };
  recent_editions: Array<{
    id: string;
    name: string;
    slug?: string;
    category: string | null;
    status: string;
    date: string | null;
  }>;
};

export default function TenantAdminDashboardPage() {
  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  useEffect(() => {
    void apiFetch<{ data: TenantProfile }>("/api/v1/auth/me")
      .then((response) => setProfile(response.data))
      .catch(() => undefined);
    void apiFetch<{ data: DashboardData }>("/api/v1/customer/dashboard")
      .then((response) => setDashboard(response.data))
      .catch(() => undefined);
  }, []);

  const tenantName = profile?.customer?.name ?? profile?.name ?? "Tenant";
  const tenantDomain = profile?.customer?.domain_name ?? profile?.customer?.paper_name;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Welcome, {tenantName}</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">{tenantDomain ?? "Tenant Admin Dashboard"}</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your ePaper publishing operations.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/tenant-admin/edition-upload">
            <Button>Upload edition</Button>
          </Link>
          <Link href="/tenant-admin/ai-agent">
            <Button variant="secondary">Launch AI agent</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statDefinitions.map(({ key, label, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">{label}</CardTitle>
              <div className="rounded-lg bg-sky-100 p-2 text-sky-700">
                <Icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-slate-900">{dashboard?.stats[key] ?? 0}</div>
              <p className="mt-2 text-xs text-slate-500">
                {key === "ai_tasks" ? `${dashboard?.stats.ai_tasks_pending ?? 0} pending` : "Live total"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Recent edition activity</CardTitle>
            <CardDescription>Latest publications and workflow updates.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Edition</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboard?.recent_editions.length ? dashboard.recent_editions.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-slate-900">{item.name}</TableCell>
                    <TableCell>{item.category ?? "-"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.status === "published"
                            ? "success"
                            : item.status === "failed"
                              ? "danger"
                              : item.status === "completed"
                                ? "info"
                                : "warning"
                        }
                      >
                        {editionStatusLabel(item.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500">{item.date}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-slate-500">No editions uploaded yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Keep publishing flow moving.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/tenant-admin/category" className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:bg-slate-100">
              <span>
                <p className="font-medium text-slate-900">Create category</p>
                <p className="text-sm text-slate-500">Organize publication groups</p>
              </span>
              <ArrowRight className="h-4 w-4 text-slate-500" />
            </Link>

            <Link href="/tenant-admin/sub-category" className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:bg-slate-100">
              <span>
                <p className="font-medium text-slate-900">Add sub category</p>
                <p className="text-sm text-slate-500">Break down content segments</p>
              </span>
              <ArrowRight className="h-4 w-4 text-slate-500" />
            </Link>

            <Link href="/tenant-admin/editions" className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:bg-slate-100">
              <span>
                <p className="font-medium text-slate-900">Extract and publish</p>
                <p className="text-sm text-slate-500">Turn uploaded PDFs into live editions</p>
              </span>
              <ArrowRight className="h-4 w-4 text-slate-500" />
            </Link>
            <Link href="/tenant-admin/ai-agent" className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:bg-slate-100">
              <span>
                <p className="font-medium text-slate-900">Request AI summary</p>
                <p className="text-sm text-slate-500">Generate editorial briefs</p>
              </span>
              <Sparkles className="h-4 w-4 text-sky-600" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
