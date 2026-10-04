"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Globe2, LayoutDashboard, Users } from "lucide-react";

const navSections = [
  { label: "Dashboard", href: "/super-admin", icon: LayoutDashboard },
  { label: "Domains", href: "/super-admin/domains", icon: Globe2 },
  {
    label: "Direct Clients",
    href: "/super-admin/customers",
    icon: Users,
    children: [
      { label: "All Clients", href: "/super-admin/customers" },
      { label: "Pending", href: "/super-admin/customers?status=pending" },
      { label: "Active / Live", href: "/super-admin/customers?status=active" },
      { label: "Renewal", href: "/super-admin/customers?status=renewal" },
      { label: "Expired", href: "/super-admin/customers?status=expired" },
    ],
  },
];

type SidebarProps = {
  mobileOpen?: boolean;
  onToggle?: () => void;
};

export function Sidebar({ mobileOpen = false, onToggle }: SidebarProps) {
  const [mobileClientsOpen, setMobileClientsOpen] = useState(true);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileClientsOpen(false);
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
          aria-label="Close sidebar overlay"
          onClick={onToggle}
          className="fixed inset-0 z-20 bg-slate-900/30 lg:hidden"
        />
      ) : null}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-30 flex flex-col border-r border-slate-200 bg-[#0f172a] p-3 text-slate-200 transition-transform duration-200 lg:static lg:w-72 lg:translate-x-0 lg:p-5",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          "w-[280px] lg:w-[288px]"
        ].join(" ")}
      >
        <div className="mb-4 flex h-16 items-center justify-between px-1 lg:mb-8 lg:justify-start">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-sm font-semibold text-white ring-1 ring-white/10">
              D
            </div>
            <div className="lg:block">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">Dogy</p>
              <p className="text-lg font-semibold text-white">ePaper SaaS</p>
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

        <nav className="flex flex-1 flex-col gap-3 lg:gap-2">
          {navSections.map(({ label, href, icon: Icon, children }) => {
            const isDirectClients = label === "Direct Clients";

            return (
              <div key={label} className="relative w-full">
                {isDirectClients ? (
                  <div ref={mobileMenuRef} className="w-full">
                    <button
                      type="button"
                      aria-label="Open Direct Clients menu"
                      onClick={() => setMobileClientsOpen((value) => !value)}
                      className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-left text-slate-200 transition hover:bg-white/8 hover:text-white"
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="h-5 w-5" />
                        <span className="text-sm font-medium">{label}</span>
                      </span>
                      <ChevronDown
                        className={[
                          "h-4 w-4 transition-transform duration-200",
                          mobileClientsOpen ? "rotate-180" : "rotate-0"
                        ].join(" ")}
                      />
                    </button>

                    {mobileClientsOpen ? (
                      <div className="mt-2 space-y-1 overflow-hidden rounded-xl border border-white/10 bg-slate-900/50 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                        {children?.map((child) => (
                          <Link
                            key={child.label}
                            href={child.href}
                            onClick={() => {
                              setMobileClientsOpen(false);
                              onToggle?.();
                            }}
                            className="block rounded-md px-3 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/6 hover:text-white"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <Link
                    href={href}
                    aria-label={label}
                    onClick={() => {
                      if (window.innerWidth < 1024) {
                        onToggle?.();
                      }
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-slate-200 transition hover:bg-white/8 hover:text-white"
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{label}</span>
                  </Link>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
