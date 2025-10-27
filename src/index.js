/**
 * SEO Data Collection SDK
 * Lightweight, privacy-focused JavaScript SDK for comprehensive SEO tracking
 */

import PageDataCollector from './collectors/PageDataCollector';
import PerformanceCollector from './collectors/PerformanceCollector';
import KeywordAnalyzer from './analyzers/KeywordAnalyzer';
import EngagementTracker from './trackers/EngagementTracker';
import BacklinkDetector from './detectors/BacklinkDetector';
import SERPFeaturesDetector from './detectors/SERPFeaturesDetector';
import IssuesAnalyzer from './analyzers/IssuesAnalyzer';
import PrivacyManager from './core/PrivacyManager';
import DataBatcher from './core/DataBatcher';
import { generateSessionId } from './utils/helpers';

class SEODataSDK {
  constructor(config = {}) {
    this.config = {
      apiEndpoint: config.apiEndpoint || '',
      apiKey: config.apiKey || '',
      batchInterval: config.batchInterval || 30000, // 30 seconds
      enableHeatmap: config.enableHeatmap !== false,
      enableScrollTracking: config.enableScrollTracking !== false,
      enableClickTracking: config.enableClickTracking !== false,
      privacyMode: config.privacyMode || 'opt-in', // 'opt-in', 'opt-out', 'auto'
      primaryKeyword: config.primaryKeyword || null,
      ...config,
    };

    this.sessionId = generateSessionId();
    this.collectors = {};
    this.isInitialized = false;
    this.data = {};

    // Initialize privacy manager first
    this.privacyManager = new PrivacyManager(this.config.privacyMode);

    // Initialize data batcher
    this.dataBatcher = new DataBatcher(
      this.config.apiEndpoint,
      this.config.apiKey,
      this.config.batchInterval,
    );

    // Auto-initialize if privacy allows
    if (this.privacyManager.hasConsent()) {
      this.init();
    }
  }

  /**
   * Initialize SDK and start data collection
   */
  async init() {
    if (this.isInitialized) return;

    try {
      // Initialize collectors
      this.collectors.page = new PageDataCollector();
      this.collectors.performance = new PerformanceCollector();
      this.collectors.keywords = new KeywordAnalyzer(this.config.primaryKeyword);
      this.collectors.engagement = new EngagementTracker(this.sessionId, {
        enableHeatmap: this.config.enableHeatmap,
        enableScrollTracking: this.config.enableScrollTracking,
        enableClickTracking: this.config.enableClickTracking,
      });
      this.collectors.backlinks = new BacklinkDetector();
      this.collectors.serpFeatures = new SERPFeaturesDetector();
      this.collectors.issues = new IssuesAnalyzer();

      // Wait for page to be fully loaded
      if (document.readyState === 'loading') {
        await new Promise(resolve => {
          window.addEventListener('DOMContentLoaded', resolve, { once: true });
        });
      }

      // Collect initial data
      await this.collectData();

      // Set up observers for SPA support
      this.setupObservers();

      // Start engagement tracking
      this.collectors.engagement.start();

      // Schedule periodic data collection
      this.startPeriodicCollection();

      this.isInitialized = true;

      console.log('[SEO SDK] Initialized successfully');
    } catch (error) {
      console.error('[SEO SDK] Initialization error:', error);
    }
  }

  /**
   * Collect all SEO data
   */
  async collectData() {
    try {
      const [
        pageData,
        performanceData,
        keywordData,
        engagementData,
        backlinkData,
        serpFeaturesData,
      ] = await Promise.all([
        this.collectors.page.collect(),
        this.collectors.performance.collect(),
        this.collectors.keywords.analyze(),
        this.collectors.engagement.getData(),
        this.collectors.backlinks.detect(),
        this.collectors.serpFeatures.detect(),
      ]);

      // Analyze issues based on collected data
      const issues = this.collectors.issues.analyze({
        page: pageData,
        performance: performanceData,
        keywords: keywordData,
      });

      this.data = {
        sessionId: this.sessionId,
        timestamp: Date.now(),
        page: pageData.page,
        site: pageData.site,
        keywords: keywordData.keywords,
        contentQuality: keywordData.contentQuality,
        engagement: engagementData,
        backlinks: backlinkData,
        serpFeatures: serpFeaturesData,
        issues: issues,
        performance: performanceData,
      };

      console.log('[SEO SDK] Data collected successfully');

      // Add to batch queue
      this.dataBatcher.add(this.data);

      return this.data;
    } catch (error) {
      console.error('[SEO SDK] Data collection error:', error);
      return null;
    }
  }

  /**
   * Setup DOM observers for SPA support
   */
  setupObservers() {
    // Watch for URL changes (SPA navigation)
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        this.onPageChange();
      }
    }).observe(document, { subtree: true, childList: true });

    // Listen to popstate (back/forward navigation)
    window.addEventListener('popstate', () => this.onPageChange());

    // Listen to pushState/replaceState
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      this.onPageChange();
    };

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      this.onPageChange();
    };
  }

  /**
   * Handle page change (for SPAs)
   */
  async onPageChange() {
    console.log('[SEO SDK] Page change detected');

    // Wait a bit for content to load
    setTimeout(async () => {
      await this.collectData();
    }, 1000);
  }

  /**
   * Start periodic data collection
   */
  startPeriodicCollection() {
    // Collect engagement data more frequently
    this.engagementInterval = setInterval(() => {
      const engagementData = this.collectors.engagement.getData();
      if (engagementData && Object.keys(engagementData).length > 0) {
        this.dataBatcher.add({
          sessionId: this.sessionId,
          timestamp: Date.now(),
          engagement: engagementData,
        });
      }
    }, 10000); // Every 10 seconds

    // Full data collection less frequently
    this.fullCollectionInterval = setInterval(() => {
      this.collectData();
    }, 60000); // Every minute
  }

  /**
   * Manually trigger data collection and send
   */
  async send() {
    await this.collectData();
    return this.dataBatcher.flush();
  }

  /**
   * Set primary keyword for analysis
   */
  setPrimaryKeyword(keyword) {
    this.config.primaryKeyword = keyword;
    if (this.collectors.keywords) {
      this.collectors.keywords.setPrimaryKeyword(keyword);
    }
  }

  /**
   * Get current collected data
   */
  getData() {
    return this.data;
  }

  /**
   * Request user consent (GDPR)
   */
  requestConsent() {
    return this.privacyManager.requestConsent();
  }

  /**
   * Check if user has given consent
   */
  hasConsent() {
    return this.privacyManager.hasConsent();
  }

  /**
   * Opt out of tracking
   */
  optOut() {
    this.privacyManager.optOut();
    this.destroy();
  }

  /**
   * Clean up and stop tracking
   */
  destroy() {
    // Stop intervals
    if (this.engagementInterval) clearInterval(this.engagementInterval);
    if (this.fullCollectionInterval) clearInterval(this.fullCollectionInterval);

    // Stop engagement tracking
    if (this.collectors.engagement) {
      this.collectors.engagement.stop();
    }

    // Flush remaining data
    this.dataBatcher.flush();

    this.isInitialized = false;
    console.log('[SEO SDK] Destroyed');
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SEODataSDK;
}

if (typeof window !== 'undefined') {
  window.SEODataSDK = SEODataSDK;
}

export default SEODataSDK;
