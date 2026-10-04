export function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().split(":")[0].replace(/^\./, "");
}

export function hostnameFromHeaders(headerList: Headers): string {
  const raw = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost";
  return normalizeHostname(raw.split(",")[0].trim());
}

export function isCentralHost(hostname: string): boolean {
  const host = normalizeHostname(hostname);
  const configured = (process.env.NEXT_PUBLIC_CENTRAL_HOSTS ?? "dogyepaper.com,www.dogyepaper.com")
    .split(",")
    .map((value) => normalizeHostname(value.trim()))
    .filter(Boolean);

  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "dogy.localhost" ||
    configured.includes(host)
  );
}

export function tenantLoginUrl(domain: string): string {
  const protocol = window.location.protocol;
  const port = window.location.port;
  return `${protocol}//${domain}${port ? `:${port}` : ""}/login`;
}
