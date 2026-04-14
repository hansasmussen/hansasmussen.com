import { AdminSidebar } from "@/components/AdminSidebar";

export function AdminLayout({ children, userEmail, showPrints = false, mainClassName = "" }) {
  const className = ["public-main", "admin-main", mainClassName].filter(Boolean).join(" ");

  return (
    <div className="site-shell public-shell admin-shell">
      <AdminSidebar variant="mobile-header" userEmail={userEmail} showPrints={showPrints} />
      <div className="public-layout admin-layout">
        <AdminSidebar variant="desktop" userEmail={userEmail} showPrints={showPrints} />
        <main className={className}>{children}</main>
      </div>
      <AdminSidebar variant="mobile-footer" userEmail={userEmail} showPrints={showPrints} />
    </div>
  );
}
