import type { Environment, FeatureFlagManager, EnvironmentFeatureConfig } from "./types";
import { FeatureFlag } from "./types";
import { FEATURE_FLAG_CONFIG, getAllFeatureFlagOverrides } from "./config";

/**
 * Get the current environment by mapping vite's MODE to our environment types
 * Maps: development → DEV, test → E2E, production → PROD
 * Defaults to 'DEV' for unknown MODE values and logs a warning
 */
function getCurrentEnvironment(): Environment {
  const mode = import.meta.env.MODE;

  switch (mode) {
    case "development":
      return "DEV";
    case "test":
      return "E2E";
    case "production":
      return "PROD";
    default:
      console.warn(`Unknown MODE "${mode}". Defaulting to "DEV". Valid MODE values: development, test, production`);
      return "DEV";
  }
}

/**
 * Feature Flag Manager Implementation
 *
 * Provides a universal way to check feature flags that works on both
 * frontend and backend with environment-based configuration.
 */
class FeatureFlagManagerImpl implements FeatureFlagManager {
  private environment: Environment;
  private config: EnvironmentFeatureConfig;
  private envOverrides: Partial<Record<FeatureFlag, boolean>>;

  constructor() {
    this.environment = getCurrentEnvironment();
    this.config = FEATURE_FLAG_CONFIG[this.environment];
    this.envOverrides = getAllFeatureFlagOverrides();
  }

  isEnabled(flag: FeatureFlag): boolean {
    // Check explicit environment variable override first
    if (this.envOverrides[flag] !== undefined) {
      return this.envOverrides[flag] as boolean;
    }

    // Check environment defaults (opt-in approach)
    return this.config.defaults.includes(flag);
  }

  getEnvironment(): Environment {
    return this.environment;
  }

  getEnabledFeatures(): FeatureFlag[] {
    // Get all possible feature flags
    const allFlags = Object.values(FeatureFlag) as FeatureFlag[];
    return allFlags.filter((flag) => this.isEnabled(flag));
  }
}

/**
 * Singleton instance of the feature flag manager
 */
let featureFlagManager: FeatureFlagManagerImpl | null = null;

/**
 * Get the feature flag manager instance
 * Creates a singleton to ensure consistent state across the application
 */
export function getFeatureFlagManager(): FeatureFlagManager {
  if (!featureFlagManager) {
    featureFlagManager = new FeatureFlagManagerImpl();
  }
  return featureFlagManager;
}

/**
 * Reset the feature flag manager (for testing purposes only)
 */
export function resetFeatureFlagManager(): void {
  featureFlagManager = null;
}

/**
 * Convenience function to check if a feature is enabled
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return getFeatureFlagManager().isEnabled(flag);
}

/**
 * Get the current environment (convenience function)
 */
export function getEnvironment(): Environment {
  return getFeatureFlagManager().getEnvironment();
}

/**
 * Get all currently enabled features
 */
export function getEnabledFeatures(): FeatureFlag[] {
  return getFeatureFlagManager().getEnabledFeatures();
}

// Export types and enums for convenience
export { FeatureFlag, type Environment, type FeatureFlagManager } from "./types";
