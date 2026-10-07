import { Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import { GatewayAuthError, GatewayAuthService } from './gateway-auth.service.js';

@Injectable()
export class AppService {
  constructor(private readonly gatewayAuthService: GatewayAuthService) {}

  private readonly clientServiceUrl = this.normalizeBaseUrl(
    process.env.CLIENT_SERVICE_URL ?? 'http://localhost:9875',
  );

  private readonly auditServiceUrl = this.normalizeBaseUrl(
    process.env.AUDIT_SERVICE_URL ?? 'http://localhost:9874',
  );

  proxyToClient(request: Request, response: Response): Promise<void> {
    return this.proxyRequest(request, response, this.clientServiceUrl, '/client');
  }

  proxyToAudit(request: Request, response: Response): Promise<void> {
    return this.proxyRequest(request, response, this.auditServiceUrl, '/audit');
  }

  private async proxyRequest(
    request: Request,
    response: Response,
    baseUrl: string,
    routePrefix: string
  ): Promise<void> {
    try {
      await this.gatewayAuthService.authorizeRequest(request, routePrefix);

      const targetUrl = this.buildTargetUrl(baseUrl, routePrefix, request.originalUrl);
      const upstreamResponse = await fetch(targetUrl, {
        method: request.method,
        headers: this.buildRequestHeaders(request),
        body: this.getRequestBody(request),
        redirect: 'manual',
      });

      this.copyResponseHeaders(upstreamResponse, response);
      response.status(upstreamResponse.status);

      const responseBuffer = Buffer.from(await upstreamResponse.arrayBuffer());
      response.send(responseBuffer);
    } catch (error) {
      if (error instanceof GatewayAuthError) {
        response.status(error.statusCode).json({
          statusCode: error.statusCode,
          message: error.message,
        });
        return;
      }

      response.status(502).json({
        statusCode: 502,
        message: 'Bad Gateway',
      });
    }
  }

  buildTargetUrl(baseUrl: string, routePrefix: string, originalUrl: string): string {
    const [pathname, queryString] = originalUrl.split('?', 2);
    const strippedPath = this.stripRoutePrefix(pathname, routePrefix);
    const normalizedPath = strippedPath.length > 0 ? strippedPath : '/';

    return queryString === undefined
      ? `${baseUrl}${normalizedPath}`
      : `${baseUrl}${normalizedPath}?${queryString}`;
  }

  private buildRequestHeaders(request: Request): Headers {
    const headers = new Headers();

    for (const [key, value] of Object.entries(request.headers)) {
      if (value === undefined || value === null || this.isHopByHopHeader(key) || key === 'host') {
        continue;
      }

      if (Array.isArray(value)) {
        for (const headerValue of value) {
          headers.append(key, headerValue);
        }
        continue;
      }

      headers.set(key, String(value));
    }

    return headers;
  }

  private copyResponseHeaders(upstreamResponse: globalThis.Response, response: Response): void {
    upstreamResponse.headers.forEach((value, key) => {
      if (this.isHopByHopHeader(key) || key === 'content-length') {
        return;
      }

      response.setHeader(key, value);
    });
  }

  private getRequestBody(request: Request): BodyInit | undefined {
    if (request.method === 'GET' || request.method === 'HEAD') {
      return undefined;
    }

    const body = request.body as unknown;
    if (body === undefined || body === null) {
      return undefined;
    }

    if (typeof body === 'string' || body instanceof URLSearchParams) {
      return body;
    }

    if (body instanceof Uint8Array) {
      return Buffer.from(body);
    }

    if (body instanceof ArrayBuffer) {
      return Buffer.from(body);
    }

    return JSON.stringify(body);
  }

  private stripRoutePrefix(pathname: string, routePrefix: string): string {
    if (pathname.startsWith(`${routePrefix}/`)) {
      return pathname.slice(routePrefix.length);
    }

    return pathname;
  }

  private normalizeBaseUrl(url: string): string {
    return url.endsWith('/') ? url.slice(0, -1) : url;
  }

  private isHopByHopHeader(headerName: string): boolean {
    return new Set([
      'connection',
      'content-length',
      'keep-alive',
      'proxy-authenticate',
      'proxy-authorization',
      'te',
      'trailer',
      'transfer-encoding',
      'upgrade',
    ]).has(headerName.toLowerCase());
  }
}
