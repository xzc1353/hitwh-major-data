/**
 * 从威海校区本科招生网「专业解析」页批量抓取专业字段
 * ------------------------------------------------------------------
 * 目的：把官方已公开的「软科评级 / 一句话介绍 / 专业方向 / 本科核心课程」
 *       结构化提取出来，供 src/data/majors.json 补全。
 *
 * 原则：只提取官方页面已有文字，不做改写、不做推断；提取不到的字段留空。
 *
 * 用法：node scripts/fetch-major-details.mjs
 * 输出：scripts/out/major-details.json
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const BASE = 'https://zsb.hitwh.edu.cn/home/major/details?id=';

/** 请求间隔（毫秒），避免对官方站点造成压力 */
const DELAY_MS = 400;

/** 本地专业 id → 官方「专业解析」页 id */
const MAJOR_PAGE_IDS = {
  ai: 93,
  cybersec: 94,
  auto: 95,
  comm: 99,
  'elec-info': 101,
  ic: 103,
  opto: 36,
  ee: 20,
  robot: 2,
  naval: 108,
  'mat-sci': 28,
  'mat-form': 31,
  welding: 32,
  'smart-vehicle': 52,
  measure: 14,
  'energy-storage': 50,
  software: 105,
  'env-eng': 5,
  'bio-eng': 46,
  'chem-eng': 8,
  'smart-transport': 12,
  'smart-build': 44,
  'bigdata-mgmt': 40,
  imis: 39,
  math: 34,
  'info-compute': 35,
};

async function fetchHtml(id) {
  const res = await fetch(`${BASE}${id}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; hitwh-major-data/1.0)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** HTML → 按段落切分的纯文本行 */
function toLines(html) {
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr|td)>/gi, '\n');

  const text = body
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/[\u200b\ufeff]/g, '')
    .replace(/[ \t\u00a0]+/g, ' ');

  return text
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** 该行是否像一个"章节标题"（用于判断字段结束） */
function looksLikeHeading(line) {
  return (
    line.length <= 30 &&
    /(专业|课程|优势|困难|特质|误区|就业|介绍|方向|怎么样|是什么)/.test(line) &&
    !/[。；;]/.test(line)
  );
}

/** 课程段落起始标记 */
const COURSE_LABEL =
  /^(专业核心课程|核心课程|专业基础课程|基础课程|专业选修课程|选修课程|主要课程|主干课程|专业主干课程|课程设置|学科基础课|专业方向课)[：:]/;

/** 明显的非课程行（避免把"适合报考的学生"之类收进课程） */
const NON_COURSE = /(适合|报考|特质|困难|就业|误区|优势|培养|师资|平台|深造|出国|留学)/;

function extract(html) {
  const lines = toLines(html);
  const out = { rank: undefined, intro: undefined, directions: [], coreCourses: [] };

  // 软科评级
  const rankLine = lines.find((l) => /软科评级/.test(l));
  const rankMatch = rankLine && rankLine.match(/软科评级[：:]\s*([A-Za-z]\+?)/);
  if (rankMatch) out.rank = rankMatch[1];

  // 一句话介绍：标题行的下一行
  const iIdx = lines.findIndex((l) => /一句话介绍/.test(l));
  if (iIdx >= 0 && lines[iIdx + 1] && !looksLikeHeading(lines[iIdx + 1])) {
    out.intro = lines[iIdx + 1];
  }

  // 专业方向：仅接受"标签 + 紧随其后的短句"，按首个句号截断
  for (const l of lines) {
    const m = l.match(/(?:专业方向|研究方向|特色方向)(?:为|是|涵盖|包括|主要)?[：:，,]?\s*(.+)/);
    if (!m) continue;
    let s = m[1];
    const dot = s.indexOf('。');
    if (dot > 0) s = s.slice(0, dot + 1);
    s = s.trim();
    if (s.length < 4 || s.length > 80) continue;
    if (!out.directions.includes(s)) out.directions.push(s);
    if (out.directions.length >= 2) break;
  }

  // 本科核心课程：定位"本科核心课程"标题，取其后的课程行，遇到下一章节标题即停止
  const cIdx = lines.findIndex((l) => /本科核心课程/.test(l));
  if (cIdx >= 0) {
    // 标题行本身可能已含内容（标题与正文同段）
    const inline = lines[cIdx].replace(/^.*?本科核心课程[：:]?\s*/, '').trim();
    if (inline.length > 10) out.coreCourses.push(inline);

    for (let i = cIdx + 1; i < lines.length && i <= cIdx + 8; i++) {
      const l = lines[i];
      if (l.length < 4) continue;
      // 下一章节标题 → 停止
      if (/^(学习|现实|社会)/.test(l) && l.length < 40) break;
      if (/专业的?(毕业生|培养优势|学生)/.test(l) && l.length < 40) break;
      if (/^(培养目标|专业优势|专业特色)/.test(l) && l.length < 40) break;
      // 明显非课程内容 → 停止
      if (NON_COURSE.test(l) && !/课程/.test(l)) break;
      out.coreCourses.push(l);
      if (out.coreCourses.join('').length > 900) break;
    }
  }

  return out;
}

const results = {};
let ok = 0;
let fail = 0;

for (const [majorId, pageId] of Object.entries(MAJOR_PAGE_IDS)) {
  try {
    const html = await fetchHtml(pageId);
    if (!html || html.length < 2000) throw new Error(`页面过短（${html.length} 字节）`);
    const data = extract(html);
    results[majorId] = data;
    ok++;
    console.log(
      `  ✓ ${majorId.padEnd(16)} rank=${(data.rank ?? '-').padEnd(3)} intro=${data.intro ? '有' : '无'} dirs=${data.directions.length} courses=${data.coreCourses.length}`,
    );
  } catch (err) {
    results[majorId] = { error: String(err.message || err) };
    fail++;
    console.log(`  ✗ ${majorId.padEnd(16)} 失败：${err.message || err}`);
  }
  await sleep(DELAY_MS);
}

const outDir = resolve(dirname(fileURLToPath(import.meta.url)), 'out');
mkdirSync(outDir, { recursive: true });
const outFile = resolve(outDir, 'major-details.json');
writeFileSync(outFile, JSON.stringify(results, null, 2), 'utf8');

console.log(`\n完成：成功 ${ok} 个，失败 ${fail} 个`);
console.log(`输出：${outFile}`);
