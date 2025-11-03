import { ApiError, TimeoutError } from '../../shared/errors/MetabaseError.js';
import { logger } from '../../shared/utils/logger.js';

/**
 * API client for making requests to Metabase
 */
export class ApiClient {
  constructor(metabaseUrl, apiKey, timeout = 30000) {
    this.metabaseUrl = metabaseUrl;
    this.apiKey = apiKey;
    this.timeout = timeout;
    this.logger = logger.child('ApiClient');
  }

  /**
   * Make an authenticated API request to Metabase
   * @param {string} endpoint - API endpoint (e.g., '/api/card/123')
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} JSON response
   * @throws {ApiError} If the API request fails
   * @throws {TimeoutError} If the request times out
   */
  async makeRequest(endpoint, options = {}) {
    const url = `${this.metabaseUrl}${endpoint}`;
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
    };

    const requestOptions = { ...defaultOptions, ...options };

    this.logger.debug('Making API request', { endpoint, method: requestOptions.method || 'GET' });

    try {
      const response = await this.fetchWithTimeout(url, requestOptions, this.timeout);
      
      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error('API request failed', null, {
          endpoint,
          status: response.status,
          statusText: response.statusText,
          errorText,
        });
        
        throw new ApiError(
          `API request failed: ${response.status} ${response.statusText}`,
          response.status,
          endpoint,
          errorText
        );
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new ApiError(
          'Non-JSON response received',
          response.status,
          endpoint,
          text.substring(0, 500)
        );
      }

      const data = await response.json();
      this.logger.debug('API request successful', { endpoint });
      
      return data;
    } catch (error) {
      if (error instanceof ApiError || error instanceof TimeoutError) {
        throw error;
      }
      
      this.logger.error('Unexpected error during API request', error, { endpoint });
      throw new ApiError(
        `Unexpected error: ${error.message}`,
        0,
        endpoint,
        error.message
      );
    }
  }

  /**
   * Fetch with timeout support
   * @param {string} url - URL to fetch
   * @param {Object} options - Fetch options
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<Response>} Fetch response
   * @throws {TimeoutError} If the request times out
   */
  async fetchWithTimeout(url, options = {}, timeout = 30000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new TimeoutError(
          `Request timeout after ${timeout}ms`,
          'fetch',
          timeout
        );
      }
      
      throw error;
    }
  }
}

