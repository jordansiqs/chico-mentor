"use client";
// app/dashboard/page.tsx
export const dynamic = "force-dynamic";

import dynamic from "next/dynamic";

const DashboardClient = dynamic(
  () => import("./DashboardClient"),
  {
    ssr: false,
    loading: () => (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#F7F8FC",
        flexDirection: "column",
        gap: "16px",
      }}>
        <div style={{ fontSize: "52px" }}>🐾</div>
        <div style={{
          fontSize: "18px",
          fontWeight: 700,
          color: "#1A4A8A",
          fontFamily: "Nunito, sans-serif",
        }}>
          Carregando o Chico...
        </div>
      </div>
    ),
  }
);

export default function DashboardPage() {
  return <DashboardClient />;
}
