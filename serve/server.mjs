/**
 * 零依赖静态服务（发布用）
 * ------------------------------------------------------------------
 * 为什么不用 `vite preview`：
 *   1. 发布沙箱只需要一个单端口 HTTP 服务，引入 Vite 会带来构建与 host 校验问题；
 *   2. 本项目使用 BrowserRouter，需要把未知路径回退到 index.html，否则
 *      /clusters/xxx、/majors/xxx 这类深层链接刷新时会 404；
 *   3. 仅使用 Node 内置模块，沙箱无需安装任何依赖，启动快、失败面小。
 *
 * 约束：必须监听 process.env.PORT 并绑定 0.0.0.0。
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('./webroot', import.meta.url)));
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

async function findFile(p) {
  try {
    const s = await stat(p);
    if (s.isFile()) return p;
  } catch {
    /* 不存在 */
  }
  return null;
}

function send(res, status, headers, body) {
  res.writeHead(status, headers);
  if (res.req && res.req.method === 'HEAD') res.end();
  else res.end(body);
}

const server = createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    send(res, 405, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Method Not Allowed');
    return;
  }

  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = decodeURIComponent(url.pathname);

    // 目录穿越防护：规范化后必须仍位于 ROOT 之内
    const rel = normalize(pathname).replace(/^([/\\])+/, '');
    const target = resolve(ROOT, rel);
    if (target !== ROOT && !target.startsWith(ROOT + sep)) {
      send(res, 403, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Forbidden');
      return;
    }

    const ext = extname(target).toLowerCase();
    // 跨平台判断首段目录（Windows 下 normalize 会返回反斜杠，不能用 startsWith('assets/')）
    const isAsset = rel.split(/[/\\]/)[0] === 'assets';
    let hit = await findFile(target);

    // 无扩展名 → 视为路由，尝试目录下的 index.html
    if (!hit && !ext) hit = await findFile(join(target, 'index.html'));

    // 静态资源未命中直接 404，避免用 HTML 冒充 JS/CSS
    if (!hit && isAsset) {
      send(res, 404, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Not Found');
      return;
    }

    // SPA 回退：其余未知路径交给前端路由
    if (!hit) hit = await findFile(join(ROOT, 'index.html'));
    if (!hit) {
      send(res, 404, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Not Found');
      return;
    }

    const body = await readFile(hit);
    const isHashed = /[/\\]assets[/\\]/.test(hit);
    send(
      res,
      200,
      {
        'Content-Type': MIME[extname(hit).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': isHashed ? 'public, max-age=31536000, immutable' : 'no-cache',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
      body,
    );
  } catch {
    send(res, 500, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Internal Server Error');
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[serve] listening on http://${HOST}:${PORT}  root=${ROOT}`);
});
