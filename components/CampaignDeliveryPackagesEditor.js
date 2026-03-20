"use client";

import { useState } from "react";

function createRow(index, assets = []) {
  return {
    id: `package-${index}-${crypto.randomUUID()}`,
    name: "",
    format: "",
    aspectRatio: "",
    selectionMode: "selected",
    assetIds: assets.length ? [assets[0].id] : [],
  };
}

export function CampaignDeliveryPackagesEditor({
  action,
  campaignId,
  assets,
  formatOptions,
  aspectRatioOptions,
  initialRows = [],
}) {
  const [rows, setRows] = useState(() =>
    initialRows.length ? initialRows : [createRow(1, assets)]
  );

  function addRow() {
    setRows((current) => [...current, createRow(current.length + 1, assets)]);
  }

  function removeRow(rowId) {
    setRows((current) => current.filter((row) => row.id !== rowId));
  }

  function updateRow(rowId, key, value) {
    setRows((current) => current.map((row) => (row.id === rowId ? { ...row, [key]: value } : row)));
  }

  function toggleAsset(rowId, assetId, checked) {
    setRows((current) =>
      current.map((row) =>
        row.id === rowId
          ? {
              ...row,
              assetIds: checked
                ? [...row.assetIds, assetId]
                : row.assetIds.filter((currentAssetId) => currentAssetId !== assetId),
            }
          : row
      )
    );
  }

  return (
    <form action={action} className="campaign-form">
      <input type="hidden" name="campaignId" value={campaignId} />
      <div className="campaign-stack">
        {rows.map((row, index) => (
          <div key={row.id} className="campaign-post-plan-card">
            <input type="hidden" name="deliveryPackageRowId" value={row.id} />
            <div className="campaign-post-plan-head">
              <strong>Pakke {index + 1}</strong>
              {rows.length > 1 ? (
                <button type="button" className="campaign-link-button" onClick={() => removeRow(row.id)}>
                  Fjern
                </button>
              ) : null}
            </div>
            <label>
              Pakkenavn
              <input
                name={`deliveryPackageName__${row.id}`}
                value={row.name}
                onChange={(event) => updateRow(row.id, "name", event.target.value)}
                placeholder="Meta launch assets, Marketplace square, Bannerpakke"
              />
            </label>
            <div className="campaign-grid campaign-grid-steps">
              <label>
                Format
                <select
                  name={`deliveryPackageFormat__${row.id}`}
                  value={row.format}
                  onChange={(event) => updateRow(row.id, "format", event.target.value)}
                >
                  <option value="">Vælg format</option>
                  {formatOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Størrelsesforhold
                <select
                  name={`deliveryPackageAspectRatio__${row.id}`}
                  value={row.aspectRatio}
                  onChange={(event) => updateRow(row.id, "aspectRatio", event.target.value)}
                >
                  <option value="">Vælg forhold</option>
                  {aspectRatioOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="campaign-field-group">
              <span className="campaign-field-group-label">Assets</span>
              <div className="campaign-chip-selector">
                <label className="campaign-checkbox-chip">
                  <input
                    type="radio"
                    name={`deliveryPackageSelectionMode__${row.id}`}
                    value="all"
                    checked={row.selectionMode === "all"}
                    onChange={(event) => updateRow(row.id, "selectionMode", event.target.value)}
                  />
                  <span>Alle assets</span>
                </label>
                <label className="campaign-checkbox-chip">
                  <input
                    type="radio"
                    name={`deliveryPackageSelectionMode__${row.id}`}
                    value="selected"
                    checked={row.selectionMode === "selected"}
                    onChange={(event) => updateRow(row.id, "selectionMode", event.target.value)}
                  />
                  <span>Vælg enkeltvis</span>
                </label>
              </div>
              {row.selectionMode === "selected" ? (
                <div className="campaign-chip-selector">
                  {assets.map((asset) => (
                    <label key={`${row.id}-${asset.id}`} className="campaign-checkbox-chip">
                      <input
                        type="checkbox"
                        name={`deliveryPackageAssetIds__${row.id}`}
                        value={asset.id}
                        checked={row.assetIds.includes(asset.id)}
                        onChange={(event) => toggleAsset(row.id, asset.id, event.target.checked)}
                      />
                      <span>{asset.title || "Untitled asset"}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p>Pakken vil gælde for alle uploadede assets i kampagnen.</p>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="campaign-post-plan-actions">
        <button type="button" className="campaign-link-button" onClick={addRow}>
          Tilføj pakke
        </button>
        <button type="submit">Gem pakker</button>
      </div>
    </form>
  );
}
