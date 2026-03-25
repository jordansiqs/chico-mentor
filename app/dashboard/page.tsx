// app/dashboard/page.tsx
// Server Component — sem "use client"
export const dynamic = "force-dynamic";

import dynamic from "next/dynamic";

const DashboardClient = dynamic(
  () => import("./DashboardClient"),
  {
    ssr: false,
    loading: () => null,
  }
);

export default function DashboardPage() {
  return <DashboardClient />;
}
