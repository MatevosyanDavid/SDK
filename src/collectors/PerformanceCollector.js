/**
 * Performance Collector
 * Collects web performance metrics using Navigation Timing API and Web Vitals
 */

class PerformanceCollector {
  constructor() {
    this.metrics = {};
  }

  /**
   * Collect all performance metrics
   */
  async collect() {
    return {
      loadTime: this.getLoadTime(),
      timeToFirstByte: this.getTimeToFirstByte(),
      firstContentfulPaint: await this.getFirstContentfulPaint(),
      largestContentfulPaint: await this.getLargestContentfulPaint(),
      cumulativeLayoutShift: await this.getCumulativeLayoutShift(),
      firstInputDelay: await this.getFirstInputDelay(),
      domContentLoaded: this.getDOMContentLoaded(),
      domInteractive: this.getDOMInteractive(),
    };
  }

  /**
   * Get total page load time
   */
  getLoadTime() {
    if (!window.performance || !window.performance.timing) return 0;

    const timing = window.performance.timing;
    const loadTime = timing.loadEventEnd - timing.navigationStart;

    return loadTime > 0 ? loadTime : 0;
  }

  /**
   * Get Time to First Byte (TTFB)
   */
  getTimeToFirstByte() {
    if (!window.performance || !window.performance.timing) return 0;

    const timing = window.performance.timing;
    const ttfb = timing.responseStart - timing.navigationStart;

    return ttfb > 0 ? ttfb : 0;
  }

  /**
   * Get First Contentful Paint (FCP)
   */
  async getFirstContentfulPaint() {
    return new Promise(resolve => {
      if (!window.PerformanceObserver) {
        resolve(0);
        return;
      }

      try {
        const observer = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              observer.disconnect();
              resolve(entry.startTime);
              return;
            }
          }
        });

        observer.observe({ entryTypes: ['paint'] });

        // Timeout after 10 seconds
        setTimeout(() => {
          observer.disconnect();
          resolve(0);
        }, 10000);
      } catch {
        resolve(0);
      }
    });
  }

  /**
   * Get Largest Contentful Paint (LCP)
   */
  async getLargestContentfulPaint() {
    return new Promise(resolve => {
      if (!window.PerformanceObserver) {
        resolve(0);
        return;
      }

      try {
        let lcp = 0;

        const observer = new PerformanceObserver(list => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          lcp = lastEntry.startTime;
        });

        observer.observe({ entryTypes: ['largest-contentful-paint'] });

        // Wait for page to be fully loaded
        window.addEventListener('load', () => {
          setTimeout(() => {
            observer.disconnect();
            resolve(lcp);
          }, 1000);
        });

        // Timeout after 15 seconds
        setTimeout(() => {
          observer.disconnect();
          resolve(lcp);
        }, 15000);
      } catch {
        resolve(0);
      }
    });
  }

  /**
   * Get Cumulative Layout Shift (CLS)
   */
  async getCumulativeLayoutShift() {
    return new Promise(resolve => {
      if (!window.PerformanceObserver) {
        resolve(0);
        return;
      }

      try {
        let cls = 0;

        const observer = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              cls += entry.value;
            }
          }
        });

        observer.observe({ entryTypes: ['layout-shift'] });

        // Measure CLS for 10 seconds after page load
        window.addEventListener('load', () => {
          setTimeout(() => {
            observer.disconnect();
            resolve(cls);
          }, 10000);
        });

        // Timeout after 20 seconds
        setTimeout(() => {
          observer.disconnect();
          resolve(cls);
        }, 20000);
      } catch {
        resolve(0);
      }
    });
  }

  /**
   * Get First Input Delay (FID)
   */
  async getFirstInputDelay() {
    return new Promise(resolve => {
      if (!window.PerformanceObserver) {
        resolve(0);
        return;
      }

      try {
        const observer = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            observer.disconnect();
            resolve(entry.processingStart - entry.startTime);
            return;
          }
        });

        observer.observe({ entryTypes: ['first-input'] });

        // Timeout after 30 seconds (user might not interact)
        setTimeout(() => {
          observer.disconnect();
          resolve(0);
        }, 30000);
      } catch {
        resolve(0);
      }
    });
  }

  /**
   * Get DOM Content Loaded time
   */
  getDOMContentLoaded() {
    if (!window.performance || !window.performance.timing) return 0;

    const timing = window.performance.timing;
    const dclTime = timing.domContentLoadedEventEnd - timing.navigationStart;

    return dclTime > 0 ? dclTime : 0;
  }

  /**
   * Get DOM Interactive time
   */
  getDOMInteractive() {
    if (!window.performance || !window.performance.timing) return 0;

    const timing = window.performance.timing;
    const interactiveTime = timing.domInteractive - timing.navigationStart;

    return interactiveTime > 0 ? interactiveTime : 0;
  }

  /**
   * Get resource timing data
   */
  getResourceTiming() {
    if (!window.performance || !window.performance.getEntriesByType) return [];

    const resources = window.performance.getEntriesByType('resource');

    return resources.map(resource => ({
      name: resource.name,
      type: resource.initiatorType,
      duration: resource.duration,
      size: resource.transferSize || 0,
    }));
  }
}

export default PerformanceCollector;
