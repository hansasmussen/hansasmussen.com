"use client";

import { PortfolioGrid } from "@/components/PortfolioGrid";

export function ProjectMediaGrid({ items }) {
  return <PortfolioGrid items={items} className="project-media-grid" layout="manual-columns" />;
}
