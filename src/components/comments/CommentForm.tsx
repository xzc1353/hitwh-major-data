import { useEffect, useRef, useState } from 'react';
import EmojiPicker from './EmojiPicker';
import type { SubmitInput } from '@/lib/comments';

const PROFILE_KEY = 'hitwh:commenter';
const MAX_LEN = 1000;

interface Profile {
  nick: string;
  mail: string;
  link: string;
}

function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as Profile) : { nick: '', mail: '', link: '' };
  } catch {
    return { nick: '', mail: '', link: '' };
  }
}

interface Props {
  /** 回复模式下的上下文；为空表示发表主楼 */
  replyTo?: { parentId: string; rootId: string; nick: string } | null;
  onSubmit: (input: SubmitInput) => Promise<void>;
  onCancelReply?: () => void;
}

/**
 * 评论输入框
 * ------------------------------------------------------------------
 * 特性：昵称/邮箱/网址 本地记忆、表情面板、字数统计、回复态提示。
 * 邮箱仅用于生成头像，不会公开展示（与主流评论系统一致）。
 */
export default function CommentForm({ replyTo, onSubmit, onCancelReply }: Props) {
  const [profile, setProfile] = useState<Profile>({ nick: '', mail: '', link: '' });
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setProfile(loadProfile());
  }, []);

  useEffect(() => {
    if (replyTo) {
      setExpanded(true);
      taRef.current?.focus();
    }
  }, [replyTo]);

  const insertEmoji = (emoji: string) => {
    const ta = taRef.current;
    if (!ta) {
      setContent((c) => c + emoji);
      return;
    }
    const start = ta.selectionStart ?? content.length;
    const end = ta.selectionEnd ?? content.length;
    const next = content.slice(0, start) + emoji + content.slice(end);
    setContent(next.slice(0, MAX_LEN));
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + emoji.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  const handleSubmit = async () => {
    setError('');
    const nick = profile.nick.trim();
    if (!nick) {
      setError('请填写昵称');
      return;
    }
    if (!content.trim()) {
      setError('请填写评论内容');
      return;
    }
    setSubmitting(true);
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      await onSubmit({
        nick,
        mail: profile.mail.trim() || undefined,
        link: profile.link.trim() || undefined,
        content: content.trim(),
        parentId: replyTo?.parentId ?? null,
        rootId: replyTo?.rootId ?? null,
        replyToNick: replyTo?.nick,
      });
      setContent('');
      onCancelReply?.();
      setExpanded(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : '提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const showFields = expanded || content.length > 0;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3.5">
      {replyTo && (
        <div className="mb-2.5 flex items-center justify-between rounded border border-hit-100 bg-hit-50/60 px-2.5 py-1.5 text-[12.5px] text-hit-800">
          <span>
            正在回复 <strong className="font-medium">@{replyTo.nick}</strong>
          </span>
          <button type="button" onClick={onCancelReply} className="text-slate-400 hover:text-slate-600">
            取消
          </button>
        </div>
      )}

      <textarea
        ref={taRef}
        value={content}
        onChange={(e) => setContent(e.target.value.slice(0, MAX_LEN))}
        onFocus={() => setExpanded(true)}
        rows={showFields ? 4 : 2}
        placeholder={replyTo ? `回复 @${replyTo.nick}…` : '写下你的评论…（纯文本，支持表情）'}
        className="w-full resize-y rounded-md border border-slate-200 px-3 py-2 text-sm leading-relaxed text-slate-700 placeholder:text-slate-400 focus:border-hit-400 focus:outline-none focus:ring-2 focus:ring-hit-100"
      />

      {showFields && (
        <div className="mt-2.5 grid gap-2 sm:grid-cols-3">
          <input
            value={profile.nick}
            onChange={(e) => setProfile({ ...profile, nick: e.target.value.slice(0, 24) })}
            placeholder="昵称（必填）"
            className="rounded-md border border-slate-200 px-2.5 py-1.5 text-[13px] focus:border-hit-400 focus:outline-none focus:ring-2 focus:ring-hit-100"
          />
          <input
            value={profile.mail}
            onChange={(e) => setProfile({ ...profile, mail: e.target.value.slice(0, 64) })}
            placeholder="邮箱（选填，不公开）"
            className="rounded-md border border-slate-200 px-2.5 py-1.5 text-[13px] focus:border-hit-400 focus:outline-none focus:ring-2 focus:ring-hit-100"
          />
          <input
            value={profile.link}
            onChange={(e) => setProfile({ ...profile, link: e.target.value.slice(0, 120) })}
            placeholder="网址（选填）"
            className="rounded-md border border-slate-200 px-2.5 py-1.5 text-[13px] focus:border-hit-400 focus:outline-none focus:ring-2 focus:ring-hit-100"
          />
        </div>
      )}

      {error && <p className="mt-2 text-[12.5px] text-red-600">{error}</p>}

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <EmojiPicker onSelect={insertEmoji} />
          <span className="text-[12px] text-slate-400">
            {content.length}/{MAX_LEN}
          </span>
        </div>
        <button type="button" onClick={handleSubmit} disabled={submitting} className="btn-primary btn-xs">
          {submitting ? '提交中…' : replyTo ? '发表回复' : '发表评论'}
        </button>
      </div>
    </div>
  );
}
