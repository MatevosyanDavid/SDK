/**
 * Data Batcher
 * Batches data collection events and sends them to the API endpoint
 */

class DataBatcher {
  constructor(apiEndpoint, apiKey, batchInterval = 30000, onDataCallback = null) {
    this.apiEndpoint = apiEndpoint;
    this.apiKey = apiKey;
    this.batchInterval = batchInterval;
    this.queue = [];
    this.maxQueueSize = 50;
    this.isProcessing = false;
    this.onDataCallback = onDataCallback; // Custom callback for data handling

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

    this.isProcessing = true;

    // Get current queue and clear it
    const batch = [...this.queue];
    this.queue = [];

    try {
      await this.sendBatch(batch);
    } catch (error) {
      console.error('[Data Batcher] Error sending batch:', error);

      // Re-add failed items to queue (up to max size)
      this.queue = [...batch.slice(-this.maxQueueSize / 2), ...this.queue];
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Send batch to API endpoint or custom callback
   */
  async sendBatch(batch) {
    const payload = {
      events: batch,
      batchSize: batch.length,
      timestamp: Date.now(),
    };

    // If custom callback provided, use it instead of API call
    if (this.onDataCallback && typeof this.onDataCallback === 'function') {
      try {
        await this.onDataCallback(payload);
        console.log('[Data Batcher] Data sent to custom callback');
        return { success: true, callback: true };
      } catch (error) {
        console.error('[Data Batcher] Callback error:', error);
        throw error;
      }
    }

    // If no API endpoint and no callback, just log
    if (!this.apiEndpoint) {
      console.log('[Data Batcher] No endpoint or callback configured');
      return { success: true, logged: true };
    }

    // Default: send to API endpoint
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
