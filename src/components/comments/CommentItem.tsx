import { avatarColor, renderContent, timeAgo } from '@/lib/comments';
import type { CommentNode } from '@/lib/comments';

interface Props {
  node: CommentNode;
  /** 是否为楼中楼（缩进 + 隐藏楼层号） */
  isReply?: boolean;
  adminUnlocked: boolean;
  onReply: (node: CommentNode) => void;
  onLike: (node: CommentNode) => void;
  onDelete: (node: CommentNode) => void;
  onToggleTop: (node: CommentNode) => void;
}

function Avatar({ node, size = 36 }: { node: CommentNode; size?: number }) {
  const initial = node.nick.trim().charAt(0) || '?';
  if (node.avatar) {
    return (
      <img
        src={node.avatar}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        referrerPolicy="no-referrer"
        className="shrink-0 rounded-full border border-slate-200 object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center rounded-full font-medium text-white"
      style={{ width: size, height: size, backgroundColor: avatarColor(node.nick), fontSize: size * 0.42 }}
    >
      {initial}
    </span>
  );
}

/**
 * 单条评论
 * ------------------------------------------------------------------
 * 支持：楼层号、管理员标识、置顶标识、点赞、回复（盖楼）、
 *       管理员置顶 / 删除（仅在解锁后出现）。
 * 内容渲染走 renderContent（先转义再换行），从根本上杜绝 XSS。
 */
export default function CommentItem({
  node,
  isReply = false,
  adminUnlocked,
  onReply,
  onLike,
  onDelete,
  onToggleTop,
}: Props) {
  return (
    <div className={isReply ? 'rounded-md bg-slate-50/80 p-2.5' : 'py-3.5'}>
      <div className="flex gap-2.5">
        <Avatar node={node} size={isReply ? 28 : 36} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
            <span className="font-medium text-slate-800">{node.nick}</span>

            {node.isAdmin && <span className="tag-red">管理员</span>}
            {node.isTop && <span className="tag-amber">置顶</span>}
            {!isReply && node.floor > 0 && (
              <span className="text-[12px] text-slate-400">{node.floor} 楼</span>
            )}

            {node.link ? (
              <a
                href={node.link}
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="text-[12px] text-hit-600 hover:underline"
              >
                主页
              </a>
            ) : null}

            <time className="text-[12px] text-slate-400" dateTime={new Date(node.createdAt).toISOString()}>
              {timeAgo(node.createdAt)}
            </time>
          </div>

          {isReply && node.replyToNick && (
            <p className="mt-0.5 text-[12.5px] text-slate-400">
              回复 <span className="text-hit-600">@{node.replyToNick}</span>
            </p>
          )}

          <div
            className="mt-1 break-words text-[13.5px] leading-relaxed text-slate-700"
            dangerouslySetInnerHTML={{ __html: renderContent(node.content) }}
          />

          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-slate-500">
            <button
              type="button"
              onClick={() => onLike(node)}
              aria-pressed={node.likedByMe}
              className={`inline-flex items-center gap-1 transition-colors hover:text-hit-700 ${
                node.likedByMe ? 'font-medium text-hit-700' : ''
              }`}
            >
              <span aria-hidden="true">{node.likedByMe ? '👍' : '👍🏻'}</span>
              {node.likes > 0 ? node.likes : '赞'}
            </button>

            <button
              type="button"
              onClick={() => onReply(node)}
              className="transition-colors hover:text-hit-700"
            >
              回复
            </button>

            {adminUnlocked && (
              <>
                <button
                  type="button"
                  onClick={() => onToggleTop(node)}
                  className="transition-colors hover:text-amber-600"
                >
                  {node.isTop ? '取消置顶' : '置顶'}
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(node)}
                  className="transition-colors hover:text-red-600"
                >
                  删除
                </button>
              </>
            )}
          </div>

          {/* 楼中楼 */}
          {node.children.length > 0 && (
            <div className="mt-2.5 space-y-1.5 border-l-2 border-slate-200 pl-2.5">
              {node.children.map((child) => (
                <CommentItem
                  key={child.id}
                  node={child}
                  isReply
                  adminUnlocked={adminUnlocked}
                  onReply={onReply}
                  onLike={onLike}
                  onDelete={onDelete}
                  onToggleTop={onToggleTop}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
