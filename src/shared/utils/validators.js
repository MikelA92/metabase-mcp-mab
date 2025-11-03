import { ValidationError } from '../errors/MetabaseError.js';

/**
 * Input validation utilities
 */
export class Validators {
  /**
   * Validate card ID
   * @param {*} cardId - The card ID to validate
   * @throws {ValidationError} If validation fails
   */
  static validateCardId(cardId) {
    if (!cardId || !Number.isInteger(cardId) || cardId < 1) {
      throw new ValidationError(
        'Card ID must be a positive integer',
        'cardId',
        cardId
      );
    }
  }

  /**
   * Validate dashboard ID
   * @param {*} dashboardId - The dashboard ID to validate
   * @throws {ValidationError} If validation fails
   */
  static validateDashboardId(dashboardId) {
    if (!dashboardId || !Number.isInteger(dashboardId) || dashboardId < 1) {
      throw new ValidationError(
        'Dashboard ID must be a positive integer',
        'dashboardId',
        dashboardId
      );
    }
  }

  /**
   * Validate database ID
   * @param {*} databaseId - The database ID to validate
   * @throws {ValidationError} If validation fails
   */
  static validateDatabaseId(databaseId) {
    if (!databaseId || !Number.isInteger(databaseId) || databaseId < 1) {
      throw new ValidationError(
        'Database ID must be a positive integer',
        'databaseId',
        databaseId
      );
    }
  }

  /**
   * Validate table ID
   * @param {*} tableId - The table ID to validate
   * @throws {ValidationError} If validation fails
   */
  static validateTableId(tableId) {
    if (!tableId || !Number.isInteger(tableId) || tableId < 1) {
      throw new ValidationError(
        'Table ID must be a positive integer',
        'tableId',
        tableId
      );
    }
  }

  /**
   * Validate field ID
   * @param {*} fieldId - The field ID to validate
   * @throws {ValidationError} If validation fails
   */
  static validateFieldId(fieldId) {
    if (!fieldId || !Number.isInteger(fieldId) || fieldId < 1) {
      throw new ValidationError(
        'Field ID must be a positive integer',
        'fieldId',
        fieldId
      );
    }
  }

  /**
   * Validate collection ID
   * @param {*} collectionId - The collection ID to validate
   * @throws {ValidationError} If validation fails
   */
  static validateCollectionId(collectionId) {
    if (!collectionId) {
      throw new ValidationError(
        'Collection ID is required',
        'collectionId',
        collectionId
      );
    }
  }

  /**
   * Validate limit parameter
   * @param {*} limit - The limit to validate
   * @param {number} min - Minimum allowed value
   * @param {number} max - Maximum allowed value
   * @throws {ValidationError} If validation fails
   */
  static validateLimit(limit, min = 1, max = 100) {
    if (!Number.isInteger(limit) || limit < min || limit > max) {
      throw new ValidationError(
        `Limit must be an integer between ${min} and ${max}`,
        'limit',
        limit
      );
    }
  }

  /**
   * Validate SQL query
   * @param {*} query - The query to validate
   * @throws {ValidationError} If validation fails
   */
  static validateQuery(query) {
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      throw new ValidationError(
        'Query must be a non-empty string',
        'query',
        query
      );
    }
  }

  /**
   * Validate URL
   * @param {*} url - The URL to validate
   * @throws {ValidationError} If validation fails
   */
  static validateUrl(url) {
    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      throw new ValidationError(
        'URL must be a non-empty string',
        'url',
        url
      );
    }
  }
}

