// @vitest-environment jsdom
/**
 * The cancellation rules every client-side fetch in the app leans on.
 *
 * The component-level suites cover what a stale answer does to the UI; these
 * are the rules underneath it — and the one case where cancelling would be
 * wrong: React StrictMode unmounts and immediately remounts every effect in
 * development, so a mount-once effect's request must survive that round trip
 * or development shows an empty page nothing will ever refill.
 */
import { StrictMode, useEffect, useRef } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import {
  useAbortScope,
  type AbortHandle,
  type AbortScope,
} from "./useAbortScope";

afterEach(cleanup);

/** Hands the test the scope the mounted component was given. */
function Probe({
  id,
  onScope,
}: {
  id?: string;
  onScope: (scope: AbortScope) => void;
}) {
  const scope = useAbortScope(id);
  useEffect(() => {
    onScope(scope);
  }, [scope, onScope]);
  return null;
}

describe("useAbortScope", () => {
  it("supersedes the request already in flight, so only the latest one counts", async () => {
    let scope!: AbortScope;
    const capture = (next: AbortScope) => {
      scope = next;
    };
    render(<Probe id="first" onScope={capture} />);

    const first = scope.next();
    const second = scope.next();

    expect(first.signal.aborted).toBe(true);
    expect(first.isCurrent()).toBe(false);
    expect(second.signal.aborted).toBe(false);
    expect(second.isCurrent()).toBe(true);
  });

  it("cancels a request when the inputs it was made with change", async () => {
    let scope!: AbortScope;
    const capture = (next: AbortScope) => {
      scope = next;
    };
    const { rerender } = render(<Probe id="GACCOUNT" onScope={capture} />);
    const request = scope.next();

    rerender(<Probe id="GOTHER" onScope={capture} />);

    expect(request.signal.aborted).toBe(true);
    expect(request.isCurrent()).toBe(false);
  });

  it("cancels what is still in flight when the component unmounts", async () => {
    let scope!: AbortScope;
    const capture = (next: AbortScope) => {
      scope = next;
    };
    const { unmount } = render(<Probe onScope={capture} />);
    const request = scope.next();

    unmount();
    // The teardown is queued rather than run inline, so a StrictMode remount
    // can claim it; one turn of the microtask queue is enough to see it land.
    await act(async () => {});

    expect(request.signal.aborted).toBe(true);
    expect(request.isCurrent()).toBe(false);
  });

  it("leaves a mount-once request alone through StrictMode's remount", async () => {
    let started!: AbortHandle;

    function SeedOnce() {
      const scope = useAbortScope();
      const seeded = useRef(false);
      useEffect(() => {
        // Deliberately not re-run: re-issuing would double up the work the
        // effect exists to do once. Its request still has to survive.
        if (seeded.current) return;
        seeded.current = true;
        started = scope.next();
      }, [scope]);
      return null;
    }

    render(
      <StrictMode>
        <SeedOnce />
      </StrictMode>,
    );
    await act(async () => {});

    expect(started.signal.aborted).toBe(false);
    expect(started.isCurrent()).toBe(true);
  });
});
