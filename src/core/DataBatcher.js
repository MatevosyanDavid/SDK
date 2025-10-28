/**
 * Data Batcher
 * Batches data collection events and sends them to the API endpoint
 */

import axios from 'axios';

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
    // If custom callback provided, use it instead of API call
    if (this.onDataCallback && typeof this.onDataCallback === 'function') {
      try {
        const payload = {
          events: batch,
          batchSize: batch.length,
          timestamp: Date.now(),
        };
        await this.onDataCallback(payload);
        console.log('[Data Batcher] Data sent to custom callback');
        return { success: true, callback: true };
      } catch (error) {
        console.error('[Data Batcher] Callback error:', error);
        throw error;
      }
    }

    // Send each event to the API endpoint
    try {
      for (const event of batch) {
        await axios.post('http://localhost:3000/api/data', event);
      }
      console.log('[Data Batcher] Data sent successfully');
      return { success: true };
    } catch (error) {
      console.error('[Data Batcher] Error sending data:', error);
      throw error;
    }
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
