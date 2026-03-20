import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getAuthenticatedAdminUser } from "@/lib/auth";

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const next = typeof params?.next === "string" ? params.next : "/admin";
  const user = await getAuthenticatedAdminUser();

  if (user) {
    redirect(next);
  }

  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="login-page">
        <section className="login-panel">
          <p className="eyebrow">Admin login</p>
          <h1>Sign in to edit the site.</h1>
          <p className="lede">
            Use your approved admin email and password to access portfolio editing, uploads and site settings.
          </p>
          <LoginForm />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
