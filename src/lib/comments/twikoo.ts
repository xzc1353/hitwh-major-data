import { CommentError } from './types';
import type { CommentAdapter, CommentNode, LikeResult, SubmitInput } from './types';

/**
 * Twikoo 适配器（可选方案）
 * ------------------------------------------------------------------
 * 后端：Twikoo 云函数（Vercel / Netlify 一键部署）+ MongoDB Atlas 免费集群（M0，512MB）
 *       或 腾讯云开发 CloudBase 免费额度。
 *
 * ⚠️ 版本提示
 *   Twikoo 云函数采用"事件名"式 API，不同版本的事件命名可能微调。
 *   若对接后返回「未知的 event」之类错误，请打开 twikoo 源码
 *   src/function/twikoo/index.js，找到 event 的 switch/if 分支，
 *   把下方 EVENTS 常量改成实际名称即可 —— 其余逻辑无需改动。
 *
 * 安全模型：管理员先以密码 LOGIN 换取 accessToken，置顶/删除请求由云函数校验，
 *           前端不保存密码明文。
 */

const EVENTS = {
  list: 'GET_COMMENTS',
  submit: 'SUBMIT_COMMENT',
  like: 'COMMENT_LIKE',
  login: 'LOGIN',
  remove: 'COMMENT_DELETE',
  setTop: 'SET_COMMENT_TOP',
};

interface TwikooRaw {
  _id: string;
  nick: string;
  mail?: string;
  link?: string;
  url?: string;
  /** Twikoo 服务端已渲染为 HTML */
  comment: string;
  created?: number;
  avatar?: string;
  like?: number;
  top?: boolean;
  master?: boolean;
  pid?: string | null;
  rid?: string | null;
  children?: TwikooRaw[];
}

/** 将 Twikoo 返回的 HTML 降级为纯文本，保证渲染路径统一且安全 */
function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export class TwikooCommentAdapter implements CommentAdapter {
  readonly id = 'twikoo';
  readonly label = 'Twikoo';
  readonly serverSideAuth = true;

  private accessToken = '';
  private readonly likedKey = 'hitwh:twikoo:liked';

  constructor(private readonly envId: string) {
    if (!envId) throw new CommentError('未配置 Twikoo 云函数地址（VITE_TWIKOO_ENV_ID）');
  }

  private async call<T>(event: string, params: Record<string, unknown> = {}): Promise<T> {
    const res = await fetch(this.envId, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, ...params }),
    });
    if (!res.ok) throw new CommentError(`请求失败（HTTP ${res.status}）`);
    const json = (await res.json()) as unknown;
    if (json && typeof json === 'object' && 'code' in json && (json as { code: number }).code !== 0) {
      throw new CommentError((json as { message?: string }).message || 'Twikoo 返回错误');
    }
    return json as T;
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

  private toNode(raw: TwikooRaw, path: string, parentId: string | null, rootId: string | null, liked: Set<string>, floor = 0): CommentNode {
    return {
      id: raw._id,
      path,
      parentId,
      rootId,
      floor,
      nick: raw.nick,
      mail: raw.mail,
      link: raw.link,
      avatar: raw.avatar,
      content: htmlToText(raw.comment ?? ''),
      createdAt: raw.created ?? Date.now(),
      likes: raw.like ?? 0,
      likedByMe: liked.has(raw._id),
      isTop: Boolean(raw.top),
      isAdmin: Boolean(raw.master),
      children: (raw.children ?? []).map((c) =>
        this.toNode(c, path, raw._id, rootId ?? raw._id, liked),
      ),
    };
  }

  async list(path: string): Promise<CommentNode[]> {
    // Twikoo 的 GET_COMMENTS 返回结构随版本略有差异，此处做兼容归一
    const raw = await this.call<TwikooRaw[] | { data: TwikooRaw[] }>(EVENTS.list, {
      url: path,
      pageSize: 500,
      includeReply: true,
    });
    const rows = Array.isArray(raw) ? raw : (raw?.data ?? []);
    const liked = new Set(this.readLiked());

    const roots = rows.map((r) => this.toNode(r, path, null, null, liked));
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
    const raw = await this.call<TwikooRaw>(EVENTS.submit, {
      url: path,
      nick: input.nick.trim(),
      mail: input.mail?.trim() || undefined,
      link: input.link?.trim() || undefined,
      comment: input.content.trim(),
      ua: navigator.userAgent,
      pid: input.parentId ?? undefined,
      rid: input.rootId ?? undefined,
    });
    return this.toNode(raw, path, input.parentId ?? null, input.rootId ?? null, new Set(), 0);
  }

  async like(_path: string, id: string): Promise<LikeResult> {
    const liked = this.readLiked();
    if (liked.includes(id)) {
      this.writeLiked(liked.filter((x) => x !== id));
      const cur = await this.call<number | { like: number }>(EVENTS.like, { id });
      const likes = typeof cur === 'number' ? cur : (cur?.like ?? 0);
      return { likes, liked: false };
    }
    this.writeLiked([...liked, id]);
    const res = await this.call<number | { like: number }>(EVENTS.like, { id });
    return { likes: typeof res === 'number' ? res : (res?.like ?? 0), liked: true };
  }

  async adminLogin(secret: string): Promise<boolean> {
    try {
      const data = await this.call<{ accessToken?: string }>(EVENTS.login, { password: secret });
      this.accessToken = data?.accessToken ?? '';
      return Boolean(this.accessToken);
    } catch {
      return false;
    }
  }

  async setTop(_path: string, id: string, top: boolean, _secret: string): Promise<void> {
    await this.call(EVENTS.setTop, { id, top, accessToken: this.accessToken });
  }

  async remove(_path: string, id: string, _secret: string): Promise<void> {
    await this.call(EVENTS.remove, { id, accessToken: this.accessToken });
  }
}
