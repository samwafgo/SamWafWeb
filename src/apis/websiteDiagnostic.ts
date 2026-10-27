import request from '@/utils/request';

export type DiagnosticPhase = 'inspect' | 'local_ingress' | 'origin' | 'access_url';
export type DiagnosticStatus = 'passed' | 'failed' | 'warning' | 'skipped' | 'unknown';
export interface DiagnosticField {
  label: string;
  value: string;
}
export interface DiagnosticAdvice {
  code: string;
  message: string;
  tab: string;
  section: string;
}
export interface DiagnosticCheck {
  id: string;
  title: string;
  status: DiagnosticStatus;
  reason: string;
  message: string;
  overview: DiagnosticField[];
  request: string;
  response: string;
  connection: DiagnosticField[];
  advice: DiagnosticAdvice[];
  status_code: number;
  body_truncated: boolean;
}
export interface DiagnosticRequest {
  host_code: string;
  phase: DiagnosticPhase;
  visitor_url: string;
  method: 'GET' | 'HEAD';
  headers: { name: string; value: string }[];
  use_system_proxy: boolean;
  config_fingerprint: string;
  origin_cursor: number;
}
export interface DiagnosticData {
  phase: DiagnosticPhase;
  config_fingerprint: string;
  site: { host_code: string; title: string; visitor_url: string };
  checks: DiagnosticCheck[];
  next_cursor: number;
  has_more: boolean;
  total: number;
  error_code?: string;
}
export interface DiagnosticEnvelope {
  code: number;
  msg: string;
  data: DiagnosticData;
}

export function diagnoseWebsite(data: DiagnosticRequest, signal: AbortSignal): Promise<DiagnosticEnvelope> {
  return request({
    url: 'wafhost/host/diagnostic',
    method: 'post',
    data,
    signal,
    timeout: 12000,
    background: true,
  }) as unknown as Promise<DiagnosticEnvelope>;
}
