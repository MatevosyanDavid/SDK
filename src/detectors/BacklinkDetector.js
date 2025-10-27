/**
 * Backlink Detector
 * Detects and analyzes backlinks from referring domains
 */

class BacklinkDetector {
  constructor() {
    this.storageKey = 'seo_sdk_backlinks';
  }

  /**
   * Detect and analyze backlinks
   */
  detect() {
    const referrer = document.referrer;

    if (!referrer || this.isSameDomain(referrer)) {
      return null;
    }

    try {
      const referrerUrl = new URL(referrer);
      const currentUrl = window.location.href;

      const backlink = {
        referringDomain: referrerUrl.hostname,
        landingPage: currentUrl,
        anchorText: '', // Cannot be determined from client-side
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        visits: 1,
        referrerAnalysis: {
          pageTitle: '', // Would need to fetch the referring page
          domainAuthority: null, // Requires external API
          isDofollow: null, // Cannot be determined from client-side
        },
      };

      // Store and update backlink data
      this.storeBacklink(backlink);

      return backlink;
    } catch (error) {
      console.error('[Backlink Detector] Error:', error);
      return null;
    }
  }

  /**
   * Check if referrer is from the same domain
   */
  isSameDomain(referrer) {
    try {
      const referrerUrl = new URL(referrer);
      return referrerUrl.hostname === window.location.hostname;
    } catch {
      return true;
    }
  }

  /**
   * Store backlink data in localStorage
   */
  storeBacklink(backlink) {
    try {
      const stored = this.getStoredBacklinks();
      const key = `${backlink.referringDomain}|${backlink.landingPage}`;

      if (stored[key]) {
        // Update existing backlink
        stored[key].lastSeen = backlink.lastSeen;
        stored[key].visits++;
      } else {
        // New backlink
        stored[key] = backlink;
      }

      localStorage.setItem(this.storageKey, JSON.stringify(stored));
    } catch (error) {
      // localStorage might be disabled
      console.error('[Backlink Detector] Storage error:', error);
    }
  }

  /**
   * Get stored backlinks
   */
  getStoredBacklinks() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  /**
   * Get all backlinks for current domain
   */
  getAllBacklinks() {
    return Object.values(this.getStoredBacklinks());
  }
}

export default BacklinkDetector;
