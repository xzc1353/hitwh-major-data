import { Link, useLocation, useNavigate } from 'react-router-dom';

interface Props {
  /** 无历史记录时的兜底跳转地址 */
  fallback?: string;
  fallbackLabel?: string;
  className?: string;
}

/**
 * 返回上一级
 * ------------------------------------------------------------------
 * 优先浏览器后退；若为直接进入（无来源页），跳转到 fallback。
 * 通过 `location.key === 'default'` 判断是否为首次进入。
 */
export default function BackButton({
  fallback = '/clusters',
  fallbackLabel = '返回大类列表',
  className = '',
}: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const isDirectEntry = location.key === 'default';

  if (isDirectEntry) {
    return (
      <Link to={fallback} className={`btn-ghost btn-xs no-print ${className}`}>
        <span aria-hidden="true">←</span>
        {fallbackLabel}
      </Link>
    );
  }

  return (
    <button type="button" onClick={() => navigate(-1)} className={`btn-ghost btn-xs no-print ${className}`}>
      <span aria-hidden="true">←</span>
      返回上一级
    </button>
  );
}
