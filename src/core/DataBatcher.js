/**
 * Data Batcher
 * Batches data collection events and sends them to the API endpoint
 */

class DataBatcher {
  constructor(apiEndpoint, apiKey, batchInterval = 30000) {
    this.apiEndpoint = apiEndpoint;
    this.apiKey = apiKey;
    this.batchInterval = batchInterval;
    this.queue = [];
    this.maxQueueSize = 50;
    this.isProcessing = false;

    // Start batch interval
    this.startBatchInterval();

    // Flush on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.flush());
    }
  }

  /**
   * Add data to the batch queue
   */
  add(data) {
    if (!data) return;

    this.queue.push({
      ...data,
      _timestamp: Date.now(),
    });

    // If queue is full, flush immediately
    if (this.queue.length >= this.maxQueueSize) {
      this.flush();
    }
  }

  /**
   * Start batch interval
   */
  startBatchInterval() {
    this.interval = setInterval(() => {
      if (this.queue.length > 0) {
        this.flush();
      }
    }, this.batchInterval);
  }

  /**
   * Stop batch interval
   */
  stopBatchInterval() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  /**
   * Flush queue and send data to API
   */
  async flush() {
    if (this.queue.length === 0 || this.isProcessing) {
      return;
    }

    if (!this.apiEndpoint) {
      console.warn('[Data Batcher] No API endpoint configured, clearing queue');
      this.queue = [];
      return;
    }

    this.isProcessing = true;

    // Get current queue and clear it
    const batch = [...this.queue];
    this.queue = [];

    try {
      await this.sendBatch(batch);
      console.log(`[Data Batcher] Successfully sent ${batch.length} events`);
    } catch (error) {
      console.error('[Data Batcher] Error sending batch:', error);

      // Re-add failed items to queue (up to max size)
      this.queue = [...batch.slice(-this.maxQueueSize / 2), ...this.queue];
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Send batch to API endpoint
   */
  async sendBatch(batch) {
    const payload = {
      events: batch,
      batchSize: batch.length,
      timestamp: Date.now(),
    };

    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        'X-SDK-Version': '1.0.0',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get current queue size
   */
  getQueueSize() {
    return this.queue.length;
  }

  /**
   * Clear the queue
   */
  clear() {
    this.queue = [];
  }

  /**
   * Destroy the batcher
   */
  destroy() {
    this.stopBatchInterval();
    this.flush();
  }
}

export default DataBatcher;
