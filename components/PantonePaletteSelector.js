"use client";

import { useMemo, useState } from "react";

export function PantonePaletteSelector({ options, selected = [] }) {
  const [query, setQuery] = useState("");

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return options;

    return options.filter((option) => option.label.toLowerCase().includes(normalizedQuery));
  }, [options, query]);

  return (
    <div className="campaign-palette-selector">
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Søg i Pantone farver"
      />
      <div className="campaign-palette-grid">
        {filteredOptions.map((option) => (
          <label key={option.label} className="campaign-palette-card">
            <input
              type="checkbox"
              name="colorPalette"
              value={option.label}
              defaultChecked={selected.includes(option.label)}
            />
            <span
              className="campaign-color-swatch"
              aria-hidden="true"
              style={{ backgroundColor: option.swatch }}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
