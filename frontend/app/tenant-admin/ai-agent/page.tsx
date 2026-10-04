"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const suggestions = [
  "Focus on enterprise and startup stories for the next issue to boost engagement.",
  "Highlight lifestyle and travel pieces with local travel SEO keywords.",
  "Rotate one more sports spotlight feature to increase reader retention.",
];

export default function TenantAiAgentPage() {
  const [prompt, setPrompt] = useState("Create a strong editorial brief for today’s issue around business growth and local culture.");
  const [answers, setAnswers] = useState(suggestions);

  const handleGenerate = () => {
    setAnswers([
      `AI recommendation: Prioritize a lead story about ${prompt.split(" ").slice(0, 4).join(" ") || "market trends"} and pair it with a community feature.`,
      "Schedule a brief headline A/B testing cycle before publishing at 8 AM.",
      "Prepare a follow-up day-two analytics summary for editorial review.",
    ]);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Tenant admin</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">AI agent</h1>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>AI editor prompt</CardTitle>
            <CardDescription>Generate editorial ideas, briefs and campaign recommendations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              className="min-h-40 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none transition focus:border-sky-500"
            />
            <Button onClick={handleGenerate} className="w-full">Generate suggestions</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Suggested output</CardTitle>
            <CardDescription>AI-based content actions for the current publishing cycle.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {answers.map((answer, index) => (
              <div key={answer} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <Badge variant={index % 2 === 0 ? "info" : "success"}>Recommendation {index + 1}</Badge>
                </div>
                <p className="text-sm text-slate-700">{answer}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
