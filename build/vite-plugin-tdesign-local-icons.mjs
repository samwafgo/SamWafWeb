/**
 * 把 tdesign-icons-vue* 里写死的图标 CDN 地址替换成本地路径
 *
 * 覆盖两条链路：
 *   1. transform  —— 生产构建（rollup 处理 node_modules 源码）
 *   2. optimizeDeps.esbuildOptions.plugins —— 开发态（依赖被 esbuild 预打包，不走 transform）
 *
 * 本地文件由 `npm run sync:icons` 落到 public/tdesign-icons/，随 public 目录原样进 dist。
 * 依赖升级导致版本号变了、本地又没同步时，这里直接抛错，不允许静默发出一个图标全空的包。
 */
import fs from 'node:fs';

import { CDN_ICON_RE, collectCdnIcons, localFileOf, localUrlOf } from './tdesign-icons.mjs';

export default function tdesignLocalIcons({ root = process.cwd() } = {}) {
  let base = '/';
  const replace = (code) =>
    code.replace(CDN_ICON_RE, (url, version, ext) => {
      if (fs.existsSync(localFileOf(root, version, ext))) return localUrlOf(base, version, ext);
      // 走到这里的只会是 <t-iconfont> 的字体样式（按需同步，项目当前没用到，
      // 相关模块最终会被 tree-shaking 掉）。需要离线用时执行：
      //   npm run sync:icons -- --with-iconfont
      return url;
    });

  return {
    name: 'samwaf:tdesign-local-icons',
    enforce: 'pre',

    config() {
      return {
        optimizeDeps: {
          esbuildOptions: {
            plugins: [
              {
                name: 'samwaf:tdesign-local-icons-prebundle',
                setup(build) {
                  build.onLoad({ filter: /tdesign-icons-vue/ }, async (args) => {
                    if (!/[.](js|mjs)$/.test(args.path)) return null;
                    const code = await fs.promises.readFile(args.path, 'utf8');
                    if (!code.includes('tdesign.gtimg.com/icon/')) return null;
                    return { contents: replace(code), loader: 'js' };
                  });
                },
              },
            ],
          },
        },
      };
    },

    configResolved(config) {
      base = config.base || '/';

      // <t-icon> 用的 sprite 必须本地有，否则离线环境图标全瞎
      const missing = [...collectCdnIcons(root).values()].filter(
        (icon) => icon.ext === 'js' && !fs.existsSync(localFileOf(root, icon.version, icon.ext)),
      );
      if (missing.length) {
        throw new Error(
          `[tdesign-local-icons] 缺少本地图标资源，请先执行：npm run sync:icons\n${missing
            .map((i) => `  - ${i.url}`)
            .join('\n')}`,
        );
      }

    },

    transform(code, id) {
      if (!id.includes('tdesign-icons-vue')) return null;
      if (!code.includes('tdesign.gtimg.com/icon/')) return null;
      return { code: replace(code), map: null };
    },
  };
}
