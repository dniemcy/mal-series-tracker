export class RateLimiter {
    constructor(maxRequests, timeWindow, maxRetries = 5, retryDelay = 30000) {
        this.queue = [];
        this.maxRequests = maxRequests;
        this.timeWindow = timeWindow;
        this.maxRetries = maxRetries;
        this.retryDelay = retryDelay;
        this.processing = false;
    }

    async add(fn, retries = this.maxRetries) {
        return new Promise((resolve, reject) => {
            this.queue.push({ fn, resolve, reject, retries });
            if (!this.processing) {
                this.processQueue();
            }
        });
    }

    async processQueue() {
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
                } catch (error) {
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
            .filter((res) => res)
            .forEach(({ success, result, error, item }) => {
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

