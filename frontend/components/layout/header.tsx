"use client";

import { Bell, ChevronDown, LockKeyhole, LogOut, Menu, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { logoutFromApi } from "@/lib/api";

type HeaderProps = {
  onToggleSidebar?: () => void;
  profile?: {
    name: string;
    subtitle: string;
  };
};

export function Header({ onToggleSidebar, profile }: HeaderProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    void logoutFromApi();
    router.push("/login");
  };

  return (
    <header className="relative flex h-16 items-center justify-between border-b border-slate-200 bg-[#f3f6fb] px-3 shadow-sm sm:px-4 lg:px-6">
      <button
        type="button"
        aria-label="Toggle sidebar menu"
        onClick={onToggleSidebar}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 lg:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>

      <div className="hidden w-full max-w-md md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input className="border-slate-200 bg-white pl-9 text-slate-700 placeholder:text-slate-400" placeholder="Search customers or domains" />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          aria-label="Search customers"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 md:hidden"
        >
          <Search className="h-4 w-4" />
        </button>

        <button
          type="button"
          aria-label="Notifications"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100"
        >
          <Bell className="h-4 w-4" />
        </button>

        <div className="relative">
          <button
            type="button"
            aria-label="Admin profile"
            onClick={() => setMenuOpen((value) => !value)}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1.5 shadow-sm transition hover:bg-slate-100"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0f172a] text-xs font-medium text-white">
              {profile?.name.slice(0, 2).toUpperCase() ?? "DA"}
            </div>
            <div className="hidden text-left sm:block">
              <p className="max-w-36 truncate text-sm font-medium text-slate-900">{profile?.name ?? "Dogy Admin"}</p>
              <p className="max-w-36 truncate text-[10px] text-slate-500">{profile?.subtitle ?? "Platform owner"}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-500" />
          </button>

          {menuOpen ? (
            <div className="absolute right-0 top-12 z-40 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
              >
                <LockKeyhole className="h-4 w-4" />
                Update Password
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
