type FeatureFlag = {
  name: string;
  description: string;
  enabled: boolean;
  expiry?: string;
};

const features: Record<string, FeatureFlag> = {
  analytics: {
    name: "analytics",
    description: "Privacy-respecting usage analytics (no personal data)",
    enabled: isFeatureEnabled("NEXT_PUBLIC_FEATURE_ANALYTICS", false),
    expiry: "2026-12-31",
  },
};

function isFeatureEnabled(envKey: string, defaultValue: boolean): boolean {
  if (typeof window === "undefined") {
    return defaultValue;
  }

  const envValue = process.env[envKey];
  if (envValue === undefined) {
    return defaultValue;
  }

  return envValue === "true" || envValue === "1" || envValue === "yes";
}

export function isEnabled(featureName: keyof typeof features): boolean {
  const feature = features[featureName];
  return feature ? feature.enabled : false;
}

export function getFeatureInfo(featureName: keyof typeof features): FeatureFlag | null {
  return features[featureName] || null;
}

export function listFeatures(): FeatureFlag[] {
  return Object.values(features);
}
