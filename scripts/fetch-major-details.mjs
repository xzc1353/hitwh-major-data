/**
 * 从威海校区本科招生网「专业解析」页批量抓取专业字段（多维度版）
 * ------------------------------------------------------------------
 * 官方页面采用固定的章节结构，本脚本按章节标题切分后逐项提取：
 *   - 软科评级
 *   - 一句话介绍
 *   - 专业概况 / 培养目标（"X 专业怎么样"）
 *   - 本科核心课程
 *   - 能力要求（"学习 X 专业的学生需要具备哪些特质"）
 *   - 学习难度（"学习 X 专业过程中可能会遇到哪些困难"）
 *   - 应用场景（"现实工作和生活中，哪些问题是通过 X 专业的人才来解决的"）
 *   - 就业方向（"X 专业的毕业生就业怎么样"）
 *   - 深造路径（从就业段落中抽取含升学/深造/留学等表述的句子）
 *
 * 原则：只做原文搬运，不改写、不概括、不评价；提取不到的字段一律留空。
 *
 * 用法：node scripts/fetch-major-details.mjs
 * 输出：scripts/out/major-details.json
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const BASE = 'https://zsb.hitwh.edu.cn/home/major/details?id=';
const DELAY_MS = 400;

/** 本地专业 id → 官方「专业解析」页 id */
const MAJOR_PAGE_IDS = {
  cs: 92,
  mech: 1,
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

function decode(s) {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/[\u200b\ufeff]/g, '');
}

function stripTags(s) {
  return decode(s.replace(/<[^>]+>/g, '')).replace(/[ \t\u00a0]+/g, ' ').trim();
}

/**
 * 按 <p> 切块，识别标题块与正文块，返回 [{heading, body[]}]
 * 标题判定：块内含 <strong>，且纯文本长度较短、不以句号/分号结尾。
 */
function parseSections(html) {
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');

  const blocks = cleaned
    .split(/<\/p\s*>/i)
    .map((b) => ({ raw: b, text: stripTags(b) }))
    .filter((b) => b.text.length > 0);

  const sections = [];
  let current = { heading: '__preamble__', body: [] };

  for (const b of blocks) {
    const isHeading =
      /<strong>/i.test(b.raw) && b.text.length <= 48 && !/[。；;]$/.test(b.text);
    if (isHeading) {
      // 空正文的章节也要保留：官方页面常见"主标题 + 副标题"连续出现
      sections.push(current);
      current = { heading: b.text, body: [] };
    } else {
      current.body.push(b.text);
    }
  }
  sections.push(current);

  return sections.filter((s) => s.heading !== '__preamble__' || s.body.length > 0);
}

/** 章节正文结束的标记（遇到这些标题说明已进入下一主题） */
const NEXT_TOPIC = /(本科核心课程|特质|困难|现实工作|哪些问题|就业|误区|培养优势|一句话介绍)/;

/** 取第一个标题匹配的章节正文；若该章节正文为空，向后并入紧随的伪标题章节 */
function pick(sections, re) {
  const idx = sections.findIndex((s) => re.test(s.heading));
  if (idx < 0) return undefined;

  const parts = [];
  for (let i = idx; i < sections.length && i <= idx + 2; i++) {
    if (i > idx && NEXT_TOPIC.test(sections[i].heading)) break;
    parts.push(...sections[i].body);
    if (parts.length) break;
  }
  const text = parts.join('\n').trim();
  return text.length > 0 ? text : undefined;
}

/** 从长文本中抽取含指定关键词的句子 */
function pickSentences(text, re, limit = 4) {
  if (!text) return [];
  const sentences = text
    .split(/(?<=[。！？])/)
    .map((s) => s.trim())
    .filter(Boolean);
  return sentences.filter((s) => re.test(s)).slice(0, limit);
}

function extract(html) {
  const sections = parseSections(html);
  const out = {
    rank: undefined,
    intro: undefined,
    objectives: undefined,
    coreCourses: [],
    requiredTraits: undefined,
    learningDifficulty: undefined,
    applications: undefined,
    employment: undefined,
    furtherStudy: [],
  };

  // 软科评级
  for (const s of sections) {
    const m = s.heading.match(/软科评级[：:]\s*([A-Za-z]\+?)/) || s.body.join(' ').match(/软科评级[：:]\s*([A-Za-z]\+?)/);
    if (m) {
      out.rank = m[1];
      break;
    }
  }
  if (!out.rank) {
    const m = stripTags(html).match(/软科评级[：:]\s*([A-Za-z]\+?)/);
    if (m) out.rank = m[1];
  }

  // 一句话介绍
  const introSec = sections.find((s) => /一句话介绍/.test(s.heading));
  if (introSec && introSec.body.length) out.intro = introSec.body[0];

  // 专业概况 / 培养目标（不同页面存在多种标题写法，逐级回退）
  out.objectives =
    pick(sections, /专业(怎么样|是什么)/) ??
    pick(sections, /专业简介/) ??
    pick(sections, /专业定位/);

  // 本科核心课程
  const courseSec = sections.find((s) => /本科核心课程/.test(s.heading));
  if (courseSec) {
    const inline = courseSec.heading.replace(/^.*?本科核心课程[：:]?\s*/, '').trim();
    const all = [...(inline.length > 10 ? [inline] : []), ...courseSec.body];
    out.coreCourses = all
      .map((s) => s.trim())
      .filter((s) => s.length >= 8)
      .filter((s) => /[、，,]/.test(s))
      .slice(0, 6);
  }

  // 能力要求
  out.requiredTraits = pick(sections, /特质|需要具备/);

  // 学习难度
  out.learningDifficulty = pick(sections, /困难/);

  // 应用场景
  out.applications = pick(sections, /现实工作和生活|哪些问题/);

  // 就业方向
  out.employment = pick(sections, /毕业生就业|就业怎么样/);

  // 深造路径：从就业段落中抽取
  out.furtherStudy = pickSentences(out.employment, /升学|深造|读研|留学|推免|攻读|考研|保研/, 4);

  // 常见误区（官方专设章节，客观陈述社会认知偏差）
  out.misconceptions = pick(sections, /误区/);

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
    const flag = (v) => (v && String(v).length > 10 ? '✓' : '·');
    console.log(
      `  ✓ ${majorId.padEnd(16)} 评级${(data.rank ?? '-').padEnd(3)} 概况${flag(data.objectives)} 课程${String(data.coreCourses.length).padStart(2)} 能力${flag(data.requiredTraits)} 难度${flag(data.learningDifficulty)} 应用${flag(data.applications)} 就业${flag(data.employment)} 深造${data.furtherStudy.length}`,
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
