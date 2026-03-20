import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAllowedAdminEmail } from "@/lib/auth-shared";

function isProtectedPath(pathname) {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/site-data") ||
    pathname.startsWith("/api/upload") ||
    pathname.startsWith("/api/project-text-rewrite")
  );
}

export async function middleware(request) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthorized = Boolean(user?.email && isAllowedAdminEmail(user.email));
  const { pathname } = request.nextUrl;

  if (pathname === "/login" && isAuthorized) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (isProtectedPath(pathname) && !isAuthorized) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/login",
    "/api/site-data/:path*",
    "/api/upload/:path*",
    "/api/project-text-rewrite/:path*",
  ],
};
