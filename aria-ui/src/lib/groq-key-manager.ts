/**
 * Groq API Key Manager with rotation and failure handling
 * Matches the implementation in aria-agent
 */

interface GroqKeyConfig {
  key: string;
  failureCount: number;
  lastFailure?: Date;
  isDisabled: boolean;
}

class GroqKeyManager {
  private keys: GroqKeyConfig[] = [];
  private currentKeyIndex = 0;
  private readonly maxFailuresBeforeDisable = 3;
  private readonly reEnableAfterMinutes = 30;
  private initialized = false;

  private loadKeys(): void {
    if (this.initialized) return;

    const keys: GroqKeyConfig[] = [];
    let keyIndex = 1;

    // Try to load numbered keys first (GROQ_API_KEY_1, GROQ_API_KEY_2, etc.)
    while (true) {
      const key = process.env[`GROQ_API_KEY_${keyIndex}`];
      if (!key) break;

      keys.push({
        key,
        failureCount: 0,
        isDisabled: false,
      });
      keyIndex++;
    }

    // Fallback to single GROQ_API_KEY if no numbered keys found
    if (keys.length === 0) {
      const singleKey = process.env.GROQ_API_KEY;
      if (singleKey) {
        keys.push({
          key: singleKey,
          failureCount: 0,
          isDisabled: false,
        });
      }
    }

    this.keys = keys;
    this.initialized = true;

    if (this.keys.length === 0) {
      console.warn('[GroqKeyManager] No GROQ_API_KEY found');
    } else {
      console.log(`[GroqKeyManager] Loaded ${this.keys.length} Groq API key(s)`);
    }
  }

  /**
   * Get the current active API key
   */
  getCurrentKey(): string | null {
    this.loadKeys();

    if (this.keys.length === 0) {
      return null;
    }

    // Re-enable keys that have been disabled for long enough
    this.checkAndReEnableKeys();

    // Find the next available key starting from current index
    for (let i = 0; i < this.keys.length; i++) {
      const index = (this.currentKeyIndex + i) % this.keys.length;
      const keyConfig = this.keys[index];

      if (!keyConfig.isDisabled) {
        this.currentKeyIndex = index;
        return keyConfig.key;
      }
    }

    // All keys are disabled
    console.error('[GroqKeyManager] All Groq API keys are disabled due to failures');
    return null;
  }

  /**
   * Mark the current key as failed and rotate to the next one
   * Detects API key errors (rate limits, quota, invalid key) and immediately rotates
   */
  markCurrentKeyAsFailed(error?: any): void {
    if (this.keys.length === 0) return;

    const currentKey = this.keys[this.currentKeyIndex];
    const keyLabel = `Key ${this.currentKeyIndex + 1}`;
    
    // Detect API key-related errors (rate limit, quota, invalid key, etc.)
    const errorMessage = error?.message?.toLowerCase() || '';
    const isApiKeyError = 
      errorMessage.includes('rate limit') ||
      errorMessage.includes('quota') ||
      errorMessage.includes('tokens per minute') ||
      errorMessage.includes('tpm') ||
      errorMessage.includes('rpm') ||
      errorMessage.includes('invalid api key') ||
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('insufficient') ||
      errorMessage.includes('exceeded') ||
      errorMessage.includes('billing') ||
      errorMessage.includes('payment');

    if (isApiKeyError) {
      // Immediately disable key on API key errors
      currentKey.isDisabled = true;
      currentKey.lastFailure = new Date();
      console.error(
        `[GroqKeyManager] ${keyLabel} IMMEDIATELY DISABLED due to API key error: ${error?.message || 'Unknown'}. ` +
        `It will be re-enabled after ${this.reEnableAfterMinutes} minutes.`,
      );
    } else {
      // For other errors, use failure count threshold
      currentKey.failureCount++;
      currentKey.lastFailure = new Date();

      console.warn(
        `[GroqKeyManager] ${keyLabel} failed (${currentKey.failureCount}/${this.maxFailuresBeforeDisable} failures). Error: ${error?.message || 'Unknown'}`,
      );

      // Disable key if it has failed too many times
      if (currentKey.failureCount >= this.maxFailuresBeforeDisable) {
        currentKey.isDisabled = true;
        console.error(
          `[GroqKeyManager] ${keyLabel} has been disabled after ${this.maxFailuresBeforeDisable} failures. ` +
          `It will be re-enabled after ${this.reEnableAfterMinutes} minutes.`,
        );
      }
    }

    // Always rotate to next key
    this.rotateToNextKey();
  }

  /**
   * Mark the current key as successful (reset failure count)
   */
  markCurrentKeyAsSuccessful(): void {
    if (this.keys.length === 0) return;

    const currentKey = this.keys[this.currentKeyIndex];
    if (currentKey.failureCount > 0) {
      console.log(`[GroqKeyManager] Key ${this.currentKeyIndex + 1} succeeded, resetting failure count`);
      currentKey.failureCount = 0;
      currentKey.lastFailure = undefined;
    }
  }

  /**
   * Rotate to the next available key
   */
  private rotateToNextKey(): void {
    const startIndex = this.currentKeyIndex;
    
    do {
      this.currentKeyIndex = (this.currentKeyIndex + 1) % this.keys.length;
      
      if (!this.keys[this.currentKeyIndex].isDisabled) {
        console.log(`[GroqKeyManager] Rotated to Key ${this.currentKeyIndex + 1}`);
        return;
      }
      
      // If we've checked all keys and they're all disabled
      if (this.currentKeyIndex === startIndex) {
        console.error('[GroqKeyManager] All keys are disabled, staying on current key');
        return;
      }
    } while (true);
  }

  /**
   * Check if any disabled keys should be re-enabled
   */
  private checkAndReEnableKeys(): void {
    const now = new Date();
    
    for (let i = 0; i < this.keys.length; i++) {
      const keyConfig = this.keys[i];
      
      if (keyConfig.isDisabled && keyConfig.lastFailure) {
        const minutesSinceFailure = 
          (now.getTime() - keyConfig.lastFailure.getTime()) / (1000 * 60);
        
        if (minutesSinceFailure >= this.reEnableAfterMinutes) {
          keyConfig.isDisabled = false;
          keyConfig.failureCount = 0;
          keyConfig.lastFailure = undefined;
          console.log(
            `[GroqKeyManager] Key ${i + 1} has been re-enabled after ${this.reEnableAfterMinutes} minutes`,
          );
        }
      }
    }
  }

  /**
   * Get total number of keys
   */
  getTotalKeys(): number {
    this.loadKeys();
    return this.keys.length;
  }
}

// Singleton instance
export const groqKeyManager = new GroqKeyManager();
