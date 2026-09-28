// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import TransactionFilters from "./TransactionFilters";
import { EMPTY_FILTERS } from "@/lib/transactionFilters";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("TransactionFilters source input", () => {
  it("keeps typing immediate and commits only the final value after a pause", () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    render(
      <TransactionFilters
        filters={EMPTY_FILTERS}
        onChange={onChange}
        presets={[]}
        onSavePreset={vi.fn()}
        onApplyPreset={vi.fn()}
        onDeletePreset={vi.fn()}
      />,
    );

    const input = screen.getByLabelText("Source account");
    fireEvent.change(input, { target: { value: "GAB" } });
    expect(input).toHaveValue("GAB");
    vi.advanceTimersByTime(200);
    fireEvent.change(input, { target: { value: "GABC" } });
    vi.advanceTimersByTime(299);
    expect(onChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ ...EMPTY_FILTERS, source: "GABC" });
  });
});
