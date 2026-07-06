import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; reset?: string }>;
}) {
  const { redirect = "", reset } = await searchParams;
  return (
    <Suspense>
      <LoginForm redirectTo={redirect} passwordReset={reset === "1"} />
    </Suspense>
  );
}
