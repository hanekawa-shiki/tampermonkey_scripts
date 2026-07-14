# Tampermonkey Scripts

自用 Tampermonkey / Greasemonkey 浏览器脚本集合，使用 TypeScript 编写并通过 esbuild 构建为可直接安装的 `.user.js` 文件。

## 项目结构

```
tampermonkey_scripts/
├── src/                        # TypeScript 源文件
│   └── annaTorExport.ts        # Anna's Archive 种子/磁力链接导出脚本
├── scripts/
│   └── build.mjs               # 构建脚本（esbuild 打包 + UserScript 头部注入）
├── dist/                       # 构建输出（.user.js 文件，不提交到 Git）
├── package.json
├── tsconfig.json
└── README.md
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

构建产物输出到 `dist/` 目录，文件名根据脚本 `@name` 自动生成（kebab-case），例如：

```
dist/annas-torrents/magnet-export.user.js
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
4. 运行 `pnpm build`，产物将自动输出到 `dist/my-new-script.user.js`

## 安装脚本

### 方法一：直接安装构建产物

1. 构建项目：`pnpm build`
2. 打开 Tampermonkey 面板 → 实用工具
3. 在「从文件导入」中选择 `dist/` 目录下的 `.user.js` 文件

### 方法二：通过 URL 安装（需托管）

将 `dist/` 中的 `.user.js` 文件托管到服务器，然后在浏览器中打开该文件的 URL，Tampermonkey 会自动检测并提示安装。

## 脚本列表

| 脚本 | 描述 | 匹配站点 |
|------|------|----------|
| Anna's Torrent/Magnet Export | 导出 Anna's Archive 当前页所有 torrent 和 magnet 链接 | `*.annas-archive.org/torrents/*` |

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
5. 输出到 `dist/` 目录，文件名取自 `@name` 字段

## License

MIT