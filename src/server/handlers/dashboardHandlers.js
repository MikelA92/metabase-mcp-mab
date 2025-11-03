import { Validators } from '../../shared/utils/validators.js';
import { DashboardUrlDecoder } from '../../shared/utils/urlDecoder.js';
import { logger } from '../../shared/utils/logger.js';

/**
 * Handlers for dashboard-related operations
 */
export class DashboardHandlers {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.logger = logger.child('DashboardHandlers');
  }

  /**
   * Get a dashboard by ID
   */
  async getDashboard(dashboardId) {
    Validators.validateDashboardId(dashboardId);
    
    this.logger.debug('Getting dashboard', { dashboardId });
    const dashboard = await this.apiClient.makeRequest(`/api/dashboard/${dashboardId}`);
    
    const cards = dashboard.dashcards?.map(dc => ({
      cardId: dc.card_id,
      cardName: dc.card?.name,
      row: dc.row,
      col: dc.col,
    })) || [];

    return {
      content: [
        {
          type: 'text',
          text: `Dashboard Information:
ID: ${dashboard.id}
Name: ${dashboard.name}
Description: ${dashboard.description || 'No description'}
Created: ${dashboard.created_at}
Updated: ${dashboard.updated_at}
Number of Cards: ${cards.length}

Cards in Dashboard:
${cards.map(c => `- Card ${c.cardId}: ${c.cardName} (Row: ${c.row}, Col: ${c.col})`).join('\n')}`,
        },
      ],
    };
  }

  /**
   * List all dashboards
   */
  async listDashboards() {
    this.logger.debug('Listing dashboards');
    const dashboards = await this.apiClient.makeRequest('/api/dashboard');
    
    return {
      content: [
        {
          type: 'text',
          text: `Found ${dashboards.length} dashboards:
${dashboards.slice(0, 50).map(d => 
  `- ID: ${d.id} | Name: ${d.name}`
).join('\n')}${dashboards.length > 50 ? `\n... and ${dashboards.length - 50} more dashboards` : ''}`,
        },
      ],
    };
  }

  /**
   * Get card with parameters from dashboard URL
   */
  async getCardWithParameters(url) {
    Validators.validateUrl(url);
    
    this.logger.debug('Getting card with parameters from URL');
    
    const decoded = DashboardUrlDecoder.decode(url);
    const baseCard = await this.apiClient.makeRequest(`/api/card/${decoded.originalCardId}`);
    
    return {
      content: [
        {
          type: 'text',
          text: `Card with Parameters:
Original Card ID: ${decoded.originalCardId}
Card Name: ${baseCard.name}
Description: ${baseCard.description || 'No description'}
Database ID: ${baseCard.dataset_query?.database}
Query Type: ${baseCard.dataset_query?.type}
Display Type: ${decoded.display}

Applied Parameters:
${JSON.stringify(decoded.parameters, null, 2)}

Dataset Query:
${JSON.stringify(decoded.datasetQuery, null, 2)}

Visualization Settings:
${JSON.stringify(decoded.visualizationSettings, null, 2)}`,
        },
      ],
    };
  }
}

