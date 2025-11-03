import { logger } from '../../shared/utils/logger.js';

/**
 * Handlers for segment and metric operations
 */
export class SegmentMetricHandlers {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.logger = logger.child('SegmentMetricHandlers');
  }

  /**
   * List all segments
   */
  async listSegments() {
    this.logger.debug('Listing segments');
    const segments = await this.apiClient.makeRequest('/api/segment');
    
    return {
      content: [
        {
          type: 'text',
          text: `Segments:
${segments.map(s => 
  `- ID: ${s.id} | Name: ${s.name} | Table: ${s.table?.name}${s.description ? ` | ${s.description}` : ''}`
).join('\n')}`,
        },
      ],
    };
  }

  /**
   * List all metrics
   */
  async listMetrics() {
    this.logger.debug('Listing metrics');
    
    try {
      const metrics = await this.apiClient.makeRequest('/api/metric');
      
      return {
        content: [
          {
            type: 'text',
            text: `Metrics:
${metrics.map(m => 
  `- ID: ${m.id} | Name: ${m.name} | Table: ${m.table?.name}${m.description ? ` | ${m.description}` : ''}`
).join('\n')}`,
          },
        ],
      };
    } catch (error) {
      if (error.message.includes('404')) {
        return {
          content: [{ type: 'text', text: 'Metrics endpoint not available in this Metabase version' }],
        };
      }
      throw error;
    }
  }
}

