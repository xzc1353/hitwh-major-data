/**
 * 将抓取结果合并进 src/data/majors.json
 * ------------------------------------------------------------------
 * 只合并三项可逐字核验的字段：rank（软科评级）、intro（一句话介绍）、coreCourses（本科核心课程）。
 *
 * 为什么不合并「专业方向」：官方页面对该信息的表述位置不固定，自动提取噪声大
 * （曾抓到"就业优势""培养优势"等段落），存在曲解官方原意的风险。
 * 按本站"严格对齐官方口径、不推断、不改写"的红线，宁缺勿滥，故舍弃该字段。
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
  if (d.intro && !major.intro) {
    major.intro = d.intro;
    touched = true;
  }
  const courses = cleanCourses(d.coreCourses);
  if (courses.length && !(major.coreCourses && major.coreCourses.length)) {
    major.coreCourses = courses;
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

const withRank = majors.filter((m) => m.rank).length;
const withIntro = majors.filter((m) => m.intro).length;
const withCourses = majors.filter((m) => m.coreCourses && m.coreCourses.length).length;

console.log(`合并完成：更新 ${updated} 个，跳过 ${skipped} 个`);
console.log(`当前覆盖：软科评级 ${withRank}/${majors.length}，一句话介绍 ${withIntro}/${majors.length}，核心课程 ${withCourses}/${majors.length}`);
