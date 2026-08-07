import dayjs from 'dayjs';

// 后端时间字段一律是 unix 秒，0 表示"没有/永久"
export function fmtUnix(sec: number): string {
  if (!sec || sec <= 0) {
    return '-';
  }
  return dayjs(sec * 1000).format('YYYY-MM-DD HH:mm:ss');
}

// 封禁时长：0 表示永久
export function fmtBanMinutes(minutes: number, permanentText: string): string {
  if (!minutes || minutes <= 0) {
    return permanentText;
  }
  if (minutes < 60) {
    return `${minutes}m`;
  }
  if (minutes < 1440) {
    return `${Math.floor(minutes / 60)}h`;
  }
  return `${Math.floor(minutes / 1440)}d`;
}

// 剩余时间倒计时文本。expireTime=0 表示永久封禁。
export function fmtRemain(expireTime: number, permanentText: string, expiredText: string): string {
  if (!expireTime || expireTime <= 0) {
    return permanentText;
  }
  const remain = expireTime - Math.floor(Date.now() / 1000);
  if (remain <= 0) {
    return expiredText;
  }
  if (remain < 60) {
    return `${remain}s`;
  }
  if (remain < 3600) {
    return `${Math.floor(remain / 60)}m${remain % 60}s`;
  }
  if (remain < 86400) {
    return `${Math.floor(remain / 3600)}h${Math.floor((remain % 3600) / 60)}m`;
  }
  return `${Math.floor(remain / 86400)}d${Math.floor((remain % 86400) / 3600)}h`;
}
