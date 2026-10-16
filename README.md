# 哈工大威海 · 大类专业数据参考

哈尔滨工业大学（威海）大类招生专业数据的**纯静态**整理站点。
仅做公开信息搬运与结构化呈现，**不提供任何报考建议**。

> 个人制作、非官方，有建议请联系 QQ：**3029624824**

---

## 一、产品结构树

```
/                                  首页
│   数据概览 · 大类卡片 · 1+1+X 流程 · 官方信源
│
├── /clusters                      大类列表
│   │   关键词搜索 + 类别筛选（拔尖班 / 卓越优才计划 / 常规大类 / 单专业招生）
│   │
│   └── /clusters/:clusterId       大类详情
│       │   基本信息 · 包含专业表 · 转专业政策 · 备注 · 数据来源
│       │   └── 高级评论区（按 pathname 分区）
│       │
│       └── /majors/:majorId       专业详情
│           专业方向 · 核心课程 · 就业去向 · 所属大类 · 数据来源
│           └── 高级评论区
│
├── /compare                       数据对比
│   │   模式切换：对比大类（≤3） / 对比专业（≤4）
│   │   差异高亮 · 状态同步至 URL（?c=id1,id2 或 ?m=id1,id2）
│
├── /about                         关于本站
│   完整免责声明 · 字段覆盖范围 · 评论区说明 · 联系方式
│
└── *                               404
```

**多层级导航能力**

| 能力 | 实现位置 |
| --- | --- |
| 面包屑 | `src/components/Breadcrumbs.tsx`，由路由 `handle.crumb` 声明完整路径链，`useMatches()` 取最深匹配渲染 |
| 返回上一级 | `src/components/BackButton.tsx`，优先 `navigate(-1)`，直接进入时降级为跳转父级路由 |
| 避免过度单页滚动 | 数据分页分布在 5 个路由，首页只做概览与入口 |

---

## 二、技术栈

| 项 | 选型 | 说明 |
| --- | --- | --- |
| 框架 | React 18.3 + TypeScript 5.6 | 严格模式 |
| 构建 | Vite 5 | 产物为纯静态资源 |
| 样式 | Tailwind CSS 3.4 | 自定义 `hit` 主题色板 |
| 路由 | React Router 6.26（`createBrowserRouter`） | 数据路由，支持 `handle` 元信息 |
| 数据 | 本地 Mock JSON（`src/data/*.json`） | 通过 `src/lib/data.ts` 统一访问 |
| 部署 | Vercel | 零成本，见 `docs/DEPLOY.md` |

---

## 三、本地运行

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # 产物输出到 dist/
npm run preview      # 本地预览构建产物
npm run typecheck    # 仅类型检查
```

---

## 四、目录结构

```
src/
├── App.tsx                     路由表（含面包屑 handle）
├── config/site.ts              站点配置：身份信息、免责声明、评论后端
├── data/
│   ├── clusters.json           招生大类（6 条）
│   ├── majors.json             专业（39 条）
│   ├── official-quotes.json    官方原文对照（13 条，含出处与表述日期）
│   └── meta.json               数据元信息与官方信源清单
├── lib/
│   ├── data.ts                 数据访问层（唯一数据出入口）
│   └── comments/               评论适配层
│       ├── types.ts            接口与工具（含 XSS 转义）
│       ├── local.ts            localStorage 实现（演示默认）
│       ├── waline.ts           Waline REST API 实现（生产推荐）
│       ├── twikoo.ts           Twikoo 云函数实现（备选）
│       └── index.ts            适配器工厂
├── components/
│   ├── Layout / Header / Footer / Breadcrumbs / BackButton
│   ├── ui/                     DataNotice / ClusterCard / SourceList / EmptyField
│   └── comments/
│       ├── CommentSection.tsx  评论区容器（排序 / 分页 / 管理模式）
│       ├── CommentItem.tsx     单条评论（递归渲染楼中楼）
│       ├── CommentForm.tsx     输入框（昵称记忆 / 表情 / 字数）
│       └── EmojiPicker.tsx     表情面板
└── pages/                      Home / ClusterList / ClusterDetail / MajorDetail / Compare / About / NotFound
```

---

## 五、内容红线与合规设计

本项目在代码层面固化了三条红线，不依赖人工自觉：

1. **客观中立与免责**
   - 全站文案仅陈述官方字段，不含"推荐""避坑""学长说"等表述。
   - 页脚 `src/components/Footer.tsx` 与关于页 `src/pages/About.tsx` 强制渲染 `DISCLAIMER.short`：**"个人制作、非官方，有建议请联系QQ：3029624824"**。
   - `DISCLAIMER.full` 五条完整免责声明在关于页展示。
   - `EmptyField` 组件保证"官方未公开即留空"，从机制上杜绝推测填充。

2. **严格对齐官方口径（核心机制）**
   - 数据文件 `src/data/official-quotes.json` 收录 **13 条官方原文**，每条含 `topic`（主题）、`quote`（逐字原文）、`source`（出处）、`sourceUrl`、`quoteDate`（表述日期）、`clusterIds`（适用范围）。
   - 每个大类详情页底部渲染「**官方原文对照**」区块，列出该页数据所依据的全部官方原文，可逐条核验。
   - 所有规则性表述（分流、转专业、录取）一律**逐字引用原文**，不作改写、不作推断、不作评价；不同文件口径不一致时**并列呈现、不作取舍**。
   - 典型示例：拔尖班转专业。本站不再使用"不允许转专业"这一无官方依据的表述，改为官方原文口径——**"大一学年所有考试及格，可申请在以上四个专业类内转专业（类）"**（即可以申请，但范围限于拔尖班专业类之内）。

3. **身份隔离**
   - `DISCLAIMER.commentIsolation` 固定渲染在评论区顶部与页脚：
     **"评论区由第三方评论系统托管，评论内容仅代表发布者个人观点，与本平台及建站者无关。"**
   - 评论数据存于第三方服务，本站不采集评论者信息。

4. **数据可追溯**
   - 每条大类、每个专业均带 `sources` 字段，在详情页通过 `SourceList` 展示；全站官方信源清单在 `src/data/meta.json` 中集中维护。

---

## 六、部署与更新

### 6.1 当前实际使用的发布方式：内置发布

站点通过 WorkBuddy 内置发布能力上线，**不依赖 GitHub 与 Vercel**：

- 线上地址：`https://3aed7820e6814f73b6f331f0908d2558.sg.agentos-app.run`
- 代码托管（可选，仅用于版本管理）：`https://github.com/xzc1353/hitwh-major-data`
- 发布单元：`serve/`（零依赖 Node 静态服务 + 自带 SPA 回退）
- 管理入口：**设置 — 数据管理 — 应用**

> ⚠️ **重新发布会更换分享链接**：实测再次发布后，旧地址返回 400 且不再可用。
> 因此**每次重新发布后，请以最新返回的链接为准重新分享**；若已把旧链接发给他人，需一并告知新地址。

> 之所以不使用 `vite preview` 或 `python3 -m http.server`：本项目使用 BrowserRouter，
> 必须把未知路径回退到 `index.html`，否则 `/clusters/xxx`、`/majors/xxx` 这类深层链接
> 刷新时会 404。`serve/server.mjs` 用约 120 行 Node 内置模块实现了该回退。

### 6.2 更新线上内容的完整流程

```bash
# 1) 修改数据或代码
#    数据文件位于 src/data/*.json

# 2) 构建
npm run build

# 3) 同步到发布单元
npm run pack:serve

# 4) 重新发布（内容覆盖，分享链接保持不变）
```

第 4 步通过内置发布完成，无需重新申请地址。

### 6.3 版本管理

```bash
git add -A && git commit -m "..." && git push
```

推送使用 SSH 通道（`~/.ssh/config` 中已将 `github.com` 指向 `ssh.github.com:443`，
因为本机 22 端口对 github.com 不可用）。

### 6.4 如果将来改用 Vercel

`vercel.json` 已备好 SPA 重写与缓存头配置，可直接导入 Vercel 并绑定自有域名。
届时把 `serve/` 的发布方式替换为 Vercel 的 Git 集成即可实现 push 自动部署。
详见 **[docs/DEPLOY.md](docs/DEPLOY.md)**，其中还包含：

- Vercel 零成本部署（含 SPA 重写配置）
- Waline + Neon 免费 PostgreSQL 部署与管理员账号设置
- Twikoo + MongoDB Atlas 免费集群部署
- 后台置顶 / 删除评论的操作路径
- **Giscus 不适用的六条原因**

---

## 七、免责声明

本站为个人制作的第三方信息整理页面，与哈尔滨工业大学、哈尔滨工业大学（威海）及其任何内设机构无隶属或合作关系。
全部数据搬运自学校官方公开渠道，仅作结构化整理，不构成任何报考建议、承诺或担保。
招生专业、招生计划、选考科目、学费标准、分流与转专业规则等，均以学校及各省招生考试机构当年正式公布的文件为唯一准据。

如学校相关部门认为本站内容存在不当之处，或权利人认为内容侵犯其合法权益，请联系 QQ：**3029624824**，我们将在核实后第一时间处理。
