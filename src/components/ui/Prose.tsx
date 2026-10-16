import { useState } from 'react';

interface Props {
  title: string;
  /** 官方原文，可能含换行 */
  text?: string;
  /** 超过该字数时默认折叠 */
  collapseAt?: number;
  /** 无数据时的提示 */
  emptyHint?: string;
}

/**
 * 官方原文展示块
 * ------------------------------------------------------------------
 * 用于承载「专业解析」页的长段落。默认折叠超长内容，避免页面过长；
 * 正文按原样渲染（保留换行），不做改写、不做摘要。
 */
export default function Prose({
  title,
  text,
  collapseAt = 420,
  emptyHint = '官方招生网未公开该字段，本站不做推测填充。',
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const hasText = Boolean(text && text.trim().length > 0);
  const needCollapse = hasText && (text as string).length > collapseAt;

  return (
    <section className="card p-4">
      <h2 className="sec-title">
        {title}
        <span className="ml-1 text-[11.5px] font-normal text-slate-400">官方原文</span>
      </h2>

      {!hasText ? (
        <p className="rounded border border-dashed border-slate-300 bg-slate-50/60 px-3 py-2 text-[12.5px] text-slate-400">
          {emptyHint}
        </p>
      ) : (
        <>
          <div
            className={`whitespace-pre-line break-words text-[13.5px] leading-relaxed text-slate-700 ${
              needCollapse && !expanded ? 'max-h-40 overflow-hidden' : ''
            }`}
            style={
              needCollapse && !expanded
                ? { maskImage: 'linear-gradient(to bottom, #000 60%, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, #000 60%, transparent)' }
                : undefined
            }
          >
            {text}
          </div>
          {needCollapse && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-2 text-[12.5px] text-hit-700 hover:underline"
            >
              {expanded ? '收起' : '展开全文'}
            </button>
          )}
        </>
      )}
    </section>
  );
}
