import { PaperViewer } from "@/components/paper/paper-viewer";
import type { PublicEdition, PublicEditionSummary, PublicPaper } from "@/lib/public-paper";

export function TenantPaperHome({
  paper,
  edition,
  archives,
  initialPage,
}: {
  paper: PublicPaper;
  edition: PublicEdition | null;
  archives: PublicEditionSummary[];
  initialPage?: number;
}) {
  return <PaperViewer paper={paper} edition={edition} archives={archives} initialPage={initialPage} />;
}
