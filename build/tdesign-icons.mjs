/**
 * TDesign 图标 CDN 本地化 —— 共用逻辑
 *
 * 背景：页面上出现 <t-icon name="xxx"> 时，tdesign-icons-vue 会在组件 mounted 里
 * 往 body 动态插一个 <script src="https://tdesign.gtimg.com/icon/<版本>/fonts/index.js">，
 * 去腾讯 CDN 拉 SVG sprite，再用 <use href="#t-icon-xxx"> 渲染。
 * SamWaf 常部署在内网 / 离线机器上，拉不到就是整片图标空白（不报错，静默不显示）。
 *
 * 做法：把 sprite 同步到 public/tdesign-icons/<版本>/，构建时把包里那个 CDN 常量
 * 替换成本地路径（见 vite-plugin-tdesign-local-icons.mjs）。
 *
 * CDN 地址里的版本号是写死在 tdesign-icons-vue* 包源码里的常量，只有升级依赖才会变。
 * 升级依赖后跑一次 `npm run sync:icons`；忘了跑的话构建会直接报错提醒。
 */
import fs from 'node:fs';
import path from 'node:path';

/** 本地资源存放目录（相对 public/），也是构建产物里的目录名 */
export const ICON_DIR = 'tdesign-icons';

/** 包源码里的 CDN 常量形如 https://tdesign.gtimg.com/icon/0.4.0/fonts/index.js */
export const CDN_ICON_RE = /https:\/\/tdesign\.gtimg\.com\/icon\/([0-9.]+)\/fonts\/index\.(js|css)/g;

const PKG_PREFIX = 'tdesign-icons-vue';

/** 常量所在文件：svg-sprite 是 <t-icon>，iconfont 是 <t-iconfont> */
const CANDIDATE_FILES = [
  'esm/svg-sprite/svg-sprite.js',
  'esm/iconfont/icon.js',
  'lib/svg-sprite/svg-sprite.js',
  'lib/iconfont/icon.js',
];

/** 找出所有 tdesign-icons-vue* 包目录（含 npm 版本冲突时装出来的一层嵌套副本） */
function findIconPackages(root) {
  const nodeModules = path.join(root, 'node_modules');
  if (!fs.existsSync(nodeModules)) return [];

  const found = [];
  const pick = (dir) => {
    let names = [];
    try {
      names = fs.readdirSync(dir);
    } catch {
      return;
    }
    for (const name of names) {
      if (name.startsWith(PKG_PREFIX)) found.push(path.join(dir, name));
    }
  };

  pick(nodeModules);
  // 只再往下钻一层：node_modules/<pkg>/node_modules/tdesign-icons-vue*
  for (const name of fs.readdirSync(nodeModules)) {
    if (name.startsWith('.')) continue;
    const nested = path.join(nodeModules, name, 'node_modules');
    if (fs.existsSync(nested)) pick(nested);
  }
  return found;
}

/**
 * 扫描已安装的依赖，收集所有写死的图标 CDN 地址
 * @returns {Map<string, {url:string, version:string, ext:'js'|'css', from:string[]}>}
 */
export function collectCdnIcons(root) {
  const result = new Map();
  for (const pkg of findIconPackages(root)) {
    for (const rel of CANDIDATE_FILES) {
      const file = path.join(pkg, rel);
      if (!fs.existsSync(file)) continue;
      const code = fs.readFileSync(file, 'utf8');
      for (const m of code.matchAll(CDN_ICON_RE)) {
        const [url, version, ext] = m;
        const hit = result.get(url) || { url, version, ext, from: [] };
        hit.from.push(path.relative(root, file));
        result.set(url, hit);
      }
    }
  }
  return result;
}

/** 本地文件的磁盘路径 */
export function localFileOf(root, version, ext) {
  return path.join(root, 'public', ICON_DIR, version, `index.${ext}`);
}

/** 本地文件在浏览器里的访问路径（base 为 vite 的 base，本项目是 ./） */
export function localUrlOf(base, version, ext) {
  const prefix = base.endsWith('/') ? base : `${base}/`;
  return `${prefix}${ICON_DIR}/${version}/index.${ext}`;
}
