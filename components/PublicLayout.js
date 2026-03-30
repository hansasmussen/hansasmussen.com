import { PublicSidebar } from "@/components/PublicSidebar";

export function PublicLayout({ children, mainClassName = "", showPrints = false }) {
  const className = ["public-main", mainClassName].filter(Boolean).join(" ");

  return (
    <div className="site-shell public-shell">
      <div className="public-layout">
        <PublicSidebar showPrints={showPrints} />
        <main className={className}>{children}</main>
      </div>
    </div>
  );
}
