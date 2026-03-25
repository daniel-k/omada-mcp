import type { OmadaApiResponse, PaginatedResult } from '../types/index.js';
import { logger } from '../utils/logger.js';

import type { InternalRequestHandler } from './internalRequest.js';
import type { RequestHandler } from './request.js';
import type { SiteOperations } from './site.js';

/**
 * Network-related operations for the Omada API.
 * Covers internet, LAN, WLAN, firewall, and port forwarding configurations.
 */
export class NetworkOperations {
    private internalRequest?: InternalRequestHandler;

    constructor(
        private readonly request: RequestHandler,
        private readonly site: SiteOperations,
        private readonly buildPath: (path: string, version?: string) => string
    ) {}

    /**
     * Set the internal request handler for web UI API access.
     * When configured, firewall ACL operations will use the internal API.
     */
    public setInternalRequest(internalRequest: InternalRequestHandler): void {
        this.internalRequest = internalRequest;
    }

    /**
     * Check whether the internal API is available for use.
     */
    private get hasInternalApi(): boolean {
        return this.internalRequest !== undefined;
    }

    /**
     * Get internet configuration info for a site.
     * OperationId: getInternet
     */
    public async getInternetInfo(siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/internet`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get port forwarding status for a specific type (User or UPnP).
     * OperationId: getPortForwardStatus
     *
     * @param type - Port forwarding type: 'User' or 'UPnP'
     * @param siteId - Optional site ID (uses default if not provided)
     * @param page - Page number (required by API, default: 1)
     * @param pageSize - Page size (required by API, range: 1-1000, default: 10)
     */
    public async getPortForwardingStatus(type: 'User' | 'UPnP', siteId?: string, page = 1, pageSize = 10): Promise<PaginatedResult<unknown>> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/insight/port-forwarding/${encodeURIComponent(type)}`);

        const response = await this.request.get<OmadaApiResponse<PaginatedResult<unknown>>>(path, {
            page,
            pageSize,
        });

        return this.request.ensureSuccess(response);
    }

    /**
     * Get LAN network list (v2 API) with pagination.
     * OperationId: getLanNetworkListV2
     */
    public async getLanNetworkList(siteId?: string): Promise<unknown[]> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/lan-networks`, 'v2');
        return await this.request.fetchPaginated<unknown>(path);
    }

    /**
     * Get LAN profile list with pagination.
     * OperationId: getLanProfileList
     */
    public async getLanProfileList(siteId?: string): Promise<unknown[]> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/lan-profiles`);
        return await this.request.fetchPaginated<unknown>(path);
    }

    /**
     * Get WLAN group list.
     * OperationId: getWlanGroupList
     */
    public async getWlanGroupList(siteId?: string): Promise<unknown[]> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/wireless-network/wlans`);
        const response = await this.request.get<OmadaApiResponse<unknown[]>>(path);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get SSID list for a specific WLAN group.
     * OperationId: getSsidList
     *
     * @param wlanId - WLAN group ID (can be obtained from getWlanGroupList)
     */
    public async getSsidList(wlanId: string, siteId?: string): Promise<unknown[]> {
        if (!wlanId) {
            throw new Error('A wlanId must be provided. Use getWlanGroupList to get available WLAN group IDs.');
        }

        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/wireless-network/wlans/${encodeURIComponent(wlanId)}/ssids`);
        return await this.request.fetchPaginated<unknown>(path);
    }

    /**
     * Get detailed information for a specific SSID.
     * OperationId: getSsidDetail
     *
     * @param wlanId - WLAN group ID (can be obtained from getWlanGroupList)
     * @param ssidId - SSID ID (can be obtained from getSsidList)
     */
    public async getSsidDetail(wlanId: string, ssidId: string, siteId?: string): Promise<unknown> {
        if (!wlanId) {
            throw new Error('A wlanId must be provided. Use getWlanGroupList to get available WLAN group IDs.');
        }
        if (!ssidId) {
            throw new Error('An ssidId must be provided. Use getSsidList to get available SSID IDs.');
        }

        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(
            `/sites/${encodeURIComponent(resolvedSiteId)}/wireless-network/wlans/${encodeURIComponent(wlanId)}/ssids/${encodeURIComponent(ssidId)}`
        );
        const response = await this.request.get<OmadaApiResponse<unknown>>(path);
        return this.request.ensureSuccess(response);
    }

    /**
     * Create a new SSID in a WLAN group.
     *
     * @param wlanId - WLAN group ID (can be obtained from getWlanGroupList)
     * @param data - SSID configuration data
     */
    public async createSsid(wlanId: string, data: Record<string, unknown>, siteId?: string): Promise<unknown> {
        if (!wlanId) {
            throw new Error('A wlanId must be provided. Use getWlanGroupList to get available WLAN group IDs.');
        }

        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(
            `/sites/${encodeURIComponent(resolvedSiteId)}/wireless-network/wlans/${encodeURIComponent(wlanId)}/ssids`
        );
        const response = await this.request.post<OmadaApiResponse<unknown>>(path, data);
        return this.request.ensureSuccess(response);
    }

    /**
     * PATCH a specific aspect of an SSID configuration.
     */
    private async patchSsid(wlanId: string, ssidId: string, action: string, data: Record<string, unknown>, siteId?: string): Promise<unknown> {
        if (!wlanId) {
            throw new Error('A wlanId must be provided. Use getWlanGroupList to get available WLAN group IDs.');
        }
        if (!ssidId) {
            throw new Error('An ssidId must be provided. Use getSsidList to get available SSID IDs.');
        }

        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(
            `/sites/${encodeURIComponent(resolvedSiteId)}/wireless-network/wlans/${encodeURIComponent(wlanId)}/ssids/${encodeURIComponent(ssidId)}/${action}`
        );
        const response = await this.request.request<OmadaApiResponse<unknown>>({ method: 'PATCH', url: path, data });
        return this.request.ensureSuccess(response);
    }

    /**
     * Update SSID basic config (name, band, security, VLAN, etc.).
     * OperationId: updateSsidBasicConfig
     */
    public async updateSsidBasicConfig(wlanId: string, ssidId: string, data: Record<string, unknown>, siteId?: string): Promise<unknown> {
        return this.patchSsid(wlanId, ssidId, 'update-basic-config', data, siteId);
    }

    /**
     * Update SSID rate limit config (client and SSID rate limits).
     * OperationId: updateSsidRateLimitConfig
     */
    public async updateSsidRateLimit(wlanId: string, ssidId: string, data: Record<string, unknown>, siteId?: string): Promise<unknown> {
        return this.patchSsid(wlanId, ssidId, 'update-rate-limit', data, siteId);
    }

    /**
     * Update SSID 802.11 rate control config.
     * OperationId: updateSsidRateControlConfig
     */
    public async updateSsidRateControl(wlanId: string, ssidId: string, data: Record<string, unknown>, siteId?: string): Promise<unknown> {
        return this.patchSsid(wlanId, ssidId, 'update-rate-control', data, siteId);
    }

    /**
     * Update SSID multicast/broadcast management config.
     * OperationId: updateSsidMultiCastConfig
     */
    public async updateSsidMultiCastConfig(wlanId: string, ssidId: string, data: Record<string, unknown>, siteId?: string): Promise<unknown> {
        return this.patchSsid(wlanId, ssidId, 'update-multicast-config', data, siteId);
    }

    /**
     * Update SSID MAC filter config.
     * OperationId: updateSsidMacFilterConfig
     */
    public async updateSsidMacFilter(wlanId: string, ssidId: string, data: Record<string, unknown>, siteId?: string): Promise<unknown> {
        return this.patchSsid(wlanId, ssidId, 'update-mac-filter', data, siteId);
    }

    /**
     * Update SSID WLAN schedule config.
     * OperationId: updateSsidWlanSchedule
     */
    public async updateSsidWlanSchedule(wlanId: string, ssidId: string, data: Record<string, unknown>, siteId?: string): Promise<unknown> {
        return this.patchSsid(wlanId, ssidId, 'update-wlan-schedule', data, siteId);
    }

    /**
     * Update SSID Hotspot 2.0 config.
     * OperationId: updateSsidHotspotV2Setting
     */
    public async updateSsidHotspotV2(wlanId: string, ssidId: string, data: Record<string, unknown>, siteId?: string): Promise<unknown> {
        return this.patchSsid(wlanId, ssidId, 'update-hotspotv2', data, siteId);
    }

    /**
     * Delete an SSID from a WLAN group.
     *
     * @param wlanId - WLAN group ID (can be obtained from getWlanGroupList)
     * @param ssidId - SSID ID (can be obtained from getSsidList)
     */
    public async deleteSsid(wlanId: string, ssidId: string, siteId?: string): Promise<unknown> {
        if (!wlanId) {
            throw new Error('A wlanId must be provided. Use getWlanGroupList to get available WLAN group IDs.');
        }
        if (!ssidId) {
            throw new Error('An ssidId must be provided. Use getSsidList to get available SSID IDs.');
        }

        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(
            `/sites/${encodeURIComponent(resolvedSiteId)}/wireless-network/wlans/${encodeURIComponent(wlanId)}/ssids/${encodeURIComponent(ssidId)}`
        );
        const response = await this.request.delete<OmadaApiResponse<unknown>>(path);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get firewall settings for a site.
     * OperationId: getFirewallSetting
     */
    public async getFirewallSetting(siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/firewall`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path);
        return this.request.ensureSuccess(response);
    }

    /**
     * Create a new LAN network (v2 API).
     */
    public async createLanNetwork(data: Record<string, unknown>, siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/lan-networks`, 'v2');
        const response = await this.request.post<OmadaApiResponse<unknown>>(path, data);
        return this.request.ensureSuccess(response);
    }

    /**
     * Update an existing LAN network (v2 API).
     */
    public async updateLanNetwork(networkId: string, data: Record<string, unknown>, siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/lan-networks/${encodeURIComponent(networkId)}`, 'v2');
        const response = await this.request.put<OmadaApiResponse<unknown>>(path, data);
        return this.request.ensureSuccess(response);
    }

    /**
     * Delete a LAN network (v2 API).
     */
    public async deleteLanNetwork(networkId: string, siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/lan-networks/${encodeURIComponent(networkId)}`, 'v2');
        const response = await this.request.delete<OmadaApiResponse<unknown>>(path);
        return this.request.ensureSuccess(response);
    }

    /**
     * Create a new LAN profile (v1 API).
     */
    public async createLanProfile(data: Record<string, unknown>, siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/lan-profiles`);
        const response = await this.request.post<OmadaApiResponse<unknown>>(path, data);
        return this.request.ensureSuccess(response);
    }

    /**
     * Update an existing LAN profile (v1 API).
     */
    public async updateLanProfile(profileId: string, data: Record<string, unknown>, siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/lan-profiles/${encodeURIComponent(profileId)}`);
        const response = await this.request.put<OmadaApiResponse<unknown>>(path, data);
        return this.request.ensureSuccess(response);
    }

    /**
     * Update firewall settings for a site (v1 API).
     */
    public async updateFirewallSetting(data: Record<string, unknown>, siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/firewall`);
        const response = await this.request.put<OmadaApiResponse<unknown>>(path, data);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get paginated events for a site (v1 API).
     */
    public async listEvents(siteId?: string, page = 1, pageSize = 10): Promise<PaginatedResult<unknown>> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/events`);
        const response = await this.request.get<OmadaApiResponse<PaginatedResult<unknown>>>(path, {
            page,
            pageSize,
        });
        return this.request.ensureSuccess(response);
    }

    /**
     * Get paginated logs for a site (v1 API).
     */
    public async listLogs(siteId?: string, page = 1, pageSize = 10): Promise<PaginatedResult<unknown>> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/logs`);
        const response = await this.request.get<OmadaApiResponse<PaginatedResult<unknown>>>(path, {
            page,
            pageSize,
        });
        return this.request.ensureSuccess(response);
    }

    /**
     * Get switch ports for a specific switch (v1 API, paginated).
     */
    public async getSwitchPorts(switchMac: string, siteId?: string): Promise<unknown[]> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/switches/${encodeURIComponent(switchMac)}/ports`);
        return await this.request.fetchPaginated<unknown>(path);
    }

    /**
     * Update a switch port configuration (v1 API).
     */
    public async updateSwitchPort(switchMac: string, portId: string, data: Record<string, unknown>, siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(
            `/sites/${encodeURIComponent(resolvedSiteId)}/switches/${encodeURIComponent(switchMac)}/ports/${encodeURIComponent(portId)}`
        );
        const response = await this.request.request<OmadaApiResponse<unknown>>({ method: 'PATCH', url: path, data });
        return this.request.ensureSuccess(response);
    }

    /**
     * List firewall ACL rules for a site.
     * Uses the internal web UI API when web credentials are configured (required for OC200),
     * otherwise falls back to the Open API.
     */
    public async listFirewallAcls(siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);

        if (this.hasInternalApi) {
            logger.info('Using internal API for listFirewallAcls');
            const path = `/sites/${encodeURIComponent(resolvedSiteId)}/setting/firewall/acls`;
            const response = await this.internalRequest!.get<OmadaApiResponse<unknown>>(path, {
                type: 0,
                currentPage: 1,
                currentPageSize: 100,
            });
            return this.internalRequest!.ensureSuccess(response);
        }

        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/setting/firewall/acls`);
        return await this.request.fetchPaginated<unknown>(path);
    }

    /**
     * Create a firewall ACL rule.
     * Uses the internal web UI API when web credentials are configured (required for OC200),
     * otherwise falls back to the Open API.
     */
    public async createFirewallAcl(data: Record<string, unknown>, siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);

        if (this.hasInternalApi) {
            logger.info('Using internal API for createFirewallAcl');
            const path = `/sites/${encodeURIComponent(resolvedSiteId)}/setting/firewall/acls`;
            const response = await this.internalRequest!.post<OmadaApiResponse<unknown>>(path, data);
            return this.internalRequest!.ensureSuccess(response);
        }

        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/setting/firewall/acls`);
        const response = await this.request.post<OmadaApiResponse<unknown>>(path, data);
        return this.request.ensureSuccess(response);
    }

    /**
     * Delete a firewall ACL rule.
     * Uses the internal web UI API when web credentials are configured (required for OC200),
     * otherwise falls back to the Open API.
     */
    public async deleteFirewallAcl(aclId: string, siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);

        if (this.hasInternalApi) {
            logger.info('Using internal API for deleteFirewallAcl');
            const path = `/sites/${encodeURIComponent(resolvedSiteId)}/setting/firewall/acls/${encodeURIComponent(aclId)}`;
            const response = await this.internalRequest!.delete<OmadaApiResponse<unknown>>(path);
            return this.internalRequest!.ensureSuccess(response);
        }

        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/setting/firewall/acls/${encodeURIComponent(aclId)}`);
        const response = await this.request.delete<OmadaApiResponse<unknown>>(path);
        return this.request.ensureSuccess(response);
    }

    /**
     * List IP/Port groups for a site (internal API only).
     * These groups can be used as source/destination in firewall ACL rules.
     * Requires OMADA_WEB_USERNAME and OMADA_WEB_PASSWORD to be configured.
     */
    public async listIpGroups(siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);

        if (!this.hasInternalApi) {
            throw new Error(
                'listIpGroups requires the internal web UI API. ' +
                    'Set OMADA_WEB_USERNAME and OMADA_WEB_PASSWORD environment variables to enable it.'
            );
        }

        const path = `/sites/${encodeURIComponent(resolvedSiteId)}/setting/profiles/groups`;
        const response = await this.internalRequest!.get<OmadaApiResponse<unknown>>(path, {
            currentPage: 1,
            currentPageSize: 100,
        });
        return this.internalRequest!.ensureSuccess(response);
    }

    /**
     * Get beacon control and airtime fairness settings for a site.
     */
    public async getBeaconControl(siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/beacon-control`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path);
        return this.request.ensureSuccess(response);
    }

    /**
     * Update beacon control and/or airtime fairness settings for a site.
     */
    public async updateBeaconControl(data: Record<string, unknown>, siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/beacon-control`);
        const response = await this.request.request<OmadaApiResponse<unknown>>({ method: 'PATCH', url: path, data });
        return this.request.ensureSuccess(response);
    }

    /**
     * Get band steering settings for a site.
     */
    public async getBandSteering(siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/band-steering`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path);
        return this.request.ensureSuccess(response);
    }

    /**
     * Update band steering settings for a site.
     */
    public async updateBandSteering(data: Record<string, unknown>, siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/band-steering`);
        const response = await this.request.request<OmadaApiResponse<unknown>>({ method: 'PATCH', url: path, data });
        return this.request.ensureSuccess(response);
    }

    /**
     * Get roaming settings for a site (802.11k/v/r).
     */
    public async getRoaming(siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/roaming`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path);
        return this.request.ensureSuccess(response);
    }

    /**
     * Update roaming settings for a site.
     */
    public async updateRoaming(data: Record<string, unknown>, siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/roaming`);
        const response = await this.request.request<OmadaApiResponse<unknown>>({ method: 'PATCH', url: path, data });
        return this.request.ensureSuccess(response);
    }

    /**
     * Get mesh settings for a site.
     */
    public async getMesh(siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/mesh`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path);
        return this.request.ensureSuccess(response);
    }

    /**
     * Update mesh settings for a site.
     */
    public async updateMesh(data: Record<string, unknown>, siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/mesh`);
        const response = await this.request.request<OmadaApiResponse<unknown>>({ method: 'PATCH', url: path, data });
        return this.request.ensureSuccess(response);
    }

    /**
     * Get channel limit settings for a site.
     */
    public async getChannelLimit(siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/channel-limit`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path);
        return this.request.ensureSuccess(response);
    }

    /**
     * Update channel limit settings for a site.
     */
    public async updateChannelLimit(data: Record<string, unknown>, siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/channel-limit`);
        const response = await this.request.request<OmadaApiResponse<unknown>>({ method: 'PATCH', url: path, data });
        return this.request.ensureSuccess(response);
    }

    /**
     * Get RF planning configuration for a site.
     */
    public async getRfPlanningConfig(siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/rfPlanning`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path);
        return this.request.ensureSuccess(response);
    }

    /**
     * Update RF planning deploy configuration for a site.
     */
    public async updateRfPlanningConfig(data: Record<string, unknown>, siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/rfPlanning/config`);
        const response = await this.request.put<OmadaApiResponse<unknown>>(path, data);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get RF planning optimization result/status for a site.
     */
    public async getRfPlanningResult(siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/rfPlanning/result`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path);
        return this.request.ensureSuccess(response);
    }

    /**
     * Start RF planning optimization for a site.
     */
    public async startRfOptimization(data: Record<string, unknown>, siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/cmd/rfPlanning/optimization`);
        const response = await this.request.post<OmadaApiResponse<unknown>>(path, data);
        return this.request.ensureSuccess(response);
    }

    /**
     * Cancel an in-progress RF planning optimization.
     */
    public async cancelRfOptimization(siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/cmd/rfPlanning/cancel`);
        const response = await this.request.post<OmadaApiResponse<unknown>>(path, {});
        return this.request.ensureSuccess(response);
    }

    /**
     * Check whether RF planning has been successfully executed before.
     */
    public async getRfPlanningDeployHistory(siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/rfplanning/history`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path);
        return this.request.ensureSuccess(response);
    }

    /**
     * List RF planning history entries (paginated).
     */
    public async listRfPlanningHistory(siteId?: string, page = 1, pageSize = 10): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/planningHistory`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, { page, pageSize });
        return this.request.ensureSuccess(response);
    }

    /**
     * Get detailed RF planning history entry.
     */
    public async getRfPlanningHistoryDetail(historyId: string, siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/planningHistory/${encodeURIComponent(historyId)}`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path);
        return this.request.ensureSuccess(response);
    }

    /**
     * Apply a RF planning history entry (recommended or previous config).
     */
    public async applyRfPlanningHistory(historyId: string, appliedConfig: number, siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/planningHistory/${encodeURIComponent(historyId)}`);
        const response = await this.request.post<OmadaApiResponse<unknown>>(path, { appliedConfig });
        return this.request.ensureSuccess(response);
    }

    /**
     * Delete a RF planning history entry.
     */
    public async deleteRfPlanningHistory(historyId: string, siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/planningHistory/${encodeURIComponent(historyId)}`);
        const response = await this.request.delete<OmadaApiResponse<unknown>>(path);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get WLAN experience index for a site.
     */
    public async getWlanExperienceIndex(siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/experienceIndex`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path);
        return this.request.ensureSuccess(response);
    }

    /**
     * List static routes for a site (v1 API).
     */
    public async listRoutes(siteId?: string): Promise<unknown[]> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/setting/routes`);
        return await this.request.fetchPaginated<unknown>(path);
    }
}
