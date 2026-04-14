import { AdminLayout } from "@/components/AdminLayout";
import { AdminClient } from "@/components/AdminClient";
import { requireAdminUser } from "@/lib/auth";
import { getPrintProducts, getSiteData } from "@/lib/site-data";

export default async function AdminPage() {
  const user = await requireAdminUser("/admin");
  const siteData = await getSiteData();
  const showPrints = getPrintProducts(siteData).length > 0;

  return (
    <AdminLayout userEmail={user.email} showPrints={showPrints}>
      <AdminClient initialSiteData={siteData} />
    </AdminLayout>
  );
}
