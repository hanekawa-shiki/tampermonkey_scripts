# 项目交接文档

> 项目名称：tampermonkey_scripts  
> 最后更新：2026-07-14  
> 仓库地址：https://github.com/hanekawa-shiki/tampermonkey_scripts

---

## 1. 项目概述

本项目是一个 **Tampermonkey/Greasemonkey 浏览器用户脚本集合**，使用 TypeScript 编写，通过 esbuild 构建为可直接安装的 `.user.js` 文件。

### 核心特性

- 使用 TypeScript 编写，享有类型安全和 IDE 智能提示
- esbuild 快速构建，自动提取 UserScript 元数据头部
- 支持 `--watch` 监听模式，开发体验流畅
- GitHub Actions 自动化发布流程

---

## 2. 项目结构

```
tampermonkey_scripts/
├── .github/
│   └── workflows/
│       └── release.yml         # CI/CD：推送 tag 时自动构建并发布到 GitHub Releases
├── src/                        # TypeScript 源文件目录
│   └── annaTorExport.ts        # Anna's Archive 种子/磁力链接导出脚本
├── scripts/
│   └── build.mjs               # 构建脚本（Node.js ESM）
├── dist/                       # 构建输出目录（已 gitignore）
│   └── annas-torrents/
│       └── magnet-export.user.js
├── node_modules/               # 依赖（已 gitignore）
├── package.json                # 项目配置和脚本
├── pnpm-workspace.yaml         # pnpm 配置（允许 esbuild postinstall）
├── pnpm-lock.yaml              # 锁定依赖版本
├── tsconfig.json               # TypeScript 配置（仅用于类型检查）
├── .gitignore
├── LICENSE                     # MIT License
├── README.md                   # 项目使用说明
└── HANDOVER.md                 # 本文档（项目交接文档）
```

---

## 3. 环境依赖

| 工具 | 版本要求 | 说明 |
|------|---------|------|
| Node.js | >= 18 | 运行构建脚本 |
| pnpm | >= 8 | 包管理器（推荐） |
| TypeScript | ~6.0.3 | 类型检查（devDependency） |
| esbuild | ^0.25.0 | 打包构建（devDependency） |

---

## 4. 脚本说明

### 4.1 Anna's Torrent/Magnet Export

| 属性 | 值 |
|------|-----|
| 源文件 | `src/annaTorExport.ts` |
| 输出文件 | `dist/annas-torrents/magnet-export.user.js` |
| 版本 | 1.0.10 |
| 匹配站点 | `*://*.annas-archive.org/torrents/*` |
| 功能 | 导出 Anna's Archive 种子列表页所有 torrent 和 magnet 链接 |

**工作原理：**

1. 在页面右下角注入一个「导出种子/磁力链接」按钮
2. 点击按钮后，解析页面中的种子表格（`table tbody`）
3. 提取每行的日期、torrent 下载链接、magnet 链接
4. 按日期分组，生成两个文本文件：
   - `Torrent_<timestamp>.txt` — 所有 torrent 链接
   - `Magnet_<timestamp>.txt` — 所有 magnet 链接
5. 自动触发浏览器下载

**关键 DOM 选择器（网站变更时需要同步更新）：**

- 表格容器：`.overflow-hidden.max-w-full table tbody`
- 日期单元格：`[title="Date added"]`
- 链接单元格：`.p-0 break-all`

---

## 5. 开发流程

### 5.1 首次设置

```bash
# 克隆仓库
git clone git@github.com:hanekawa-shiki/tampermonkey_scripts.git
cd tampermonkey_scripts

# 安装依赖
pnpm install

# 构建
pnpm build
```

### 5.2 日常开发

```bash
# 启动监听模式（修改 src/ 后自动重新构建）
pnpm build:watch

# 构建单次
pnpm build

# 清理 dist/
pnpm clean
```

### 5.3 添加新脚本

1. 在 `src/` 目录下创建新的 `.ts` 文件
2. 必须在文件顶部添加 `==UserScript==` 元数据块（构建脚本依赖此头部）
3. 遵循 IIFE 包裹的编码风格
4. 运行 `pnpm build` 验证构建
5. 文件名会被自动转换为 kebab-case（空格 → `-`，全部小写）

**UserScript 模板：**

```typescript
// ==UserScript==
// @name         Script Name
// @namespace    https://github.com/hanekawa-shiki/tampermonkey_scripts
// @version      1.0.0
// @description  脚本描述
// @author       hanekawa-shiki
// @match        *://example.com/*
// @grant        none
// @license MIT
// ==/UserScript==

(function () {
  'use strict';
  // 脚本逻辑...
})();
```

---

## 6. 构建系统

### 6.1 `scripts/build.mjs`

构建脚本的核心逻辑：

1. **扫描** `src/` 目录下所有 `.ts` 文件（排除 `.d.ts`）
2. **提取** 每个文件中的 `==UserScript==` 元数据块
3. **使用 esbuild** 将 TypeScript 编译并打包为 IIFE 格式
4. **注入** UserScript 元数据到输出文件顶部（作为 banner）
5. **输出** 到 `dist/` 目录

### 6.2 TypeScript 配置

`tsconfig.json` 中 `noEmit: true`，TypeScript 编译器仅用于**类型检查**，不负责实际编译。实际编译由 esbuild 完成。

### 6.3 CI/CD

`.github/workflows/release.yml`：

- **触发条件**：推送以 `v` 开头的 tag（如 `v1.0.11`）
- **流程**：checkout → pnpm install → pnpm build → 打包 zip → 创建 GitHub Release
- **注意**：`gh` CLI 在 GitHub Actions runner 上已预装，无需额外安装

**发布新版本的步骤：**

```bash
# 更新 package.json 和脚本中的 @version
# 提交更改
git add .
git commit -m "release: v1.0.11"

# 打 tag 并推送
git tag v1.0.11
git push origin v1.0.11
```

---

## 7. 已知问题与注意事项

### 7.1 DOM 依赖

脚本的 `getData()` 函数依赖 Anna's Archive 网站的特定 DOM 结构（CSS 类名、`title` 属性等）。如果网站前端改版，可能需要更新选择器。

### 7.2 @grant unsafeWindow

当前脚本声明了 `@grant unsafeWindow`，但在代码中实际未使用 `unsafeWindow`。可以考虑将其改为 `@grant none`，除非确实需要跨隔离环境访问。

### 7.3 pnpm workspace 配置

`pnpm-workspace.yaml` 中的 `allowBuilds` 配置是为了解决 pnpm 默认禁止 esbuild postinstall 脚本的问题。如果升级 pnpm 版本，需要检查此配置是否仍然需要。

---

## 8. 文件依赖关系图

```
package.json
  ├── devDependencies
  │     ├── typescript ~6.0.3   (类型检查)
  │     └── esbuild ^0.25.0    (构建打包)
  └── scripts
        └── build.mjs
              ├── 读取 src/*.ts
              ├── 提取 ==UserScript== header
              ├── 调用 esbuild 打包
              └── 输出 dist/*.user.js

src/annaTorExport.ts
  ├── ==UserScript== header → 被 build.mjs 提取
  └── TypeScript 代码 → 被 esbuild 编译为 JS

.github/workflows/release.yml
  ├── 依赖 pnpm install
  ├── 依赖 pnpm build
  └── 使用 gh release create 发布
```

---

## 9. 常用命令速查

| 命令 | 说明 |
|------|------|
| `pnpm install` | 安装依赖 |
| `pnpm build` | 构建所有脚本到 dist/ |
| `pnpm build:watch` | 监听模式，修改自动构建 |
| `pnpm clean` | 清理 dist/ 目录 |
| `npx tsc --noEmit` | 仅运行类型检查（不输出文件） |

---

## 10. 联系方式

- **作者**：hanekawa-shiki
- **仓库**：https://github.com/hanekawa-shiki/tampermonkey_scripts