"use client";

import { useEffect, useState } from "react";
import CopyAddressButton from "@/components/CopyAddressButton";
import { truncateAddress } from "@/lib/formatters";

const INTEGER_TYPES = new Set(["i64", "u64", "i128", "u128", "i256", "u256"]);
const SCALAR_TYPES = new Set([
  ...INTEGER_TYPES,
  "bool",
  "error",
  "symbol",
  "string",
  "address",
  "bytes",
  "void",
  "timepoint",
  "duration",
  "u32",
  "i32",
]);
const ADDRESS_PATTERN = /^[GC][A-Z2-7]{39,}$/;

interface SorobanValueProps {
  value: unknown;
  initialExpandedDepth?: number;
  showRawToggle?: boolean;
  rawValue?: string;
}

function parseValue(value: unknown): unknown {
  if (typeof value !== "string") return value;
  if (/^-?\d+$/.test(value.trim())) return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

function AddressValue({ address }: { address: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span title={address}>{truncateAddress(address, 6)}</span>
      <CopyAddressButton address={address} />
    </span>
  );
}

function ScalarValue({ value, type }: { value: unknown; type?: string }) {
  if (type === "void" || value === null || value === undefined) {
    return <span className="text-[var(--color-text-muted)]">void</span>;
  }

  if (
    type === "address" ||
    (typeof value === "string" && ADDRESS_PATTERN.test(value))
  ) {
    return typeof value === "string" ? (
      <AddressValue address={value} />
    ) : (
      <span>{String(value)}</span>
    );
  }

  if (typeof value === "boolean") {
    return (
      <span className="text-[var(--color-accent-11)]">{String(value)}</span>
    );
  }

  if (typeof value === "bigint") {
    return <span>{value.toString()}</span>;
  }

  if (typeof value === "number") {
    return <span>{String(value)}</span>;
  }

  if (typeof value === "string") {
    return <span className="break-all">{value}</span>;
  }

  return (
    <span className="text-[var(--color-text-muted)]">{String(value)}</span>
  );
}

function byteValue(value: Uint8Array): string {
  return Array.from(value, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

function MapValue({
  value,
  depth,
  initialExpandedDepth,
}: {
  value: unknown;
  depth: number;
  initialExpandedDepth: number;
}) {
  const entries =
    value instanceof Map
      ? Array.from(value.entries())
      : Array.isArray(value)
        ? value.map((item) => {
            if (
              item &&
              typeof item === "object" &&
              "key" in item &&
              "val" in item
            ) {
              return [
                (item as { key: unknown }).key,
                (item as { val: unknown }).val,
              ] as const;
            }
            return ["", item] as const;
          })
        : [];

  return (
    <details open={depth < initialExpandedDepth} className="min-w-0">
      <summary className="cursor-pointer select-none text-[var(--color-accent-11)]">
        Map · {entries.length}
      </summary>
      <div className="ms-3 border-s border-[var(--color-border-default)] ps-3">
        {entries.map(([key, item], index) => (
          <div key={index} className="py-1">
            <span className="me-2 text-[var(--color-text-secondary)]">
              {key === "" ? (
                `Entry ${index + 1}`
              ) : (
                <SorobanNode
                  value={key}
                  depth={depth + 1}
                  initialExpandedDepth={initialExpandedDepth}
                />
              )}
              :
            </span>
            <SorobanNode
              value={item}
              depth={depth + 1}
              initialExpandedDepth={initialExpandedDepth}
            />
          </div>
        ))}
      </div>
    </details>
  );
}

function SorobanNode({
  value,
  depth,
  initialExpandedDepth,
}: {
  value: unknown;
  depth: number;
  initialExpandedDepth: number;
}) {
  if (value instanceof Uint8Array) {
    return <span className="break-all">0x{byteValue(value)}</span>;
  }

  if (ArrayBuffer.isView(value)) {
    return (
      <span className="break-all">
        0x
        {byteValue(
          new Uint8Array(value.buffer, value.byteOffset, value.byteLength),
        )}
      </span>
    );
  }

  if (Array.isArray(value)) {
    return (
      <details open={depth < initialExpandedDepth} className="min-w-0">
        <summary className="cursor-pointer select-none text-[var(--color-accent-11)]">
          Vector · {value.length}
        </summary>
        <div className="ms-3 border-s border-[var(--color-border-default)] ps-3">
          {value.map((item, index) => (
            <div key={index} className="py-1">
              <span className="me-2 text-[var(--color-text-muted)]">
                [{index}]
              </span>
              <SorobanNode
                value={item}
                depth={depth + 1}
                initialExpandedDepth={initialExpandedDepth}
              />
            </div>
          ))}
        </div>
      </details>
    );
  }

  if (value instanceof Map) {
    return (
      <details open={depth < initialExpandedDepth} className="min-w-0">
        <summary className="cursor-pointer select-none text-[var(--color-accent-11)]">
          Map · {value.size}
        </summary>
        <div className="ms-3 border-s border-[var(--color-border-default)] ps-3">
          {Array.from(value.entries(), ([key, item], index) => (
            <div key={index} className="py-1">
              <span className="me-2 text-[var(--color-text-secondary)]">
                {String(key)}:
              </span>
              <SorobanNode
                value={item}
                depth={depth + 1}
                initialExpandedDepth={initialExpandedDepth}
              />
            </div>
          ))}
        </div>
      </details>
    );
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value);
    if (entries.length === 1 && entries[0][0] === "map") {
      return (
        <MapValue
          value={entries[0][1]}
          depth={depth}
          initialExpandedDepth={initialExpandedDepth}
        />
      );
    }
    if (entries.length === 1 && entries[0][0] === "vec") {
      return (
        <SorobanNode
          value={entries[0][1]}
          depth={depth}
          initialExpandedDepth={initialExpandedDepth}
        />
      );
    }
    if (entries.length === 1 && SCALAR_TYPES.has(entries[0][0])) {
      const [type, scalar] = entries[0];
      if (INTEGER_TYPES.has(type)) {
        return (
          <span className="inline-flex flex-wrap items-baseline gap-x-2">
            <span className="text-[var(--color-text-muted)]">{type}</span>
            <ScalarValue value={scalar} type={type} />
          </span>
        );
      }
      if (type === "void") return <ScalarValue value={null} type={type} />;
      if (type === "bytes" && Array.isArray(scalar)) {
        return (
          <span className="break-all">
            0x
            {scalar
              .map((byte) => Number(byte).toString(16).padStart(2, "0"))
              .join("")}
          </span>
        );
      }
      if (type === "error" && scalar && typeof scalar === "object") {
        return <span className="break-all">{JSON.stringify(scalar)}</span>;
      }
      return <ScalarValue value={scalar} type={type} />;
    }

    return (
      <details open={depth < initialExpandedDepth} className="min-w-0">
        <summary className="cursor-pointer select-none text-[var(--color-accent-11)]">
          Struct · {entries.length}
        </summary>
        <div className="ms-3 border-s border-[var(--color-border-default)] ps-3">
          {entries.map(([key, item]) => (
            <div key={key} className="py-1">
              <span className="me-2 text-[var(--color-text-secondary)]">
                {key}:
              </span>
              <SorobanNode
                value={item}
                depth={depth + 1}
                initialExpandedDepth={initialExpandedDepth}
              />
            </div>
          ))}
        </div>
      </details>
    );
  }

  return <ScalarValue value={value} />;
}

function RawValue({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <code className="break-all bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] rounded px-2 py-1 text-xs">
          {value}
        </code>
        <button
          onClick={handleCopy}
          className="flex-shrink-0 px-2 py-1 text-xs bg-[var(--color-accent-surface)] hover:bg-[var(--color-accent-surface-hover)] text-[var(--color-accent-text)] rounded transition-colors"
          title="Copy raw value"
        >
          {copied ? "✓" : "Copy"}
        </button>
      </div>
    </div>
  );
}

export default function SorobanValue({
  value,
  initialExpandedDepth = 1,
  showRawToggle = false,
  rawValue,
}: SorobanValueProps) {
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    if (!showRawToggle) return;
    const stored = sessionStorage.getItem("soroban-raw-toggle");
    if (stored === "true") {
      setShowRaw(true);
    }
  }, [showRawToggle]);

  const handleToggle = () => {
    const newValue = !showRaw;
    setShowRaw(newValue);
    if (showRawToggle) {
      sessionStorage.setItem("soroban-raw-toggle", String(newValue));
    }
  };

  return (
    <div className="min-w-0 break-words text-xs text-[var(--color-text-secondary)]">
      {showRawToggle && rawValue && (
        <div className="mb-2 flex items-center gap-2">
          <button
            onClick={handleToggle}
            className="text-xs px-2 py-1 bg-[var(--color-bg-subtle)] hover:bg-[var(--color-bg-muted)] border border-[var(--color-border-default)] rounded transition-colors"
          >
            {showRaw ? "Decoded" : "Raw XDR"}
          </button>
        </div>
      )}
      {showRaw && rawValue ? (
        <RawValue value={rawValue} />
      ) : (
        <SorobanNode
          value={parseValue(value)}
          depth={0}
          initialExpandedDepth={initialExpandedDepth}
        />
      )}
    </div>
  );
}
