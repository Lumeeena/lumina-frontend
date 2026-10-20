import { isEnabled } from "./features";

export interface AnalyticsEvent {
  event: string;
  route?: string;
  feature?: string;
  timestamp: number;
}

class Analytics {
  private isEnabled: boolean;
  private sessionId: string;
  private endpoint: string;

  constructor() {
    this.isEnabled = isEnabled("analytics");
    this.sessionId = this.generateSessionId();
    this.endpoint = "/api/analytics";
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  trackPageView(route: string): void {
    if (!this.isEnabled) return;

    this.sendEvent({
      event: "pageView",
      route,
      timestamp: Date.now(),
    });
  }

  trackFeatureUsage(featureName: string): void {
    if (!this.isEnabled) return;

    this.sendEvent({
      event: "featureUsage",
      feature: featureName,
      timestamp: Date.now(),
    });
  }

  private async sendEvent(event: AnalyticsEvent): Promise<void> {
    if (!this.isEnabled) return;

    try {
      await fetch(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...event,
          sessionId: this.sessionId,
        }),
      });
    } catch (error) {
      console.debug("Analytics tracking failed:", error);
    }
  }

  setOptOut(optOut: boolean): void {
    if (optOut) {
      localStorage.setItem("analyticsOptOut", "true");
    } else {
      localStorage.removeItem("analyticsOptOut");
    }
  }

  isOptedOut(): boolean {
    return typeof window !== "undefined" && localStorage.getItem("analyticsOptOut") === "true";
  }
}

export const analytics = new Analytics();
