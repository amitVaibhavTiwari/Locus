import { Suspense } from "react";
import { SignupForm } from "./SignupForm";

export default async function Signup({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const { invite = "" } = await searchParams;
  return (
    <Suspense>
      <SignupForm inviteToken={invite} />
    </Suspense>
  );
}
