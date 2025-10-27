/**
 * Utility Helper Functions
 */

/**
 * Generate a unique session ID
 */
export function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get device type from user agent
 */
export function getDeviceType() {
  const ua = navigator.userAgent;

  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }

  if (
    /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
      ua,
    )
  ) {
    return 'mobile';
  }

  return 'desktop';
}

/**
 * Get user agent information
 */
export function getUserAgent() {
  return navigator.userAgent;
}

/**
 * Debounce function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Deep clone an object
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if running in browser
 */
export function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Get query parameter from URL
 */
export function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

/**
 * Format bytes to human readable size
 */
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Wait for a condition to be true
 */
export function waitFor(condition, timeout = 5000, interval = 100) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      if (condition()) {
        resolve(true);
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Timeout waiting for condition'));
      } else {
        setTimeout(check, interval);
      }
    };

    check();
  });
}

/**
 * Hash string (simple hash function)
 */
export function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

/**
 * Sanitize string for use in CSS selector
 */
export function sanitizeSelector(str) {
  return str.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

/**
 * Check if element is visible in viewport
 */
export function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Get element's absolute position
 */
export function getElementPosition(element) {
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top + window.pageYOffset,
    left: rect.left + window.pageXOffset,
    width: rect.width,
    height: rect.height,
  };
}
