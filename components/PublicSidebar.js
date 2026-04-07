"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { SocialNav } from "@/components/SocialNav";

function buildLinks(showPrints) {
  return [
    { href: "/", label: "Home" },
    { href: "/work", label: "Work" },
    ...(showPrints ? [{ href: "/prints", label: "Prints", note: "coming soon" }] : []),
    { href: "/contact", label: "Contact" },
  ];
}

export function PublicSidebar({ showPrints = false, variant = "desktop" }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const links = buildLinks(showPrints);
  const mobileLinks = links.filter((link) => link.href !== "/prints");

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  if (variant === "mobile-header") {
    return (
      <header className="public-sidebar-mobile-header">
        <div className="public-mobile-header-bar">
          <Link className="public-sidebar-brand public-sidebar-brand-mobile" href="/">
            <span>Hans</span>
            <span>Asmussen</span>
          </Link>

          <button
            type="button"
            className={`public-menu-toggle ${isOpen ? "is-open" : ""}`}
            aria-expanded={isOpen}
            aria-controls={menuId}
            aria-label="Open navigation menu"
            onClick={() => setIsOpen((current) => !current)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        <nav
          id={menuId}
          className={`public-mobile-nav ${isOpen ? "is-open" : ""}`}
          aria-label="Primary navigation"
        >
          {mobileLinks.map((link) => {
            const isActive =
              pathname === link.href || (link.href === "/work" && pathname.startsWith("/work"));

            return (
              <Link key={link.href} className={isActive ? "is-active" : ""} href={link.href}>
                {link.label}
                {link.note ? <span className="public-nav-note">{link.note}</span> : null}
              </Link>
            );
          })}
        </nav>
      </header>
    );
  }

  if (variant === "mobile-footer") {
    return (
      <section className="public-sidebar-mobile-footer">
        <SocialNav />

        <div className="public-sidebar-meta">
          <p>
            Based in Denmark
            <br />
            working across Europe
          </p>
        </div>

        <p className="public-sidebar-footer">
          hansasmussen.com is a part of www.ps-content.dk - all rights reservered
        </p>
      </section>
    );
  }

  return (
    <aside className="public-sidebar public-sidebar-desktop">
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
                {link.note ? <span className="public-nav-note">{link.note}</span> : null}
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

        <p className="public-sidebar-footer">
          hansasmussen.com is a part of www.ps-content.dk - all rights reservered
        </p>
      </div>
    </aside>
  );
}
