interface QueueItem {
  fn: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  retries: number;
}

export class RateLimiter {
  private queue: QueueItem[];
  private maxRequests: number;
  private timeWindow: number;
  private maxRetries: number;
  private retryDelay: number;
  private processing: boolean;

  constructor(maxRequests: number, timeWindow: number, maxRetries: number = 5, retryDelay: number = 30000) {
    this.queue = [];
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
    this.processing = false;
  }

  async add<T>(fn: () => Promise<T>, retries: number = this.maxRetries): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject, retries });
      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }
    
    this.processing = true;
    const batch = this.queue.splice(0, this.maxRequests);
    
    const results = await Promise.all(
      batch.map(async (item) => {
        try {
          const result = await item.fn();
          return { success: true, result, item };
        } catch (error: any) {
          if (item.retries > 0 && [504, 502, 503].includes(error.status)) {
            await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
            this.queue.push({ ...item, retries: item.retries - 1 });
            return null;
          }
          return { success: false, error, item };
        }
      })
    );
    
    results
      .filter((res) => res !== null)
      .forEach(({ success, result, error, item }: any) => {
        if (success) {
          item.resolve(result);
        } else {
          item.reject(error);
        }
      });
    
    await new Promise((resolve) => setTimeout(resolve, this.timeWindow));
    this.processQueue();
  }
}
