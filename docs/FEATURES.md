# Feature Flags

This document describes how feature flags work in Lumina, when to use them, and how to manage their lifecycle.

## Overview

Feature flags allow incomplete features to merge and deploy disabled, avoiding long-lived branches that diverge from main. They are configured via environment variables and default to disabled.

## Using a Feature Flag

### Check if a feature is enabled

In client code:

```typescript
import { isEnabled } from "@/lib/features";

if (isEnabled("analytics")) {
  // Feature-specific code
}
```

In server code:

```typescript
import { isEnabled } from "@/lib/features";

export default function MyComponent() {
  if (!isEnabled("myFeature")) {
    return null;
  }
  // Component code
}
```

### Get feature info

```typescript
import { getFeatureInfo } from "@/lib/features";

const feature = getFeatureInfo("analytics");
if (feature) {
  console.log(feature.description);
  console.log(feature.expiry);
}
```

## Adding a New Feature

1. Add the feature to `lib/features.ts`:

```typescript
const features: Record<string, FeatureFlag> = {
  myFeature: {
    name: "myFeature",
    description: "Description of what this feature does",
    enabled: isFeatureEnabled("NEXT_PUBLIC_FEATURE_MY_FEATURE", false),
    expiry: "2026-12-31", // When to remove this flag
  },
};
```

2. Enable in development or production via environment variable:

```bash
NEXT_PUBLIC_FEATURE_MY_FEATURE=true npm run dev
# or in .env.local
echo "NEXT_PUBLIC_FEATURE_MY_FEATURE=true" >> .env.local
```

3. Wrap incomplete code with the feature check:

```typescript
if (isEnabled("myFeature")) {
  // Your feature code
}
```

## Removing a Feature

Once a feature is stable and no longer needs the flag:

1. Delete the feature from `lib/features.ts`
2. Remove all `isEnabled("featureName")` checks
3. Keep the feature code, run the full test suite to ensure nothing broke
4. Open a PR with the cleanup

Expiry dates in feature definitions are advisory - rely on code review to catch stale flags.

## Current Features

| Feature      | Status   | Expiry     | Purpose                                                    |
| ------------ | -------- | ---------- | ---------------------------------------------------------- |
| `analytics`  | Disabled | 2026-12-31 | Privacy-respecting usage tracking without personal data    |

## Privacy & Analytics

The `analytics` feature enables aggregate route and feature usage tracking. It does not collect:

- IP addresses
- User identifiers
- Wallet addresses or any personal data
- Session cookies or tracking identifiers beyond session-scoped aggregates

Data collected:

- Route changes (page views by path, not specific values)
- Feature usage (which features are used, not by whom)

Users can opt out via localStorage: see `lib/analytics.ts` for the `setOptOut()` method.

The analytics endpoint is at `/api/analytics` and requires the request to validate.
