# SEO Data Collection SDK - Usage Guide

## Installation & Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the SDK

```bash
# Production build (minified)
npm run build

# Development build (with source maps)
npm run dev
```

The built files will be in the `dist/` directory:

- `seo-sdk.min.js` - Production build (minified)
- `seo-sdk.js` - Development build

## Integration Examples

### Simple Integration

```html
<!DOCTYPE html>
<html>
  <head>
    <title>My Website</title>
  </head>
  <body>
    <h1>Welcome to My Website</h1>
    <p>Content here...</p>

    <!-- Load SDK -->
    <script src="path/to/seo-sdk.min.js"></script>

    <!-- Initialize -->
    <script>
      const seoSDK = new SEODataSDK({
        apiEndpoint: 'https://your-api.com/analytics',
        apiKey: 'your-api-key',
        primaryKeyword: 'your focus keyword',
      });
    </script>
  </body>
</html>
```

### With GDPR Consent

```javascript
const seoSDK = new SEODataSDK({
  apiEndpoint: 'https://your-api.com/analytics',
  apiKey: 'your-api-key',
  privacyMode: 'opt-in',
});

// Show consent banner
seoSDK.requestConsent().then(hasConsent => {
  if (hasConsent) {
    seoSDK.init();
  }
});
```

### React Integration

```javascript
import SEODataSDK from 'seo-data-collection-sdk';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    const seoSDK = new SEODataSDK({
      apiEndpoint: process.env.REACT_APP_API_ENDPOINT,
      apiKey: process.env.REACT_APP_API_KEY,
      primaryKeyword: 'your keyword',
    });

    return () => {
      seoSDK.destroy();
    };
  }, []);

  return <div>Your app...</div>;
}
```

### Vue Integration

```javascript
<template>
  <div id="app">
    <!-- Your content -->
  </div>
</template>

<script>
import SEODataSDK from 'seo-data-collection-sdk';

export default {
  name: 'App',
  mounted() {
    this.seoSDK = new SEODataSDK({
      apiEndpoint: process.env.VUE_APP_API_ENDPOINT,
      apiKey: process.env.VUE_APP_API_KEY
    });
  },
  beforeDestroy() {
    if (this.seoSDK) {
      this.seoSDK.destroy();
    }
  }
};
</script>
```

### Next.js Integration

```javascript
// pages/_app.js
import { useEffect } from 'react';
import SEODataSDK from 'seo-data-collection-sdk';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const seoSDK = new SEODataSDK({
        apiEndpoint: process.env.NEXT_PUBLIC_API_ENDPOINT,
        apiKey: process.env.NEXT_PUBLIC_API_KEY,
      });

      return () => seoSDK.destroy();
    }
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
```

## Configuration Options

### Complete Configuration

```javascript
const config = {
  // Required
  apiEndpoint: 'https://your-api.com/analytics',
  apiKey: 'your-api-key',

  // Keyword Tracking
  primaryKeyword: 'seo keyword',

  // Batching
  batchInterval: 30000, // Send data every 30 seconds

  // Feature Toggles
  enableHeatmap: true,
  enableScrollTracking: true,
  enableClickTracking: true,

  // Privacy
  privacyMode: 'opt-in', // 'opt-in', 'opt-out', 'auto'
};

const seoSDK = new SEODataSDK(config);
```

## API Methods

### Initialization

```javascript
// Auto-initialize (if consent given)
const seoSDK = new SEODataSDK(config);

// Manual initialization
seoSDK.init();
```

### Data Collection

```javascript
// Collect data now
const data = await seoSDK.collectData();

// Send data immediately
await seoSDK.send();

// Get current data without sending
const currentData = seoSDK.getData();
```

### Keyword Management

```javascript
// Set initial keyword
const seoSDK = new SEODataSDK({
  primaryKeyword: 'initial keyword',
});

// Update keyword dynamically
seoSDK.setPrimaryKeyword('new keyword');
```

### Privacy Controls

```javascript
// Request consent
const hasConsent = await seoSDK.requestConsent();

// Check consent
if (seoSDK.hasConsent()) {
  // User has consented
}

// Opt out
seoSDK.optOut();
```

### Cleanup

```javascript
// Stop tracking and clean up
seoSDK.destroy();
```

## Data Format

### Collected Data Structure

```javascript
{
  sessionId: "session_1234567890_abc123",
  timestamp: 1234567890000,

  page: {
    url: "https://example.com/page",
    title: "Page Title",
    metaDescription: "Meta description...",
    h1Tags: ["Main Heading"],
    h2Tags: ["Section 1", "Section 2"],
    // ... more page data
  },

  performance: {
    loadTime: 1500,
    timeToFirstByte: 200,
    firstContentfulPaint: 800,
    largestContentfulPaint: 1200,
    cumulativeLayoutShift: 0.05,
    firstInputDelay: 50
  },

  keywords: {
    primaryKeyword: "seo",
    keywordDensity: 1.5,
    detectedKeywords: [
      {
        term: "seo",
        frequency: 15,
        density: 1.5,
        locations: ["title", "h1", "body"]
      }
    ]
  },

  engagement: {
    timeOnPage: 45000,
    scrollDepth: 75,
    bounced: false,
    clicks: [...],
    // ... more engagement data
  },

  serpFeatures: {
    featuredSnippetCandidate: true,
    hasFAQSchema: true,
    // ... more SERP features
  },

  issues: [
    {
      severity: "high",
      type: "missing-meta-description",
      title: "Missing Meta Description",
      description: "...",
      recommendation: "..."
    }
  ]
}
```

## Backend API Integration

### Expected API Endpoint

Your API endpoint should accept POST requests with the following format:

```javascript
// Request
POST https://your-api.com/analytics
Headers:
  Content-Type: application/json
  Authorization: Bearer your-api-key
  X-SDK-Version: 1.0.0

Body:
{
  "events": [
    { /* event 1 data */ },
    { /* event 2 data */ }
  ],
  "batchSize": 2,
  "timestamp": 1234567890000
}

// Response
{
  "success": true,
  "received": 2,
  "processed": 2
}
```

### Example Node.js/Express Handler

```javascript
app.post('/analytics', async (req, res) => {
  const { events, batchSize } = req.body;

  // Validate API key
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  if (!apiKey || !validateApiKey(apiKey)) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  // Process events
  try {
    for (const event of events) {
      await processEvent(event);
    }

    res.json({
      success: true,
      received: batchSize,
      processed: events.length,
    });
  } catch (error) {
    res.status(500).json({ error: 'Processing failed' });
  }
});
```

## Best Practices

### 1. Performance

```javascript
// Only enable features you need
const seoSDK = new SEODataSDK({
  enableHeatmap: false, // Disable if not needed
  enableScrollTracking: true,
  batchInterval: 60000, // Increase for less frequent sends
});
```

### 2. Privacy

```javascript
// Always use opt-in for GDPR compliance
const seoSDK = new SEODataSDK({
  privacyMode: 'opt-in',
});

// Request consent before tracking
await seoSDK.requestConsent();
```

### 3. SPA Support

```javascript
// The SDK automatically detects route changes
// But you can manually trigger collection on route change
router.afterEach(() => {
  seoSDK.collectData();
});
```

### 4. Error Handling

```javascript
try {
  const data = await seoSDK.collectData();
} catch (error) {
  console.error('SDK error:', error);
  // Handle gracefully
}
```

## Troubleshooting

### SDK not initializing

- Check that consent is given (for opt-in mode)
- Verify API endpoint and key are correct
- Check browser console for errors

### Data not being sent

- Verify API endpoint is accessible
- Check network tab for failed requests
- Ensure batch interval hasn't been set too high

### Performance issues

- Disable heatmap if not needed
- Increase batch interval
- Check for JavaScript errors

## Support

For issues and questions:

- GitHub Issues: https://github.com/your-repo/issues
- Email: support@example.com
- Documentation: https://docs.example.com
