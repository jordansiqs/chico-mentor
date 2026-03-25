"use client";
// app/dashboard/DashboardWrapper.tsx
import dynamic from "next/dynamic";

const DashboardClient = dynamic(
  () => import("./DashboardClient"),
  { ssr: false, loading: () => null }
);

export default function DashboardWrapper() {
  return <DashboardClient />;
}
