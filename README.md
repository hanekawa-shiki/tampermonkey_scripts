# Tampermonkey Scripts

自用 Tampermonkey / Greasemonkey 浏览器脚本集合，使用 TypeScript 编写并通过 esbuild 构建为可直接安装的 `.js` 文件。

## 项目结构

```
tampermonkey_scripts/
├── .github/
│   └── workflows/
│       ├── release.yml         # 推送 tag 时自动发布到 GitHub Releases
│       └── deploy.yml          # 推送 master 时自动部署到 GitHub Pages
├── src/                        # TypeScript 源文件
│   └── annaTorExport.ts        # Anna's Archive 种子/磁力链接导出脚本
├── scripts/
│   └── build.mjs               # 构建脚本（esbuild 打包 + UserScript 头部注入）
├── dist/                       # 构建输出（不提交到 Git）
├── package.json
├── tsconfig.json
├── README.md
└── HANDOVER.md                 # 项目交接文档
```

## 快速开始

### 环境要求

- **Node.js** >= 18
- **pnpm**（推荐）

### 安装依赖

```bash
pnpm install
```

### 构建所有脚本

```bash
pnpm build
```

构建产物输出到 `dist/` 目录，文件名根据脚本 `@name` 自动生成（kebab-case，转小写），例如：

```
dist/annas-archive.js
```

### 监听模式（开发时使用）

```bash
pnpm build:watch
```

修改 `src/` 下的 `.ts` 文件后自动重新构建。

### 清理构建产物

```bash
pnpm clean
```

## 添加新脚本

1. 在 `src/` 目录下新建 `.ts` 文件（例如 `src/myNewScript.ts`）
2. 在文件顶部添加标准 UserScript 头部：

```typescript
// ==UserScript==
// @name         My New Script
// @namespace    https://github.com/hanekawa-shiki/tampermonkey_scripts
// @version      1.0.0
// @description  脚本描述
// @author       hanekawa-shiki
// @match        *://example.com/*
// @grant        none
// @license MIT
// ==/UserScript==
```

3. 编写脚本逻辑
4. 运行 `pnpm build`，产物将自动输出到 `dist/my-new-script.js`

## 安装脚本

### 方法一：直接安装构建产物

1. 构建项目：`pnpm build`
2. 打开 Tampermonkey 面板 → 实用工具
3. 在「从文件导入」中选择 `dist/` 目录下的 `.js` 文件

### 方法二：通过 GitHub Pages 安装

推送 master 分支后，`deploy.yml` 工作流会自动将 `dist/` 部署到 GitHub Pages。部署完成后，可通过以下 URL 直接安装：

```
https://<username>.github.io/tampermonkey_scripts/annas-archive.js
```

## 脚本列表

| 脚本 | 描述 | 匹配站点 |
|------|------|----------|
| Anna's Archive | 导出 Anna's Archive 当前页所有 torrent 和 magnet 链接 | `*.annas-archive.org/torrents/*`、`*.annas-archive.gl/torrents/*`、`*.annas-archive.pk/torrents/*`、`*.annas-archive.gd/torrents/*` |

## CI/CD

- **Release**（`release.yml`）：推送 `v*` tag 时自动构建并发布到 GitHub Releases
- **Deploy**（`deploy.yml`）：推送 master 时自动将构建产物部署到 GitHub Pages

## 技术栈

- **TypeScript** — 类型安全的脚本编写
- **esbuild** — 快速打包，将 TS 编译并捆绑为单个 IIFE 格式的 JS 文件
- **UserScript 标准** — 兼容 Tampermonkey / Greasemonkey / Violentmonkey

## 构建流程说明

`scripts/build.mjs` 脚本执行以下操作：

1. 扫描 `src/` 目录下所有 `.ts` 文件
2. 从每个文件中提取 `==UserScript==` 元数据块
3. 使用 esbuild 将 TypeScript 编译并打包为 IIFE 格式的 JavaScript
4. 将 UserScript 元数据头部注入到输出文件顶部
5. 输出到 `dist/` 目录，文件名取自 `@name` 字段（kebab-case）

## License

MIT