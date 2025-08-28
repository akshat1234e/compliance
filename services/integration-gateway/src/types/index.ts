export interface ServiceConfig {
  name: string;
  baseUrl: string;
  routes: string[];
}

export interface GatewayRequest {
  serviceName: string;
  path: string;
  method: string;
  body?: any;
}
