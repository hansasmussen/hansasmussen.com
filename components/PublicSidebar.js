"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SocialNav } from "@/components/SocialNav";

const links = [
  { href: "/", label: "Home" },
  { href: "/work", label: "Work" },
  { href: "/contact", label: "Contact" },
];

export function PublicSidebar() {
  const pathname = usePathname();

  return (
    <aside className="public-sidebar">
      <div className="public-sidebar-inner">
        <Link className="public-sidebar-brand" href="/">
          <span>Hans</span>
          <span>Asmussen</span>
        </Link>

        <nav className="public-sidebar-nav" aria-label="Primary navigation">
          {links.map((link) => {
            const isActive =
              pathname === link.href || (link.href === "/work" && pathname.startsWith("/work"));

            return (
              <Link key={link.href} className={isActive ? "is-active" : ""} href={link.href}>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <SocialNav />

        <div className="public-sidebar-meta">
          <p>
            Based in Denmark
            <br />
            working across Europe
          </p>
        </div>

        <p className="public-sidebar-footer">hansasmussen.com / all rights reserved</p>
      </div>
    </aside>
  );
}
