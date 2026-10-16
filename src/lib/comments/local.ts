import { COMMENT_CONFIG } from '@/config/site';
import { CommentError } from './types';
import type { CommentAdapter, CommentNode, LikeResult, SubmitInput } from './types';

/**
 * 本地演示适配器（localStorage）
 * ------------------------------------------------------------------
 * 用途：零后端即可完整体验"盖楼 / 点赞 / 表情 / 置顶 / 删除 / 管理员"全部交互。
 * 限制：数据仅存于当前浏览器；密码在客户端比对，**不具备真实安全性**。
 *       生产环境请切换为 waline 或 twikoo（见 src/lib/comments/index.ts）。
 */

interface StoredComment {
  id: string;
  path: string;
  parentId: string | null;
  rootId: string | null;
  nick: string;
  mail?: string;
  link?: string;
  content: string;
  createdAt: number;
  likes: number;
  isTop: boolean;
  isAdmin: boolean;
  replyToNick?: string;
}

const keyOf = (path: string) => `hitwh:comments:${path}`;
const likedKeyOf = (path: string) => `hitwh:liked:${path}`;

function read(path: string): StoredComment[] {
  try {
    const raw = localStorage.getItem(keyOf(path));
    return raw ? (JSON.parse(raw) as StoredComment[]) : [];
  } catch {
    return [];
  }
}

function write(path: string, list: StoredComment[]) {
  try {
    localStorage.setItem(keyOf(path), JSON.stringify(list));
  } catch {
    /* 配额不足等异常静默处理 */
  }
}

function readLiked(path: string): string[] {
  try {
    const raw = localStorage.getItem(likedKeyOf(path));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeLiked(path: string, ids: string[]) {
  try {
    localStorage.setItem(likedKeyOf(path), JSON.stringify(ids));
  } catch {
    /* noop */
  }
}

function uid(): string {
  return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export class LocalCommentAdapter implements CommentAdapter {
  readonly id = 'local';
  readonly label = '本地演示（localStorage）';
  readonly serverSideAuth = false;

  private assertAdmin(secret: string) {
    if (secret !== COMMENT_CONFIG.localAdminPassword) {
      throw new CommentError('管理员密码不正确');
    }
  }

  async list(path: string): Promise<CommentNode[]> {
    const all = read(path);
    const liked = new Set(readLiked(path));

    // 楼层号：按创建时间升序对顶层评论编号
    const floorMap = new Map<string, number>();
    all
      .filter((c) => c.parentId === null)
      .sort((a, b) => a.createdAt - b.createdAt)
      .forEach((c, i) => floorMap.set(c.id, i + 1));

    const toNode = (c: StoredComment): CommentNode => ({
      id: c.id,
      path: c.path,
      parentId: c.parentId,
      rootId: c.rootId,
      floor: floorMap.get(c.id) ?? 0,
      nick: c.nick,
      mail: c.mail,
      link: c.link,
      content: c.content,
      createdAt: c.createdAt,
      likes: c.likes,
      likedByMe: liked.has(c.id),
      isTop: c.isTop,
      isAdmin: c.isAdmin,
      replyToNick: c.replyToNick,
      children: [],
    });

    const nodes = all.map(toNode);
    const byId = new Map(nodes.map((n) => [n.id, n]));

    // 组装树：把非顶层节点挂到其 rootId 对应的主楼下
    const roots: CommentNode[] = [];
    for (const n of nodes) {
      if (n.parentId === null) {
        roots.push(n);
      } else {
        const root = n.rootId ? byId.get(n.rootId) : undefined;
        (root ?? n).children.push(n);
      }
    }

    for (const r of roots) r.children.sort((a, b) => a.createdAt - b.createdAt);

    // 排序：置顶优先 → 创建时间倒序
    roots.sort((a, b) => {
      if (a.isTop !== b.isTop) return a.isTop ? -1 : 1;
      return b.createdAt - a.createdAt;
    });

    return roots;
  }

  async submit(path: string, input: SubmitInput): Promise<CommentNode> {
    const content = input.content.trim();
    if (!content) throw new CommentError('评论内容不能为空');
    if (content.length > 1000) throw new CommentError('评论内容不能超过 1000 字');
    if (!input.nick.trim()) throw new CommentError('请填写昵称');

    const list = read(path);
    const item: StoredComment = {
      id: uid(),
      path,
      parentId: input.parentId ?? null,
      rootId: input.rootId ?? null,
      nick: input.nick.trim().slice(0, 24),
      mail: input.mail?.trim() || undefined,
      link: input.link?.trim() || undefined,
      content,
      createdAt: Date.now(),
      likes: 0,
      isTop: false,
      isAdmin: false,
      replyToNick: input.replyToNick,
    };
    list.push(item);
    write(path, list);

    const nodes = await this.list(path);
    const find = (arr: CommentNode[]): CommentNode | undefined => {
      for (const n of arr) {
        if (n.id === item.id) return n;
        const hit = find(n.children);
        if (hit) return hit;
      }
      return undefined;
    };
    return find(nodes) ?? ({} as CommentNode);
  }

  async like(path: string, id: string): Promise<LikeResult> {
    const list = read(path);
    const liked = readLiked(path);
    const isLiked = liked.includes(id);
    const target = list.find((c) => c.id === id);
    if (!target) throw new CommentError('评论不存在');

    if (isLiked) {
      target.likes = Math.max(0, target.likes - 1);
      writeLiked(
        path,
        liked.filter((x) => x !== id),
      );
    } else {
      target.likes += 1;
      writeLiked(path, [...liked, id]);
    }
    write(path, list);
    return { likes: target.likes, liked: !isLiked };
  }

  async adminLogin(secret: string): Promise<boolean> {
    return secret === COMMENT_CONFIG.localAdminPassword;
  }

  async setTop(path: string, id: string, top: boolean, secret: string): Promise<void> {
    this.assertAdmin(secret);
    const list = read(path);
    const target = list.find((c) => c.id === id);
    if (!target) throw new CommentError('评论不存在');
    target.isTop = top;
    write(path, list);
  }

  async remove(path: string, id: string, secret: string): Promise<void> {
    this.assertAdmin(secret);
    const list = read(path);
    // 连同楼中楼一并删除
    const remain = list.filter((c) => c.id !== id && c.rootId !== id);
    if (remain.length === list.length) throw new CommentError('评论不存在');
    write(path, remain);
  }
}
