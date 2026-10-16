import { CommentError } from './types';
import type { CommentAdapter, CommentNode, LikeResult, SubmitInput } from './types';

/**
 * Waline 适配器（推荐用于生产）
 * ------------------------------------------------------------------
 * 后端：Waline 官方服务端（可一键部署到 Vercel）+ 免费数据库
 *       （Neon / Supabase 免费版 PostgreSQL，或 LeanCloud 国际版）
 *
 * 安全模型：
 *   - 普通评论 / 点赞：匿名即可，服务端按后台配置审核。
 *   - 置顶 / 删除：先 POST /token 换取管理员 JWT，再带 Authorization 头调用，
 *     由服务端校验身份。前端不持有任何"万能密码"，这是与 local 模式的本质区别。
 *
 * 说明：不同 Waline 大版本的字段名可能微调（如 `url` / `path`、置顶状态字段），
 *       若对接后出现 4xx，请对照 https://waline.js.org/reference/server/api.html 调整
 *       `FIELD` 常量，其余逻辑无需改动。
 */

const FIELD = {
  /** 评论归属页面的字段名 */
  page: 'url',
  /** 点赞请求体 */
  likeBody: { '/like': true } as Record<string, unknown>,
  /** 置顶状态值 */
  stickyStatus: 'sticky',
  /** 取消置顶恢复的状态值 */
  normalStatus: 'approved',
};

interface WalineRaw {
  objectId: string;
  nick: string;
  mail?: string;
  link?: string;
  url?: string;
  comment: string;
  insertedAt?: number;
  createdAt?: number;
  avatar?: string;
  like?: number;
  status?: string;
  pid?: string | null;
  rid?: string | null;
  children?: WalineRaw[];
}

export class WalineCommentAdapter implements CommentAdapter {
  readonly id = 'waline';
  readonly label = 'Waline';
  readonly serverSideAuth = true;

  private token = '';
  private readonly likedKey = 'hitwh:waline:liked';

  constructor(private readonly serverURL: string) {
    if (!serverURL) {
      throw new CommentError('未配置 Waline 服务端地址（VITE_WALINE_SERVER_URL）');
    }
  }

  private url(p: string) {
    return `${this.serverURL.replace(/\/$/, '')}${p}`;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((init.headers as Record<string, string>) ?? {}),
    };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;

    const res = await fetch(this.url(path), { ...init, headers });
    const json = (await res.json().catch(() => ({}))) as {
      errno?: number;
      errmsg?: string;
      data?: T;
    };
    if (!res.ok || (json.errno !== undefined && json.errno !== 0)) {
      throw new CommentError(json.errmsg || `请求失败（HTTP ${res.status}）`);
    }
    return (json.data ?? (json as unknown)) as T;
  }

  private readLiked(): string[] {
    try {
      return JSON.parse(localStorage.getItem(this.likedKey) ?? '[]') as string[];
    } catch {
      return [];
    }
  }

  private writeLiked(ids: string[]) {
    try {
      localStorage.setItem(this.likedKey, JSON.stringify(ids));
    } catch {
      /* noop */
    }
  }

  private toNode(raw: WalineRaw, path: string, parentId: string | null, rootId: string | null, liked: Set<string>, floor = 0): CommentNode {
    return {
      id: raw.objectId,
      path,
      parentId,
      rootId,
      floor,
      nick: raw.nick,
      mail: raw.mail,
      link: raw.link,
      avatar: raw.avatar,
      content: raw.comment,
      createdAt: raw.insertedAt ?? raw.createdAt ?? Date.now(),
      likes: raw.like ?? 0,
      likedByMe: liked.has(raw.objectId),
      isTop: raw.status === FIELD.stickyStatus,
      isAdmin: false,
      replyToNick: undefined,
      children: (raw.children ?? []).map((c) =>
        this.toNode(c, path, raw.objectId, rootId ?? raw.objectId, liked),
      ),
    };
  }

  async list(path: string): Promise<CommentNode[]> {
    const data = await this.request<{ data: WalineRaw[] }>(
      `/comment?${FIELD.page}=${encodeURIComponent(path)}&pageSize=500&sortBy=insertedAt_desc`,
      { method: 'GET' },
    );
    const rows = Array.isArray(data) ? data : (data?.data ?? []);
    const liked = new Set(this.readLiked());

    const roots = rows.map((r) => this.toNode(r, path, null, null, liked));
    // 楼层号按时间升序编号
    [...roots]
      .sort((a, b) => a.createdAt - b.createdAt)
      .forEach((r, i) => {
        r.floor = i + 1;
      });

    roots.sort((a, b) => {
      if (a.isTop !== b.isTop) return a.isTop ? -1 : 1;
      return b.createdAt - a.createdAt;
    });
    return roots;
  }

  async submit(path: string, input: SubmitInput): Promise<CommentNode> {
    const body: Record<string, unknown> = {
      nick: input.nick.trim(),
      mail: input.mail?.trim() || undefined,
      link: input.link?.trim() || undefined,
      comment: input.content.trim(),
      ua: navigator.userAgent,
      [FIELD.page]: path,
      pid: input.parentId ?? undefined,
      rid: input.rootId ?? undefined,
    };
    const raw = await this.request<WalineRaw>('/comment', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return this.toNode(raw, path, input.parentId ?? null, input.rootId ?? null, new Set(), 0);
  }

  async like(_path: string, id: string): Promise<LikeResult> {
    const liked = this.readLiked();
    const isLiked = liked.includes(id);
    // Waline 服务端仅支持累加；取消点赞仅记录在前端，避免误减他人点赞数
    if (!isLiked) {
      this.writeLiked([...liked, id]);
      await this.request(`/comment/${id}`, {
        method: 'PUT',
        body: JSON.stringify(FIELD.likeBody),
      });
    } else {
      this.writeLiked(liked.filter((x) => x !== id));
    }
    const data = await this.request<{ like?: number }>(`/comment/${id}`, { method: 'GET' });
    return { likes: data?.like ?? 0, liked: !isLiked };
  }

  async adminLogin(secret: string): Promise<boolean> {
    try {
      // secret 格式："邮箱:密码"，由管理后台的超级管理员账号签发 Token
      const [email, password] = secret.split(':');
      if (!email || !password) throw new CommentError('请按「邮箱:密码」格式填写');
      const data = await this.request<{ token: string }>('/token', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      this.token = data.token;
      return Boolean(data.token);
    } catch {
      return false;
    }
  }

  async setTop(_path: string, id: string, top: boolean, _secret: string): Promise<void> {
    await this.request(`/comment/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: top ? FIELD.stickyStatus : FIELD.normalStatus }),
    });
  }

  async remove(_path: string, id: string, _secret: string): Promise<void> {
    await this.request(`/comment/${id}`, { method: 'DELETE' });
  }
}
