// 应用管理（表单预检 / 提交编排 / 启动轮询）的纯逻辑。
// 不依赖 Vue / axios，组件与 scripts/verify-app-flow.mjs 共用同一份实现。

// ---------- 目录预检 ----------

export interface DirectoryPreviewData {
  default_dir: string;
  resolved_dir: string;
  allowed_dirs: string[];
  path_base: string;
  valid: boolean;
  error: string;
}

export type PreviewStatus =
  | { state: 'ok'; data: DirectoryPreviewData }
  | { state: 'unsupported' }
  | { state: 'error'; message: string };

interface PreviewControllerOpts {
  request: (body: { code: string; app_dir: string }) => Promise<any>;
  // 旧后端没有预检接口，HTTP 404 视为“不支持”
  isNotFound: (err: any) => boolean;
  onUpdate: (st: PreviewStatus) => void;
  debounceMs?: number;
  setTimeoutFn?: (fn: () => void, ms: number) => any;
  clearTimeoutFn?: (t: any) => void;
}

export function createDirPreviewController(opts: PreviewControllerOpts) {
  let seq = 0;
  let timer: any = null;
  const debounceMs = opts.debounceMs == null ? 300 : opts.debounceMs;
  const stFn = opts.setTimeoutFn || ((fn: () => void, ms: number) => setTimeout(fn, ms));
  const ctFn = opts.clearTimeoutFn || ((t: any) => { clearTimeout(t); });
  const ctl = {
    schedule(body: { code: string; app_dir: string }) {
      if (timer != null) ctFn(timer);
      timer = stFn(() => { timer = null; ctl.run(body); }, debounceMs);
    },
    run(body: { code: string; app_dir: string }): Promise<PreviewStatus | null> {
      seq += 1;
      const mySeq = seq;
      return opts.request(body).then((res: any) => {
        if (mySeq !== seq) return null; // 已有更新的请求，丢弃本次结果
        const st: PreviewStatus = res && res.code === 0
          ? { state: 'ok', data: res.data as DirectoryPreviewData }
          : { state: 'error', message: (res && res.msg) || '' };
        opts.onUpdate(st);
        return st;
      }).catch((err: any) => {
        if (mySeq !== seq) return null;
        const st: PreviewStatus = opts.isNotFound(err)
          ? { state: 'unsupported' }
          : { state: 'error', message: '' };
        opts.onUpdate(st);
        return st;
      });
    },
    dispose() {
      seq += 1; // 使在途请求结果失效
      if (timer != null) { ctFn(timer); timer = null; }
    },
  };
  return ctl;
}

// ---------- 提交编排：保证「记录已创建后绝不重复 Add」 ----------

export type SubmitPlan = 'add' | 'edit' | 'edit_then_upload';

export function planSubmit(ctx: {
  isEdit: boolean;
  recordCreated: boolean;
  hasUploadFile: boolean;
  uploadState: string;
}): SubmitPlan {
  if (ctx.isEdit) return 'edit';
  if (!ctx.recordCreated) return 'add';
  if (ctx.hasUploadFile && ctx.uploadState !== 'success') return 'edit_then_upload';
  return 'edit';
}

// ---------- 启动轮询判定 ----------

export interface AppStatusData {
  run_status?: number;
  last_error?: string;
  error_time?: string;
}

export type StartPollDecision =
  | { kind: 'success' }
  | { kind: 'pending' }
  | { kind: 'failed'; error: string; time: string }
  | { kind: 'timeout' };

// 后端时间串：RFC3339 或 "YYYY-MM-DD HH:mm:ss"（空串表示无错误）
export function parseErrorTimeMs(s?: string): number {
  if (!s) return NaN;
  const t = Date.parse(s);
  if (!Number.isNaN(t)) return t;
  const m = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})/.exec(s);
  if (m) return Date.parse(`${m[1]}T${m[2]}`);
  return NaN;
}

export function decideStartPoll(
  data: AppStatusData | null | undefined,
  targetStatus: number,
  attemptStartMs: number | null,
  nowMs: number,
  deadlineMs: number,
  skewMs = 5000,
): StartPollDecision {
  if (data && data.run_status === targetStatus) return { kind: 'success' };
  if (attemptStartMs != null && data && data.run_status === 2) {
    const t = parseErrorTimeMs(data.error_time);
    // error_time 为空：新契约里表示无错误记录；进程已崩溃却无法给出错误时按失败处理
    // error_time 早于本次启动：是上一次残留的错误信息，继续等待，避免陈旧状态误判
    if (Number.isNaN(t) || t >= attemptStartMs - skewMs) {
      return { kind: 'failed', error: data.last_error || '', time: data.error_time || '' };
    }
  }
  if (nowMs >= deadlineMs) return { kind: 'timeout' };
  return { kind: 'pending' };
}
