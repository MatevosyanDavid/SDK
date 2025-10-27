# Firestore Integration Guide

## 📊 Storage Strategy Comparison

| Strategy        | Writes/Day | Best For              | Cost (1K users) |
| --------------- | ---------- | --------------------- | --------------- |
| **Every 5s**    | 17,280     | ❌ Too expensive      | ~$30/day        |
| **Every 30s**   | 2,880      | Testing only          | ~$5/day         |
| **Every 10min** | 144        | Background tracking   | ~$0.25/day      |
| **Page Change** | 5-20       | ✅ **Recommended**    | ~$0.01/day      |
| **Session End** | 1          | ✅ **Most efficient** | ~$0.001/day     |

## ✅ Recommended: Strategy 1 - Page-Based Storage

**Best for:** Most use cases, captures all essential SEO data

```javascript
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// Initialize Firebase
const firebaseConfig = {
  /* your config */
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Initialize SDK with page-based storage
const seoSDK = new SEODataSDK({
  primaryKeyword: 'your keyword',
  batchInterval: 300000, // 5 minutes (backup)

  // Custom callback - called when data is collected
  onDataCollected: async payload => {
    // payload.events contains array of collected data
    for (const event of payload.events) {
      try {
        await addDoc(collection(db, 'seo_data'), {
          sessionId: event.sessionId,
          timestamp: Date.now(),
          page: {
            url: event.page.url,
            title: event.page.title,
            description: event.page.description,
            wordCount: event.page.wordCount,
          },
          seo: {
            keywords: event.keywords,
            issues: event.issues,
          },
          performance: event.performance,
        });
        console.log('✅ Data stored in Firestore');
      } catch (error) {
        console.error('❌ Firestore error:', error);
      }
    }
  },
});
```

**Result:** ~5-20 writes per user session (one per page view)

---

## 🎯 Strategy 2 - Session Summary (Most Efficient)

**Best for:** Large scale, cost optimization, aggregate analytics

```javascript
const seoSDK = new SEODataSDK({
  primaryKeyword: 'your keyword',
  batchInterval: 3600000, // 1 hour

  onDataCollected: async payload => {
    // Aggregate all events into one session summary
    const sessionSummary = {
      sessionId: payload.events[0]?.sessionId,
      timestamp: Date.now(),
      pagesViewed: payload.events.length,

      // Aggregate page data
      pages: payload.events.map(e => ({
        url: e.page.url,
        title: e.page.title,
        wordCount: e.page.wordCount,
      })),

      // Aggregate performance
      avgPerformance: {
        loadTime:
          payload.events.reduce((sum, e) => sum + (e.performance?.loadTime || 0), 0) /
          payload.events.length,
        fcp:
          payload.events.reduce((sum, e) => sum + (e.performance?.fcp || 0), 0) /
          payload.events.length,
      },

      // Total engagement
      totalEngagement: {
        clicks: payload.events.reduce((sum, e) => sum + (e.engagement?.clicks?.length || 0), 0),
        scrolls: payload.events.reduce(
          (sum, e) => sum + (e.engagement?.scrollEvents?.length || 0),
          0,
        ),
      },

      // SEO issues summary
      totalIssues: payload.events.reduce((sum, e) => sum + (e.issues?.length || 0), 0),
    };

    // Store ONE document per session
    await addDoc(collection(db, 'seo_sessions'), sessionSummary);
    console.log('✅ Session summary stored');
  },
});

// Store on page unload
window.addEventListener('beforeunload', () => {
  seoSDK.dataBatcher.flush();
});
```

**Result:** ~1 write per user session

---

## 🔥 Strategy 3 - Hybrid (Recommended for Most Apps)

**Combines page tracking + session summary**

```javascript
import FirestoreStorage from 'seo-data-collection-sdk/src/storage/FirestoreStorage';

const storage = new FirestoreStorage(db, {
  collection: 'seo_data',
  storeOnPageChange: true, // Store each page
  storeOnSessionEnd: true, // Store session summary
  periodicInterval: 600000, // Backup every 10 min
  minTimeBetweenWrites: 60000, // Min 1 minute between writes
});

const seoSDK = new SEODataSDK({
  primaryKeyword: 'your keyword',
  batchInterval: 600000, // 10 minutes

  onDataCollected: async payload => {
    const event = payload.events[0];
    if (!event) return;

    // Store page data
    await storage.storePageData(event);
  },
});

// Store session summary on exit
window.addEventListener('beforeunload', async () => {
  const data = seoSDK.getData();
  await storage.storeSessionSummary(seoSDK.sessionId, data);
});
```

---

## 🎨 Strategy 4 - Event-Based (Advanced)

**For specific events only (conversions, important pages)**

```javascript
const seoSDK = new SEODataSDK({
  primaryKeyword: 'your keyword',
  batchInterval: null, // Disable automatic batching
});

// Manually trigger storage on specific events
async function trackConversion() {
  const data = await seoSDK.collectData();

  await addDoc(collection(db, 'conversions'), {
    sessionId: seoSDK.sessionId,
    timestamp: Date.now(),
    page: data.page,
    performance: data.performance,
    engagement: data.engagement,
    conversionType: 'purchase',
  });
}

// Track specific pages
if (window.location.pathname === '/checkout/success') {
  trackConversion();
}
```

---

## 📱 Next.js Integration Example

```typescript
// app/components/SeoTracker.tsx
'use client';

import { useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function SeoTracker() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    import('seo-data-collection-sdk').then(module => {
      const SEODataSDK = module.default;

      const seoSDK = new SEODataSDK({
        primaryKeyword: document.title,
        batchInterval: 300000, // 5 minutes

        onDataCollected: async payload => {
          for (const event of payload.events) {
            try {
              await addDoc(collection(db, 'seo_data'), {
                ...event,
                timestamp: Date.now(),
              });
            } catch (error) {
              console.error('Firestore error:', error);
            }
          }
        },
      });
    });
  }, []);

  return null;
}
```

---

## 💰 Cost Optimization Tips

1. **Use Session Summary** - 1 write instead of 100+ writes
2. **Increase batch interval** - 10min instead of 30sec saves 95% costs
3. **Filter important pages** - Only track key pages (homepage, product pages)
4. **Aggregate engagement** - Store summaries, not individual events
5. **Use Firestore offline persistence** - Reduce reads

## 📈 Recommended Configuration

```javascript
// Best balance of cost vs. data quality
const seoSDK = new SEODataSDK({
  primaryKeyword: 'your keyword',
  batchInterval: 600000, // 10 minutes (only as backup)

  onDataCollected: async payload => {
    // This is called:
    // 1. On page change (SPA navigation)
    // 2. Every 10 minutes (backup)
    // 3. On page unload

    const event = payload.events[0];

    await addDoc(collection(db, 'seo_data'), {
      sessionId: event.sessionId,
      timestamp: Date.now(),
      page: {
        url: event.page.url,
        title: event.page.title,
        wordCount: event.page.wordCount,
      },
      seo: {
        keywords: event.keywords?.slice(0, 10), // Top 10 keywords only
        issueCount: event.issues?.length || 0,
      },
      performance: {
        loadTime: event.performance?.loadTime,
        fcp: event.performance?.fcp,
        lcp: event.performance?.lcp,
      },
    });
  },
});
```

**This configuration:**

- ✅ Writes ~5-10 times per session
- ✅ Costs ~$0.01 per 1,000 users/day
- ✅ Captures all essential SEO data
- ✅ Works perfectly with Firestore free tier
