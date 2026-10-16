import clustersRaw from '@/data/clusters.json';
import majorsRaw from '@/data/majors.json';
import metaRaw from '@/data/meta.json';
import officialQuotesRaw from '@/data/official-quotes.json';
import type { Cluster, ClusterWithMajors, DataMeta, Major, OfficialQuote } from '@/types';

/**
 * 数据访问层
 * ------------------------------------------------------------------
 * 所有页面只能通过本模块读取数据，禁止直接 import JSON。
 * 便于后续把本地 Mock JSON 替换为远程接口（保持函数签名不变即可）。
 */

export const clusters = clustersRaw as unknown as Cluster[];
export const majors = majorsRaw as unknown as Major[];
export const meta = metaRaw as unknown as DataMeta;
export const officialQuotes = officialQuotesRaw as unknown as OfficialQuote[];

/** 取适用于某大类的官方原文引用 */
export function getQuotesOfCluster(clusterId: string): OfficialQuote[] {
  return officialQuotes.filter((q) => q.clusterIds.includes(clusterId));
}

/** 按 id 取大类 */
export function getCluster(id: string | undefined): Cluster | undefined {
  if (!id) return undefined;
  return clusters.find((c) => c.id === id);
}

/** 按 id 取专业 */
export function getMajor(id: string | undefined): Major | undefined {
  if (!id) return undefined;
  return majors.find((m) => m.id === id);
}

/** 取大类下的全部专业（按 majorIds 顺序） */
export function getMajorsOfCluster(cluster: Cluster): Major[] {
  return cluster.majorIds
    .map((id) => getMajor(id))
    .filter((m): m is Major => Boolean(m));
}

/** 取包含该专业的大类 */
export function getClustersOfMajor(major: Major): Cluster[] {
  return major.clusterIds
    .map((id) => getCluster(id))
    .filter((c): c is Cluster => Boolean(c));
}

/** 带专业列表的大类 */
export function getClusterWithMajors(id: string | undefined): ClusterWithMajors | undefined {
  const cluster = getCluster(id);
  if (!cluster) return undefined;
  return { ...cluster, majors: getMajorsOfCluster(cluster) };
}

/** 全部大类（带专业列表） */
export function getAllClustersWithMajors(): ClusterWithMajors[] {
  return clusters.map((c) => ({ ...c, majors: getMajorsOfCluster(c) }));
}

/** 全站统计（首页用） */
export function getStats() {
  return {
    clusterCount: clusters.length,
    majorCount: majors.length,
    collegeCount: new Set(majors.map((m) => m.college)).size,
    updatedAt: meta.updatedAt,
  };
}

/** 关键词搜索：同时命中大类与专业 */
export function search(keyword: string) {
  const kw = keyword.trim().toLowerCase();
  if (!kw) return { clusters: [] as Cluster[], majors: [] as Major[] };
  const hit = (s: string) => s.toLowerCase().includes(kw);
  return {
    clusters: clusters.filter((c) => hit(c.name) || hit(c.shortName)),
    majors: majors.filter(
      (m) => hit(m.name) || hit(m.college) || m.clusterIds.some((cid) => hit(getCluster(cid)?.name ?? '')),
    ),
  };
}

/** 学费展示 */
export function formatTuition(v: number): string {
  return `${v.toLocaleString('zh-CN')} 元/年`;
}
