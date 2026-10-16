/** 数据模型定义 */

/** 招生大类（专业集群）类型 */
export type ClusterKind =
  | '拔尖班'
  | '卓越优才计划'
  | '常规大类'
  | '单专业招生'
  | '中外合作办学';

/** 培养地点安排 */
export type CampusPlan =
  | '威海校区 4 年'
  | '前 2 年威海校区，后 2 年校本部（哈尔滨）';

/** 官方原文引用（用于"严格对齐官方口径"的溯源展示） */
export interface OfficialQuote {
  id: string;
  /** 该原文对应的主题 */
  topic: string;
  /** 官方原文，逐字保留 */
  quote: string;
  /** 出处（文件名称 / 栏目名称） */
  source: string;
  /** 出处链接 */
  sourceUrl?: string;
  /** 该表述的发布日期 */
  quoteDate?: string;
  /** 适用的大类 id 列表 */
  clusterIds: string[];
}

/** 大类（专业集群） */
export interface Cluster {
  id: string;
  /** 官方完整名称 */
  name: string;
  /** 简称，用于卡片与面包屑 */
  shortName: string;
  kind: ClusterKind;
  /** 学费（元/年） */
  tuition: number;
  /** 选考科目要求 */
  subjectRequirement: string[];
  /** 涉及的学院 */
  colleges: string[];
  /** 培养地点安排 */
  campusPlan: CampusPlan;
  /** 培养模式说明 */
  mode: string;
  /** 转专业政策（一句话） */
  transferPolicy: string;
  /** 转专业政策的补充说明（可为空） */
  transferPolicyNote?: string;
  /** 该大类包含的专业 id 列表 */
  majorIds: string[];
  /** 客观备注（时间、更名沿革、招生计划等） */
  notes: string[];
  /** 数据来源 */
  sources: string[];
}

/** 专业 */
export interface Major {
  id: string;
  name: string;
  /** 所属大类 id（一个专业可能出现在多个大类中，此处记录其主大类） */
  clusterIds: string[];
  /** 所属学院 */
  college: string;
  /** 培养地点 */
  campus: string;
  /** 选考科目要求 */
  subjectRequirement: string[];
  /** 软科评级（官方招生网展示字段，可为空） */
  rank?: string;
  /** 一句话介绍（官方招生网展示字段） */
  intro?: string;
  /** 专业概况 / 培养目标（官方招生网「专业解析」原文） */
  objectives?: string;
  /** 专业方向（官方招生网展示字段） */
  directions?: string[];
  /** 本科核心课程（官方招生网展示字段） */
  coreCourses?: string[];
  /** 能力要求：学习本专业需要具备的特质（官方原文） */
  requiredTraits?: string;
  /** 学习难度：学习过程中可能遇到的困难（官方原文） */
  learningDifficulty?: string;
  /** 应用场景：本专业人才解决哪些现实问题（官方原文） */
  applications?: string;
  /** 就业去向说明（官方招生网展示字段） */
  employment?: string;
  /** 深造路径：升学 / 留学相关表述（自官方就业段落抽取） */
  furtherStudy?: string[];
  /** 常见误区：官方专设章节对社会认知偏差的说明（官方原文） */
  misconceptions?: string;
  /** 客观备注 */
  notes: string[];
  /** 数据来源 */
  sources: string[];
}

/** 数据元信息 */
export interface DataMeta {
  version: string;
  updatedAt: string;
  /** 官方信源清单 */
  sources: { label: string; url: string }[];
  /** 全站统一的数据说明 */
  notice: string;
}

/** 查询结果包装 */
export interface ClusterWithMajors extends Cluster {
  majors: Major[];
}

/** 对比页可对比的实体类型 */
export type CompareKind = 'cluster' | 'major';

export interface CompareItem {
  kind: CompareKind;
  id: string;
}
