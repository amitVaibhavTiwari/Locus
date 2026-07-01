import Link from "next/link";

export default function RootPage() {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-sm text-gray-500">Locus Kanban</p>

      <Link href="/login">Login</Link>
    </div>
  );
}
