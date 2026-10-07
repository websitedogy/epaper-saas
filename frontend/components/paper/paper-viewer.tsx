"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Archive, ChevronLeft, ChevronRight, FileText, Minus, Plus, Scissors, X } from "lucide-react";

import { formatEditionDate, type PublicEdition, type PublicEditionSummary, type PublicPaper } from "@/lib/public-paper";

type Panel = "archives" | "about" | "vision" | "mission" | null;

const navItems: Array<{ id: "home" | "about" | "vision" | "mission"; label: string }> = [
  { id: "home", label: "Home" },
  { id: "vision", label: "Vision" },
  { id: "about", label: "About Us" },
  { id: "mission", label: "Mission" },
];

export function PaperViewer({
  paper,
  edition,
  archives = [],
  initialPage = 1,
}: {
  paper: PublicPaper;
  edition: PublicEdition | null;
  archives?: PublicEditionSummary[];
  initialPage?: number;
}) {
  const total = edition?.total_pages || edition?.pages.length || 0;
  const [page, setPage] = useState(() => clamp(initialPage, 1, Math.max(total, 1)));
  const [zoom, setZoom] = useState(1);
  const [panel, setPanel] = useState<Panel>(null);
  const current = edition?.pages.find((item) => item.page_number === page) ?? edition?.pages[page - 1];
  const sharePath = edition ? `/epaper/${edition.slug}` : "/";
  const [shareUrl, setShareUrl] = useState(sharePath);
  const ticker = useMemo(() => {
    if (!edition) return `${paper.name} — today's ePaper will appear here after publish.`;
    return `News: 1. ${paper.name} Daily ePaper · ${formatEditionDate(edition.edition_date)} · ${total} pages now live`;
  }, [edition, paper.name, total]);

  useEffect(() => {
    setShareUrl(`${window.location.origin}${sharePath}`);
  }, [sharePath]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") setPage((value) => Math.min(total || 1, value + 1));
      if (event.key === "ArrowLeft") setPage((value) => Math.max(1, value - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total]);

  const go = (next: number) => setPage(clamp(next, 1, Math.max(total, 1)));

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="border-b border-[#f7d56a]/30 bg-[#4a0408] px-4 py-1 text-center text-[11px] font-medium tracking-wide text-[#f7d56a] sm:text-xs">
        <p className="truncate">{ticker}</p>
      </div>

      <header className="bg-[linear-gradient(90deg,#e30613_0%,#c8102e_28%,#1a1a1a_72%)] text-white">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            {paper.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={paper.logo_url} alt="" className="h-11 w-11 rounded-md bg-white object-contain p-0.5" />
            ) : (
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-white text-lg font-black tracking-tight text-[#e30613]">
                {paper.name.slice(0, 1).toUpperCase()}
              </span>
            )}
            <span>
              <span className="block text-xl font-bold leading-none tracking-tight sm:text-2xl">{paper.name}</span>
              <span className="mt-1 block text-[10px] uppercase tracking-[0.22em] text-white/70">Daily ePaper</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            {navItems.map(({ id, label }) =>
              id === "home" ? (
                <Link key={id} href="/" className="hover:text-white/80">
                  {label}
                </Link>
              ) : (
                <button key={id} type="button" onClick={() => setPanel(id)} className="hover:text-white/80">
                  {label}
                </button>
              ),
            )}
          </nav>
        </div>
        <nav className="flex items-center gap-4 overflow-x-auto px-4 pb-3 text-sm font-medium md:hidden">
          {navItems.map(({ id, label }) =>
            id === "home" ? (
              <Link key={id} href="/" className="shrink-0 hover:text-white/80">
                {label}
              </Link>
            ) : (
              <button key={id} type="button" onClick={() => setPanel(id)} className="shrink-0 hover:text-white/80">
                {label}
              </button>
            ),
          )}
        </nav>
      </header>

      <div className="bg-[#111]">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-3 py-2 sm:px-6">
          <div className="flex items-center gap-2">
            <ToolbarButton disabled={!edition || page <= 1} onClick={() => go(page - 1)} icon={<ChevronLeft className="h-4 w-4" />} label="Prev" />
            <ToolbarButton disabled={!edition || page >= total} onClick={() => go(page + 1)} icon={<ChevronRight className="h-4 w-4" />} label="Next" />
          </div>
          <div className="flex items-center gap-2">
            <ToolbarButton
              disabled={!current}
              onClick={() => current && window.open(current.image_url, "_blank", "noopener,noreferrer")}
              icon={<FileText className="h-4 w-4" />}
              label="PDF"
            />
            <ToolbarButton
              disabled={!current}
              onClick={() => current && downloadPage(current.image_url, `${paper.name}-page-${page}`)}
              icon={<Scissors className="h-4 w-4" />}
              label="Clip"
            />
            <ToolbarButton onClick={() => setPanel("archives")} icon={<Archive className="h-4 w-4" />} label="Archives" />
          </div>
        </div>
      </div>

      <div className="border-b border-slate-100 bg-white px-4 py-3 text-center">
        <p className="text-sm text-slate-700 sm:text-[15px]">
          {paper.name} Daily ePaper
          {edition ? (
            <>
              {" "}
              | {formatEditionDate(edition.edition_date)} | Page {page} of {total}
            </>
          ) : (
            " | No edition published yet"
          )}
        </p>
      </div>

      {edition ? (
        <div className="flex justify-center gap-3 bg-[#111] py-3">
          <SocialCircle href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`} label="Share on X" className="bg-[#1d9bf0]">
            <TwitterIcon />
          </SocialCircle>
          <SocialCircle href={`https://wa.me/?text=${encodeURIComponent(shareUrl)}`} label="Share on WhatsApp" className="bg-[#25d366]">
            <WhatsAppIcon />
          </SocialCircle>
          <SocialCircle href={`https://www.instagram.com/`} label="Open Instagram" className="bg-[#e1306c]">
            <InstagramIcon />
          </SocialCircle>
          <SocialCircle href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} label="Share on LinkedIn" className="bg-[#0a66c2]">
            <LinkedInIcon />
          </SocialCircle>
          <SocialCircle href={`mailto:?subject=${encodeURIComponent(paper.name)}&body=${encodeURIComponent(shareUrl)}`} label="Share by email" className="bg-[#ea4335]">
            <MailIcon />
          </SocialCircle>
        </div>
      ) : null}

      <div className="relative mx-auto flex max-w-[1400px] gap-4 px-3 py-5 sm:px-6 lg:gap-8">
        {edition ? (
          <aside className="hidden w-[92px] shrink-0 flex-col gap-4 md:flex">
            {edition.pages.map((item) => (
              <button
                key={item.page_number}
                type="button"
                onClick={() => go(item.page_number)}
                className="group text-center"
              >
                <span
                  className={`block overflow-hidden border-2 bg-white shadow-sm ${
                    item.page_number === page ? "border-[#e30613]" : "border-slate-200 group-hover:border-slate-400"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image_url} alt="" className="aspect-[3/4] w-full object-cover object-top" />
                </span>
                <span className="mt-1 block text-[11px] text-slate-600">Page {item.page_number}</span>
              </button>
            ))}
          </aside>
        ) : null}

        <div className="min-w-0 flex-1 overflow-auto bg-white">
          {current ? (
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={current.image_url}
                alt={`${edition?.name ?? paper.name} page ${page}`}
                width={current.width ?? 1200}
                height={current.height ?? 1600}
                className="h-auto max-w-none bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
                style={{ width: `${Math.round(zoom * 100)}%` }}
              />
            </div>
          ) : (
            <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
              <p className="text-2xl font-semibold text-slate-900">{paper.name}</p>
              <p className="mt-2 max-w-md text-slate-500">No edition is published yet. When the newsroom publishes, the paper opens here.</p>
              <Link href="/login" className="mt-6 rounded-full bg-[#e30613] px-5 py-2 text-sm font-semibold text-white">
                Newsroom login
              </Link>
            </div>
          )}
        </div>

        {edition ? (
          <div className="sticky top-24 hidden h-fit flex-col gap-3 self-start lg:flex">
            <ZoomButton label="Zoom in" onClick={() => setZoom((value) => Math.min(2.2, Number((value + 0.15).toFixed(2))))}>
              <Plus className="h-5 w-5" />
            </ZoomButton>
            <ZoomButton label="Zoom out" onClick={() => setZoom((value) => Math.max(0.55, Number((value - 0.15).toFixed(2))))}>
              <Minus className="h-5 w-5" />
            </ZoomButton>
          </div>
        ) : null}
      </div>

      {edition && edition.pages.length > 1 ? (
        <div className="flex gap-3 overflow-x-auto px-4 pb-6 md:hidden">
          {edition.pages.map((item) => (
            <button key={item.page_number} type="button" onClick={() => go(item.page_number)} className="shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image_url}
                alt={`Page ${item.page_number}`}
                className={`h-24 w-[68px] object-cover object-top ${item.page_number === page ? "ring-2 ring-[#e30613]" : "ring-1 ring-slate-200"}`}
              />
            </button>
          ))}
        </div>
      ) : null}

      <footer className="mt-4 border-t-4 border-[#e30613] bg-[#111] text-white">
        <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-3">
              {paper.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={paper.logo_url} alt="" className="h-10 w-10 rounded-md bg-white object-contain p-0.5" />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-base font-black text-[#e30613]">
                  {paper.name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <span>
                <span className="block text-lg font-bold leading-none">{paper.name}</span>
                <span className="mt-1 block text-[10px] uppercase tracking-[0.2em] text-white/60">Daily ePaper</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/65">
              Read today&apos;s newspaper page by page. {edition ? `${formatEditionDate(edition.edition_date)} edition is live.` : "A new edition appears here after publish."}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#f7d56a]">Quick links</p>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              <li>
                <Link href="/" className="hover:text-white">Home</Link>
              </li>
              <li>
                <button type="button" onClick={() => setPanel("archives")} className="hover:text-white">Archives</button>
              </li>
              <li>
                <button type="button" onClick={() => setPanel("about")} className="hover:text-white">About Us</button>
              </li>
              <li>
                <button type="button" onClick={() => setPanel("vision")} className="hover:text-white">Vision</button>
              </li>
              <li>
                <button type="button" onClick={() => setPanel("mission")} className="hover:text-white">Mission</button>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#f7d56a]">Contact</p>
            <p className="mt-4 text-sm text-white/80">{paper.domain}</p>
            <Link href="/login" className="mt-3 inline-block text-sm text-white/80 hover:text-white">
              Newsroom login
            </Link>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-2 px-4 py-4 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>© {new Date().getFullYear()} {paper.name}. All rights reserved.</p>
            <p>Digital ePaper publishing</p>
          </div>
        </div>
      </footer>

      {panel ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center" role="dialog" aria-modal="true">
          <div className="max-h-[86vh] w-full max-w-3xl overflow-auto rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#e30613]">{paper.name}</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-950">
                  {panel === "archives" ? "Archives" : panel === "vision" ? "Vision" : panel === "mission" ? "Mission" : "About Us"}
                </h2>
              </div>
              <button type="button" onClick={() => setPanel(null)} className="rounded-lg border border-slate-200 p-2" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>

            {panel === "archives" ? (
              archives.length ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {archives.map((item) => (
                    <Link key={item.id} href={`/epaper/${item.slug}`} onClick={() => setPanel(null)} className="overflow-hidden rounded-xl border border-slate-200 hover:border-[#e30613]">
                      <div className="aspect-[3/4] bg-slate-100">
                        {item.cover_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.cover_url} alt="" className="h-full w-full object-cover object-top" />
                        ) : null}
                      </div>
                      <div className="p-3">
                        <p className="text-xs text-slate-500">{formatEditionDate(item.edition_date)}</p>
                        <p className="mt-1 font-medium text-slate-900">{item.name}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-slate-600">No archived editions yet.</p>
              )
            ) : (
              <p className="leading-7 text-slate-600">
                {panel === "vision" && `${paper.name} exists to put a complete daily newspaper in every reader's hands, on any screen, the moment it is published.`}
                {panel === "mission" && `Our mission is to deliver ${paper.name} as a faithful digital ePaper — page by page, date by date — with the same authority as print.`}
                {panel === "about" && `${paper.name} is a digital newspaper on ${paper.domain}. Open today's edition, turn the pages, and browse the archive from this reader.`}
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function ToolbarButton({
  label,
  icon,
  onClick,
  disabled,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm text-white hover:bg-white/10 disabled:opacity-35"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/70">{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function ZoomButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-[#e30613] bg-white text-[#e30613] shadow-md hover:bg-red-50"
    >
      {children}
    </button>
  );
}

function SocialCircle({
  href,
  label,
  className,
  children,
}: {
  href: string;
  label: string;
  className: string;
  children: ReactNode;
}) {
  return (
    <a href={href} target="_blank" rel="noreferrer" aria-label={label} className={`flex h-10 w-10 items-center justify-center rounded-full text-white ${className}`}>
      {children}
    </a>
  );
}

function downloadPage(url: string, filename: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.webp`;
  link.target = "_blank";
  link.rel = "noreferrer";
  document.body.append(link);
  link.click();
  link.remove();
}

function TwitterIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M22 5.8c-.7.3-1.5.6-2.3.7.8-.5 1.5-1.3 1.8-2.2-.8.5-1.7.8-2.6 1A4 4 0 0 0 12 8.7c0 .3 0 .6.1.9-3.3-.2-6.3-1.8-8.3-4.2-.3.6-.5 1.3-.5 2 0 1.4.7 2.6 1.8 3.3-.6 0-1.2-.2-1.8-.5v.1c0 2 1.4 3.6 3.3 4-.3.1-.7.1-1.1.1-.3 0-.5 0-.8-.1.5 1.6 2 2.8 3.8 2.8A8.1 8.1 0 0 1 2 18.4 11.4 11.4 0 0 0 8.2 20c7.4 0 11.5-6.1 11.5-11.5v-.5c.8-.6 1.5-1.3 2.3-2.2Z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M20 3.9A10 10 0 0 0 3.3 17.7L2 22l4.4-1.2A10 10 0 1 0 20 3.9Zm-8 16.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-2.6.7.7-2.5-.2-.3A8.2 8.2 0 1 1 12 20.1Zm4.5-6.1c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1l-.8 1c-.1.1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.3 0-.4.1-.6l.4-.5.1-.3c0-.1 0-.3-.1-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5c-.1 0-.4.1-.6.3s-.8.8-.8 1.9.8 2.2.9 2.3a8.8 8.8 0 0 0 3.4 3.1c1.3.6 1.8.6 2.4.5.4-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5Zm8 2H8a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3Zm-4 3.2A3.8 3.8 0 1 1 8.2 12 3.8 3.8 0 0 1 12 8.2Zm0 2A1.8 1.8 0 1 0 13.8 12 1.8 1.8 0 0 0 12 10.2Zm4.4-3.1a.9.9 0 1 1-.9.9.9.9 0 0 1 .9-.9Z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M6.5 9H4V20h2.5V9ZM5.2 4A1.6 1.6 0 1 0 5.2 7.2 1.6 1.6 0 0 0 5.2 4ZM20 20h-2.5v-5.6c0-1.6-.6-2.4-1.8-2.4s-1.8 1-1.8 2.4V20H11.5V9H14v1.4A3.4 3.4 0 0 1 17 9c2.4 0 3 1.7 3 4.3V20Z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M3 6.8A2.8 2.8 0 0 1 5.8 4h12.4A2.8 2.8 0 0 1 21 6.8v10.4A2.8 2.8 0 0 1 18.2 20H5.8A2.8 2.8 0 0 1 3 17.2Zm2.1-.3 6.6 4.6c.2.1.4.1.6 0l6.6-4.6a.8.8 0 0 0-.7-.5H5.8a.8.8 0 0 0-.7.5Z" />
    </svg>
  );
}
