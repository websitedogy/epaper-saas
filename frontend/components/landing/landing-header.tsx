"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";

const navItems = [
  { href: "#product", label: "Product" },
  { href: "#workflow", label: "Workflow" },
  { href: "#solutions", label: "Solutions" },
  { href: "#platform", label: "Platform" },
];

export function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[#12324a]/10 bg-[#f4efe6]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-3" onClick={() => setMenuOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#12324a] font-display text-lg text-[#f4efe6]">
            D
          </span>
          <span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8a6a32]">Dogy</span>
            <span className="font-display text-lg leading-none text-[#12324a]">ePaper</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-slate-600 lg:flex">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="transition hover:text-[#12324a]">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="relative lg:hidden">
            <button
              type="button"
              className="rounded-full border border-[#12324a]/15 bg-white px-3 py-2 text-sm text-[#12324a]"
              aria-expanded={menuOpen}
              aria-controls="landing-mobile-nav"
              onClick={() => setMenuOpen((open) => !open)}
            >
              Menu
            </button>
            {menuOpen ? (
              <div
                id="landing-mobile-nav"
                className="absolute right-0 top-12 z-50 w-44 rounded-2xl border border-[#12324a]/10 bg-white p-2 shadow-lg"
              >
                {navItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="block rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-[#f4efe6]"
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
          <Button asChild className="rounded-full bg-[#12324a] px-4 hover:bg-[#0d2436]">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
