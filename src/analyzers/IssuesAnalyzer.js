/**
 * Issues Analyzer
 * Analyzes SEO issues and provides recommendations
 */

class IssuesAnalyzer {
  constructor() {
    this.issues = [];
  }

  /**
   * Analyze all SEO issues
   */
  analyze(data) {
    this.issues = [];

    if (data.page.page) {
      this.analyzePageIssues(data.page.page);
    }

    if (data.performance) {
      this.analyzePerformanceIssues(data.performance);
    }

    if (data.keywords) {
      this.analyzeKeywordIssues(data.keywords);
    }

    return this.issues;
  }

  /**
   * Analyze page-level issues
   */
  analyzePageIssues(page) {
    if (!page.title || page.title.trim().length === 0) {
      this.addIssue(
        'critical',
        'missing-title',
        'Missing Page Title',
        'The page does not have a title tag, which is critical for SEO.',
        ['title'],
        'Add a descriptive, keyword-rich title tag (50-60 characters).',
      );
    } else if (page.title.length < 30) {
      this.addIssue(
        'medium',
        'short-title',
        'Title Too Short',
        `The page title is only ${page.title.length} characters.`,
        ['title'],
        'Expand the title to 50-60 characters for better SEO.',
      );
    } else if (page.title.length > 60) {
      this.addIssue(
        'medium',
        'long-title',
        'Title Too Long',
        `The page title is ${page.title.length} characters, which may be truncated in search results.`,
        ['title'],
        'Shorten the title to 50-60 characters.',
      );
    }

    // Missing or empty meta description
    if (!page.metaDescription || page.metaDescription.trim().length === 0) {
      this.addIssue(
        'high',
        'missing-meta-description',
        'Missing Meta Description',
        'The page does not have a meta description.',
        ['meta[name="description"]'],
        'Add a compelling meta description (150-160 characters).',
      );
    } else if (page.metaDescription.length < 120) {
      this.addIssue(
        'low',
        'short-meta-description',
        'Meta Description Too Short',
        `The meta description is only ${page.metaDescription.length} characters.`,
        ['meta[name="description"]'],
        'Expand the meta description to 150-160 characters.',
      );
    } else if (page.metaDescription.length > 160) {
      this.addIssue(
        'low',
        'long-meta-description',
        'Meta Description Too Long',
        `The meta description is ${page.metaDescription.length} characters.`,
        ['meta[name="description"]'],
        'Shorten the meta description to 150-160 characters.',
      );
    }

    // Missing H1
    if (!page.h1Tags || page.h1Tags.length === 0) {
      this.addIssue(
        'high',
        'missing-h1',
        'Missing H1 Tag',
        'The page does not have an H1 heading tag.',
        ['h1'],
        'Add a single, descriptive H1 tag at the top of your content.',
      );
    } else if (page.h1Tags.length > 1) {
      this.addIssue(
        'medium',
        'multiple-h1',
        'Multiple H1 Tags',
        `The page has ${page.h1Tags.length} H1 tags.`,
        ['h1'],
        'Use only one H1 tag per page.',
      );
    }

    // Missing canonical URL
    if (!page.canonicalUrl) {
      this.addIssue(
        'medium',
        'missing-canonical',
        'Missing Canonical URL',
        'The page does not have a canonical URL defined.',
        ['link[rel="canonical"]'],
        'Add a canonical link tag to prevent duplicate content issues.',
      );
    }

    // Images without alt text
    if (page.images) {
      const imagesWithoutAlt = page.images.filter(img => !img.hasAlt);
      if (imagesWithoutAlt.length > 0) {
        this.addIssue(
          'medium',
          'missing-image-alt',
          'Images Missing Alt Text',
          `${imagesWithoutAlt.length} images are missing alt text.`,
          imagesWithoutAlt.map(img => `img[src="${img.src}"]`).slice(0, 5),
          'Add descriptive alt text to all images for accessibility and SEO.',
        );
      }
    }

    // Low text to HTML ratio
    if (page.textToHtmlRatio < 15) {
      this.addIssue(
        'medium',
        'low-text-ratio',
        'Low Text to HTML Ratio',
        `Text to HTML ratio is ${page.textToHtmlRatio.toFixed(1)}%, which is quite low.`,
        ['body'],
        'Increase the amount of text content or reduce unnecessary HTML markup.',
      );
    }

    // Missing Open Graph tags
    if (!page.openGraphTags || Object.keys(page.openGraphTags).length === 0) {
      this.addIssue(
        'low',
        'missing-og-tags',
        'Missing Open Graph Tags',
        'The page does not have Open Graph tags for social media sharing.',
        ['meta[property^="og:"]'],
        'Add Open Graph tags (og:title, og:description, og:image) for better social media sharing.',
      );
    }

    // Not mobile-friendly
    if (!page.isMobileFriendly) {
      this.addIssue(
        'high',
        'not-mobile-friendly',
        'Not Mobile-Friendly',
        'The page does not have a mobile-friendly viewport meta tag.',
        ['meta[name="viewport"]'],
        'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to make the page mobile-friendly.',
      );
    }
  }

  /**
   * Analyze performance issues
   */
  analyzePerformanceIssues(performance) {
    // Slow load time
    if (performance.loadTime > 3000) {
      this.addIssue(
        'high',
        'slow-load-time',
        'Slow Page Load Time',
        `Page load time is ${(performance.loadTime / 1000).toFixed(
          2,
        )}s, which is slower than recommended.`,
        ['performance'],
        'Optimize images, minify CSS/JS, enable caching, and use a CDN to improve load time.',
      );
    }

    // High TTFB
    if (performance.timeToFirstByte > 600) {
      this.addIssue(
        'medium',
        'high-ttfb',
        'High Time to First Byte',
        `TTFB is ${performance.timeToFirstByte}ms. Target is under 600ms.`,
        ['server'],
        'Optimize server response time by using faster hosting, caching, or a CDN.',
      );
    }

    // Poor LCP
    if (performance.largestContentfulPaint > 2500) {
      this.addIssue(
        'high',
        'poor-lcp',
        'Poor Largest Contentful Paint',
        `LCP is ${(performance.largestContentfulPaint / 1000).toFixed(2)}s. Target is under 2.5s.`,
        ['performance'],
        'Optimize largest content element loading, compress images, and remove render-blocking resources.',
      );
    }

    // High CLS
    if (performance.cumulativeLayoutShift > 0.1) {
      this.addIssue(
        'medium',
        'high-cls',
        'High Cumulative Layout Shift',
        `CLS score is ${performance.cumulativeLayoutShift.toFixed(3)}. Target is under 0.1.`,
        ['performance'],
        'Set explicit dimensions for images and ads, avoid inserting content above existing content.',
      );
    }

    // High FID
    if (performance.firstInputDelay > 100) {
      this.addIssue(
        'medium',
        'high-fid',
        'High First Input Delay',
        `FID is ${performance.firstInputDelay.toFixed(0)}ms. Target is under 100ms.`,
        ['performance'],
        'Reduce JavaScript execution time, break up long tasks, and optimize third-party scripts.',
      );
    }
  }

  /**
   * Analyze keyword issues
   */
  analyzeKeywordIssues(keywords) {
    // Low keyword density
    if (keywords.primaryKeyword && keywords.keywordDensity < 0.5) {
      this.addIssue(
        'low',
        'low-keyword-density',
        'Low Keyword Density',
        `Primary keyword "${
          keywords.primaryKeyword
        }" has a density of ${keywords.keywordDensity.toFixed(2)}%.`,
        ['body'],
        'Increase the usage of your primary keyword naturally throughout the content (target 1-2%).',
      );
    }

    // Keyword stuffing
    if (keywords.primaryKeyword && keywords.keywordDensity > 3) {
      this.addIssue(
        'medium',
        'keyword-stuffing',
        'Possible Keyword Stuffing',
        `Primary keyword "${
          keywords.primaryKeyword
        }" has a high density of ${keywords.keywordDensity.toFixed(2)}%.`,
        ['body'],
        'Reduce keyword usage to avoid appearing spammy. Use variations and LSI keywords instead.',
      );
    }

    // Keyword not in first paragraph
    if (keywords.primaryKeyword && !keywords.keywordInFirstParagraph) {
      this.addIssue(
        'low',
        'keyword-not-in-first-paragraph',
        'Keyword Not in First Paragraph',
        'Primary keyword does not appear in the first paragraph.',
        ['p:first-of-type'],
        'Include your primary keyword naturally in the first paragraph for better SEO.',
      );
    }

    // Low readability score
    if (keywords.contentQuality && keywords.contentQuality.readabilityScore < 60) {
      this.addIssue(
        'low',
        'low-readability',
        'Low Readability Score',
        `Content readability score is ${keywords.contentQuality.readabilityScore.toFixed(
          0,
        )}, which is difficult to read.`,
        ['body'],
        'Simplify sentences, use shorter words, and break up long paragraphs.',
      );
    }

    // Low word count
    if (keywords.contentQuality && keywords.contentQuality.wordCount < 300) {
      this.addIssue(
        'medium',
        'low-word-count',
        'Low Word Count',
        `Page has only ${keywords.contentQuality.wordCount} words.`,
        ['body'],
        'Add more comprehensive content. Target at least 500-1000 words for better SEO.',
      );
    }
  }

  /**
   * Add an issue to the list
   */
  addIssue(severity, type, title, description, affectedElements, recommendation) {
    this.issues.push({
      severity,
      type,
      title,
      description,
      affectedElements,
      recommendation,
    });
  }
}

export default IssuesAnalyzer;
