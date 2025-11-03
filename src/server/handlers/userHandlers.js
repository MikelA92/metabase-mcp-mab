import { Validators } from '../../shared/utils/validators.js';
import { logger } from '../../shared/utils/logger.js';

/**
 * Handlers for user and activity operations
 */
export class UserHandlers {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.logger = logger.child('UserHandlers');
  }

  /**
   * Get recent activity
   */
  async getActivity(limit = 20) {
    Validators.validateLimit(limit, 1, 100);
    
    this.logger.debug('Getting activity', { limit });
    
    try {
      const activity = await this.apiClient.makeRequest(`/api/activity?limit=${limit}`);
      
      return {
        content: [
          {
            type: 'text',
            text: `Recent Activity (last ${limit} items):
${activity.map(a => 
  `- ${a.timestamp} | ${a.user?.common_name || 'Unknown'} | ${a.topic} | ${a.details}`
).join('\n')}`,
          },
        ],
      };
    } catch (error) {
      if (error.message.includes('404')) {
        return {
          content: [{ type: 'text', text: 'Activity endpoint not available in this Metabase version' }],
        };
      }
      throw error;
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser() {
    this.logger.debug('Getting current user');
    const user = await this.apiClient.makeRequest('/api/user/current');
    
    return {
      content: [
        {
          type: 'text',
          text: `Current User:
ID: ${user.id}
Name: ${user.common_name}
Email: ${user.email}
Is Admin: ${user.is_superuser}`,
        },
      ],
    };
  }

  /**
   * List all users
   */
  async listUsers() {
    this.logger.debug('Listing users');
    const users = await this.apiClient.makeRequest('/api/user/');
    
    return {
      content: [
        {
          type: 'text',
          text: `Users (${users.length}):
${users.map(u => 
  `- ID: ${u.id} | Name: ${u.common_name} | Email: ${u.email} | Admin: ${u.is_superuser}`
).join('\n')}`,
        },
      ],
    };
  }
}

