import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect = "" } = await searchParams;
  return (
    <Suspense>
      <LoginForm redirectTo={redirect} />
    </Suspense>
  );
}
