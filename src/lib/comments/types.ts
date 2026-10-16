/**
 * 评论系统类型定义
 * ------------------------------------------------------------------
 * 设计要点：UI 与后端解耦。组件只依赖 `CommentAdapter` 接口，
 * 更换 Twikoo / Waline / 自建后端时无需改动任何组件代码。
 */

/** 单条评论（树形结构，children 仅顶层主楼持有） */
export interface CommentNode {
  id: string;
  /** 归属页面路径，作为评论分区的唯一键 */
  path: string;
  /** 直接父级 id；顶层主楼为 null */
  parentId: string | null;
  /** 顶层主楼 id；本身为主楼时为 null */
  rootId: string | null;
  /** 楼层号（仅顶层主楼有值，楼中楼为 0） */
  floor: number;
  nick: string;
  mail?: string;
  link?: string;
  /** 头像地址，为空时前端按昵称生成首字母头像 */
  avatar?: string;
  /** 评论正文：纯文本 + emoji，渲染前一律转义 */
  content: string;
  createdAt: number;
  likes: number;
  likedByMe: boolean;
  /** 是否被管理员置顶 */
  isTop: boolean;
  /** 发布者是否为管理员 */
  isAdmin: boolean;
  /** 楼中楼展示的 @对象昵称 */
  replyToNick?: string;
  /** 楼中楼列表 */
  children: CommentNode[];
}

export interface SubmitInput {
  nick: string;
  mail?: string;
  link?: string;
  content: string;
  parentId?: string | null;
  rootId?: string | null;
  replyToNick?: string;
}

/** 排序方式 */
export type SortMode = 'newest' | 'hottest';

/** 点赞结果 */
export interface LikeResult {
  likes: number;
  liked: boolean;
}

/**
 * 评论后端适配器接口
 * ------------------------------------------------------------------
 * serverSideAuth = true  表示置顶/删除由服务端校验管理员身份（生产环境必须如此）
 * serverSideAuth = false 表示仅在前端比对密码（演示用，无真实安全性）
 */
export interface CommentAdapter {
  readonly id: string;
  readonly label: string;
  readonly serverSideAuth: boolean;

  /** 拉取某页面的评论（已组装为树，顶层已按置顶 → 时间倒序排好） */
  list(path: string): Promise<CommentNode[]>;

  /** 发表评论或回复 */
  submit(path: string, input: SubmitInput): Promise<CommentNode>;

  /** 点赞 / 取消点赞，返回最新状态 */
  like(path: string, id: string): Promise<LikeResult>;

  /** 管理员登录校验 */
  adminLogin(secret: string): Promise<boolean>;

  /** 置顶 / 取消置顶 */
  setTop(path: string, id: string, top: boolean, secret: string): Promise<void>;

  /** 删除评论（及其子回复） */
  remove(path: string, id: string, secret: string): Promise<void>;
}

/** 通用错误 */
export class CommentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CommentError';
  }
}

/** 由昵称生成稳定的头像底色（避免依赖外部头像服务） */
export function avatarColor(nick: string): string {
  const palette = [
    '#0b4d8f',
    '#1f7a52',
    '#b7791f',
    '#a13b2f',
    '#6b4ea8',
    '#0f766e',
    '#9d174d',
    '#3f6212',
  ];
  let h = 0;
  for (let i = 0; i < nick.length; i++) h = (h * 31 + nick.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

/** 相对时间 */
export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const min = 60_000;
  if (diff < min) return '刚刚';
  if (diff < 60 * min) return `${Math.floor(diff / min)} 分钟前`;
  if (diff < 24 * 60 * min) return `${Math.floor(diff / (60 * min))} 小时前`;
  if (diff < 30 * 24 * 60 * min) return `${Math.floor(diff / (24 * 60 * min))} 天前`;
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 渲染前转义，防止 XSS */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** 把纯文本渲染为带换行的安全 HTML（表情为普通字符，无需特殊处理） */
export function renderContent(s: string): string {
  return escapeHtml(s).replace(/\n/g, '<br/>');
}
