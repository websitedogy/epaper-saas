import { API_BASE_URL, apiFetch, getApiToken } from "@/lib/api";

export type TenantEditionPage = {
  page_number: number;
  width: number | null;
  height: number | null;
  image_url: string;
};

export type TenantEdition = {
  id: string;
  name: string;
  slug: string;
  edition_date: string | null;
  total_pages: number;
  status: string;
  processing_progress: number;
  published_at?: string | null;
  pages?: TenantEditionPage[];
};

type ApiEnvelope<T> = { data: T; message?: string };

function tenantHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  const token = getApiToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (typeof window !== "undefined" && !headers.has("X-Tenant-Host")) {
    headers.set("X-Tenant-Host", window.location.hostname);
  }
  headers.set("Accept", "application/json");
  return headers;
}

export async function listTenantEditions(): Promise<TenantEdition[]> {
  const payload = await apiFetch<ApiEnvelope<{ data: TenantEdition[] }>>(
    `/api/v1/customer/editions?per_page=50&_=${Date.now()}`,
  );
  return payload.data?.data ?? [];
}

export async function getTenantEdition(id: string): Promise<TenantEdition> {
  const payload = await apiFetch<ApiEnvelope<TenantEdition>>(
    `/api/v1/customer/editions/${id}?_=${Date.now()}`,
  );
  return payload.data;
}

export async function uploadTenantEdition(form: FormData): Promise<TenantEdition> {
  const response = await fetch(`${API_BASE_URL}/api/v1/customer/editions`, {
    method: "POST",
    headers: tenantHeaders(),
    body: form,
  });
  const payload = (await response.json().catch(() => ({}))) as ApiEnvelope<TenantEdition> & { message?: string };
  if (!response.ok) {
    throw new Error(payload.message ?? "Edition upload failed.");
  }
  return payload.data;
}

export async function extractTenantEdition(id: string): Promise<TenantEdition> {
  const payload = await apiFetch<ApiEnvelope<TenantEdition>>(`/api/v1/customer/editions/${id}/extract`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  return payload.data;
}

export async function publishTenantEdition(id: string): Promise<TenantEdition> {
  const payload = await apiFetch<ApiEnvelope<TenantEdition>>(`/api/v1/customer/editions/${id}/publish`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  return payload.data;
}

export async function loadEditionPagePreview(editionId: string, page: number): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/v1/customer/editions/${editionId}/pages/${page}`, {
    headers: tenantHeaders(),
  });
  if (!response.ok) {
    throw new Error("Unable to load page preview.");
  }
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

export function editionStatusLabel(status: string, progress = 0): string {
  if (status === "processing") return `Extracting ${progress}%`;
  if (status === "uploaded") return "Uploaded";
  if (status === "completed") return "Ready to publish";
  if (status === "published") return "Published";
  if (status === "failed") return "Extraction failed";
  return status;
}
