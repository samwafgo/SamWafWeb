import request from '@/utils/request';
import { decryptIncoming, resetSecSession } from '@/utils/seccrypto';

const base = '/samwaf/report';
export const getReportConfig = () => request({ url: `${base}/config`, method: 'get', background: true });
export const saveReportConfig = (data) => request({ url: `${base}/config`, method: 'post', data });
export const listReports = (params) => request({ url: `${base}/list`, method: 'get', params, background: true });
export const createReport = (data) => request({ url: `${base}/create`, method: 'post', data });
export const deleteReport = (id) => request({ url: `${base}/delete`, method: 'post', data: { id } });

export async function downloadReport(id: string, retried = false): Promise<Blob> {
  let body: any;
  try {
    body = await request({
      url: `${base}/download`, method: 'post', data: { id }, responseType: 'blob',
      headers: { Accept: 'text/html, application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  } catch (error) {
    if (!(error.response && error.response.data instanceof Blob)) throw error;
    body = error.response.data;
  }
  if (body instanceof Blob && body.type.toLowerCase().includes('text/html')) return body;
  if (body instanceof Blob) {
    try { body = JSON.parse(await body.text()); } catch (_) { throw new Error('REPORT_DOWNLOAD_FAILED'); }
  }
  if (body && body.code === -5 && !retried) {
    resetSecSession();
    return downloadReport(id, true);
  }
  if (body && typeof body.data === 'string' && body.data) {
    try { body.data = JSON.parse(decryptIncoming(body.data)); } catch (_) { /* Keep the response message. */ }
  }
  const error: any = new Error((body && body.msg) || 'REPORT_DOWNLOAD_FAILED');
  error.apiCode = body && body.code;
  throw error;
}
