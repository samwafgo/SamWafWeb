import nacl from 'tweetnacl';
import { v4 as uuidv4 } from 'uuid';
import { getBaseUrl, AesDecrypt, AesEncrypt } from './usuallytool';

/**
 * 管理端传输层 v2（swt2）通道。
 *
 * 与服务端每实例静态公钥（X25519）协商出本标签页专属的会话密钥，报文用
 * XSalsa20-Poly1305 加密。相对旧通道的实际增益：密钥不再随源码公开，抓到的报文
 * 无法离线还原。防不了主动中间人、也防不了本机 DevTools —— 那两件事只有 TLS 和
 * 端上信任能解决，此处不做过度承诺。
 *
 * 选 tweetnacl 而不是浏览器原生 Web Crypto 的原因：crypto.subtle 只在安全上下文
 * （HTTPS / localhost）暴露，而本通道要服务的正是 HTTP 部署。tweetnacl 是纯 JS，
 * 且全部同步，因此 axios 的 transformRequest 不必改成异步。
 *
 * 报文格式：swt2:<keyid>:<base64(nonce24 ‖ 密文)>
 */

const PREFIX = 'swt2:';
const KEYID_KEY = '__samwaf_sec_keyid__';
const SHARED_KEY = '__samwaf_sec_shared__';
const NONCE_LEN = 24;
const KEY_LEN = 32;

let keyId = '';
let sharedKey: Uint8Array | null = null;
let handshakePromise: Promise<boolean> | null = null;

function toB64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 1) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function fromB64(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function encodeUtf8(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function decodeUtf8(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

/** 从 sessionStorage 恢复本标签页的会话密钥（刷新页面不必重新握手） */
function restore(): boolean {
  if (keyId && sharedKey) return true;
  try {
    const id = sessionStorage.getItem(KEYID_KEY);
    const shared = sessionStorage.getItem(SHARED_KEY);
    if (id && shared) {
      // 先解码校验，两项都合格才一起赋值：storage 里的内容不可信（用户可改、
      // 也可能是上个版本残留），中途失败留下半截状态会让后续判断依据不一致
      const bytes = fromB64(shared);
      if (bytes.length !== KEY_LEN) return false;
      keyId = id;
      sharedKey = bytes;
      return true;
    }
  } catch {
    // 隐私模式等场景读不到 storage：退化成每次加载握手一次，功能不受影响
  }
  return false;
}

function persist() {
  try {
    sessionStorage.setItem(KEYID_KEY, keyId);
    sessionStorage.setItem(SHARED_KEY, toB64(sharedKey as Uint8Array));
  } catch {
    // 同上，存不下不影响本次会话使用
  }
}

/** 丢弃当前会话密钥，下次请求前会重新握手（服务端重启/密钥过期时调用） */
export function resetSecSession() {
  keyId = '';
  sharedKey = null;
  handshakePromise = null;
  try {
    sessionStorage.removeItem(KEYID_KEY);
    sessionStorage.removeItem(SHARED_KEY);
  } catch {
    // ignore
  }
}

export function currentKeyId(): string {
  return keyId;
}

export function secReady(): boolean {
  return !!(keyId && sharedKey);
}

// 握手不走 axios，防重放头得自己带，否则被 ReplayProtect 直接拦掉
function handshakeHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    'X-Request-Time': Math.floor(Date.now() / 1000).toString(),
    'X-Request-Id': uuidv4(),
    ...(extra || {}),
  };
}

async function doHandshake(): Promise<boolean> {
  const base = getBaseUrl();

  // 一次往返：把自己的一次性公钥发过去，换回服务端公钥 + keyid。
  // X25519 双方各出一个公钥、各自算出同一把共享密钥，谁先谁后都行，
  // 所以不需要先单独取一次服务端公钥。
  // 握手报文本身是明文的（此时还没有共享密钥），因此不能走 axios 实例。
  const ephemeral = nacl.box.keyPair();
  const resp = await fetch(`${base}/public/seckey`, {
    method: 'POST',
    headers: handshakeHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ epk: toB64(ephemeral.publicKey) }),
  });
  const reg = await resp.json();
  if (!reg || reg.code !== 0 || !reg.data || !reg.data.keyid || !reg.data.pub) return false;

  const serverPub = fromB64(reg.data.pub);
  if (serverPub.length !== KEY_LEN) return false;

  keyId = reg.data.keyid;
  sharedKey = nacl.box.before(serverPub, ephemeral.secretKey);
  persist();
  return true;
}

/**
 * 确保本标签页已有可用的会话密钥。
 * 握手失败（旧后端没有该接口、网络异常等）返回 false，调用方回落 legacy 通道。
 * 并发请求共用同一个握手 Promise，不会打出多次握手。
 */
export function ensureSecSession(): Promise<boolean> {
  if (restore()) return Promise.resolve(true);
  if (handshakePromise) return handshakePromise;

  handshakePromise = doHandshake()
    .catch(() => false)
    .then((ok) => {
      handshakePromise = null;
      if (!ok) resetSecSession();
      return ok;
    });
  return handshakePromise;
}

/** 判断一段报文是否是 v2 格式 */
export function isSecPayload(text: unknown): boolean {
  return typeof text === 'string' && text.indexOf(PREFIX) === 0;
}

/** 用当前会话密钥加密；没有可用密钥时返回 null，由调用方回落 legacy */
export function secEncrypt(plain: string): string | null {
  if (!restore()) return null;
  try {
    const nonce = nacl.randomBytes(NONCE_LEN);
    const box = nacl.secretbox(encodeUtf8(plain), nonce, sharedKey as Uint8Array);
    const joined = new Uint8Array(nonce.length + box.length);
    joined.set(nonce, 0);
    joined.set(box, nonce.length);
    return `${PREFIX}${keyId}:${toB64(joined)}`;
  } catch {
    return null;
  }
}

/** 解开 v2 报文；不是 v2 格式或校验失败返回 null，由调用方按 legacy 处理 */
export function secDecrypt(enc: string): string | null {
  if (!isSecPayload(enc) || !restore()) return null;
  try {
    const rest = enc.slice(PREFIX.length);
    const sep = rest.indexOf(':');
    if (sep <= 0) return null;
    // keyid 不是当前这把（服务端换过密钥/串了标签页）就不试了
    if (rest.slice(0, sep) !== keyId) return null;

    const raw = fromB64(rest.slice(sep + 1));
    if (raw.length <= NONCE_LEN) return null;
    const opened = nacl.secretbox.open(
      raw.slice(NONCE_LEN),
      raw.slice(0, NONCE_LEN),
      sharedKey as Uint8Array,
    );
    if (!opened) return null;
    return decodeUtf8(opened);
  } catch {
    return null;
  }
}

/**
 * 解密一段来自服务端的报文：先按 v2 试，不是 v2（或本地没有对应密钥）再按 legacy 解。
 * 供 WebSocket 推送、SSE 流、以及个别直接解密响应体的页面复用。
 */
export function decryptIncoming(enc: string): string {
  const plain = secDecrypt(enc);
  if (plain !== null) return plain;
  return AesDecrypt(enc);
}

/** 加密一段要发给服务端的报文：有会话密钥走 v2，否则回落 legacy */
export function encryptOutgoing(plain: string): string {
  const enc = secEncrypt(plain);
  return enc !== null ? enc : AesEncrypt(plain);
}
