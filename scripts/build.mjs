import { context } from 'esbuild';
import { readdirSync, readFileSync, mkdirSync, existsSync } from 'fs';
import { join, basename, resolve } from 'path';

const ROOT_DIR = resolve(import.meta.dirname, '..');
const SRC_DIR = join(ROOT_DIR, 'src');
const DIST_DIR = join(ROOT_DIR, 'dist');

/** 从 TypeScript 源文件中提取 ==UserScript== 块 */
function extractUserScriptHeader(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const match = content.match(/(\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==)/);
  return match ? match[1] : null;
}

/** 获取 src/ 下所有 .ts 文件（排除 .d.ts） */
function getSourceFiles() {
  return readdirSync(SRC_DIR)
    .filter((f) => f.endsWith('.ts') && !f.endsWith('.d.ts'))
    .map((f) => join(SRC_DIR, f));
}

/** 根据 UserScript @name 或文件名生成输出文件名 */
function getOutputFileName(header, filePath) {
  if (header) {
    const nameMatch = header.match(/@name\s+(.+)/);
    if (nameMatch) {
      // 将脚本名转为 kebab-case 作为文件名
      return nameMatch[1].trim().replace(/\s+/g, '-').toLowerCase() + '.user.js';
    }
  }
  return basename(filePath).replace(/\.ts$/, '.user.js');
}

async function build(isWatch = false) {
  const files = getSourceFiles();

  if (files.length === 0) {
    console.error('⚠ 未找到 src/ 目录下的 .ts 文件');
    process.exit(1);
  }

  if (!existsSync(DIST_DIR)) {
    mkdirSync(DIST_DIR, { recursive: true });
  }

  for (const file of files) {
    const header = extractUserScriptHeader(file);
    const outputName = getOutputFileName(header, file);
    const banner = header ? header + '\n' : '';

    const ctx = await context({
      entryPoints: [file],
      bundle: true,
      minify: false,
      format: 'iife',
      target: ['es2020'],
      outfile: join(DIST_DIR, outputName),
      banner: { js: banner },
      logLevel: 'info',
    });

    if (isWatch) {
      await ctx.watch();
      console.log(`👀 正在监听 ${outputName} ...`);
    } else {
      await ctx.rebuild();
      await ctx.dispose();
      console.log(`✅ 已构建: dist/${outputName}`);
    }
  }
}

const isWatch = process.argv.includes('--watch');
build(isWatch).catch((err) => {
  console.error(err);
  process.exit(1);
});