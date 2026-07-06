import { VerifyLoginForm } from "./VerifyLoginForm";

export default async function VerifyLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; redirect?: string }>;
}) {
  const { email = "", redirect: redirectTo = "" } = await searchParams;
  return <VerifyLoginForm email={email} redirectTo={redirectTo} />;
}
