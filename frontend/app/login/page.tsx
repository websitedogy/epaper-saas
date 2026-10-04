import { headers } from "next/headers";

import { hostnameFromHeaders, isCentralHost } from "@/lib/hosts";

import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const headerList = await headers();
  const host = hostnameFromHeaders(headerList);

  return <LoginForm host={host} central={isCentralHost(host)} />;
}
