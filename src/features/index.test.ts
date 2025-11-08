import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { FeatureFlag, getFeatureFlagManager, isFeatureEnabled, resetFeatureFlagManager } from "./index";

describe("Feature Flag System", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment for each test
    process.env = { ...originalEnv };
    // Reset the singleton instance
    resetFeatureFlagManager();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("Environment Detection", () => {
    it("should default to DEV environment", () => {
      delete process.env.NODE_ENV;
      const manager = getFeatureFlagManager();
      expect(manager.getEnvironment()).toBe("DEV");
    });

    it("should map development to DEV", () => {
      process.env.NODE_ENV = "development";
      const manager = getFeatureFlagManager();
      expect(manager.getEnvironment()).toBe("DEV");
    });

    it("should map test to E2E", () => {
      process.env.NODE_ENV = "test";
      const manager = getFeatureFlagManager();
      expect(manager.getEnvironment()).toBe("E2E");
    });

    it("should map production to PROD", () => {
      process.env.NODE_ENV = "production";
      const manager = getFeatureFlagManager();
      expect(manager.getEnvironment()).toBe("PROD");
    });

    it("should default to DEV for unknown NODE_ENV and log warning", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      process.env.NODE_ENV = "staging";
      const manager = getFeatureFlagManager();
      expect(manager.getEnvironment()).toBe("DEV");
      expect(consoleSpy).toHaveBeenCalledWith(
        'Unknown NODE_ENV "staging". Defaulting to "DEV". Valid NODE_ENV values: development, test, production'
      );
      consoleSpy.mockRestore();
    });
  });

  describe("Feature Flag Logic", () => {
    it("should enable AI_ANALYSIS by default in DEV environment", () => {
      process.env.NODE_ENV = "development";
      expect(isFeatureEnabled(FeatureFlag.AI_ANALYSIS)).toBe(true);
    });

    it("should disable AI_ANALYSIS by default in E2E environment", () => {
      process.env.NODE_ENV = "test";
      expect(isFeatureEnabled(FeatureFlag.AI_ANALYSIS)).toBe(false);
    });

    it("should disable AI_ANALYSIS by default in PROD environment", () => {
      process.env.NODE_ENV = "production";
      expect(isFeatureEnabled(FeatureFlag.AI_ANALYSIS)).toBe(false);
    });

    it("should allow environment variable override", () => {
      process.env.NODE_ENV = "test"; // Maps to E2E
      process.env.FEATURE_FLAG_AI_ANALYSIS = "true";
      expect(isFeatureEnabled(FeatureFlag.AI_ANALYSIS)).toBe(true);
    });
  });

  describe("Manager Methods", () => {
    it("should return singleton instance", () => {
      const manager1 = getFeatureFlagManager();
      const manager2 = getFeatureFlagManager();
      expect(manager1).toBe(manager2);
    });
  });
});
