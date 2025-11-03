import { ValidationError } from '../errors/MetabaseError.js';

/**
 * Utilities for decoding Metabase dashboard URLs and extracting parameters
 */
export class DashboardUrlDecoder {
  /**
   * Decode a Metabase dashboard URL and extract the card configuration
   * @param {string} url - The Metabase dashboard URL with encoded parameters
   * @returns {Object} Decoded data with card ID and parameters
   * @throws {ValidationError} If URL is invalid or cannot be decoded
   */
  static decode(url) {
    try {
      // Extract the base64 fragment after the #
      const fragment = url.split('#')[1];
      if (!fragment) {
        throw new ValidationError(
          'No fragment found in URL',
          'url',
          url
        );
      }
      
      // Decode base64
      const decoded = Buffer.from(fragment, 'base64').toString('utf-8');
      const data = JSON.parse(decoded);
      
      return {
        originalCardId: data.original_card_id,
        datasetQuery: data.dataset_query,
        parameters: DashboardUrlDecoder.extractParametersFromQuery(data.dataset_query),
        display: data.display,
        visualizationSettings: data.visualization_settings,
        name: data.name,
        description: data.description,
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError(
        `Failed to decode dashboard URL: ${error.message}`,
        'url',
        url
      );
    }
  }

  /**
   * Extract parameters from a query builder dataset query
   * @param {Object} datasetQuery - The dataset query object
   * @returns {Object} Extracted parameters
   */
  static extractParametersFromQuery(datasetQuery) {
    if (!datasetQuery || datasetQuery.type !== 'query') {
      return {};
    }
    
    const query = datasetQuery.query;
    const parameters = {};
    
    // Extract filters
    if (query.filter) {
      parameters.filters = query.filter;
    }
    
    // Extract aggregations
    if (query.aggregation) {
      parameters.aggregations = query.aggregation;
    }
    
    // Extract breakouts
    if (query.breakout) {
      parameters.breakouts = query.breakout;
    }
    
    // Extract source table
    if (query['source-table']) {
      parameters.sourceTable = query['source-table'];
    }
    
    // Extract order by
    if (query['order-by']) {
      parameters.orderBy = query['order-by'];
    }
    
    // Extract limit
    if (query.limit) {
      parameters.limit = query.limit;
    }
    
    return parameters;
  }

  /**
   * Convert query builder parameters to Metabase API format
   * @param {Object} parameters - Query builder parameters
   * @returns {Object} API-formatted parameters
   */
  static convertParametersToApiFormat(parameters) {
    const apiParams = {};
    
    // Handle filters
    if (parameters.filters) {
      parameters.filters.forEach((filter, index) => {
        if (Array.isArray(filter) && filter[0] === 'time-interval') {
          // Convert time-interval filter to API format
          apiParams[`time-interval-${index}`] = {
            type: 'time-interval',
            field: filter[1],
            value: filter[2],
            unit: filter[3],
          };
        } else if (Array.isArray(filter) && filter[0] === '=') {
          // Convert equality filter to API format
          apiParams[`filter-${index}`] = {
            type: '=',
            field: filter[1],
            value: filter[2],
          };
        } else if (Array.isArray(filter) && filter[0] === 'and') {
          // Handle AND filters
          filter.slice(1).forEach((subFilter, subIndex) => {
            apiParams[`and-filter-${index}-${subIndex}`] = subFilter;
          });
        }
      });
    }
    
    return apiParams;
  }
}

