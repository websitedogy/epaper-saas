import type { Metadata } from "next";
import { headers } from "next/headers";

import { PaperViewer } from "@/components/paper/paper-viewer";
import { hostnameFromHeaders } from "@/lib/hosts";
import { fetchPublicEdition, fetchPublicSite } from "@/lib/public-paper";

async function currentHost(): Promise<string> {
  return hostnameFromHeaders(await headers());
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const host = await currentHost();
  const [edition, site] = await Promise.all([fetchPublicEdition(slug, host), fetchPublicSite(host)]);
  if (!edition) return { title: "Edition not found", robots: { index: false, follow: false } };
  const paperName = site?.paper?.name ?? "ePaper";
  return {
    title: `${edition.name} | ${paperName}`,
    description: `Read ${edition.name}, a ${edition.total_pages}-page digital ePaper edition.`,
    alternates: { canonical: `/epaper/${edition.slug}` },
    openGraph: {
      title: edition.name,
      description: `Read ${edition.name} online.`,
      type: "article",
      images: edition.pages[0]?.image_url ? [{ url: edition.pages[0].image_url }] : [],
    },
  };
}

export default async function PublicEditionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const host = await currentHost();
  const [edition, site] = await Promise.all([fetchPublicEdition(slug, host), fetchPublicSite(host)]);
  if (!edition) {
    return (
      <main className="p-10 text-center">
        <h1 className="text-3xl font-semibold">Edition not found</h1>
        <p className="mt-2 text-slate-600">This edition is not published or no longer available.</p>
      </main>
    );
  }

  const paper = site?.paper ?? { name: edition.name, domain: host, logo_url: null };
  const initialPage = Number((await searchParams).page) || 1;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: edition.name,
    datePublished: edition.edition_date,
    image: edition.pages[0]?.image_url,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PaperViewer paper={paper} edition={edition} archives={site?.editions ?? []} initialPage={initialPage} />
    </>
  );
}
