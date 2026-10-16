import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import CommentForm from './CommentForm';
import CommentItem from './CommentItem';
import { COMMENT_CONFIG, DISCLAIMER } from '@/config/site';
import { getCommentAdapter } from '@/lib/comments';
import type { CommentNode, SortMode, SubmitInput } from '@/lib/comments';

const adapter = getCommentAdapter();

/**
 * 高级评论区
 * ------------------------------------------------------------------
 * 功能：盖楼回复、点赞、表情、置顶、删除、管理员模式、排序、分页。
 * 后端：由 CommentAdapter 决定（local / waline / twikoo），本组件与后端完全解耦。
 * 红线：顶部固定展示"评论内容与本平台及建站者无关"的身份隔离声明。
 */
export default function CommentSection() {
  const { pathname } = useLocation();
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sort, setSort] = useState<SortMode>('newest');
  const [page, setPage] = useState(1);
  const [replyTo, setReplyTo] = useState<{ parentId: string; rootId: string; nick: string } | null>(null);

  const [adminOpen, setAdminOpen] = useState(false);
  const [adminInput, setAdminInput] = useState('');
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminError, setAdminError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setComments(await adapter.list(pathname));
    } catch (e) {
      setError(e instanceof Error ? e.message : '评论加载失败');
    } finally {
      setLoading(false);
    }
  }, [pathname]);

  useEffect(() => {
    void reload();
    setPage(1);
    setReplyTo(null);
  }, [reload]);

  /** 排序：置顶恒在最前 */
  const sorted = useMemo(() => {
    const arr = [...comments];
    arr.sort((a, b) => {
      if (a.isTop !== b.isTop) return a.isTop ? -1 : 1;
      if (sort === 'hottest') {
        const al = a.likes + a.children.reduce((s, c) => s + c.likes, 0);
        const bl = b.likes + b.children.reduce((s, c) => s + c.likes, 0);
        if (al !== bl) return bl - al;
      }
      return b.createdAt - a.createdAt;
    });
    return arr;
  }, [comments, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / COMMENT_CONFIG.pageSize));
  const pageItems = sorted.slice((page - 1) * COMMENT_CONFIG.pageSize, page * COMMENT_CONFIG.pageSize);
  const totalCount = comments.reduce((s, c) => s + 1 + c.children.length, 0);

  const handleSubmit = async (input: SubmitInput) => {
    await adapter.submit(pathname, input);
    await reload();
  };

  const handleLike = async (node: CommentNode) => {
    try {
      const res = await adapter.like(pathname, node.id);
      const patch = (list: CommentNode[]): CommentNode[] =>
        list.map((c) =>
          c.id === node.id
            ? { ...c, likes: res.likes, likedByMe: res.liked }
            : { ...c, children: patch(c.children) },
        );
      setComments((prev) => patch(prev));
    } catch (e) {
      setError(e instanceof Error ? e.message : '点赞失败');
    }
  };

  const handleReply = (node: CommentNode) => {
    // 若回复的是楼中楼，则挂到其所属主楼下
    const rootId = node.rootId ?? node.id;
    setReplyTo({ parentId: node.id, rootId, nick: node.nick });
    document.getElementById('comment-form-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleDelete = async (node: CommentNode) => {
    if (!window.confirm(`确认删除该评论${node.children.length ? '及其全部回复' : ''}？此操作不可撤销。`)) return;
    try {
      await adapter.remove(pathname, node.id, adminInput);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除失败');
    }
  };

  const handleToggleTop = async (node: CommentNode) => {
    try {
      await adapter.setTop(pathname, node.id, !node.isTop, adminInput);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : '操作失败');
    }
  };

  const tryUnlockAdmin = async () => {
    setAdminError('');
    const ok = await adapter.adminLogin(adminInput);
    if (ok) {
      setAdminUnlocked(true);
      setAdminOpen(false);
    } else {
      setAdminError('密码或账号不正确');
    }
  };

  return (
    <section className="mt-10" aria-label="评论区">
      {/* 身份隔离声明（红线要求） */}
      <div className="mb-3 rounded-md border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-slate-500">
        <span className="mr-1.5 font-semibold text-slate-600">评论区声明</span>
        {DISCLAIMER.commentIsolation}
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="sec-title mb-0">
          评论
          <span className="ml-1 text-sm font-normal text-slate-400">（{totalCount}）</span>
        </h2>

        <div className="flex items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-md border border-slate-200">
            {(['newest', 'hottest'] as SortMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setSort(m);
                  setPage(1);
                }}
                className={`px-2.5 py-1 text-xs transition-colors ${
                  sort === m ? 'bg-hit-700 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {m === 'newest' ? '最新' : '最热'}
              </button>
            ))}
          </div>

          {adminUnlocked ? (
            <button
              type="button"
              onClick={() => {
                setAdminUnlocked(false);
                setAdminInput('');
              }}
              className="btn-ghost btn-xs"
            >
              退出管理
            </button>
          ) : (
            <button type="button" onClick={() => setAdminOpen((v) => !v)} className="btn-ghost btn-xs">
              管理
            </button>
          )}
        </div>
      </div>

      {adminUnlocked && (
        <p className="mb-3 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12.5px] text-emerald-700">
          已进入管理模式，可对评论执行<strong className="font-medium">置顶 / 取消置顶 / 删除</strong>。
          {!adapter.serverSideAuth && (
            <span className="ml-1 text-emerald-800/70">
              （当前为本地演示模式，权限校验在浏览器端完成，仅用于功能体验）
            </span>
          )}
        </p>
      )}

      {adminOpen && !adminUnlocked && (
        <div className="mb-3 rounded-md border border-slate-200 bg-white p-3">
          <p className="field-label">
            {adapter.id === 'waline' ? '管理员账号（格式：邮箱:密码）' : '管理员密码'}
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              type="password"
              value={adminInput}
              onChange={(e) => setAdminInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void tryUnlockAdmin()}
              placeholder={adapter.id === 'waline' ? 'admin@example.com:your-password' : '请输入管理员密码'}
              className="min-w-[220px] flex-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-[13px] focus:border-hit-400 focus:outline-none focus:ring-2 focus:ring-hit-100"
            />
            <button type="button" onClick={() => void tryUnlockAdmin()} className="btn-primary btn-xs">
              验证
            </button>
          </div>
          {adminError && <p className="mt-2 text-[12.5px] text-red-600">{adminError}</p>}
          <p className="mt-2 text-[12px] text-slate-400">
            当前评论后端：{adapter.label}
            {adapter.serverSideAuth ? '（服务端校验，安全）' : '（前端校验，仅演示）'}
          </p>
        </div>
      )}

      <div id="comment-form-anchor">
        <CommentForm replyTo={replyTo} onSubmit={handleSubmit} onCancelReply={() => setReplyTo(null)} />
      </div>

      {error && (
        <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-600">
          {error}
        </p>
      )}

      <div className="mt-2 divide-y divide-slate-100">
        {loading ? (
          <p className="py-8 text-center text-[13px] text-slate-400">评论加载中…</p>
        ) : pageItems.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-slate-400">暂无评论，欢迎发布第一条。</p>
        ) : (
          pageItems.map((node) => (
            <CommentItem
              key={node.id}
              node={node}
              adminUnlocked={adminUnlocked}
              onReply={handleReply}
              onLike={handleLike}
              onDelete={handleDelete}
              onToggleTop={handleToggleTop}
            />
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-1.5">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="btn-ghost btn-xs"
          >
            上一页
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((n) => Math.abs(n - page) <= 2 || n === 1 || n === totalPages)
            .map((n, idx, arr) => (
              <span key={n} className="flex items-center gap-1.5">
                {idx > 0 && arr[idx - 1] !== n - 1 && <span className="text-slate-300">…</span>}
                <button
                  type="button"
                  onClick={() => setPage(n)}
                  className={`h-7 min-w-7 rounded px-2 text-xs transition-colors ${
                    n === page ? 'bg-hit-700 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {n}
                </button>
              </span>
            ))}
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="btn-ghost btn-xs"
          >
            下一页
          </button>
        </div>
      )}
    </section>
  );
}
