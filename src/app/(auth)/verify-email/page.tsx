import { Suspense } from "react";
import { VerifyEmailForm } from "./VerifyEmailForm";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; invite?: string }>;
}) {
  const { email = "", invite = "" } = await searchParams;
  return (
    <Suspense>
      <VerifyEmailForm email={email} inviteToken={invite} />
    </Suspense>
  );
}
