/** 数据来源清单 */
export default function SourceList({ sources }: { sources: string[] }) {
  if (!sources.length) return null;
  return (
    <div className="mt-1">
      <p className="field-label">数据来源</p>
      <ul className="list-inside list-disc space-y-1 text-[12.5px] leading-relaxed text-slate-500">
        {sources.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
    </div>
  );
}
