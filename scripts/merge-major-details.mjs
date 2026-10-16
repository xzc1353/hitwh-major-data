/**
 * 将抓取结果合并进 src/data/majors.json
 * ------------------------------------------------------------------
 * 合并的均为官方「专业解析」页原文，逐字搬运、不改写：
 *   rank（软科评级）、intro（一句话介绍）、objectives（专业概况/培养目标）、
 *   coreCourses（本科核心课程）、requiredTraits（能力要求）、
 *   learningDifficulty（学习难度）、applications（应用场景）、
 *   employment（就业方向）、furtherStudy（深造路径）、misconceptions（常见误区）
 *
 * 为什么不合并「专业方向」：官方页面对该信息的表述位置不固定，自动提取噪声大
 * （曾抓到"就业优势""培养优势"等段落），存在曲解官方原意的风险。
 * 按本站"严格对齐官方口径、不推断、不改写"的红线，宁缺勿滥，故舍弃该字段。
 *
 * 为什么不合并「培养优势 / 核心优势」：该类章节带有宣传色彩，
 * 与本站"中立、不评价、不推荐"的定位不符，故不采用。
 *
 * 用法：node scripts/merge-major-details.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const detailsPath = resolve(root, 'scripts/out/major-details.json');
const majorsPath = resolve(root, 'src/data/majors.json');

const details = JSON.parse(readFileSync(detailsPath, 'utf8'));
const majors = JSON.parse(readFileSync(majorsPath, 'utf8'));

/** 课程行清洗：剔除引导句、过短行、无分隔符行 */
function cleanCourses(list) {
  return (list || [])
    .map((s) => String(s).trim())
    .filter((s) => s.length >= 8)
    .filter((s) => !/[：:]$/.test(s)) // 以冒号结尾的是引导句
    .filter((s) => /[、，,]/.test(s)) // 至少含一个顿号/逗号，说明是课程列表
    .slice(0, 4);
}

/** 文本型字段：抓取值 → majors.json 字段名 */
const TEXT_FIELDS = [
  ['intro', 'intro'],
  ['objectives', 'objectives'],
  ['requiredTraits', 'requiredTraits'],
  ['learningDifficulty', 'learningDifficulty'],
  ['applications', 'applications'],
  ['employment', 'employment'],
  ['misconceptions', 'misconceptions'],
];

const SOURCE_LABEL = (name) => `哈尔滨工业大学（威海）本科招生网 · 专业解析（${name}）`;

let updated = 0;
let skipped = 0;

for (const major of majors) {
  const d = details[major.id];
  if (!d || d.error) {
    skipped++;
    continue;
  }

  let touched = false;

  if (d.rank && !major.rank) {
    major.rank = d.rank;
    touched = true;
  }

  for (const [srcKey, destKey] of TEXT_FIELDS) {
    const val = d[srcKey];
    if (val && typeof val === 'string' && val.length > 10 && !major[destKey]) {
      major[destKey] = val;
      touched = true;
    }
  }

  const courses = cleanCourses(d.coreCourses);
  if (courses.length && !(major.coreCourses && major.coreCourses.length)) {
    major.coreCourses = courses;
    touched = true;
  }

  if (Array.isArray(d.furtherStudy) && d.furtherStudy.length && !(major.furtherStudy && major.furtherStudy.length)) {
    major.furtherStudy = d.furtherStudy;
    touched = true;
  }

  if (touched) {
    const label = SOURCE_LABEL(major.name);
    if (!major.sources.includes(label)) major.sources.push(label);
    updated++;
  } else {
    skipped++;
  }
}

writeFileSync(majorsPath, JSON.stringify(majors, null, 2) + '\n', 'utf8');

const pct = (n) => `${n}/${majors.length}`;
console.log(`合并完成：更新 ${updated} 个，跳过 ${skipped} 个`);
console.log('字段覆盖：');
console.log(`  软科评级        ${pct(majors.filter((m) => m.rank).length)}`);
console.log(`  一句话介绍      ${pct(majors.filter((m) => m.intro).length)}`);
console.log(`  专业概况        ${pct(majors.filter((m) => m.objectives).length)}`);
console.log(`  本科核心课程    ${pct(majors.filter((m) => m.coreCourses?.length).length)}`);
console.log(`  能力要求        ${pct(majors.filter((m) => m.requiredTraits).length)}`);
console.log(`  学习难度        ${pct(majors.filter((m) => m.learningDifficulty).length)}`);
console.log(`  应用场景        ${pct(majors.filter((m) => m.applications).length)}`);
console.log(`  就业方向        ${pct(majors.filter((m) => m.employment).length)}`);
console.log(`  深造路径        ${pct(majors.filter((m) => m.furtherStudy?.length).length)}`);
console.log(`  常见误区        ${pct(majors.filter((m) => m.misconceptions).length)}`);
