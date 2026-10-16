/**
 * 站点级配置
 * ------------------------------------------------------------------
 * 所有"对外可见的身份信息、免责声明、评论后端参数"集中在此处，
 * 便于统一修改，避免散落在各组件中。
 */

export const SITE = {
  /** 站点名称 */
  name: '哈工大威海 · 大类专业数据参考',
  shortName: '大类专业数据参考',
  /** 副标题 */
  tagline: '公开信息搬运 · 结构化查阅',
  /** 建站者联系 QQ（红线要求：必须在页脚与"关于"页展示） */
  contactQQ: '3029624824',
  /** 数据版本 */
  dataVersion: 'v1.0.0',
  /** 数据截止日期 */
  dataUpdatedAt: '2026-10-15',
  /** 仓库地址（可选，用于页脚展示） */
  repoUrl: '',
} as const;

/** 统一免责声明文案（页脚 / 关于页 / 数据页角标共用同一份） */
export const DISCLAIMER = {
  /** 一句话声明 */
  short: '个人制作、非官方，有建议请联系QQ：3029624824',
  /** 完整免责声明（关于页展示） */
  full: [
    '本站为个人制作的第三方信息整理页面，与哈尔滨工业大学、哈尔滨工业大学（威海）及其任何内设机构无隶属或合作关系，非官方站点。',
    '本站全部数据均搬运自学校官方公开渠道（本科生招生网、教务处通知公告、招生章程等），仅做结构化整理与呈现，不构成任何报考建议、承诺或担保。',
    '招生专业、招生计划、选考科目、学费标准、分流与转专业规则等，均以学校及各省招生考试机构当年正式公布的文件为唯一准据。本站数据可能存在滞后或整理误差。',
    '本站不对因使用本站信息而产生的任何直接或间接后果承担责任。请务必以官方渠道信息为准。',
    '如学校相关部门认为本站内容存在不当之处，或权利人认为内容侵犯其合法权益，请联系 QQ：3029624824，我们将在核实后第一时间处理。',
  ],
  /** 评论区的身份隔离声明（红线要求） */
  commentIsolation:
    '评论区由第三方评论系统托管，评论内容仅代表发布者个人观点，与本平台及建站者无关；本站不对评论内容的真实性、准确性负责。',
} as const;

/**
 * 评论后端配置
 * ------------------------------------------------------------------
 * provider:
 *   'local'  —— 本地演示实现（localStorage）。零后端，开箱即用，仅用于功能演示。
 *               注意：密码校验在客户端完成，不具备真实安全性，切勿用于生产。
 *   'waline' —— 推荐。Waline + 免费数据库（Neon / Supabase 免费版 Postgres）。
 *               服务端校验管理员 Token，可安全执行置顶 / 删除。
 *   'twikoo' —— 可选。Twikoo + MongoDB Atlas 免费集群（M0，512MB）。
 *               管理员通过密码登录云函数，安全性由服务端保证。
 */
export const COMMENT_CONFIG = {
  provider: (import.meta.env.VITE_COMMENT_PROVIDER ?? 'local') as
    | 'local'
    | 'waline'
    | 'twikoo',

  /** Waline 服务端地址，例如 https://your-waline.vercel.app */
  walineServerURL: import.meta.env.VITE_WALINE_SERVER_URL ?? '',

  /** Twikoo 云函数地址，例如 https://your-twikoo.vercel.app */
  twikooEnvId: import.meta.env.VITE_TWIKOO_ENV_ID ?? '',

  /** 本地演示模式的管理员密码（仅 provider === 'local' 时生效） */
  localAdminPassword: import.meta.env.VITE_LOCAL_ADMIN_PASSWORD ?? 'hitwh-admin',

  /** 每页评论条数 */
  pageSize: 10,
} as const;
