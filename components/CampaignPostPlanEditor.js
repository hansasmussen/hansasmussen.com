"use client";

import { useState } from "react";

function createRow(index, channel = "", workingTitle = "", assetIds = []) {
  return {
    id: `post-${index}-${crypto.randomUUID()}`,
    channel,
    workingTitle,
    assetIds,
  };
}

export function CampaignPostPlanEditor({ action, campaignId, channelOptions, assets, initialRows = [] }) {
  const [rows, setRows] = useState(() =>
    initialRows.length ? initialRows : [createRow(1, channelOptions[0] || "", "", [])]
  );

  function addRow() {
    setRows((current) => [...current, createRow(current.length + 1, channelOptions[0] || "", "", [])]);
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
            <input type="hidden" name="postPlanRowId" value={row.id} />
            <div className="campaign-post-plan-head">
              <strong>Post {index + 1}</strong>
              {rows.length > 1 ? (
                <button type="button" className="campaign-link-button" onClick={() => removeRow(row.id)}>
                  Fjern
                </button>
              ) : null}
            </div>
            <label>
              Kanal
              <select
                name={`postPlanChannel__${row.id}`}
                value={row.channel}
                onChange={(event) => updateRow(row.id, "channel", event.target.value)}
              >
                {channelOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Arbejdsoverskrift
              <input
                name={`postPlanTitle__${row.id}`}
                value={row.workingTitle}
                onChange={(event) => updateRow(row.id, "workingTitle", event.target.value)}
                placeholder="Weekend launch, Hero look, New arrivals"
              />
            </label>
            <div className="campaign-field-group">
              <span className="campaign-field-group-label">Assets til dette post</span>
              <p>Hvis du ikke vælger assets, bliver teksten automatisk genereret ud fra brief, moodboard og farvepalette.</p>
              <div className="campaign-chip-selector">
                {assets.map((asset) => (
                  <label key={`${row.id}-${asset.id}`} className="campaign-checkbox-chip">
                    <input
                      type="checkbox"
                      name={`postPlanAssetIds__${row.id}`}
                      value={asset.id}
                      checked={row.assetIds.includes(asset.id)}
                      onChange={(event) => toggleAsset(row.id, asset.id, event.target.checked)}
                    />
                    <span>{asset.title || "Untitled asset"}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="campaign-post-plan-actions">
        <button type="button" className="campaign-link-button" onClick={addRow}>
          Tilføj post
        </button>
        <button type="submit">Gem postplan</button>
      </div>
    </form>
  );
}
