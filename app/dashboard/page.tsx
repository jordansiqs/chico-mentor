// app/dashboard/page.tsx
// Server Component — sem "use client"
export const dynamic = "force-dynamic";

import nextDynamic from "next/dynamic";

const DashboardClient = nextDynamic(
  () => import("./DashboardClient"),
  { ssr: false, loading: () => null }
);

export default function DashboardPage() {
  return <DashboardClient />;
}
