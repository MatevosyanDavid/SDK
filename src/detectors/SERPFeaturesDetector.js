/**
 * SERP Features Detector
 * Detects structured data and content features that can appear in SERP
 */

class SERPFeaturesDetector {
  constructor() {}

  /**
   * Detect all SERP features
   */
  detect() {
    return {
      serpFeatures: {
        // Schema markup detection
        featuredSnippetCandidate: this.isFeaturedSnippetCandidate(),
        hasFAQSchema: this.hasSchema('FAQPage'),
        hasHowToSchema: this.hasSchema('HowTo'),
        hasProductSchema: this.hasSchema('Product'),
        hasLocalBusinessSchema: this.hasSchema('LocalBusiness'),
        hasVideoSchema: this.hasSchema('VideoObject'),
        hasBreadcrumbSchema: this.hasSchema('BreadcrumbList'),
        hasArticleSchema: this.hasSchema('Article'),
        hasRecipeSchema: this.hasSchema('Recipe'),
        hasEventSchema: this.hasSchema('Event'),
        hasOrganizationSchema: this.hasSchema('Organization'),
        hasPersonSchema: this.hasSchema('Person'),

        // Content structure
        hasFAQSection: this.hasFAQSection(),
        hasStepByStepGuide: this.hasStepByStepGuide(),
        hasProductListing: this.hasProductListing(),
        hasVideoEmbed: this.hasVideoEmbed(),
        hasImageGallery: this.hasImageGallery(),
        hasTableData: this.hasTableData(),
        hasBulletLists: this.hasBulletLists(),
      },
    };
  }

  /**
   * Check if page has specific schema type
   */
  hasSchema(schemaType) {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');

    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent);

        // Check if schema matches (handle both single objects and arrays)
        if (Array.isArray(data)) {
          if (data.some(item => this.schemaMatches(item, schemaType))) {
            return true;
          }
        } else if (this.schemaMatches(data, schemaType)) {
          return true;
        }
      } catch (error) {
        // Invalid JSON, skip
      }
    }

    return false;
  }

  /**
   * Check if schema object matches type
   */
  schemaMatches(schema, type) {
    if (!schema || !schema['@type']) return false;

    const schemaType = schema['@type'];

    if (typeof schemaType === 'string') {
      return schemaType === type || schemaType.endsWith(`/${type}`);
    }

    if (Array.isArray(schemaType)) {
      return schemaType.some(t => t === type || t.endsWith(`/${type}`));
    }

    return false;
  }

  /**
   * Check if page is a good candidate for featured snippet
   */
  isFeaturedSnippetCandidate() {
    // Featured snippets typically have:
    // 1. Clear question-answer format
    // 2. Concise paragraphs (40-60 words)
    // 3. Lists or tables
    // 4. Clear headings with questions

    const hasQuestionHeading = this.hasQuestionInHeadings();
    const hasConciseParagraphs = this.hasConciseParagraphs();
    const hasLists = this.hasBulletLists();
    const hasTables = this.hasTableData();

    // If at least 2 of these are true, it's a good candidate
    const score = [hasQuestionHeading, hasConciseParagraphs, hasLists, hasTables].filter(
      Boolean,
    ).length;

    return score >= 2;
  }

  /**
   * Check if headings contain questions
   */
  hasQuestionInHeadings() {
    const headings = document.querySelectorAll('h1, h2, h3');
    const questionWords = ['what', 'how', 'why', 'when', 'where', 'who', 'which'];

    for (const heading of headings) {
      const text = heading.textContent.toLowerCase();
      if (questionWords.some(word => text.startsWith(word)) || text.includes('?')) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if page has concise paragraphs (good for featured snippets)
   */
  hasConciseParagraphs() {
    const paragraphs = document.querySelectorAll('p');

    for (const p of paragraphs) {
      const words = p.textContent.trim().split(/\s+/).length;
      if (words >= 40 && words <= 60) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if page has FAQ section
   */
  hasFAQSection() {
    // Look for FAQ-like structure
    const text = document.body.textContent.toLowerCase();

    // Check for FAQ heading
    const headings = Array.from(document.querySelectorAll('h1, h2, h3'));
    const hasFAQHeading = headings.some(
      h =>
        h.textContent.toLowerCase().includes('faq') ||
        h.textContent.toLowerCase().includes('frequently asked'),
    );

    // Check for Q&A pattern
    const hasQAPattern = /q[:\s]|question[:\s]|a[:\s]|answer[:\s]/i.test(text);

    return hasFAQHeading || (hasQAPattern && this.hasQuestionInHeadings());
  }

  /**
   * Check if page has step-by-step guide
   */
  hasStepByStepGuide() {
    const text = document.body.textContent.toLowerCase();

    // Look for numbered steps or "step" keywords
    const hasStepKeywords = /step \d+|step-by-step|\d+\.|first,|second,|third,/i.test(text);

    // Look for ordered lists
    const orderedLists = document.querySelectorAll('ol');
    const hasOrderedList = orderedLists.length > 0;

    return hasStepKeywords || hasOrderedList;
  }

  /**
   * Check if page has product listing
   */
  hasProductListing() {
    // Look for price elements
    const priceSelectors = [
      '[itemtype*="Product"]',
      '[class*="price"]',
      '[class*="product"]',
      '[itemprop="price"]',
    ];

    return priceSelectors.some(selector => document.querySelector(selector) !== null);
  }

  /**
   * Check if page has video embed
   */
  hasVideoEmbed() {
    const videoElements = document.querySelectorAll(
      'video, iframe[src*="youtube"], iframe[src*="vimeo"], iframe[src*="dailymotion"]',
    );

    return videoElements.length > 0;
  }

  /**
   * Check if page has image gallery
   */
  hasImageGallery() {
    const images = document.querySelectorAll('img');

    // Consider it a gallery if there are 4+ images
    if (images.length >= 4) {
      return true;
    }

    // Look for gallery-related classes
    const gallerySelectors = ['[class*="gallery"]', '[class*="slider"]', '[class*="carousel"]'];

    return gallerySelectors.some(selector => document.querySelector(selector) !== null);
  }

  /**
   * Check if page has table data
   */
  hasTableData() {
    const tables = document.querySelectorAll('table');
    return tables.length > 0;
  }

  /**
   * Check if page has bullet lists
   */
  hasBulletLists() {
    const lists = document.querySelectorAll('ul, ol');
    return lists.length > 0;
  }
}

export default SERPFeaturesDetector;
