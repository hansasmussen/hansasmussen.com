import { AdminClient } from "@/components/AdminClient";
import { AdminSignOutButton } from "@/components/AdminSignOutButton";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { requireAdminUser } from "@/lib/auth";
import { getSiteData } from "@/lib/site-data";

export default async function AdminPage() {
  const user = await requireAdminUser("/admin");
  const siteData = await getSiteData();

  return (
    <div className="site-shell">
      <SiteHeader includeAdmin />
      <div className="admin-auth-bar">
        <p>Signed in as {user.email}</p>
        <AdminSignOutButton />
      </div>
      <AdminClient initialSiteData={siteData} />
      <SiteFooter />
    </div>
  );
}
