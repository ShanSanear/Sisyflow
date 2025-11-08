# Feature Flag System

A universal TypeScript feature flag system that works on both frontend and backend with environment-based configuration.

## Overview

This system allows you to control feature availability based on:

- Environment (local, integration, prod)
- Environment variables for explicit overrides
- Opt-in approach (features disabled by default)

## Usage

### Basic Usage

```typescript
import { isFeatureEnabled, FeatureFlag } from "../features";

// Check if AI analysis is enabled
if (isFeatureEnabled(FeatureFlag.AI_ANALYSIS)) {
  // Enable AI analysis features
  console.log("AI analysis is enabled");
} else {
  // Use fallback behavior
  console.log("AI analysis is disabled");
}
```

### In Astro Pages

```astro
---
import { isFeatureEnabled, FeatureFlag } from "../features";

const aiAnalysisEnabled = isFeatureEnabled(FeatureFlag.AI_ANALYSIS);
---

{aiAnalysisEnabled ? <div>AI Analysis: Enabled</div> : <div>AI Analysis: Disabled</div>}
```

### In API Endpoints

```typescript
import { isFeatureEnabled, FeatureFlag } from "../../../features";

export const POST: APIRoute = async ({ request }) => {
  const aiAnalysisEnabled = isFeatureEnabled(FeatureFlag.AI_ANALYSIS);

  if (aiAnalysisEnabled) {
    // Use real AI analysis
    const result = await callOpenRouterAPI(request);
    return new Response(JSON.stringify(result));
  } else {
    // Return dummy data
    const dummyResult = getDummyAnalysis();
    return new Response(JSON.stringify(dummyResult));
  }
};
```

## Configuration

### Environment Variable

The system automatically maps `NODE_ENV` to environments:

- `NODE_ENV=development` → `DEV` environment
- `NODE_ENV=test` → `E2E` environment
- `NODE_ENV=production` → `PROD` environment

Unknown `NODE_ENV` values default to `DEV` with a warning.

### Feature Flag Overrides

Override default behavior using environment variables:

- `FEATURE_FLAG_AI_ANALYSIS=true` - Enable AI analysis
- `FEATURE_FLAG_AI_ANALYSIS=false` - Disable AI analysis

### Default Configuration

| Environment | AI_ANALYSIS |
| ----------- | ----------- |
| DEV         | ✅ Enabled  |
| E2E         | ❌ Disabled |
| PROD        | ❌ Disabled |

### Override Behavior

Environment variables take precedence over defaults:

- `FEATURE_FLAG_AI_ANALYSIS=true` → Forces feature ON (any environment)
- `FEATURE_FLAG_AI_ANALYSIS=false` → Forces feature OFF (any environment)
- No environment variable → Uses environment default

## Available Features

- `FeatureFlag.AI_ANALYSIS` - Controls AI analysis functionality (real API calls vs dummy data)

## Adding New Features

1. Add new enum value to `FeatureFlag` in `types.ts`
2. Update default configuration in `config.ts`
3. Add environment variable type to `env.d.ts`
4. Use `isFeatureEnabled()` to check feature status
