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

    console.log('[Data Batcher] Data added to queue. Queue size:', this.queue.length);

    // If queue is full, flush immediately
    if (this.queue.length >= this.maxQueueSize) {
      console.log('[Data Batcher] Queue full, flushing immediately');
      this.flush();
    }
  }

  /**
   * Start batch interval
   */
  startBatchInterval() {
    console.log('[Data Batcher] Starting batch interval:', this.batchInterval, 'ms');
    this.interval = setInterval(() => {
      console.log('[Data Batcher] Interval tick. Queue size:', this.queue.length);
      if (this.queue.length > 0) {
        console.log('[Data Batcher] Flushing queue');
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
    console.log(
      '[Data Batcher] flush() called. Queue size:',
      this.queue.length,
      'isProcessing:',
      this.isProcessing,
    );

    if (this.queue.length === 0 || this.isProcessing) {
      console.log('[Data Batcher] Skipping flush (empty queue or already processing)');
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

    // Log collected data to console
    console.log('==========================================');
    console.log('📊 SEO DATA COLLECTED');
    console.log('==========================================');
    console.log('Batch Size:', payload.batchSize);
    console.log('Timestamp:', new Date(payload.timestamp).toISOString());
    console.log('Events:', payload.events);
    console.log('==========================================');

    // If no API endpoint configured, just log and return
    if (!this.apiEndpoint) {
      console.log('✅ Data collection complete (API endpoint not configured)');
      return { success: true, logged: true };
    }

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
