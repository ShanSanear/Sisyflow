import type { FeatureFlagConfig } from "./types";
import { FeatureFlag } from "./types";

/**
 * Feature flag configuration
 *
 * Environment variable format: FEATURE_FLAG_{FLAG_NAME}
 * Example: FEATURE_FLAG_AI_ANALYSIS=true
 */
export const FEATURE_FLAG_CONFIG: FeatureFlagConfig = {
  // DEV environment: Enable everything for development
  DEV: {
    defaults: [FeatureFlag.AI_ANALYSIS],
  },
  // E2E environment: Enable only stable features
  E2E: {
    defaults: [],
  },
  // PROD environment: Enable only thoroughly tested features
  PROD: {
    defaults: [],
  },
};

/**
 * Get feature flag override from environment variable
 */
export function getFeatureFlagOverride(flag: FeatureFlag): boolean | undefined {
  const envVar = `FEATURE_FLAG_${flag.toUpperCase()}`;
  // Use process.env (import.meta.env doesn't support dynamic access in all environments)
  const value = process.env[envVar];

  if (value === undefined) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;

  // Invalid value, treat as undefined
  console.warn(`Invalid feature flag value for ${envVar}: "${value}". Expected "true" or "false".`);
  return undefined;
}

/**
 * Get all feature flag overrides from environment variables
 */
export function getAllFeatureFlagOverrides(): Partial<Record<FeatureFlag, boolean>> {
  const overrides: Partial<Record<FeatureFlag, boolean>> = {};

  // Check all enum values
  Object.values(FeatureFlag).forEach((flag) => {
    const override = getFeatureFlagOverride(flag);
    if (override !== undefined) {
      overrides[flag] = override;
    }
  });

  return overrides;
}
