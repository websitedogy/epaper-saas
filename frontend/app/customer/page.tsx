import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CustomerPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Customer portal</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Brand workspace</h1>
          </div>
          <Button>Publish edition</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Edition status</CardTitle>
              <CardDescription>Current publication cycle.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-slate-900">Draft</p>
              <Badge className="mt-4" variant="info">In review</Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
              <CardDescription>Domain and visual identity.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-slate-900">customer-brand.local</p>
              <p className="mt-2 text-sm text-slate-500">Primary color: #0f172a</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Audience</CardTitle>
              <CardDescription>Readers and subscribers.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-slate-900">8.4k</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
