// 应用管理前端纯逻辑（appFlow.ts）行为验证。
// 直接转译组件引用的同一份源码来跑真实行为，不是镜像实现。
// 用法：node scripts/verify-app-flow.mjs （在 SamWafWeb 根目录执行）
/* eslint-disable no-new-func, no-plusplus, prefer-promise-reject-errors */
// no-new-func：用 Function 构造函数装载 esbuild 转译出的 CJS；
// prefer-promise-reject-errors：模拟 axios 错误对象（{response:{status}}）必须是普通对象。
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const require2 = createRequire(import.meta.url);
const esbuild = require2(path.join(root, 'node_modules', 'esbuild'));

const tsPath = path.join(root, 'src', 'pages', 'waf', 'application', 'components', 'appFlow.ts');
const js = esbuild.transformSync(fs.readFileSync(tsPath, 'utf8'), { loader: 'ts', format: 'cjs' }).code;
const mod = { exports: {} };
new Function('module', 'exports', 'require', js)(mod, mod.exports, require2);
const flow = mod.exports;

let passed = 0;
let failed = 0;
function assert(cond, name) {
  if (cond) { passed += 1; console.log(`  PASS  ${name}`); }
  else { failed += 1; console.error(`  FAIL  ${name}`); }
}
const flush = () => new Promise((r) => setImmediate(r));
function deferred() {
  let resolve; let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}
function makeFakeTimers() {
  let now = 0;
  let nextId = 1;
  const timers = new Map();
  return {
    setTimeoutFn: (fn, ms) => { const id = nextId++; timers.set(id, { fn, at: now + ms }); return id; },
    clearTimeoutFn: (id) => { timers.delete(id); },
    tick: (ms) => {
      now += ms;
      const due = [...timers.entries()].filter(([, t]) => t.at <= now);
      due.forEach(([id, t]) => { timers.delete(id); t.fn(); });
    },
  };
}
function mkCtl(overrides, updates) {
  const timers = makeFakeTimers();
  const ctl = flow.createDirPreviewController({
    request: () => Promise.resolve({ code: 0, data: { resolved_dir: '/x' } }),
    isNotFound: (e) => !!(e && e.response && e.response.status === 404),
    onUpdate: (st) => updates.push(st),
    debounceMs: 0,
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn,
    ...overrides,
  });
  return { ctl, timers };
}

async function main() {
  console.log('== 目录预检控制器 ==');

  { // 防抖合并：连续 schedule 只发最新一次请求
    const calls = [];
    const { ctl, timers } = mkCtl({
      debounceMs: 300,
      request: (body) => { calls.push(body.app_dir); return Promise.resolve({ code: 0, data: {} }); },
    }, []);
    ctl.schedule({ code: 'c', app_dir: 'a' });
    timers.tick(100);
    ctl.schedule({ code: 'c', app_dir: 'ab' });
    timers.tick(299);
    assert(calls.length === 0, '防抖窗口内不发请求');
    timers.tick(1);
    assert(calls.length === 1 && calls[0] === 'ab', '防抖合并后只发最新一次');
  }

  { // 乱序保护：A 慢 B 快，A 后返回但不得覆盖 B
    const dA = deferred(); const dB = deferred();
    const updates = [];
    const { ctl, timers } = mkCtl({
      debounceMs: 100,
      request: (body) => (body.app_dir === 'a' ? dA.promise : dB.promise),
    }, updates);
    ctl.schedule({ code: 'c', app_dir: 'a' });
    timers.tick(100);
    ctl.schedule({ code: 'c', app_dir: 'b' });
    timers.tick(100);
    dB.resolve({ code: 0, data: { resolved_dir: '/b' } });
    await flush();
    dA.resolve({ code: 0, data: { resolved_dir: '/a' } });
    await flush();
    assert(updates.length === 1 && updates[0].state === 'ok' && updates[0].data.resolved_dir === '/b',
      '乱序：旧请求结果被丢弃，仅应用最新');
  }

  { // 404 → 旧后端不支持；其他 HTTP 错误 → error
    const updates404 = [];
    const a = mkCtl({ request: () => Promise.reject({ response: { status: 404 } }) }, updates404);
    a.ctl.schedule({ code: 'c', app_dir: '' });
    a.timers.tick(0); await flush();
    assert(updates404.length === 1 && updates404[0].state === 'unsupported', '404 → unsupported（显式提示可原样保存）');
    const updates500 = [];
    const b = mkCtl({ request: () => Promise.reject({ response: { status: 500 } }) }, updates500);
    b.ctl.schedule({ code: 'c', app_dir: '' });
    b.timers.tick(0); await flush();
    assert(updates500.length === 1 && updates500[0].state === 'error', '500 → error（持续可见）');
  }

  { // code 0 带数据 / code 非 0 带 msg
    const data = { default_dir: 'd', resolved_dir: 'r', allowed_dirs: ['a'], path_base: 'p', valid: true, error: '' };
    const updatesOk = [];
    const a = mkCtl({ request: () => Promise.resolve({ code: 0, data }) }, updatesOk);
    a.ctl.schedule({ code: 'c', app_dir: '' });
    a.timers.tick(0); await flush();
    assert(updatesOk.length === 1 && updatesOk[0].state === 'ok' && updatesOk[0].data.resolved_dir === 'r', 'code 0 → ok 携带服务端数据');
    const updatesBiz = [];
    const b = mkCtl({ request: () => Promise.resolve({ code: 7, msg: '目录越界' }) }, updatesBiz);
    b.ctl.schedule({ code: 'c', app_dir: '' });
    b.timers.tick(0); await flush();
    assert(updatesBiz.length === 1 && updatesBiz[0].state === 'error' && updatesBiz[0].message === '目录越界', '业务错误 code!=0 → error 带服务端 msg');
  }

  { // dispose 后，在途请求结果不得再回写
    const d = deferred();
    const updates = [];
    const { ctl, timers } = mkCtl({ request: () => d.promise }, updates);
    ctl.schedule({ code: 'c', app_dir: '' });
    timers.tick(0);
    ctl.dispose();
    d.resolve({ code: 0, data: { resolved_dir: '/late' } });
    await flush();
    assert(updates.length === 0, 'dispose：在途响应被丢弃（关闭销毁清理）');
  }

  console.log('== 提交编排 planSubmit（不能重复 Add） ==');
  assert(flow.planSubmit({ isEdit: false, recordCreated: false, hasUploadFile: false, uploadState: '' }) === 'add', '新建无文件 → add');
  assert(flow.planSubmit({ isEdit: false, recordCreated: false, hasUploadFile: true, uploadState: '' }) === 'add', '新建有文件 → add（上传在 add 成功后进行）');
  assert(flow.planSubmit({ isEdit: false, recordCreated: true, hasUploadFile: true, uploadState: 'failed' }) === 'edit_then_upload', '已创建+上传失败留窗 → 更新既有记录并重试上传');
  assert(flow.planSubmit({ isEdit: false, recordCreated: true, hasUploadFile: true, uploadState: '' }) === 'edit_then_upload', '已创建+待传文件 → 更新并重传');
  assert(flow.planSubmit({ isEdit: false, recordCreated: true, hasUploadFile: true, uploadState: 'success' }) === 'edit', '已创建+上传已成功 → 只更新（不重复上传）');
  assert(flow.planSubmit({ isEdit: false, recordCreated: true, hasUploadFile: false, uploadState: 'failed' }) === 'edit', '已创建+文件已移除 → 只更新');
  assert(flow.planSubmit({ isEdit: true, recordCreated: false, hasUploadFile: false, uploadState: '' }) === 'edit', '编辑态恒 edit');

  console.log('== 启动轮询 decideStartPoll ==');
  const ATTEMPT = Date.parse('2026-11-02T10:00:00Z');
  const FRESH = new Date(ATTEMPT + 3000).toISOString();
  const STALE = new Date(ATTEMPT - 60000).toISOString();
  const DL = ATTEMPT + 30000;
  assert(flow.decideStartPoll({ run_status: 1 }, 1, ATTEMPT, ATTEMPT + 1000, DL).kind === 'success', '运行中 → success');
  assert(flow.decideStartPoll({ run_status: 0 }, 1, ATTEMPT, ATTEMPT + 1000, DL).kind === 'pending', '启动中（停止态）→ 继续等');
  {
    const d = flow.decideStartPoll({ run_status: 2, last_error: 'exec: not found', error_time: FRESH }, 1, ATTEMPT, ATTEMPT + 5000, DL);
    assert(d.kind === 'failed' && d.error === 'exec: not found' && d.time === FRESH, '本次启动后崩溃（新错误时间）→ failed 带 last_error/error_time');
  }
  assert(flow.decideStartPoll({ run_status: 2, last_error: '旧错误', error_time: STALE }, 1, ATTEMPT, ATTEMPT + 5000, DL).kind === 'pending',
    '陈旧错误时间（早于本次启动）→ 不误判，继续等');
  {
    const d = flow.decideStartPoll({ run_status: 2, last_error: '', error_time: '' }, 1, ATTEMPT, ATTEMPT + 5000, DL);
    assert(d.kind === 'failed' && d.error === '', '异常退出但无 last_error → 明确失败（通用提示）');
  }
  assert(flow.decideStartPoll({ run_status: 0 }, 1, ATTEMPT, DL + 1, DL).kind === 'timeout', '到点未达目标态 → timeout（未确认成功）');
  {
    const d = flow.decideStartPoll({ run_status: 2, last_error: 'boom', error_time: FRESH }, 1, ATTEMPT, DL + 1, DL);
    assert(d.kind === 'failed', '已超时也优先报告本次明确失败，而非未确认');
  }
  assert(flow.decideStartPoll({ run_status: 0 }, 0, null, ATTEMPT + 1000, DL).kind === 'success', '停止/删除轮询（无 attemptStart）只匹配目标态');

  console.log('== parseErrorTimeMs ==');
  assert(!Number.isNaN(flow.parseErrorTimeMs('2026-11-02T10:00:00Z')), 'RFC3339 可解析');
  assert(!Number.isNaN(flow.parseErrorTimeMs('2026-11-02 10:00:00')), '"YYYY-MM-DD HH:mm:ss" 可解析');
  assert(Number.isNaN(flow.parseErrorTimeMs('')), '空串 → NaN（无错误记录）');
  assert(Number.isNaN(flow.parseErrorTimeMs(undefined)), 'undefined → NaN');

  console.log(`\n合计：${passed} 通过，${failed} 失败`);
  process.exitCode = failed > 0 ? 1 : 0;
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
