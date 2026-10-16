import { Link } from 'react-router-dom';
import Breadcrumbs from '@/components/Breadcrumbs';
import { SITE } from '@/config/site';

export default function NotFound() {
  return (
    <>
      <Breadcrumbs />
      <div className="card px-6 py-16 text-center">
        <p className="text-4xl font-bold text-slate-200">404</p>
        <h1 className="mt-3 text-lg font-semibold text-slate-800">未找到该页面或数据条目</h1>
        <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-slate-500">
          可能链接已失效，或对应的招生大类 / 专业条目尚未收录。可返回首页或大类列表重新查找。
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link to="/" className="btn-primary btn-xs">
            返回首页
          </Link>
          <Link to="/clusters" className="btn-ghost btn-xs">
            浏览招生大类
          </Link>
        </div>
        <p className="mt-6 text-[12px] text-slate-400">
          如认为该条目应当存在，请联系 QQ：{SITE.contactQQ}
        </p>
      </div>
    </>
  );
}
