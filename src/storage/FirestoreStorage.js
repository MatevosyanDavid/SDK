/**
 * Firestore Storage Strategy
 * Optimized for minimal writes while capturing essential SEO data
 */

class FirestoreStorage {
  constructor(firestore, options = {}) {
    this.db = firestore;
    this.options = {
      collection: options.collection || 'seo_data',
      // Storage strategy
      storeOnPageChange: options.storeOnPageChange !== false, // Default: true
      storeOnSessionEnd: options.storeOnSessionEnd !== false, // Default: true
      periodicInterval: options.periodicInterval || 600000, // Default: 10 minutes
      minTimeBetweenWrites: options.minTimeBetweenWrites || 60000, // Minimum 1 minute between writes
      ...options,
    };

    this.lastWriteTime = 0;
    this.sessionData = {
      pages: [],
      engagementSummary: {},
    };
  }

  /**
   * Store page-level SEO data (called on page load/change)
   * This is the primary storage method - writes once per page
   */
  async storePageData(data) {
    const now = Date.now();

    // Prevent too frequent writes
    if (now - this.lastWriteTime < this.options.minTimeBetweenWrites) {
      console.log('[Firestore] Skipping write - too soon since last write');
      return;
    }

    try {
      const docData = {
        sessionId: data.sessionId,
        timestamp: now,
        page: {
          url: data.page.url,
          title: data.page.title,
          description: data.page.description,
          keywords: data.page.keywords,
          wordCount: data.page.wordCount,
          headings: data.page.headings,
        },
        seo: {
          keywords: data.keywords,
          contentQuality: data.contentQuality,
          issues: data.issues,
        },
        performance: data.performance,
        serpFeatures: data.serpFeatures,
        backlinks: data.backlinks,
      };

      // Store in Firestore
      await this.db.collection(this.options.collection).add(docData);

      this.lastWriteTime = now;
      console.log('[Firestore] Page data stored successfully');

      // Track for session summary
      this.sessionData.pages.push({
        url: data.page.url,
        timestamp: now,
      });
    } catch (error) {
      console.error('[Firestore] Error storing page data:', error);
    }
  }

  /**
   * Store engagement summary (called periodically or on session end)
   * Aggregates engagement data to reduce writes
   */
  async storeEngagementSummary(sessionId, engagement) {
    try {
      const summary = {
        sessionId,
        timestamp: Date.now(),
        type: 'engagement_summary',
        engagement: {
          totalClicks: engagement.clicks?.length || 0,
          totalScrolls: engagement.scrollEvents?.length || 0,
          maxScrollDepth: engagement.maxScrollDepth || 0,
          timeOnPage: engagement.totalTimeOnPage || 0,
          pagesViewed: this.sessionData.pages.length,
          // Aggregate click data
          clicksByElement: this.aggregateClicks(engagement.clicks),
          // Aggregate scroll patterns
          scrollPattern: this.aggregateScrolls(engagement.scrollEvents),
        },
      };

      await this.db.collection(this.options.collection).add(summary);
      console.log('[Firestore] Engagement summary stored');
    } catch (error) {
      console.error('[Firestore] Error storing engagement:', error);
    }
  }

  /**
   * Aggregate click data to reduce storage size
   */
  aggregateClicks(clicks = []) {
    const aggregated = {};

    clicks.forEach(click => {
      const key = click.tagName || 'unknown';
      aggregated[key] = (aggregated[key] || 0) + 1;
    });

    return aggregated;
  }

  /**
   * Aggregate scroll data
   */
  aggregateScrolls(scrolls = []) {
    if (scrolls.length === 0) return {};

    const depths = scrolls.map(s => s.depth || 0);
    return {
      count: scrolls.length,
      avgDepth: depths.reduce((a, b) => a + b, 0) / depths.length,
      maxDepth: Math.max(...depths),
    };
  }

  /**
   * Store session summary (called once per session)
   * Most efficient - one write per entire user session
   */
  async storeSessionSummary(sessionId, allData) {
    try {
      const sessionSummary = {
        sessionId,
        timestamp: Date.now(),
        type: 'session_summary',
        duration: allData.engagement?.totalTimeOnPage || 0,
        pagesViewed: this.sessionData.pages.map(p => ({
          url: p.url,
          timestamp: p.timestamp,
        })),
        totalEngagement: {
          clicks: allData.engagement?.clicks?.length || 0,
          scrolls: allData.engagement?.scrollEvents?.length || 0,
          maxScrollDepth: allData.engagement?.maxScrollDepth || 0,
        },
        // Store only first and last page SEO data
        firstPage: this.sessionData.pages[0] || null,
        lastPage: this.sessionData.pages[this.sessionData.pages.length - 1] || null,
      };

      await this.db.collection(this.options.collection).add(sessionSummary);
      console.log('[Firestore] Session summary stored');

      // Reset session data
      this.sessionData = { pages: [], engagementSummary: {} };
    } catch (error) {
      console.error('[Firestore] Error storing session:', error);
    }
  }
}

export default FirestoreStorage;
