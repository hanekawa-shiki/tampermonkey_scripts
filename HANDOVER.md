# 项目交接文档

> 项目名称：tampermonkey_scripts  
> 最后更新：2026-07-15  
> 仓库地址：https://github.com/hanekawa-shiki/tampermonkey_scripts

---

## 1. 项目概述

本项目是一个 **Tampermonkey/Greasemonkey 浏览器用户脚本集合**，使用 TypeScript 编写，通过 esbuild 构建为可直接安装的 `.js` 文件。

### 核心特性

- 使用 TypeScript 编写，享有类型安全和 IDE 智能提示
- esbuild 快速构建，自动提取 UserScript 元数据头部
- 支持 `--watch` 监听模式，开发体验流畅
- GitHub Actions 自动化发布流程（Release + GitHub Pages 部署）

---

## 2. 项目结构

```
tampermonkey_scripts/
├── .github/
│   └── workflows/
│       ├── release.yml         # CI/CD：推送 tag 时自动构建并发布到 GitHub Releases
│       └── deploy.yml          # CI/CD：推送 master 时自动部署 dist/ 到 GitHub Pages
├── src/                        # TypeScript 源文件目录
│   └── annaTorExport.ts        # Anna's Archive 种子/磁力链接导出脚本
├── scripts/
│   └── build.mjs               # 构建脚本（Node.js ESM，基于 esbuild）
├── dist/                       # 构建输出目录（已 gitignore）
│   └── annas-archive.js        # 构建产物（@name 转 kebab-case）
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

### 4.1 Anna's Archive Torrent/Magnet Export

| 属性 | 值 |
|------|-----|
| 源文件 | `src/annaTorExport.ts` |
| 输出文件 | `dist/annas-archive.js` |
| 脚本版本 | 1.0.11 |
| 项目版本 | 2.0.0（package.json） |
| 功能 | 导出 Anna's Archive 种子列表页所有 torrent 和 magnet 链接 |

**匹配站点：**

| 域名 | Pattern |
|------|---------|
| Anna's Archive 主站 | `*://*.annas-archive.org/torrents/*` |
| Anna's Archive 镜像 1 | `*://*.annas-archive.gl/torrents/*` |
| Anna's Archive 镜像 2 | `*://*.annas-archive.pk/torrents/*` |
| Anna's Archive 镜像 3 | `*://*.annas-archive.gd/torrents/*` |

**工作原理：**

1. 在页面右下角注入一个「导出种子/磁力链接」按钮
2. 点击按钮后，解析页面中的种子表格（`table tbody`）
3. 提取每行的日期、torrent 下载链接、magnet 链接
4. 按日期分组，生成两个文本文件：
   - `Torrent_<timestamp>.txt` — 所有 torrent 链接
   - `Magnet_<timestamp>.txt` — 所有 magnet 链接
5. 自动触发浏览器下载

**关键 DOM 选择器（网站变更时需要同步更新）：**

| 选择器 | 用途 |
|--------|------|
| `.overflow-hidden.max-w-full table tbody` | 种子表格容器 |
| `[title="Date added"]` | 日期单元格 |
| `.p-0.break-all` | 链接单元格（包含 torrent/magnet 下载链接） |

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

# 仅运行类型检查（不输出文件）
npx tsc --noEmit
```

### 5.3 添加新脚本

1. 在 `src/` 目录下创建新的 `.ts` 文件
2. 在文件顶部添加标准 UserScript 头部（构建脚本依赖此头部）
3. 遵循 IIFE 包裹的编码风格
4. 运行 `pnpm build` 验证构建
5. 输出文件名取自 `@name` 字段，自动转为 kebab-case（空格 → `-`，全部小写），扩展名为 `.js`

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
5. **输出** 到 `dist/` 目录，文件名取自 `@name` 字段（kebab-case + `.js`）

### 6.2 TypeScript 配置

`tsconfig.json` 中 `noEmit: true`，TypeScript 编译器仅用于**类型检查**，不负责实际编译。实际编译由 esbuild 完成。

### 6.3 CI/CD

#### 6.3.1 Release 工作流（`.github/workflows/release.yml`）

- **触发条件**：推送以 `v` 开头的 tag（如 `v2.0.0`）
- **流程**：checkout → pnpm install → pnpm build → 打包 zip → 创建 GitHub Release
- `gh` CLI 在 GitHub Actions runner 上已预装，无需额外安装

**发布新版本的步骤：**

```bash
# 1. 更新 package.json 中的 version
# 2. 更新脚本中的 @version
# 3. 提交更改
git add .
git commit -m "release: v2.0.0"

# 4. 打 tag 并推送
git tag v2.0.0
git push origin v2.0.0
```

#### 6.3.2 Deploy 工作流（`.github/workflows/deploy.yml`）

- **触发条件**：推送到 `master` 分支
- **流程**：checkout → pnpm install → pnpm build → 将 `dist/` 部署到 `gh-pages` 分支
- 使用 `JamesIves/github-pages-deploy-action@v4` 执行部署
- **用途**：通过 GitHub Pages 提供构建产物的在线访问，用户可直接从浏览器安装脚本

---

## 7. 已知问题与注意事项

### 7.1 DOM 依赖

脚本的 `getData()` 函数依赖 Anna's Archive 网站的特定 DOM 结构（CSS 类名、`title` 属性等）。如果网站前端改版，可能需要更新选择器。

### 7.2 @grant unsafeWindow

当前脚本声明了 `@grant unsafeWindow`，但在代码中实际未使用 `unsafeWindow`。可以考虑将其改为 `@grant none`，除非确实需要跨隔离环境访问。

### 7.3 pnpm workspace 配置

`pnpm-workspace.yaml` 中的 `allowBuilds` 配置是为了解决 pnpm 默认禁止 esbuild postinstall 脚本的问题。如果升级 pnpm 版本，需要检查此配置是否仍然需要。

### 7.4 版本号同步

`package.json` 中的 `version`（项目版本，当前 2.0.0）和脚本中 `@version`（脚本版本，当前 1.0.11）是独立管理的，发布时需要分别更新。

---

## 8. 文件依赖关系图

```
package.json (v2.0.0)
  ├── devDependencies
  │     ├── typescript ~6.0.3   (类型检查)
  │     └── esbuild ^0.25.0    (构建打包)
  └── scripts
        └── build.mjs
              ├── 读取 src/*.ts
              ├── 提取 ==UserScript== header
              ├── 调用 esbuild 打包 (IIFE, es2020)
              └── 输出 dist/*.js

src/annaTorExport.ts (@v1.0.11)
  ├── ==UserScript== header → 被 build.mjs 提取为 banner
  ├── 多域名 @match: .org / .gl / .pk / .gd
  └── TypeScript 代码 → 被 esbuild 编译为 JS

.github/workflows/release.yml
  ├── 触发: push tag v*
  ├── 依赖 pnpm install → pnpm build
  └── 使用 gh release create 发布

.github/workflows/deploy.yml
  ├── 触发: push master
  ├── 依赖 pnpm install → pnpm build (pnpm v10)
  └── 使用 JamesIves/github-pages-deploy-action@v4 部署到 gh-pages
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