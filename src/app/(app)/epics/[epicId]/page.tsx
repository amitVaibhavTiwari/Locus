import { notFound, redirect } from "next/navigation";
import {
  getSessionUser,
  getActiveOrg,
  getEpic,
  getEpicIssues,
} from "@/lib/dal";
import { EpicDetailClient } from "./EpicDetailClient";

export default async function EpicDetailPage({
  params,
}: {
  params: Promise<{ epicId: string }>;
}) {
  const { epicId } = await params;

  const [user, org] = await Promise.all([getSessionUser(), getActiveOrg()]);
  if (!org || !user) redirect("/onboarding/workspace");

  const epic = await getEpic(epicId);
  if (!epic) notFound();

  const issues = await getEpicIssues(epicId);

  return <EpicDetailClient epic={epic} issues={issues} />;
}
