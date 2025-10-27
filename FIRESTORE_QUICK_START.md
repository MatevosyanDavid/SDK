# 🔥 Firestore Quick Start

## Problem Analysis

**Current Issue:** 5-second batching = 17,280 writes/day per user

- Firestore free tier: 20,000 writes/day total
- Cost with 1K users: ~$30/day (too expensive!)

## ✅ Solution: Smart Storage Strategy

### Recommended Configuration

```javascript
const seoSDK = new SEODataSDK({
  primaryKeyword: 'your keyword',
  batchInterval: 600000, // 10 minutes

  onDataCollected: async payload => {
    // Save to Firestore
    for (const event of payload.events) {
      await addDoc(collection(db, 'seo_data'), event);
    }
  },
});
```

### When Data is Stored

1. **Page Load/Navigation** (automatic) - Main trigger
2. **Every 10 minutes** (backup) - Safety net
3. **Page Unload** (automatic) - Catch remaining data

### Result

- ✅ ~5-10 writes per user session (instead of 17,280!)
- ✅ Cost: ~$0.01 per 1,000 users/day (instead of $30!)
- ✅ Captures all essential SEO data
- ✅ Works with Firestore free tier

## Quick Setup (3 steps)

### 1. Install SDK

```bash
npm install seo-data-collection-sdk firebase
```

### 2. Add to Your Project

```javascript
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import SEODataSDK from 'seo-data-collection-sdk';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const seoSDK = new SEODataSDK({
  primaryKeyword: 'your keyword',
  batchInterval: 600000,
  onDataCollected: async payload => {
    for (const event of payload.events) {
      await addDoc(collection(db, 'seo_data'), event);
    }
  },
});
```

### 3. Done! ✅

Data will be automatically stored in Firestore on:

- Page changes
- Every 10 minutes
- Page unload

## Cost Comparison

| Users  | Old (5s) | New (Page-based) | Savings |
| ------ | -------- | ---------------- | ------- |
| 100    | $3/day   | $0.001/day       | 99.97%  |
| 1,000  | $30/day  | $0.01/day        | 99.97%  |
| 10,000 | $300/day | $0.10/day        | 99.97%  |

## Full Documentation

See [FIRESTORE_INTEGRATION.md](./FIRESTORE_INTEGRATION.md) for:

- Multiple storage strategies
- Cost optimization tips
- Advanced configurations
- Next.js examples
