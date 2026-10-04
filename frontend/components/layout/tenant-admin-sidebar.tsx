"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  ChevronDown,
  Database,
  FileText,
  FolderTree,
  LayoutDashboard,
  Sparkles,
  UploadCloud,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/tenant-admin", icon: LayoutDashboard },
  { label: "Category", href: "/tenant-admin/category", icon: FolderTree },
  { label: "Sub Category", href: "/tenant-admin/sub-category", icon: Database },
  { label: "Edition Upload", href: "/tenant-admin/edition-upload", icon: UploadCloud },
  { label: "All Editions History", href: "/tenant-admin/editions", icon: FileText },
  { label: "AI Agent", href: "/tenant-admin/ai-agent", icon: Sparkles },
];

type SidebarProps = {
  mobileOpen?: boolean;
  onToggle?: () => void;
  tenant?: {
    name: string;
    domain: string;
  };
};

export function TenantSidebar({ mobileOpen = false, onToggle, tenant }: SidebarProps) {
  const [expanded, setExpanded] = useState(true);
  const sidebarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setExpanded(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close tenant sidebar overlay"
          onClick={onToggle}
          className="fixed inset-0 z-20 bg-slate-900/30 lg:hidden"
        />
      ) : null}

      <aside
        ref={sidebarRef}
        className={[
          "fixed inset-y-0 left-0 z-30 flex flex-col border-r border-slate-200 bg-[#0f172a] p-3 text-slate-200 transition-transform duration-200 lg:static lg:w-72 lg:translate-x-0 lg:p-5",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          "w-[280px] lg:w-[288px]"
        ].join(" ")}
      >
        <div className="mb-4 flex h-16 items-center justify-between px-1 lg:mb-8 lg:justify-start">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-sm font-semibold text-sky-200 ring-1 ring-sky-400/30">
              TA
            </div>
            <div className="lg:block">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">{tenant?.name ?? "Tenant"}</p>
              <p className="max-w-48 truncate text-lg font-semibold text-white">{tenant?.domain ?? "Admin Portal"}</p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close sidebar"
            onClick={onToggle}
            className="rounded-full border border-white/10 p-2 text-slate-200 transition hover:bg-white/5 lg:hidden"
          >
            ×
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-2">
          {navItems.map(({ label, href, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              onClick={() => {
                if (window.innerWidth < 1024) {
                  onToggle?.();
                }
              }}
              className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-slate-200 transition hover:bg-white/8 hover:text-white"
            >
              <span className="flex items-center gap-3">
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{label}</span>
              </span>
              {label === "Dashboard" ? <ChevronDown className={['h-4 w-4 transition-transform', expanded ? 'rotate-180' : 'rotate-0'].join(' ')} /> : null}
            </Link>
          ))}
        </nav>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200">
          <div className="flex items-center gap-2 text-sky-200">
            <BarChart3 className="h-4 w-4" />
            <span className="font-medium">Live status</span>
          </div>
          <p className="mt-2 text-slate-300">7 active campaigns</p>
          <p className="mt-1 text-xs text-slate-400">Updated 2 mins ago</p>
        </div>
      </aside>
    </>
  );
}
