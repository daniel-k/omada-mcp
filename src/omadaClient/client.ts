import type { OmadaClientInfo } from '../types/index.js';

import type { RequestHandler } from './request.js';
import type { SiteOperations } from './site.js';

/**
 * Client-related operations for the Omada API.
 */
export class ClientOperations {
    constructor(
        private readonly request: RequestHandler,
        private readonly site: SiteOperations,
        private readonly buildPath: (path: string) => string
    ) {}

    /**
     * List all clients in a site.
     */
    public async listClients(siteId?: string): Promise<OmadaClientInfo[]> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        return this.request.fetchPaginated<OmadaClientInfo>(this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/clients`));
    }

    /**
     * Get a specific client by MAC address or client ID.
     */
    public async getClient(identifier: string, siteId?: string): Promise<OmadaClientInfo | undefined> {
        const clients = await this.listClients(siteId);
        return clients.find((client) => client.mac === identifier || client.id === identifier);
    }
}
