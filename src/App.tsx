import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import ClusterList from '@/pages/ClusterList';
import ClusterDetail from '@/pages/ClusterDetail';
import MajorDetail from '@/pages/MajorDetail';
import Compare from '@/pages/Compare';
import About from '@/pages/About';
import NotFound from '@/pages/NotFound';
import { getCluster, getMajor } from '@/lib/data';
import type { Crumb } from '@/components/Breadcrumbs';

/**
 * 多层级路由表
 * ------------------------------------------------------------------
 * 采用 createBrowserRouter（数据路由），面包屑由每层路由的 `handle.crumb`
 * 声明并返回"完整路径链"，`useMatches()` 取最深匹配渲染，避免在各页面重复拼装。
 *
 * 层级：
 *   /                        首页
 *   /clusters                大类列表
 *   /clusters/:clusterId     大类详情
 *   /majors/:majorId         专业详情
 *   /compare                 对比页
 *   /about                   关于页
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
        handle: { crumb: (): Crumb[] => [{ label: '首页' }] },
      },
      {
        path: 'clusters',
        element: <ClusterList />,
        handle: {
          crumb: (): Crumb[] => [{ label: '首页', to: '/' }, { label: '招生大类' }],
        },
      },
      {
        path: 'clusters/:clusterId',
        element: <ClusterDetail />,
        handle: {
          crumb: (params: Record<string, string | undefined>): Crumb[] => {
            const c = getCluster(params.clusterId);
            return [
              { label: '首页', to: '/' },
              { label: '招生大类', to: '/clusters' },
              { label: c?.shortName ?? '未找到' },
            ];
          },
        },
      },
      {
        path: 'majors/:majorId',
        element: <MajorDetail />,
        handle: {
          crumb: (params: Record<string, string | undefined>): Crumb[] => {
            const m = getMajor(params.majorId);
            const c = m ? getCluster(m.clusterIds[0]) : undefined;
            const trail: Crumb[] = [{ label: '首页', to: '/' }, { label: '招生大类', to: '/clusters' }];
            if (c) trail.push({ label: c.shortName, to: `/clusters/${c.id}` });
            trail.push({ label: m?.name ?? '未找到' });
            return trail;
          },
        },
      },
      {
        path: 'compare',
        element: <Compare />,
        handle: {
          crumb: (): Crumb[] => [{ label: '首页', to: '/' }, { label: '数据对比' }],
        },
      },
      {
        path: 'about',
        element: <About />,
        handle: {
          crumb: (): Crumb[] => [{ label: '首页', to: '/' }, { label: '关于本站' }],
        },
      },
      {
        path: '*',
        element: <NotFound />,
        handle: {
          crumb: (): Crumb[] => [{ label: '首页', to: '/' }, { label: '页面不存在' }],
        },
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
