#!/usr/bin/env node
/**
 * 把 TDesign 图标资源从腾讯 CDN 同步到本地 public/tdesign-icons/
 *
 *   npm run sync:icons                  只同步 <t-icon> 用的 SVG sprite（默认，项目当前只用到这个）
 *   npm run sync:icons -- --with-iconfont  额外同步 <t-iconfont> 用的字体样式（css + t.woff）
 *   npm run sync:icons -- --check       只检查不下载，缺文件时以非 0 退出（给 CI 用）
 *
 * 什么时候要跑：升级 tdesign-vue / tdesign-icons-vue 之后。
 * CDN 地址里的版本号写死在包源码里，升级后版本号变了，本地就得重新同步一份。
 * 忘了跑也不会静默出错 —— vite 构建时会直接报错并提示这条命令。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ICON_DIR, collectCdnIcons, localFileOf } from './tdesign-icons.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'public', ICON_DIR);
const args = process.argv.slice(2);
const withIconfont = args.includes('--with-iconfont');
const checkOnly = args.includes('--check');

/** IconFont 的 css 里 @font-face 引了 eot/woff/ttf/svg 五份字体，svg 那份 1.6MB。
 *  现代浏览器 woff 就够（管理端本来也不支持 IE），只留 woff 省体积。 */
const FONT_FILE = 't.woff';
const WOFF_ONLY_FACE = `@font-face {
	font-family: "t";
  src: url('./${FONT_FILE}') format("woff");
  font-weight: normal;
  font-style: normal;
}`;

async function download(url) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} <- ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;

async function main() {
  const icons = [...collectCdnIcons(ROOT).values()].filter((i) => i.ext === 'js' || withIconfont);
  if (icons.length === 0) {
    console.log('[tdesign-icons] 依赖里没扫到图标 CDN 地址，可能是包结构变了，请人工确认');
    process.exit(1);
  }

  const missing = [];
  const kept = new Set();
  const manifest = { note: '由 npm run sync:icons 生成，请勿手改', syncedAt: new Date().toISOString(), files: [] };

  for (const icon of icons) {
    const dest = localFileOf(ROOT, icon.version, icon.ext);
    kept.add(icon.version);

    if (checkOnly) {
      if (!fs.existsSync(dest)) missing.push(icon.url);
      continue;
    }

    fs.mkdirSync(path.dirname(dest), { recursive: true });
    let buf = await download(icon.url);

    if (icon.ext === 'css') {
      // 把 @font-face 收敛成只引 woff，再把 woff 拉到同目录
      const css = buf.toString('utf8').replace(/@font-face\s*\{[\s\S]*?\}/, WOFF_ONLY_FACE);
      buf = Buffer.from(css, 'utf8');
      const font = await download(icon.url.replace(/index\.css$/, FONT_FILE));
      fs.writeFileSync(path.join(path.dirname(dest), FONT_FILE), font);
      console.log(`  + ${ICON_DIR}/${icon.version}/${FONT_FILE}  ${kb(font.length)}`);
    }

    fs.writeFileSync(dest, buf);
    manifest.files.push({ url: icon.url, local: `${ICON_DIR}/${icon.version}/index.${icon.ext}`, bytes: buf.length });
    console.log(`  + ${ICON_DIR}/${icon.version}/index.${icon.ext}  ${kb(buf.length)}  <- ${icon.url}`);
  }

  if (checkOnly) {
    if (missing.length) {
      console.error('[tdesign-icons] 本地缺少以下图标资源，请执行 npm run sync:icons');
      missing.forEach((u) => console.error(`  - ${u}`));
      process.exit(1);
    }
    console.log('[tdesign-icons] 本地图标资源齐全');
    return;
  }

  // 清掉依赖升级后不再引用的旧版本目录
  if (fs.existsSync(OUT_DIR)) {
    for (const name of fs.readdirSync(OUT_DIR)) {
      const full = path.join(OUT_DIR, name);
      if (fs.statSync(full).isDirectory() && !kept.has(name)) {
        fs.rmSync(full, { recursive: true, force: true });
        console.log(`  - ${ICON_DIR}/${name}  （已不再引用，删除）`);
      }
    }
  }

  fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`[tdesign-icons] 同步完成，共 ${manifest.files.length} 个文件 -> public/${ICON_DIR}/`);
  if (!withIconfont) console.log('[tdesign-icons] 未同步 <t-iconfont> 字体（项目当前没用到），需要时加 -- --with-iconfont');
}

main().catch((err) => {
  console.error('[tdesign-icons] 同步失败：', err.message);
  process.exit(1);
});
