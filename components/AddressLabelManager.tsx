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
import { truncateAddress } from "@/lib/formatters";
import { Dialog } from "@/components/ui/Dialog";
import { t } from "@/lib/i18n";

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
  const triggerRef = useRef<HTMLButtonElement>(null);

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
          setImportError(t("addressLabelManager.invalidFormat"));
        }
      } catch {
        setImportError(t("addressLabelManager.failedToRead"));
      }
    };
    reader.readAsText(file);
  }, []);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="dialog"
        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        title={t("addressLabelManager.manageLabels")}
      >
        <Tag className="w-4 h-4" />
        <span className="hidden sm:inline">{t("addressLabelManager.labels")}</span>
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={t("addressLabelManager.title")}
        triggerRef={triggerRef}
        maxWidth="lg"
        className="max-h-[80vh] overflow-y-auto"
      >
        <div className="space-y-4">
          <div className="p-4 bg-[var(--color-bg-elevated)] rounded-lg border border-[var(--color-border-default)]">
            <h3 className="font-semibold text-sm mb-3 text-[var(--color-text-primary)]">
              {t("addressLabelManager.addNewLabel")}
            </h3>
            <div className="space-y-2">
              <input
                type="text"
                placeholder={t("addressLabelManager.addressPlaceholder")}
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[var(--color-bg-base)] border border-[var(--color-border-default)] rounded text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] outline-none focus:border-[var(--color-accent-border)]"
              />
              <input
                type="text"
                placeholder={t("addressLabelManager.labelPlaceholder")}
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
                {t("addressLabelManager.addLabel")}
              </button>
            </div>
          </div>

          {Object.entries(labels).length > 0 && (
            <div className="p-4 bg-[var(--color-bg-elevated)] rounded-lg border border-[var(--color-border-default)]">
              <h3 className="font-semibold text-sm mb-3 text-[var(--color-text-primary)]">
                {t("addressLabelManager.yourLabels")}
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
                          {t("addressLabelManager.save")}
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-[var(--color-text-primary)]">
                            {label}
                          </div>
                          <div className="text-xs text-[var(--color-text-secondary)] font-mono truncate">
                            {truncateAddress(address)}
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
                          {t("addressLabelManager.edit")}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveLabel(address)}
                          className="p-1 text-[var(--color-text-secondary)] hover:text-red-600 transition-colors"
                          title={t("addressLabelManager.deleteLabel")}
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

        <footer className="flex gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            title={t("addressLabelManager.exportTitle")}
          >
            <Download className="w-4 h-4" />
            {t("addressLabelManager.export")}
          </button>
          <button
            type="button"
            onClick={handleImportClick}
            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            title={t("addressLabelManager.importTitle")}
          >
            <Upload className="w-4 h-4" />
            {t("addressLabelManager.import")}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportFile}
            className="hidden"
            aria-label={t("addressLabelManager.importFile")}
          />
        </footer>
      </Dialog>
    </>
  );
}
