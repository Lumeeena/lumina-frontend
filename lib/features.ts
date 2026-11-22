type FeatureFlag = {
  name: string;
  description: string;
  enabled: boolean;
  expiry?: string;
};

export const features: Record<string, FeatureFlag> = {
  analytics: {
    name: "analytics",
    description: "Privacy-respecting usage analytics (no personal data)",
    enabled: process.env.NEXT_PUBLIC_FEATURE_ANALYTICS === "true" || process.env.NEXT_PUBLIC_FEATURE_ANALYTICS === "1" || process.env.NEXT_PUBLIC_FEATURE_ANALYTICS === "yes",
    expiry: "2026-12-31",
  },
  webhooks: {
    name: "webhooks",
    description: "Webhook management for real-time event notifications",
    enabled: false,
  },
};

export function isEnabled(featureName: keyof typeof features): boolean {
  const feature = features[featureName];
  if (!feature) return false;
  const envKey = `NEXT_PUBLIC_FEATURE_${featureName.toUpperCase()}`;
  const envValue = process.env[envKey];
  if (envValue === undefined) {
    return feature.enabled;
  }
  return envValue === "true" || envValue === "1" || envValue === "yes";
}

export function getFeatureInfo(featureName: keyof typeof features): FeatureFlag | null {
  return features[featureName] || null;
}

export function listFeatures(): FeatureFlag[] {
  return Object.values(features);
}
