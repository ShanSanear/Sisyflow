/**
 * Feature Flag System Types
 *
 * This module provides a universal feature flag system that works on both
 * frontend and backend, with environment-based configuration.
 */

/**
 * Supported environments
 */
export type Environment = "DEV" | "E2E" | "PROD";

/**
 * Available feature flags
 */
export enum FeatureFlag {
  /** AI analysis functionality (real API calls vs dummy data) */
  AI_ANALYSIS = "ai_analysis",
}

/**
 * Feature flag configuration for a specific environment
 */
export interface EnvironmentFeatureConfig {
  /** Default enabled features for this environment */
  defaults: FeatureFlag[];
}

/**
 * Complete feature flag configuration across all environments
 */
export interface FeatureFlagConfig {
  DEV: EnvironmentFeatureConfig;
  E2E: EnvironmentFeatureConfig;
  PROD: EnvironmentFeatureConfig;
}

/**
 * Feature flag manager interface
 */
export interface FeatureFlagManager {
  /** Check if a feature is enabled */
  isEnabled(flag: FeatureFlag): boolean;
  /** Get the current environment */
  getEnvironment(): Environment;
  /** Get all enabled features */
  getEnabledFeatures(): FeatureFlag[];
}
