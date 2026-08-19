# SamWafWeb

## QuickStart

1.
``` 
npm install
```

2.
```
npm run dev
```

3. 
```
npm run build
```

## 图标资源（离线部署必读）

`<t-icon name="xxx">` 默认会去腾讯 CDN（`tdesign.gtimg.com`）拉 SVG sprite，内网/离线环境拉不到就整片图标空白。
本项目已把 sprite 落到 `public/assets/tdesign-icons/<版本>/`（**必须放 assets/ 下面**：SamWaf 后端只把 `dist/assets` 挂成静态目录，其余路径会被 SPA 兜底返回 index.html），构建时由 `build/vite-plugin-tdesign-local-icons.mjs`
把包里写死的 CDN 常量替换成本地路径，产物不再依赖外网。

**升级 `tdesign-vue` / `tdesign-icons-vue` 之后要重新同步一次**（CDN 地址里的版本号写死在包源码里，升级就会变）：

```
npm run sync:icons                     # 同步 <t-icon> 用的 SVG sprite
npm run sync:icons -- --with-iconfont  # 顺带同步 <t-iconfont> 的字体（默认不同步，项目没用到）
npm run sync:icons -- --check          # 只检查不下载，缺文件时非 0 退出（CI 用）
```

忘了跑也不会静默出问题：本地文件对不上时 `npm run build` / `npm run dev` 会直接报错并提示这条命令。
旧版本目录会在同步时自动清理。


#  License
SamWaf is licensed under the Apache License 2.0. Refer to [LICENSE](./LICENSE) for more details.

For third-party software usage notice:

TDesign (https://github.com/Tencent/tdesign-vue-starter).

# Contribution
Thanks for the following contributors!

<a href="https://github.com/samwafgo/SamWafWeb/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=samwafgo/SamWafWeb" />
</a>
