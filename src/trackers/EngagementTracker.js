/**
 * Engagement Tracker
 * Tracks user behavior, interactions, and engagement metrics
 */

import { getUserAgent, getDeviceType } from '../utils/helpers';

class EngagementTracker {
  constructor(sessionId, options = {}) {
    this.sessionId = sessionId;
    this.options = {
      enableHeatmap: options.enableHeatmap !== false,
      enableScrollTracking: options.enableScrollTracking !== false,
      enableClickTracking: options.enableClickTracking !== false,
    };

    this.data = {
      sessionId,
      timestamp: Date.now(),
      referrer: document.referrer,
      utmParams: this.getUTMParams(),
      device: getDeviceType(),
      browser: this.getBrowser(),
      os: this.getOS(),
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timeOnPage: 0,
      scrollDepth: 0,
      bounced: true,
      exitPage: false,
      pagesViewed: 1,
      clicks: [],
      mouseMovements: [],
      scrollEvents: [],
    };

    this.startTime = Date.now();
    this.maxScrollDepth = 0;
    this.isTracking = false;
    this.listeners = [];
  }

  /**
   * Start tracking user engagement
   */
  start() {
    if (this.isTracking) return;

    this.isTracking = true;

    // Track time on page
    this.timeInterval = setInterval(() => {
      this.data.timeOnPage = Date.now() - this.startTime;

      // Not bounced if user stays > 30 seconds
      if (this.data.timeOnPage > 30000) {
        this.data.bounced = false;
      }
    }, 1000);

    // Track scroll depth
    if (this.options.enableScrollTracking) {
      this.addListener(window, 'scroll', this.handleScroll.bind(this));
    }

    // Track clicks
    if (this.options.enableClickTracking) {
      this.addListener(document, 'click', this.handleClick.bind(this));
    }

    // Track mouse movements (for heatmap)
    if (this.options.enableHeatmap) {
      this.addListener(document, 'mousemove', this.handleMouseMove.bind(this));
    }

    // Track page visibility
    this.addListener(document, 'visibilitychange', this.handleVisibilityChange.bind(this));

    // Track beforeunload (exit)
    this.addListener(window, 'beforeunload', this.handleBeforeUnload.bind(this));

    console.log('[Engagement Tracker] Started');
  }

  /**
   * Stop tracking
   */
  stop() {
    if (!this.isTracking) return;

    this.isTracking = false;

    // Clear interval
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }

    // Remove all event listeners
    this.listeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.listeners = [];

    console.log('[Engagement Tracker] Stopped');
  }

  /**
   * Add event listener and keep track of it
   */
  addListener(element, event, handler) {
    element.addEventListener(event, handler);
    this.listeners.push({ element, event, handler });
  }

  /**
   * Handle scroll events
   */
  handleScroll() {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    const scrollPercentage = Math.round(((scrollTop + windowHeight) / documentHeight) * 100);

    if (scrollPercentage > this.maxScrollDepth) {
      this.maxScrollDepth = scrollPercentage;
      this.data.scrollDepth = this.maxScrollDepth;

      // Record scroll event
      this.data.scrollEvents.push({
        depth: scrollPercentage,
        timestamp: Date.now(),
      });

      // Limit scroll events to last 50
      if (this.data.scrollEvents.length > 50) {
        this.data.scrollEvents = this.data.scrollEvents.slice(-50);
      }
    }

    // Not bounced if user scrolls
    if (scrollPercentage > 25) {
      this.data.bounced = false;
    }
  }

  /**
   * Handle click events
   */
  handleClick(event) {
    const target = event.target;

    // Get CSS selector for the clicked element
    const selector = this.getElementSelector(target);

    this.data.clicks.push({
      element: selector,
      timestamp: Date.now(),
      x: event.clientX,
      y: event.clientY,
    });

    // Limit clicks to last 100
    if (this.data.clicks.length > 100) {
      this.data.clicks = this.data.clicks.slice(-100);
    }

    // Not bounced if user clicks
    this.data.bounced = false;
  }

  /**
   * Handle mouse move events (throttled for performance)
   */
  handleMouseMove(event) {
    // Throttle to every 100ms
    if (!this.lastMouseMove || Date.now() - this.lastMouseMove > 100) {
      this.lastMouseMove = Date.now();

      this.data.mouseMovements.push({
        x: event.clientX,
        y: event.clientY,
        timestamp: Date.now(),
      });

      // Limit to last 500 movements
      if (this.data.mouseMovements.length > 500) {
        this.data.mouseMovements = this.data.mouseMovements.slice(-500);
      }
    }
  }

  /**
   * Handle visibility change
   */
  handleVisibilityChange() {
    if (document.hidden) {
      // User switched tabs or minimized
      this.data.timeOnPage = Date.now() - this.startTime;
    }
  }

  /**
   * Handle before unload
   */
  handleBeforeUnload() {
    this.data.exitPage = true;
    this.data.timeOnPage = Date.now() - this.startTime;
  }

  /**
   * Get CSS selector for an element
   */
  getElementSelector(element) {
    if (element.id) {
      return `#${element.id}`;
    }

    if (element.className && typeof element.className === 'string') {
      const classes = element.className.trim().split(/\s+/).slice(0, 2).join('.');
      if (classes) {
        return `${element.tagName.toLowerCase()}.${classes}`;
      }
    }

    return element.tagName.toLowerCase();
  }

  /**
   * Get UTM parameters from URL
   */
  getUTMParams() {
    const params = new URLSearchParams(window.location.search);

    return {
      source: params.get('utm_source') || '',
      medium: params.get('utm_medium') || '',
      campaign: params.get('utm_campaign') || '',
      term: params.get('utm_term') || '',
      content: params.get('utm_content') || '',
    };
  }

  /**
   * Get browser name
   */
  getBrowser() {
    const ua = navigator.userAgent;

    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    if (ua.includes('Opera')) return 'Opera';

    return 'Unknown';
  }

  /**
   * Get operating system
   */
  getOS() {
    const ua = navigator.userAgent;

    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';

    return 'Unknown';
  }

  /**
   * Get current engagement data
   */
  getData() {
    // Update time on page before returning
    this.data.timeOnPage = Date.now() - this.startTime;

    return { engagement: this.data };
  }

  /**
   * Increment pages viewed (for multi-page tracking)
   */
  incrementPagesViewed() {
    this.data.pagesViewed++;
    this.data.bounced = false;
  }
}

export default EngagementTracker;
