/**
 * Keyword Analyzer
 * Analyzes keywords, keyword density, and content quality metrics
 */

class KeywordAnalyzer {
  constructor(primaryKeyword = null) {
    this.primaryKeyword = primaryKeyword;
    this.stopWords = new Set([
      'the',
      'be',
      'to',
      'of',
      'and',
      'a',
      'in',
      'that',
      'have',
      'i',
      'it',
      'for',
      'not',
      'on',
      'with',
      'he',
      'as',
      'you',
      'do',
      'at',
      'this',
      'but',
      'his',
      'by',
      'from',
      'they',
      'we',
      'say',
      'her',
      'she',
      'or',
      'an',
      'will',
      'my',
      'one',
      'all',
      'would',
      'there',
      'their',
      'what',
      'so',
      'up',
      'out',
      'if',
      'about',
      'who',
      'get',
      'which',
      'go',
      'me',
      'when',
      'make',
      'can',
      'like',
      'time',
      'no',
      'just',
      'him',
      'know',
      'take',
      'people',
      'into',
      'year',
      'your',
      'good',
      'some',
      'could',
      'them',
      'see',
      'other',
      'than',
      'then',
      'now',
      'look',
      'only',
      'come',
      'its',
      'over',
    ]);
  }

  /**
   * Analyze keywords and content quality
   */
  async analyze() {
    const bodyText = this.getBodyText();
    const words = this.tokenize(bodyText);
    const totalWords = words.length;

    return {
      keywords: this.analyzeKeywords(bodyText, words, totalWords),
      contentQuality: this.analyzeContentQuality(bodyText),
    };
  }

  /**
   * Analyze keyword metrics
   */
  analyzeKeywords(bodyText, words, totalWords) {
    const detectedKeywords = this.extractKeywords(words, totalWords);

    let primaryKeywordData = null;
    if (this.primaryKeyword) {
      primaryKeywordData = {
        keyword: this.primaryKeyword,
        density: this.calculateKeywordDensity(this.primaryKeyword, bodyText, totalWords),
        inFirstParagraph: this.isKeywordInFirstParagraph(this.primaryKeyword),
        inLastParagraph: this.isKeywordInLastParagraph(this.primaryKeyword),
        locations: this.getKeywordLocations(this.primaryKeyword),
      };
    }

    return {
      primaryKeyword: this.primaryKeyword,
      keywordDensity: primaryKeywordData ? primaryKeywordData.density : 0,
      detectedKeywords: detectedKeywords.slice(0, 20), // Top 20
      lsiKeywords: this.extractLSIKeywords(detectedKeywords),
      keywordInFirstParagraph: primaryKeywordData ? primaryKeywordData.inFirstParagraph : false,
      keywordInLastParagraph: primaryKeywordData ? primaryKeywordData.inLastParagraph : false,
    };
  }

  /**
   * Analyze content quality metrics
   */
  analyzeContentQuality(bodyText) {
    const sentences = this.extractSentences(bodyText);
    const words = this.tokenize(bodyText);

    return {
      readabilityScore: this.calculateReadabilityScore(sentences, words),
      avgSentenceLength: sentences.length > 0 ? words.length / sentences.length : 0,
      avgWordLength: this.calculateAvgWordLength(words),
      paragraphCount: this.countParagraphs(),
      listCount: this.countLists(),
      imageCount: document.querySelectorAll('img').length,
      videoCount: document.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"]')
        .length,
    };
  }

  /**
   * Get body text content
   */
  getBodyText() {
    // Clone body to avoid modifying the actual DOM
    const body = document.body.cloneNode(true);

    // Remove script and style elements
    const unwanted = body.querySelectorAll('script, style, noscript');
    unwanted.forEach(el => el.remove());

    return body.innerText || body.textContent || '';
  }

  /**
   * Tokenize text into words
   */
  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !this.stopWords.has(word));
  }

  /**
   * Extract keywords with frequency and density
   */
  extractKeywords(words, totalWords) {
    const frequency = {};

    // Count word frequency
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    // Convert to array and sort by frequency
    const keywords = Object.entries(frequency)
      .map(([term, freq]) => ({
        term,
        frequency: freq,
        density: (freq / totalWords) * 100,
        locations: this.getKeywordLocations(term),
      }))
      .sort((a, b) => b.frequency - a.frequency);

    return keywords;
  }

  /**
   * Calculate keyword density for a specific keyword
   */
  calculateKeywordDensity(keyword, text, totalWords) {
    const regex = new RegExp(keyword, 'gi');
    const matches = text.match(regex) || [];
    return (matches.length / totalWords) * 100;
  }

  /**
   * Get locations where keyword appears
   */
  getKeywordLocations(keyword) {
    const locations = [];
    const regex = new RegExp(keyword, 'i');

    // Check title
    if (regex.test(document.title)) {
      locations.push('title');
    }

    // Check meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && regex.test(metaDesc.content)) {
      locations.push('meta');
    }

    // Check headings
    ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(tag => {
      const headings = document.querySelectorAll(tag);
      for (const heading of headings) {
        if (regex.test(heading.textContent)) {
          locations.push(tag);
          break;
        }
      }
    });

    // Check body
    if (regex.test(this.getBodyText())) {
      locations.push('body');
    }

    return [...new Set(locations)]; // Remove duplicates
  }

  /**
   * Check if keyword is in first paragraph
   */
  isKeywordInFirstParagraph(keyword) {
    const firstP = document.querySelector('p');
    if (!firstP) return false;

    const regex = new RegExp(keyword, 'i');
    return regex.test(firstP.textContent);
  }

  /**
   * Check if keyword is in last paragraph
   */
  isKeywordInLastParagraph(keyword) {
    const paragraphs = document.querySelectorAll('p');
    if (paragraphs.length === 0) return false;

    const lastP = paragraphs[paragraphs.length - 1];
    const regex = new RegExp(keyword, 'i');
    return regex.test(lastP.textContent);
  }

  /**
   * Extract LSI (Latent Semantic Indexing) keywords
   * Returns multi-word phrases that might be semantically related
   */
  extractLSIKeywords(detectedKeywords) {
    // Simple implementation: extract 2-3 word phrases
    const text = this.getBodyText();
    const phrases = this.extractPhrases(text, 2, 3);

    return phrases.slice(0, 10); // Top 10 phrases
  }

  /**
   * Extract n-gram phrases from text
   */
  extractPhrases(text, minWords, maxWords) {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);

    const phrases = {};

    for (let n = minWords; n <= maxWords; n++) {
      for (let i = 0; i <= words.length - n; i++) {
        const phrase = words.slice(i, i + n).join(' ');

        // Skip if contains too many stop words
        const stopWordCount = phrase.split(' ').filter(w => this.stopWords.has(w)).length;
        if (stopWordCount < n / 2) {
          phrases[phrase] = (phrases[phrase] || 0) + 1;
        }
      }
    }

    return Object.entries(phrases)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([phrase]) => phrase);
  }

  /**
   * Extract sentences from text
   */
  extractSentences(text) {
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  /**
   * Calculate Flesch Reading Ease score
   */
  calculateReadabilityScore(sentences, words) {
    if (sentences.length === 0 || words.length === 0) return 0;

    const totalSyllables = this.countSyllables(words);
    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = totalSyllables / words.length;

    // Flesch Reading Ease formula
    const score = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

    return Math.max(0, Math.min(100, score)); // Clamp between 0-100
  }

  /**
   * Count syllables in words (simplified algorithm)
   */
  countSyllables(words) {
    let total = 0;

    words.forEach(word => {
      // Simple syllable counting: count vowel groups
      const vowelGroups = word.match(/[aeiouy]+/gi);
      let syllables = vowelGroups ? vowelGroups.length : 1;

      // Adjust for silent 'e'
      if (word.endsWith('e')) syllables--;

      // Ensure at least 1 syllable
      syllables = Math.max(1, syllables);

      total += syllables;
    });

    return total;
  }

  /**
   * Calculate average word length
   */
  calculateAvgWordLength(words) {
    if (words.length === 0) return 0;

    const totalLength = words.reduce((sum, word) => sum + word.length, 0);
    return totalLength / words.length;
  }

  /**
   * Count paragraphs
   */
  countParagraphs() {
    return document.querySelectorAll('p').length;
  }

  /**
   * Count lists
   */
  countLists() {
    return document.querySelectorAll('ul, ol').length;
  }

  /**
   * Set primary keyword
   */
  setPrimaryKeyword(keyword) {
    this.primaryKeyword = keyword;
  }
}

export default KeywordAnalyzer;
