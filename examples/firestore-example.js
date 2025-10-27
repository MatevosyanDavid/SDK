/**
 * Firestore Integration Example
 * Copy this to your Next.js/React project
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import SEODataSDK from 'seo-data-collection-sdk';

// Initialize Firebase
const firebaseConfig = {
  apiKey: 'AIzaSyCFNW8gZsd4QP1Cyy056Bu6NDJ6HhViFJE',
  authDomain: 'seo-metadata-f79a0.firebaseapp.com',
  databaseURL: 'https://seo-metadata-f79a0-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'seo-metadata-f79a0',
  storageBucket: 'seo-metadata-f79a0.firebasestorage.app',
  messagingSenderId: '402670906477',
  appId: '1:402670906477:web:885e295253f852e10fe364',
  measurementId: 'G-J48G8WXE2B',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ========================================
// RECOMMENDED: Page-Based Storage
// Writes: ~5-10 per session
// Cost: ~$0.01 per 1,000 users/day
// ========================================

const seoSDK = new SEODataSDK({
  primaryKeyword: 'your target keyword',
  batchInterval: 600000, // 10 minutes (backup only)

  onDataCollected: async payload => {
    console.log('📊 Saving data to Firestore...');

    for (const event of payload.events) {
      try {
        await addDoc(collection(db, 'seo_data'), {
          // Session info
          sessionId: event.sessionId,
          timestamp: Date.now(),

          // Page data
          page: {
            url: event.page.url,
            title: event.page.title,
            description: event.page.description,
            wordCount: event.page.wordCount,
            headings: event.page.headings,
          },

          // SEO analysis
          seo: {
            keywords: event.keywords?.slice(0, 10), // Top 10 keywords
            contentQuality: event.contentQuality,
            issuesCount: event.issues?.length || 0,
            topIssues: event.issues?.slice(0, 5), // Top 5 issues
          },

          // Performance metrics
          performance: {
            loadTime: event.performance?.loadTime,
            fcp: event.performance?.fcp,
            lcp: event.performance?.lcp,
            cls: event.performance?.cls,
            fid: event.performance?.fid,
          },

          // Engagement summary (aggregated)
          engagement: {
            clicks: event.engagement?.clicks?.length || 0,
            scrolls: event.engagement?.scrollEvents?.length || 0,
            maxScrollDepth: event.engagement?.maxScrollDepth || 0,
            timeOnPage: event.engagement?.totalTimeOnPage || 0,
          },

          // Additional data
          serpFeatures: event.serpFeatures,
          backlinks: event.backlinks,
        });

        console.log('✅ Data saved successfully');
      } catch (error) {
        console.error('❌ Firestore error:', error);
      }
    }
  },
});

// Optional: Store session summary on page unload
window.addEventListener('beforeunload', () => {
  seoSDK.dataBatcher.flush();
});

// Optional: Manually collect data on specific events
document.getElementById('checkout-button')?.addEventListener('click', async () => {
  await seoSDK.collectData();
  seoSDK.dataBatcher.flush();
});

export default seoSDK;
