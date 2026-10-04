"use client";

import { CalendarDays, Check, CheckCircle2, CirclePlus, FileText, Info, Plus, Trash2, UploadCloud, X, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { EditionWorkflow } from "@/components/tenant/edition-workflow";
import { apiFetch } from "@/lib/api";
import { type TenantEdition, uploadTenantEdition } from "@/lib/editions";

const defaultTitle = "Daily ePaper";

type NewsLink = { label: string; url: string };
type DashboardStats = { editions: number; published_editions: number; pending_editions: number };

export default function TenantEditionUploadPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [title, setTitle] = useState(defaultTitle);
  const [titleOptions, setTitleOptions] = useState([defaultTitle]);
  const [editionDate, setEditionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isTitleOpen, setIsTitleOpen] = useState(false);
  const [isAddingTitle, setIsAddingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newsLinks, setNewsLinks] = useState<NewsLink[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [edition, setEdition] = useState<TenantEdition | null>(null);
  const [stats, setStats] = useState<DashboardStats>({ editions: 0, published_editions: 0, pending_editions: 0 });

  useEffect(() => {
    void apiFetch<{ data: { customer?: { paper_name?: string | null; name?: string } } }>("/api/v1/auth/me")
      .then((response) => {
        const paperName = response.data.customer?.paper_name || response.data.customer?.name;
        if (!paperName) return;
        const option = `${paperName} ePaper`;
        setTitle(option);
        setTitleOptions((current) => (current.includes(option) ? current : [option, ...current]));
      })
      .catch(() => undefined);

    void apiFetch<{ data: { stats: DashboardStats } }>("/api/v1/customer/dashboard")
      .then((response) => setStats(response.data.stats))
      .catch(() => undefined);
  }, []);

  const instructions = [
    "Upload the newspaper PDF (max 50MB).",
    "Click Extract Pages to turn each PDF page into an image.",
    "Review the extracted pages, then click Publish.",
    "Published editions appear on your paper homepage and /epaper URL.",
  ];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile) {
      setSubmitMessage("Please select a PDF file before submitting.");
      return;
    }
    if (selectedFile.size > 50 * 1024 * 1024 || selectedFile.type !== "application/pdf") {
      setSubmitMessage("Please choose a PDF file smaller than 50MB.");
      return;
    }

    const body = new FormData();
    body.append("name", title);
    body.append("edition_date", editionDate);
    body.append("pdf", selectedFile);
    setIsSubmitting(true);
    setSubmitMessage(null);
    try {
      const uploaded = await uploadTenantEdition(body);
      setEdition(uploaded);
      setSubmitMessage("PDF uploaded. Extract pages next, then publish.");
      setStats((current) => ({
        ...current,
        editions: current.editions + 1,
        pending_editions: current.pending_editions + 1,
      }));
    } catch (error) {
      setSubmitMessage(error instanceof Error ? error.message : "Edition upload failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTitle = () => {
    const nextTitle = newTitle.trim();
    if (!nextTitle || titleOptions.includes(nextTitle)) return;
    setTitle(nextTitle);
    setTitleOptions((current) => [...current, nextTitle]);
    setNewTitle("");
    setIsAddingTitle(false);
    setIsTitleOpen(false);
  };

  const handleRemoveTitle = (option: string) => {
    if (option === defaultTitle) return;
    setTitle((current) => (current === option ? defaultTitle : current));
    setTitleOptions((current) => current.filter((item) => item !== option));
  };

  const addNewsLink = () => {
    if (newsLinks.length < 5) setNewsLinks((current) => [...current, { label: "", url: "" }]);
  };

  const updateNewsLink = (index: number, field: keyof NewsLink, value: string) => {
    setNewsLinks((current) => current.map((link, linkIndex) => (linkIndex === index ? { ...link, [field]: value } : link)));
  };

  return (
    <div className="space-y-6">
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(280px,0.96fr)]">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4 md:px-6">
            <div className="flex h-7 w-7 items-center justify-center text-slate-800">
              <FileText className="h-4 w-4" />
            </div>
            <h2 className="text-[18px] font-semibold text-slate-900">Edition Details</h2>
          </div>

          <form className="space-y-5 p-5 md:p-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="block text-[16px] font-semibold text-slate-800">
                Edition Title <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsTitleOpen((value) => !value)}
                  className="flex w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-3 text-left text-[17px] font-medium text-slate-800 transition hover:border-slate-400"
                >
                  <span className="truncate">{title}</span>
                  <span className="ml-3 text-slate-500">⌄</span>
                </button>

                {isTitleOpen ? (
                  <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                    {isAddingTitle ? (
                      <div className="border-b border-slate-200 p-3">
                        <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="new-edition-title">
                          New edition title
                        </label>
                        <div className="flex gap-2">
                          <input
                            id="new-edition-title"
                            autoFocus
                            value={newTitle}
                            onChange={(event) => setNewTitle(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") handleAddTitle();
                            }}
                            placeholder="Enter a title"
                            className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                          <button type="button" onClick={handleAddTitle} className="rounded-lg bg-blue-600 px-3 text-white hover:bg-blue-700" aria-label="Save new title">
                            <Check className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={() => setIsAddingTitle(false)} className="rounded-lg border border-slate-300 px-3 text-slate-600 hover:bg-slate-50" aria-label="Cancel new title">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsAddingTitle(true)}
                        className="flex w-full items-center justify-between border-b border-slate-200 px-4 py-3 text-left text-[17px] text-slate-900 hover:bg-slate-50"
                      >
                        <span className="flex items-center gap-2">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                            <Plus className="h-4 w-4" />
                          </span>
                          Add New Title
                        </span>
                      </button>
                    )}

                    <div className="max-h-[320px] overflow-y-auto bg-white">
                      {titleOptions.map((option) => (
                        <div key={option} className={`flex items-center gap-2 border-b border-slate-100 px-4 py-2 transition ${title === option ? "bg-sky-50" : "hover:bg-slate-50"}`}>
                          <button
                            type="button"
                            onClick={() => {
                              setTitle(option);
                              setIsTitleOpen(false);
                            }}
                            className="min-w-0 flex-1 py-1 text-left text-[16px] text-slate-700"
                          >
                            <span className="block truncate">{option}</span>
                          </button>
                          {title === option ? <Check className="h-4 w-4 shrink-0 text-blue-600" /> : null}
                          {option !== defaultTitle ? (
                            <button type="button" onClick={() => handleRemoveTitle(option)} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${option}`}>
                              <Trash2 className="h-4 w-4" />
                            </button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[16px] font-semibold text-slate-800">Edition Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={editionDate}
                  onChange={(event) => setEditionDate(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 pr-12 text-[17px] text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
                <CalendarDays className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[16px] font-semibold text-slate-800">
                PDF File <span className="text-red-500">*</span>
              </label>

              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragging(false);
                  setSelectedFile(event.dataTransfer.files?.[0] ?? null);
                }}
                className={`cursor-pointer rounded-xl border-2 border-dashed px-4 py-9 text-center transition ${
                  isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50/30"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                />

                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center text-blue-500">
                    <UploadCloud className="h-11 w-11" />
                  </div>
                  <div>
                    <p className="text-[17px] font-medium text-slate-800">
                      {selectedFile ? selectedFile.name : "Click to upload or drag and drop"}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">PDF files only (Max 50MB)</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1 text-sm text-slate-500">
              <span>Click + to add news links (max 5).</span>
              <button
                type="button"
                onClick={addNewsLink}
                disabled={newsLinks.length >= 5}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-blue-500 bg-white text-blue-600 transition hover:bg-blue-50"
                aria-label="Add top heading link"
              >
                <CirclePlus className="h-5 w-5" />
              </button>
            </div>

            {newsLinks.length > 0 ? (
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                {newsLinks.map((link, index) => (
                  <div key={index} className="grid gap-2 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)_auto]">
                    <input
                      value={link.label}
                      onChange={(event) => updateNewsLink(index, "label", event.target.value)}
                      placeholder="News title"
                      aria-label={`News link ${index + 1} title`}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                    <input
                      type="url"
                      value={link.url}
                      onChange={(event) => updateNewsLink(index, "url", event.target.value)}
                      placeholder="https://example.com/news"
                      aria-label={`News link ${index + 1} URL`}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                    <button
                      type="button"
                      onClick={() => setNewsLinks((current) => current.filter((_, linkIndex) => linkIndex !== index))}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50"
                      aria-label={`Remove news link ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[#4b3fe4] px-4 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-[#4035c7] disabled:opacity-60"
            >
              <UploadCloud className="h-4 w-4" />
              {isSubmitting ? "Uploading..." : "Submit Edition"}
            </button>
            {submitMessage ? <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">{submitMessage}</p> : null}
            {edition ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-3 font-semibold text-slate-900">{edition.name}</p>
                <EditionWorkflow
                  edition={edition}
                  onChange={(next) => {
                    setEdition(next);
                    if (next.status === "published") {
                      setStats((current) => ({
                        ...current,
                        published_editions: current.published_editions + 1,
                        pending_editions: Math.max(0, current.pending_editions - 1),
                      }));
                    }
                  }}
                />
              </div>
            ) : null}
          </form>
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
              <div className="flex h-7 w-7 items-center justify-center text-slate-800">
                <Info className="h-4 w-4" />
              </div>
              <h3 className="text-[18px] font-semibold text-slate-900">Instructions</h3>
            </div>

            <ul className="space-y-3 px-5 py-5">
              {instructions.map((text) => (
                <li key={text} className="flex items-start gap-3 text-[16px] text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
              <div className="flex h-7 w-7 items-center justify-center text-slate-800">
                <Zap className="h-4 w-4" />
              </div>
              <h3 className="text-[18px] font-semibold text-slate-900">Quick Stats</h3>
            </div>

            <div className="space-y-3 px-5 py-5 text-[17px] text-slate-600">
              <div className="flex items-center justify-between gap-4">
                <span>Total Editions</span>
                <span className="font-semibold text-slate-900">{stats.editions}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Published</span>
                <span className="font-semibold text-emerald-600">{stats.published_editions}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Pending</span>
                <span className="font-semibold text-amber-500">{stats.pending_editions}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
