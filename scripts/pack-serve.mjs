/**
 * 将 Vite 构建产物 dist/ 同步到 serve/webroot/
 * ------------------------------------------------------------------
 * 用途：serve/ 是一个零依赖的独立发布单元（自建 HTTP 服务 + 自带 SPA 回退），
 *      不依赖 Vite/Tailwind，发布沙箱无需安装任何 npm 包即可启动。
 *
 * 用法：npm run pack:serve
 */
import { cp, rm, mkdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const src = resolve(root, 'dist');
const dest = resolve(root, 'serve', 'webroot');

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

if (!(await exists(src))) {
  console.error('[pack:serve] 未找到 dist/，请先执行 npm run build');
  process.exit(1);
}

await rm(dest, { recursive: true, force: true });
await mkdir(dest, { recursive: true });
await cp(src, dest, { recursive: true });

console.log(`[pack:serve] 已同步 ${src} -> ${dest}`);
