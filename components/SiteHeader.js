"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SocialNav } from "@/components/SocialNav";

const links = [
  { href: "/", label: "Home" },
  { href: "/work", label: "Portfolio" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader({ includeAdmin = false }) {
  const pathname = usePathname();
  const navLinks = includeAdmin ? [...links, { href: "/admin", label: "Admin" }] : links;

  return (
    <header className={`site-header ${pathname === "/work" ? "site-header-left" : ""}`.trim()}>
      <Link className="brand" href="/">
        hansasmussen.com
      </Link>
      <nav className="site-nav" aria-label="Primary navigation">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            className={pathname === link.href ? "is-active" : ""}
            href={link.href}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <SocialNav />
    </header>
  );
}
