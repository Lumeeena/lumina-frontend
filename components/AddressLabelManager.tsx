"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Tag, Download, Upload, Trash2 } from "lucide-react";
import {
  readLabels,
  setLabel,
  removeLabel,
  exportLabels,
  importLabels,
  AddressLabels,
} from "@/lib/addressLabels";
import { formatAddress } from "@/lib/formatters";

export default function AddressLabelManager() {
  const [open, setOpen] = useState(false);
  const [labels, setLabels] = useState<AddressLabels>({});
  const [editingAddress, setEditingAddress] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [importError, setImportError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setLabels(readLabels());
    }
  }, [open]);

  const handleAddLabel = useCallback(() => {
    if (newAddress.trim() && newLabel.trim()) {
      setLabel(newAddress, newLabel);
      setLabels((prev) => ({ ...prev, [newAddress]: newLabel }));
      setNewAddress("");
      setNewLabel("");
    }
  }, [newAddress, newLabel]);

  const handleEditLabel = useCallback(() => {
    if (editingAddress && editingLabel.trim()) {
      setLabel(editingAddress, editingLabel);
      setLabels((prev) => ({
        ...prev,
        [editingAddress]: editingLabel,
      }));
      setEditingAddress(null);
      setEditingLabel("");
    }
  }, [editingAddress, editingLabel]);

  const handleRemoveLabel = useCallback((address: string) => {
    removeLabel(address);
    setLabels((prev) => {
      const next = { ...prev };
      delete next[address];
      return next;
    });
  }, []);

  const handleExport = useCallback(() => {
    const json = exportLabels();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lumina-address-labels.json";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImportFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        if (importLabels(json)) {
          setLabels(readLabels());
          setImportError("");
        } else {
          setImportError("Invalid label format");
        }
      } catch {
        setImportError("Failed to read file");
      }
    };
    reader.readAsText(file);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="dialog"
        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        title="Manage address labels"
      >
        <Tag className="w-4 h-4" />
        <span className="hidden sm:inline">Labels</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--color-bg-base)] rounded-2xl border border-[var(--color-border-default)] p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="label-manager-title"
          >
            <h2
              id="label-manager-title"
              className="font-extrabold text-lg mb-4 text-[var(--color-text-primary)]"
            >
              Address Labels
            </h2>

            <div className="space-y-4 mb-6">
              <div className="p-4 bg-[var(--color-bg-elevated)] rounded-lg border border-[var(--color-border-default)]">
                <h3 className="font-semibold text-sm mb-3 text-[var(--color-text-primary)]">
                  Add New Label
                </h3>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Stellar address"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--color-bg-base)] border border-[var(--color-border-default)] rounded text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] outline-none focus:border-[var(--color-accent-border)]"
                  />
                  <input
                    type="text"
                    placeholder="Label"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddLabel();
                    }}
                    className="w-full px-3 py-2 text-sm bg-[var(--color-bg-base)] border border-[var(--color-border-default)] rounded text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] outline-none focus:border-[var(--color-accent-border)]"
                  />
                  <button
                    type="button"
                    onClick={handleAddLabel}
                    className="w-full px-3 py-2 text-sm font-semibold bg-[var(--color-accent-fill)] hover:bg-[var(--color-accent-fill-hover)] text-white rounded transition-colors"
                  >
                    Add Label
                  </button>
                </div>
              </div>

              {Object.entries(labels).length > 0 && (
                <div className="p-4 bg-[var(--color-bg-elevated)] rounded-lg border border-[var(--color-border-default)]">
                  <h3 className="font-semibold text-sm mb-3 text-[var(--color-text-primary)]">
                    Your Labels
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(labels).map(([address, label]) => (
                      <div
                        key={address}
                        className="flex items-center justify-between gap-2 px-3 py-2 bg-[var(--color-bg-base)] rounded border border-[var(--color-border-default)]"
                      >
                        {editingAddress === address ? (
                          <>
                            <input
                              ref={inputRef}
                              type="text"
                              value={editingLabel}
                              onChange={(e) => setEditingLabel(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleEditLabel();
                                else if (e.key === "Escape") setEditingAddress(null);
                              }}
                              autoFocus
                              className="flex-1 px-2 py-1 text-sm bg-[var(--color-bg-elevated)] border border-[var(--color-accent-border)] rounded text-[var(--color-text-primary)] outline-none"
                            />
                            <button
                              type="button"
                              onClick={handleEditLabel}
                              className="px-2 py-1 text-xs font-semibold bg-[var(--color-accent-fill)] text-white rounded hover:bg-[var(--color-accent-fill-hover)]"
                            >
                              Save
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-[var(--color-text-primary)]">
                                {label}
                              </div>
                              <div className="text-xs text-[var(--color-text-secondary)] font-mono truncate">
                                {formatAddress(address)}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingAddress(address);
                                setEditingLabel(label);
                              }}
                              className="px-2 py-1 text-xs font-semibold text-[var(--color-accent-text)] hover:text-[var(--color-accent-text-hover)]"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveLabel(address)}
                              className="p-1 text-[var(--color-text-secondary)] hover:text-red-600 transition-colors"
                              title="Delete label"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {importError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  {importError}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4 border-t border-[var(--color-border-default)]">
              <button
                type="button"
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                title="Export labels as JSON"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                type="button"
                onClick={handleImportClick}
                className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                title="Import labels from JSON"
              >
                <Upload className="w-4 h-4" />
                Import
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
                aria-label="Import labels file"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="ml-auto px-4 py-2 text-sm font-semibold bg-[var(--color-accent-fill)] hover:bg-[var(--color-accent-fill-hover)] text-white rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
