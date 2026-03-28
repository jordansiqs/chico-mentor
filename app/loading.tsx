"use client";
// app/loading.tsx — Loading screen global

export default function Loading() {
  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{margin:0}
        @keyframes pulse{0%,100%{opacity:0.4}50%{opacity:1}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .dot{animation:pulse 1.4s ease-in-out infinite}
        .dot:nth-child(2){animation-delay:0.2s}
        .dot:nth-child(3){animation-delay:0.4s}
      `}</style>
      <div style={{ minHeight:"100vh", background:"#F4F5F0", display:"flex", flexDirection:"column" as const, alignItems:"center", justifyContent:"center", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", gap:"24px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <div style={{ width:"36px", height:"36px", background:"#1B5E2B", borderRadius:"4px", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <span style={{ fontSize:"18px", fontWeight:800, color:"#1B5E2B", letterSpacing:"-0.2px" }}>Chico Mentor</span>
        </div>
        <div style={{ display:"flex", gap:"6px", alignItems:"center" }}>
          {[0,1,2].map(i => (
            <div key={i} className="dot" style={{ width:"8px", height:"8px", borderRadius:"50%", background:"#1B5E2B", animationDelay:`${i*0.2}s` }}/>
          ))}
        </div>
      </div>
    </>
  );
}
