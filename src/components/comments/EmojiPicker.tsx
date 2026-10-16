import { useEffect, useRef, useState } from 'react';

/** 常用表情集（与 B 站 / 公众号评论区常见用法接近） */
const EMOJI_GROUPS: { name: string; items: string[] }[] = [
  {
    name: '常用',
    items: ['😀', '😄', '😁', '😆', '😅', '🤣', '😊', '🙂', '😉', '😍', '🤩', '😘', '😗', '😚', '😙', '🥰'],
  },
  {
    name: '情绪',
    items: ['🤔', '😐', '😑', '😶', '🙄', '😏', '😴', '😪', '😷', '🤒', '🤕', '🤢', '🥶', '😵', '🤯', '🥺'],
  },
  {
    name: '手势',
    items: ['👍', '👎', '👌', '✌️', '🤞', '🤝', '👏', '🙌', '🙏', '💪', '🤙', '👋', '✋', '🤚', '🫡', '🫰'],
  },
  {
    name: '符号',
    items: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💯', '✨', '⭐', '🔥', '🎉', '🎊', '💡', '📌'],
  },
];

interface Props {
  onSelect: (emoji: string) => void;
  className?: string;
}

export default function EmojiPicker({ onSelect, className = '' }: Props) {
  const [open, setOpen] = useState(false);
  const [group, setGroup] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="插入表情"
        className="btn-ghost btn-xs"
      >
        <span aria-hidden="true">🙂</span>
        表情
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-40 mb-2 w-[292px] rounded-lg border border-slate-200 bg-white p-2.5 shadow-pop">
          <div className="mb-2 flex gap-1 border-b border-slate-100 pb-2">
            {EMOJI_GROUPS.map((g, i) => (
              <button
                key={g.name}
                type="button"
                onClick={() => setGroup(i)}
                className={`rounded px-2 py-1 text-xs transition-colors ${
                  i === group ? 'bg-hit-50 font-medium text-hit-700' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>
          <div className="thin-scroll grid max-h-[168px] grid-cols-8 gap-0.5 overflow-y-auto">
            {EMOJI_GROUPS[group].items.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => {
                  onSelect(e);
                  setOpen(false);
                }}
                className="grid h-8 w-8 place-items-center rounded text-lg transition-colors hover:bg-slate-100"
                aria-label={`插入表情 ${e}`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
