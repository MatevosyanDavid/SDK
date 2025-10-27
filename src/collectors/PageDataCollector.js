/**
 * Page Data Collector
 * Collects comprehensive page-level and site-wide SEO data
 */

class PageDataCollector {
  constructor() {
    this.cache = {};
  }

  /**
   * Collect all page and site data
   */
  async collect() {
    return {
      page: await this.collectPageData(),
      site: await this.collectSiteData(),
    };
  }

  /**
   * Collect page-level data
   */
  async collectPageData() {
    const pageData = {
      url: window.location.href,
      title: document.title || '',
      metaDescription: this.getMetaContent('description'),
      h1Tags: this.getHeadings('h1'),
      h2Tags: this.getHeadings('h2'),
      h3Tags: this.getHeadings('h3'),
      h4Tags: this.getHeadings('h4'),
      canonicalUrl: this.getCanonicalUrl(),
      alternateUrls: this.getAlternateUrls(),

      wordCount: this.getWordCount(),
      textToHtmlRatio: this.getTextToHtmlRatio(),
      language: this.getLanguage(),

      images: this.getImageData(),
      internalLinks: this.getLinks('internal'),
      externalLinks: this.getLinks('external'),

      schemaMarkup: this.getSchemaMarkup(),
      openGraphTags: this.getOpenGraphTags(),
      twitterCardTags: this.getTwitterCardTags(),

      viewport: this.getViewport(),
      isMobileFriendly: this.isMobileFriendly(),
      hasAMP: this.hasAMP(),
    };

    return pageData;
  }

  /**
   * Collect site-wide data
   */
  async collectSiteData() {
    const url = new URL(window.location.href);

    return {
      domain: url.hostname,
      protocol: url.protocol.replace(':', ''),
      hasSitemap: await this.checkSitemap(),
      sitemapUrl: `${url.origin}/sitemap.xml`,
      hasRobotsTxt: await this.checkRobotsTxt(),
      indexablePages: null, // Requires server-side processing

      serverType: null, // Requires server response headers
      contentEncoding: null,
      cacheControl: null,
      securityHeaders: {
        hsts: null,
        contentSecurityPolicy: null,
        xFrameOptions: null,
      },
    };
  }

  /**
   * Get meta tag content
   */
  getMetaContent(name) {
    const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
    return meta ? meta.getAttribute('content') : '';
  }

  /**
   * Get all headings of a specific level
   */
  getHeadings(tag) {
    const headings = Array.from(document.querySelectorAll(tag));
    return headings.map(h => h.textContent.trim()).filter(text => text.length > 0);
  }

  /**
   * Get canonical URL
   */
  getCanonicalUrl() {
    const canonical = document.querySelector('link[rel="canonical"]');
    return canonical ? canonical.href : '';
  }

  /**
   * Get alternate URLs (hreflang)
   */
  getAlternateUrls() {
    const alternates = Array.from(document.querySelectorAll('link[rel="alternate"][hreflang]'));
    return alternates.map(link => ({
      lang: link.getAttribute('hreflang'),
      href: link.href,
    }));
  }

  /**
   * Count words in page content
   */
  getWordCount() {
    const text = document.body.innerText || '';
    const words = text
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0);
    return words.length;
  }

  /**
   * Calculate text to HTML ratio
   */
  getTextToHtmlRatio() {
    const textLength = (document.body.innerText || '').length;
    const htmlLength = document.documentElement.outerHTML.length;
    return htmlLength > 0 ? (textLength / htmlLength) * 100 : 0;
  }

  /**
   * Get page language
   */
  getLanguage() {
    return document.documentElement.lang || this.getMetaContent('language') || 'en';
  }

  /**
   * Get comprehensive image data
   */
  getImageData() {
    const images = Array.from(document.querySelectorAll('img'));

    return images.map(img => {
      const src = img.src || img.getAttribute('data-src') || '';
      const alt = img.alt || '';

      return {
        src,
        alt,
        hasAlt: alt.length > 0,
        fileSize: null, // Would require separate fetch
        dimensions: {
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
        },
        format: this.getImageFormat(src),
      };
    });
  }

  /**
   * Get image format from URL
   */
  getImageFormat(src) {
    const match = src.match(/\.(jpg|jpeg|png|gif|webp|svg|avif)(\?|$)/i);
    return match ? match[1].toLowerCase() : 'unknown';
  }

  /**
   * Get links (internal or external)
   */
  getLinks(type = 'internal') {
    const links = Array.from(document.querySelectorAll('a[href]'));
    const currentDomain = window.location.hostname;

    return links
      .filter(link => {
        try {
          const url = new URL(link.href, window.location.origin);
          const isInternal = url.hostname === currentDomain;
          return type === 'internal' ? isInternal : !isInternal;
        } catch {
          return false;
        }
      })
      .map(link => {
        const rel = link.getAttribute('rel') || '';
        const isDofollow = !rel.includes('nofollow');

        const data = {
          href: link.href,
          anchorText: link.textContent.trim(),
          isDofollow,
        };

        if (type === 'external') {
          try {
            const url = new URL(link.href);
            data.domain = url.hostname;
          } catch {}
        }

        return data;
      });
  }

  /**
   * Get JSON-LD schema markup
   */
  getSchemaMarkup() {
    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));

    return scripts
      .map(script => {
        try {
          return JSON.parse(script.textContent);
        } catch {
          return null;
        }
      })
      .filter(schema => schema !== null);
  }

  /**
   * Get Open Graph tags
   */
  getOpenGraphTags() {
    const ogTags = Array.from(document.querySelectorAll('meta[property^="og:"]'));
    const data = {};

    ogTags.forEach(tag => {
      const property = tag.getAttribute('property').replace('og:', '');
      data[property] = tag.getAttribute('content');
    });

    return data;
  }

  /**
   * Get Twitter Card tags
   */
  getTwitterCardTags() {
    const twitterTags = Array.from(document.querySelectorAll('meta[name^="twitter:"]'));
    const data = {};

    twitterTags.forEach(tag => {
      const name = tag.getAttribute('name').replace('twitter:', '');
      data[name] = tag.getAttribute('content');
    });

    return data;
  }

  /**
   * Get viewport meta tag
   */
  getViewport() {
    return this.getMetaContent('viewport');
  }

  /**
   * Check if page is mobile-friendly
   */
  isMobileFriendly() {
    const viewport = this.getViewport();
    return viewport.includes('width=device-width') || viewport.includes('initial-scale=1');
  }

  /**
   * Check if page has AMP version
   */
  hasAMP() {
    return document.querySelector('link[rel="amphtml"]') !== null;
  }

  /**
   * Check if sitemap exists
   */
  async checkSitemap() {
    try {
      const response = await fetch('/sitemap.xml', { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Check if robots.txt exists
   */
  async checkRobotsTxt() {
    try {
      const response = await fetch('/robots.txt', { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export default PageDataCollector;
