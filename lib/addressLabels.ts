/**
 * Local address labeling system.
 *
 * Users can assign local labels to Stellar addresses. Labels are stored in
 * localStorage and displayed throughout the app wherever addresses appear.
 * The real address remains accessible.
 */

export const ADDRESS_LABELS_KEY = "lumina.addressLabels";

export interface AddressLabels {
  [address: string]: string;
}

export function readLabels(): AddressLabels {
  try {
    const stored = window.localStorage.getItem(ADDRESS_LABELS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function saveLabels(labels: AddressLabels): void {
  try {
    window.localStorage.setItem(ADDRESS_LABELS_KEY, JSON.stringify(labels));
  } catch {
    // localStorage not available or full.
  }
}

export function getLabel(address: string): string | undefined {
  try {
    const labels = readLabels();
    return labels[address];
  } catch {
    return undefined;
  }
}

export function setLabel(address: string, label: string): void {
  const labels = readLabels();
  if (label) {
    labels[address] = label;
  } else {
    delete labels[address];
  }
  saveLabels(labels);
}

export function removeLabel(address: string): void {
  setLabel(address, "");
}

export function exportLabels(): string {
  const labels = readLabels();
  return JSON.stringify(labels, null, 2);
}

export function importLabels(json: string): boolean {
  try {
    const parsed = JSON.parse(json) as AddressLabels;
    if (typeof parsed === "object" && !Array.isArray(parsed)) {
      saveLabels(parsed);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
