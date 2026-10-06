const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.dogyepaper.com";

export type PublicPaper = {
  name: string;
  domain: string;
  logo_url: string | null;
};

export type PublicEditionSummary = {
  id: string;
  name: string;
  slug: string;
  edition_date: string | null;
  total_pages: number;
  cover_url: string | null;
};

export type PublicEditionPage = {
  page_number: number;
  width: number | null;
  height: number | null;
  image_url: string;
};

export type PublicEdition = {
  name: string;
  slug: string;
  edition_date: string | null;
  total_pages: number;
  pages: PublicEditionPage[];
};

export type PublicSite = {
  kind: "central" | "tenant";
  paper: PublicPaper | null;
  editions: PublicEditionSummary[];
};

export async function fetchPublicSite(host: string): Promise<PublicSite | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/public/site`, {
      headers: { "X-Tenant-Host": host, Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const payload = await response.json();
    return payload.data ?? null;
  } catch {
    return null;
  }
}

export async function fetchPublicEdition(slug: string, host: string): Promise<PublicEdition | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/public/editions/${encodeURIComponent(slug)}`, {
      headers: { "X-Tenant-Host": host, Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const payload = await response.json();
    return payload.data ?? null;
  } catch {
    return null;
  }
}

export function formatEditionDate(value: string | null): string {
  if (!value) return "Latest edition";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}
