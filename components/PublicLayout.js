import { PublicSidebar } from "@/components/PublicSidebar";

export function PublicLayout({ children, mainClassName = "" }) {
  const className = ["public-main", mainClassName].filter(Boolean).join(" ");

  return (
    <div className="site-shell public-shell">
      <div className="public-layout">
        <PublicSidebar />
        <main className={className}>{children}</main>
      </div>
    </div>
  );
}
