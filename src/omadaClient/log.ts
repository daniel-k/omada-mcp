import type { OmadaApiResponse, PaginatedResult } from '../types/index.js';

import type { RequestHandler } from './request.js';
import type { SiteOperations } from './site.js';

export interface LogTimeRange {
    timeStart: number;
    timeEnd: number;
}

export interface GetEventOrAlertLogOptions {
    page: number;
    pageSize: number;
    timeStart: number;
    timeEnd: number;
    module?: string;
    /** Only applies to alert logs. */
    resolved?: boolean;
}

export interface GetAuditLogOptions {
    page: number;
    pageSize: number;
    sortTime?: 'asc' | 'desc';
    result?: number;
    level?: string;
    auditTypes?: string;
    times?: LogTimeRange[];
    searchKey?: string;
}

export type LogSelectType = 'include' | 'exclude' | 'all';

export interface DeleteEventLogPayload {
    selectType: LogSelectType;
    startTime: number;
    endTime: number;
    logs?: string[];
    /** Required when selectType === 'all'. Site events: 'System' | 'Device' | 'Client'; global events: 'System' | 'Device'. */
    filterModule?: string;
}

export interface DeleteAlertLogPayload extends DeleteEventLogPayload {}

export interface ResolveSiteAlertPayload extends DeleteEventLogPayload {}

export interface ExportLogPayload {
    siteIds: string[];
    /** 0: CSV, 1: xlsx */
    format: 0 | 1;
}

/**
 * Log-related operations for the Omada API.
 * Covers event/alert/audit logs (read, delete, resolve, export) and
 * log-notification settings at site and global scope.
 */
export class LogOperations {
    constructor(
        private readonly request: RequestHandler,
        private readonly site: SiteOperations,
        private readonly buildPath: (path: string, version?: string) => string
    ) {}

    // ---------- Event logs ----------

    public async getEventLogsForSite(options: GetEventOrAlertLogOptions, siteId?: string): Promise<PaginatedResult<unknown>> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/logs/events`);
        const response = await this.request.get<OmadaApiResponse<PaginatedResult<unknown>>>(path, this.buildEventOrAlertParams(options));
        return this.request.ensureSuccess(response);
    }

    public async getEventLogsForGlobal(options: GetEventOrAlertLogOptions): Promise<PaginatedResult<unknown>> {
        const path = this.buildPath('/logs/events');
        const response = await this.request.get<OmadaApiResponse<PaginatedResult<unknown>>>(path, this.buildEventOrAlertParams(options));
        return this.request.ensureSuccess(response);
    }

    // ---------- Alert logs ----------

    public async getAlertLogsForSite(options: GetEventOrAlertLogOptions, siteId?: string): Promise<PaginatedResult<unknown>> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/logs/alerts`);
        const response = await this.request.get<OmadaApiResponse<PaginatedResult<unknown>>>(path, this.buildEventOrAlertParams(options));
        return this.request.ensureSuccess(response);
    }

    public async getAlertLogsForGlobal(options: GetEventOrAlertLogOptions): Promise<PaginatedResult<unknown>> {
        const path = this.buildPath('/logs/alerts');
        const response = await this.request.get<OmadaApiResponse<PaginatedResult<unknown>>>(path, this.buildEventOrAlertParams(options));
        return this.request.ensureSuccess(response);
    }

    // ---------- Audit logs ----------

    public async getAuditLogsForSite(options: GetAuditLogOptions, siteId?: string): Promise<PaginatedResult<unknown>> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/audit-logs`);
        const response = await this.request.get<OmadaApiResponse<PaginatedResult<unknown>>>(path, this.buildAuditParams(options));
        return this.request.ensureSuccess(response);
    }

    public async getAuditLogsForGlobal(options: GetAuditLogOptions): Promise<PaginatedResult<unknown>> {
        const path = this.buildPath('/audit-logs');
        const response = await this.request.get<OmadaApiResponse<PaginatedResult<unknown>>>(path, this.buildAuditParams(options));
        return this.request.ensureSuccess(response);
    }

    // ---------- Resolve / delete operations ----------

    public async resolveAlertForSite(payload: ResolveSiteAlertPayload, siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/logs/alerts/resolve`);
        const response = await this.request.post<OmadaApiResponse<unknown>>(path, this.normalizeBulkPayload(payload));
        return this.request.ensureSuccess(response);
    }

    public async deleteEventLogsForSite(payload: DeleteEventLogPayload, siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/logs/events/delete`);
        const response = await this.request.request<OmadaApiResponse<unknown>>({
            method: 'DELETE',
            url: path,
            data: this.normalizeBulkPayload(payload),
        });
        return this.request.ensureSuccess(response);
    }

    public async deleteAlertLogsForSite(payload: DeleteAlertLogPayload, siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/logs/alerts/delete`);
        const response = await this.request.request<OmadaApiResponse<unknown>>({
            method: 'DELETE',
            url: path,
            data: this.normalizeBulkPayload(payload),
        });
        return this.request.ensureSuccess(response);
    }

    public async deleteEventLogsForGlobal(payload: DeleteEventLogPayload): Promise<unknown> {
        const path = this.buildPath('/logs/events/delete');
        const response = await this.request.request<OmadaApiResponse<unknown>>({
            method: 'DELETE',
            url: path,
            data: this.normalizeBulkPayload(payload),
        });
        return this.request.ensureSuccess(response);
    }

    public async deleteAlertLogsForGlobal(payload: DeleteAlertLogPayload): Promise<unknown> {
        const path = this.buildPath('/logs/alerts/delete');
        const response = await this.request.request<OmadaApiResponse<unknown>>({
            method: 'DELETE',
            url: path,
            data: this.normalizeBulkPayload(payload),
        });
        return this.request.ensureSuccess(response);
    }

    // ---------- Export ----------

    public async exportLogListForGlobal(payload: ExportLogPayload): Promise<unknown> {
        const path = this.buildPath('/logs/export');
        const response = await this.request.post<OmadaApiResponse<unknown>>(path, payload);
        return this.request.ensureSuccess(response);
    }

    public async exportAuditLogListForGlobal(payload: ExportLogPayload): Promise<unknown> {
        const path = this.buildPath('/logs/audit/export');
        const response = await this.request.post<OmadaApiResponse<unknown>>(path, payload);
        return this.request.ensureSuccess(response);
    }

    // ---------- Log-notification settings (event/alert) ----------

    public async getLogNotificationForSite(siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/site/log-notification`, 'v2');
        const response = await this.request.get<OmadaApiResponse<unknown>>(path);
        return this.request.ensureSuccess(response);
    }

    public async modifyLogNotificationForSite(data: Record<string, unknown>, siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/site/log-notification`, 'v2');
        const response = await this.request.request<OmadaApiResponse<unknown>>({ method: 'PATCH', url: path, data });
        return this.request.ensureSuccess(response);
    }

    public async getLogNotificationForGlobal(): Promise<unknown> {
        const path = this.buildPath('/log-notification', 'v2');
        const response = await this.request.get<OmadaApiResponse<unknown>>(path);
        return this.request.ensureSuccess(response);
    }

    public async modifyLogNotificationForGlobal(data: Record<string, unknown>): Promise<unknown> {
        const path = this.buildPath('/log-notification', 'v2');
        const response = await this.request.request<OmadaApiResponse<unknown>>({ method: 'PATCH', url: path, data });
        return this.request.ensureSuccess(response);
    }

    public async resetLogNotificationForSite(siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/site/reset/log-notification`);
        const response = await this.request.post<OmadaApiResponse<unknown>>(path, {});
        return this.request.ensureSuccess(response);
    }

    public async resetLogNotificationForGlobal(): Promise<unknown> {
        const path = this.buildPath('/reset/log-notification');
        const response = await this.request.post<OmadaApiResponse<unknown>>(path, {});
        return this.request.ensureSuccess(response);
    }

    // ---------- Audit-notification settings ----------

    public async getAuditNotificationForSite(siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/site/audit-notification`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path);
        return this.request.ensureSuccess(response);
    }

    public async modifyAuditNotificationForSite(data: Record<string, unknown>, siteId?: string): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/site/audit-notification`);
        const response = await this.request.request<OmadaApiResponse<unknown>>({ method: 'PATCH', url: path, data });
        return this.request.ensureSuccess(response);
    }

    public async getAuditNotificationForGlobal(): Promise<unknown> {
        const path = this.buildPath('/audit-notification');
        const response = await this.request.get<OmadaApiResponse<unknown>>(path);
        return this.request.ensureSuccess(response);
    }

    public async modifyAuditNotificationForGlobal(data: Record<string, unknown>): Promise<unknown> {
        const path = this.buildPath('/audit-notification');
        const response = await this.request.request<OmadaApiResponse<unknown>>({ method: 'PATCH', url: path, data });
        return this.request.ensureSuccess(response);
    }

    // ---------- Helpers ----------

    private buildEventOrAlertParams(options: GetEventOrAlertLogOptions): Record<string, unknown> {
        const params: Record<string, unknown> = {
            page: options.page,
            pageSize: options.pageSize,
            'filters.timeStart': options.timeStart,
            'filters.timeEnd': options.timeEnd,
        };
        if (options.module) {
            params['filters.module'] = options.module;
        }
        if (options.resolved !== undefined) {
            params['filters.resolved'] = options.resolved;
        }
        return params;
    }

    private buildAuditParams(options: GetAuditLogOptions): Record<string, unknown> {
        const params: Record<string, unknown> = {
            page: options.page,
            pageSize: options.pageSize,
        };
        if (options.sortTime) {
            params['sorts.time'] = options.sortTime;
        }
        if (options.result !== undefined) {
            params['filters.result'] = options.result;
        }
        if (options.level) {
            params['filters.level'] = options.level;
        }
        if (options.auditTypes) {
            params['filters.auditTypes'] = options.auditTypes;
        }
        if (options.times && options.times.length > 0) {
            params['filters.times'] = JSON.stringify(options.times);
        }
        if (options.searchKey) {
            params.searchKey = options.searchKey;
        }
        return params;
    }

    private normalizeBulkPayload<T extends DeleteEventLogPayload>(payload: T): Record<string, unknown> {
        const body: Record<string, unknown> = {
            selectType: payload.selectType,
            startTime: payload.startTime,
            endTime: payload.endTime,
            logs: payload.logs ?? [],
        };
        if (payload.filterModule) {
            body.filterModule = payload.filterModule;
        }
        return body;
    }
}
