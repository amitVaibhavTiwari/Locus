import { notFound, redirect } from "next/navigation";
import {
  getUserIdFromRequest,
  getOrgIdFromRequest,
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

  const userId = await getUserIdFromRequest();
  if (!userId) redirect("/login");

  const orgId = await getOrgIdFromRequest();
  if (!orgId) redirect("/onboarding/workspace");

  const epic = await getEpic(epicId);
  if (!epic) notFound();

  const issues = await getEpicIssues(epicId);

  return <EpicDetailClient epic={epic} issues={issues} />;
}
