# SEO Data Collection SDK

A lightweight, privacy-focused JavaScript SDK for collecting comprehensive SEO and website performance data from client websites.

## Features

- 📊 **Comprehensive SEO Data Collection**

  - Page-level metadata (titles, meta descriptions, headings)
  - Performance metrics (Core Web Vitals)
  - Keyword analysis and content quality
  - User engagement tracking
  - Backlink detection
  - SERP features analysis
  - SEO issues and recommendations

- 🔒 **Privacy-Focused**

  - GDPR compliant
  - Consent management
  - Cookie-less option
  - Data anonymization
  - Opt-out mechanism

- ⚡ **Performance Optimized**

  - Async loading
  - Bundle size < 50KB (gzipped)
  - Request batching
  - LocalStorage caching
  - Minimal performance impact

- 🎯 **Developer Friendly**
  - Easy integration
  - SPA support
  - Comprehensive documentation
  - TypeScript definitions (coming soon)

## Installation

### NPM

```bash
npm install seo-data-collection-sdk
```

### CDN

```html
<script src="https://cdn.example.com/seo-sdk.min.js"></script>
```

### Manual

Download `seo-sdk.min.js` from the releases page and include it in your HTML:

```html
<script src="/path/to/seo-sdk.min.js"></script>
```

## Quick Start

### Basic Usage

```javascript
// Initialize the SDK
const seoSDK = new SEODataSDK({
  apiEndpoint: 'https://your-api.com/analytics',
  apiKey: 'your-api-key',
  primaryKeyword: 'your focus keyword',
  privacyMode: 'opt-in', // 'opt-in', 'opt-out', or 'auto'
});

// SDK will automatically start collecting data
```

### With Consent Request

```javascript
const seoSDK = new SEODataSDK({
  apiEndpoint: 'https://your-api.com/analytics',
  apiKey: 'your-api-key',
  privacyMode: 'opt-in',
});

// Request user consent
seoSDK.requestConsent().then(hasConsent => {
  if (hasConsent) {
    seoSDK.init(); // Start tracking
  }
});
```

## Configuration Options

```javascript
const config = {
  // Required
  apiEndpoint: 'https://your-api.com/analytics', // Your API endpoint
  apiKey: 'your-api-key', // Your API key

  // Optional
  primaryKeyword: 'seo keyword', // Primary keyword to track
  batchInterval: 30000, // Batch send interval in ms (default: 30s)
  enableHeatmap: true, // Enable mouse movement tracking
  enableScrollTracking: true, // Enable scroll depth tracking
  enableClickTracking: true, // Enable click tracking
  privacyMode: 'opt-in', // Privacy mode: 'opt-in', 'opt-out', 'auto'
};

const seoSDK = new SEODataSDK(config);
```

## API Methods

### `init()`

Initialize and start data collection.

```javascript
seoSDK.init();
```

### `collectData()`

Manually trigger data collection.

```javascript
const data = await seoSDK.collectData();
console.log(data);
```

### `send()`

Manually send collected data to API.

```javascript
await seoSDK.send();
```

### `getData()`

Get current collected data without sending.

```javascript
const currentData = seoSDK.getData();
```

### `setPrimaryKeyword(keyword)`

Set or update the primary keyword for analysis.

```javascript
seoSDK.setPrimaryKeyword('new keyword');
```

### `requestConsent()`

Show consent banner and request user permission.

```javascript
const hasConsent = await seoSDK.requestConsent();
```

### `hasConsent()`

Check if user has given consent.

```javascript
if (seoSDK.hasConsent()) {
  // User has consented
}
```

### `optOut()`

Opt out of tracking and stop data collection.

```javascript
seoSDK.optOut();
```

### `destroy()`

Clean up and stop all tracking.

```javascript
seoSDK.destroy();
```

## Data Structure

The SDK collects the following data:

### Page Data

- URL, title, meta description
- Heading tags (H1-H4)
- Canonical URL, alternate URLs
- Word count, text-to-HTML ratio
- Images (with alt text analysis)
- Internal and external links
- Schema markup, Open Graph, Twitter Cards
- Mobile optimization

### Performance Metrics

- Load time, TTFB
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)
- First Input Delay (FID)

### Keyword Analysis

- Keyword density
- Keyword locations
- LSI keywords
- Content quality metrics
- Readability score

### User Engagement

- Time on page
- Scroll depth
- Bounce rate
- Click tracking
- Mouse movements (heatmap)
- Device and browser info
- UTM parameters

### SEO Issues

- Missing or problematic meta tags
- Performance issues
- Content quality issues
- Structured data opportunities

## Browser Support

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## Privacy & GDPR Compliance

The SDK is designed with privacy in mind:

1. **Consent Management**: Built-in consent banner and management
2. **No Cookies**: Uses localStorage instead of cookies
3. **Data Anonymization**: Can anonymize PII
4. **Opt-out**: Easy opt-out mechanism
5. **Transparency**: Clear data collection disclosure

## Performance Impact

The SDK is optimized for minimal performance impact:

- Async initialization
- Lazy loading of heavy features
- Debounced/throttled event handlers
- Efficient DOM queries
- Request batching

Typical performance impact: < 50ms on page load

## Development

### Build

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

### Testing

```bash
npm test
```

## License

MIT

## Support

For issues and questions, please open an issue on GitHub or contact support@example.com
