import { PublicSidebar } from "@/components/PublicSidebar";

export function PublicLayout({ children, mainClassName = "", showPrints = false }) {
  const className = ["public-main", mainClassName].filter(Boolean).join(" ");

  return (
    <div className="site-shell public-shell">
      <PublicSidebar variant="mobile-header" showPrints={showPrints} />
      <div className="public-layout">
        <PublicSidebar variant="desktop" showPrints={showPrints} />
        <main className={className}>{children}</main>
      </div>
      <PublicSidebar variant="mobile-footer" showPrints={showPrints} />
    </div>
  );
}
