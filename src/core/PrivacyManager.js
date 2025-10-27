/**
 * Privacy Manager
 * Handles GDPR compliance, user consent, and privacy controls
 */

class PrivacyManager {
  constructor(mode = 'opt-in') {
    this.mode = mode; // 'opt-in', 'opt-out', 'auto'
    this.storageKey = 'seo_sdk_consent';
    this.consentGiven = false;

    this.init();
  }

  /**
   * Initialize privacy manager
   */
  init() {
    // Check stored consent
    const stored = this.getStoredConsent();

    if (stored !== null) {
      this.consentGiven = stored;
    } else {
      // Set default based on mode
      if (this.mode === 'opt-out' || this.mode === 'auto') {
        this.consentGiven = true;
      } else {
        this.consentGiven = false;
      }
    }
  }

  /**
   * Check if user has given consent
   */
  hasConsent() {
    return this.consentGiven;
  }

  /**
   * Request user consent (GDPR)
   */
  requestConsent() {
    return new Promise(resolve => {
      // Create consent banner
      const banner = this.createConsentBanner();
      document.body.appendChild(banner);

      // Handle accept button
      const acceptBtn = banner.querySelector('.seo-sdk-consent-accept');
      acceptBtn.addEventListener('click', () => {
        this.giveConsent();
        banner.remove();
        resolve(true);
      });

      // Handle reject button
      const rejectBtn = banner.querySelector('.seo-sdk-consent-reject');
      rejectBtn.addEventListener('click', () => {
        this.rejectConsent();
        banner.remove();
        resolve(false);
      });
    });
  }

  /**
   * Create consent banner HTML
   */
  createConsentBanner() {
    const banner = document.createElement('div');
    banner.className = 'seo-sdk-consent-banner';
    banner.innerHTML = `
      <div class="seo-sdk-consent-content">
        <p>We use analytics to improve your experience and our website. Do you consent to data collection?</p>
        <div class="seo-sdk-consent-buttons">
          <button class="seo-sdk-consent-accept">Accept</button>
          <button class="seo-sdk-consent-reject">Reject</button>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .seo-sdk-consent-banner {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: #2c3e50;
        color: white;
        padding: 20px;
        z-index: 999999;
        box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      .seo-sdk-consent-content {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
      }
      .seo-sdk-consent-content p {
        margin: 0;
        flex: 1;
      }
      .seo-sdk-consent-buttons {
        display: flex;
        gap: 10px;
      }
      .seo-sdk-consent-buttons button {
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: opacity 0.2s;
      }
      .seo-sdk-consent-buttons button:hover {
        opacity: 0.9;
      }
      .seo-sdk-consent-accept {
        background: #27ae60;
        color: white;
      }
      .seo-sdk-consent-reject {
        background: #95a5a6;
        color: white;
      }
      @media (max-width: 768px) {
        .seo-sdk-consent-content {
          flex-direction: column;
          text-align: center;
        }
        .seo-sdk-consent-buttons {
          width: 100%;
          justify-content: center;
        }
      }
    `;
    banner.appendChild(style);

    return banner;
  }

  /**
   * Give consent
   */
  giveConsent() {
    this.consentGiven = true;
    this.storeConsent(true);
    console.log('[Privacy Manager] Consent given');
  }

  /**
   * Reject consent
   */
  rejectConsent() {
    this.consentGiven = false;
    this.storeConsent(false);
    console.log('[Privacy Manager] Consent rejected');
  }

  /**
   * Opt out of tracking
   */
  optOut() {
    this.consentGiven = false;
    this.storeConsent(false);
    console.log('[Privacy Manager] Opted out');
  }

  /**
   * Opt in to tracking
   */
  optIn() {
    this.consentGiven = true;
    this.storeConsent(true);
    console.log('[Privacy Manager] Opted in');
  }

  /**
   * Store consent in localStorage
   */
  storeConsent(consent) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(consent));
    } catch (error) {
      console.error('[Privacy Manager] Storage error:', error);
    }
  }

  /**
   * Get stored consent
   */
  getStoredConsent() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  /**
   * Clear stored consent
   */
  clearConsent() {
    try {
      localStorage.removeItem(this.storageKey);
      this.consentGiven = false;
    } catch (error) {
      console.error('[Privacy Manager] Storage error:', error);
    }
  }

  /**
   * Anonymize data (remove PII)
   */
  anonymizeData(data) {
    // Clone data to avoid modifying original
    const anonymized = JSON.parse(JSON.stringify(data));

    // Remove or hash potentially identifying information
    if (anonymized.engagement) {
      // Keep only country-level geography
      if (anonymized.engagement.city) delete anonymized.engagement.city;
      if (anonymized.engagement.region) delete anonymized.engagement.region;

      // Remove exact screen resolution (keep device type only)
      if (anonymized.engagement.screenResolution) {
        delete anonymized.engagement.screenResolution;
      }
    }

    return anonymized;
  }
}

export default PrivacyManager;
