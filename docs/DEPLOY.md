# 零成本部署与权限配置指南

本指南覆盖：静态站部署 → 评论后端搭建 → 管理员权限配置（密码 / 置顶 / 删除）→ Giscus 选型排除说明。

全程使用免费额度，总成本 0 元。

---

## 目录

1. [部署总览](#一部署总览)
2. [阶段一：Vercel 部署静态站](#二阶段一vercel-部署静态站)
3. [阶段二 A：Waline + Neon 免费 PostgreSQL（推荐）](#三阶段二-awaline--neon-免费-postgresql推荐)
4. [阶段二 B：Twikoo + MongoDB Atlas 免费集群（备选）](#四阶段二-btwikoo--mongodb-atlas-免费集群备选)
5. [管理员权限配置：密码 / 置顶 / 删除](#五管理员权限配置密码--置顶--删除)
6. [为什么不用 Giscus](#六为什么不用-giscus)
7. [免费额度与风险提示](#七免费额度与风险提示)
8. [常见问题排查](#八常见问题排查)

---

## 一、部署总览

```
┌─────────────────────┐        ┌──────────────────────────┐
│  静态站（本项目）      │  HTTPS │  评论服务（Waline/Twikoo） │
│  Vercel Hobby 免费    │ ─────► │  Vercel 免费 + 免费数据库  │
│  React SPA → dist/   │        │  管理员在服务端校验身份     │
└─────────────────────┘        └──────────────────────────┘
        ▲                                   ▲
        │ git push                          │ 环境变量注入
        │                                   │
   GitHub 仓库                        Neon / MongoDB Atlas
```

**三条独立通道**：站点、评论服务、数据库各自独立部署，互不影响。
站点即使评论服务挂掉也只是评论区不可用，页面数据仍正常展示。

---

## 二、阶段一：Vercel 部署静态站

### 1. 推送代码到 GitHub

```bash
cd hitwh-major-data
git init
git add .
git commit -m "feat: 哈工大威海大类专业数据参考站点"
git branch -M main
git remote add origin https://github.com/<你的用户名>/hitwh-major-data.git
git push -u origin main
```

> `.gitignore` 已排除 `node_modules`、`dist`、`.env*`，不会误提交密钥。

### 2. 在 Vercel 导入项目

1. 打开 <https://vercel.com> → 用 GitHub 账号登录（Hobby 免费计划）
2. **Add New… → Project** → 选择刚推送的仓库 → **Import**
3. 构建配置会被 `vercel.json` 自动识别，无需手动填写：

   | 配置项 | 值 |
   | --- | --- |
   | Framework Preset | Vite |
   | Build Command | `npm run build` |
   | Output Directory | `dist` |
   | Install Command | `npm install` |

4. 展开 **Environment Variables**，按第五节的说明填入评论后端变量（若暂时用本地演示模式，可留空直接部署）
5. 点击 **Deploy**，约 1 分钟完成，得到 `https://<项目名>.vercel.app`

### 3. SPA 重写（关键）

React Router 使用 History 模式，直接访问 `/clusters/future-info` 这类深层链接时，静态服务器找不到对应文件会返回 404。
`vercel.json` 已包含重写规则：

```json
{
  "rewrites": [
    { "source": "/((?!assets/|favicon\\.svg|robots\\.txt).*)", "destination": "/index.html" }
  ]
}
```

该规则把除静态资源外的所有路径回退到 `index.html`，由前端路由接管。

### 4. 后续更新

Vercel 会自动监听 `main` 分支，`git push` 即触发重新部署，无需任何手动操作。

---

## 三、阶段二 A：Waline + Neon 免费 PostgreSQL（推荐）

### 为什么推荐 Waline

- 提供**标准 REST API**，本项目 `src/lib/comments/waline.ts` 直接对接，UI 完全自研（B 站风格），不受官方默认样式限制
- 管理后台功能完整：置顶、删除、标记垃圾、审核队列
- 支持匿名评论（昵称 + 邮箱 + 网址），无需任何第三方账号登录
- 免费数据库选项多（Neon / Supabase / LeanCloud 国际版）

### 1. 创建免费数据库（Neon）

1. 打开 <https://neon.tech> → 注册（可用 GitHub 登录）
2. **Create Project** → 区域选择离用户最近的（如 `AWS ap-southeast-1` 新加坡）
3. 创建后进入 **Dashboard → Connection Details**，复制形如下的连接串：

   ```
   postgresql://<user>:<password>@ep-xxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```

> 备选：Supabase（<https://supabase.com>，免费版 500MB）——在 **Project Settings → Database → Connection string** 中复制 `URI` 格式连接串。

### 2. 部署 Waline 服务端到 Vercel

1. 打开 Waline 官方仓库的部署入口：<https://github.com/walinejs/waline/tree/main/example>
   或直接使用官方文档的 Vercel 一键部署按钮：<https://waline.js.org/guide/deploy/vercel.html>
2. 用同一个 Vercel 账号导入，项目名建议 `hitwh-waline`
3. 在 **Environment Variables** 中配置：

   | 变量名 | 值 | 必需 |
   | --- | --- | --- |
   | `DATABASE_URL` | 上一步 Neon 的连接串 | ✅ |
   | `SITE_NAME` | `哈工大威海 · 大类专业数据参考` | 建议 |
   | `SITE_URL` | `https://<你的站点>.vercel.app` | 建议 |
   | `SECURE_DOMAINS` | `https://<你的站点>.vercel.app`（多个用英文逗号分隔） | ✅ 关键 |
   | `AUTHOR_EMAIL` | 你的管理员邮箱，如 `admin@example.com` | ✅ 关键 |
   | `JWT_TOKEN` | 任意随机长字符串（用于签发登录 Token） | 建议 |

4. **Deploy**，完成后得到 `https://hitwh-waline.vercel.app`

> ⚠️ `SECURE_DOMAINS` 必须包含本站域名，否则浏览器会因 CORS 拦截评论请求。
> 本地调试时可追加 `http://localhost:5173`。

### 3. 注册管理员账号

1. 访问 `https://hitwh-waline.vercel.app/ui/register`
2. 使用与 `AUTHOR_EMAIL` **完全一致**的邮箱注册，密码自定义
3. **第一个注册的用户自动成为超级管理员**，后续注册的均为普通用户（可在后台提权）

### 4. 本站接入

在**站点项目**（不是 Waline 项目）的 Vercel 环境变量中添加：

```
VITE_COMMENT_PROVIDER = waline
VITE_WALINE_SERVER_URL = https://hitwh-waline.vercel.app
```

> ⚠️ Vite 的环境变量在**构建时**注入，改完必须 **Redeploy** 才生效。
> 路径：Project → Settings → Environment Variables → 保存后到 Deployments → 最新一次 → Redeploy。

---

## 四、阶段二 B：Twikoo + MongoDB Atlas 免费集群（备选）

### 1. 创建免费 MongoDB（Atlas M0）

1. 打开 <https://www.mongodb.com/cloud/atlas/register> → 注册
2. 创建 **M0 免费集群**（512MB 存储，永久免费）
3. **Database Access** → 新建数据库用户（记下用户名密码）
4. **Network Access** → 添加 IP 白名单，选择 `Allow Access from Anywhere`（`0.0.0.0/0`）
   —— Serverless 函数出口 IP 不固定，必须放开
5. **Connect → Drivers** → 复制连接串：

   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### 2. 部署 Twikoo 云函数

1. 打开 <https://github.com/imaegoo/twikoo> 的 Vercel 部署按钮，或参考官方文档
   <https://twikoo.js.org/quick-start.html#vercel-部署>
2. 环境变量配置：

   | 变量名 | 值 | 必需 |
   | --- | --- | --- |
   | `MONGODB_URI` | 上一步的连接串 | ✅ |
   | `TWIKOO_THROTTLE` | `1000`（同 IP 评论间隔毫秒，防刷） | 建议 |
   | `IP_REGION` | 可选，IP 归属地查询 API 地址 | 可选 |

3. 部署完成后得到 `https://hitwh-twikoo.vercel.app`

### 3. 设置管理员密码

访问 `https://hitwh-twikoo.vercel.app/ui` 进入管理面板，首次进入会要求设置管理员密码。
（若该路径与你的版本不符，请在部署后的站点页面上点击右下角设置图标进入管理入口。）

### 4. 本站接入

```
VITE_COMMENT_PROVIDER = twikoo
VITE_TWIKOO_ENV_ID    = https://hitwh-twikoo.vercel.app
```

同样需要 **Redeploy** 才生效。

> ⚠️ **版本适配提醒**：Twikoo 采用"事件名"式 API，不同版本事件命名可能微调。
> 若对接后返回「未知的 event」类错误，打开 `src/lib/comments/twikoo.ts`，
> 把顶部 `EVENTS` 常量改成你所用版本的名称即可，其余逻辑无需改动。

---

## 五、管理员权限配置：密码 / 置顶 / 删除

### 5.1 三种模式的权限模型对比

| 模式 | `provider` 值 | 密码存放位置 | 安全性 | 适用场景 |
| --- | --- | --- | --- | --- |
| 本地演示 | `local` | 浏览器端比对（`VITE_LOCAL_ADMIN_PASSWORD`） | ⚠️ 无真实安全性 | 功能演示、离线预览 |
| Waline | `waline` | 服务端数据库（bcrypt 哈希） | ✅ 安全 | **生产推荐** |
| Twikoo | `twikoo` | 服务端 MongoDB | ✅ 安全 | 生产备选 |

> **务必理解**：`local` 模式下密码写在打包产物里，任何人都能在浏览器 DevTools 中找到。
> 它存在的唯一意义是让你在不搭后端的情况下体验完整交互。**上线前必须切换到 waline 或 twikoo。**

### 5.2 站内管理入口

本站评论区右上角有 **「管理」** 按钮，点击后：

- `local` 模式：输入 `VITE_LOCAL_ADMIN_PASSWORD` 设置的值
- `waline` 模式：输入 `邮箱:密码`（即注册管理员时的邮箱与密码），前端调用 `POST /token` 换取 JWT
- `twikoo` 模式：输入 Twikoo 管理员密码，前端调用 `LOGIN` 换取 `accessToken`

验证通过后，每条评论下方会出现 **「置顶 / 取消置顶」** 与 **「删除」** 按钮，操作即时生效并刷新列表。

### 5.3 Waline 后台管理（功能更完整）

访问 `https://hitwh-waline.vercel.app/ui`，用管理员邮箱密码登录，可进行：

| 操作 | 路径 |
| --- | --- |
| 置顶评论 | 评论管理 → 目标评论 → 「置顶」 |
| 取消置顶 | 同上，再次点击 |
| 删除评论 | 评论管理 → 目标评论 → 「删除」（级联删除子回复） |
| 批量操作 | 勾选多条 → 批量删除 / 标记垃圾 |
| 审核待审评论 | 评论管理 → 状态筛选 `waiting` |
| 修改站点配置 | 设置 → 基础设置（评论审核策略、防刷、邮件通知等） |
| 管理用户 | 用户管理 → 修改角色（管理员 / 普通用户 / 封禁） |

### 5.4 Twikoo 后台管理

访问 `https://hitwh-twikoo.vercel.app/ui`，登录后可对评论执行置顶、删除、标记垃圾、配置审核策略等操作。

### 5.5 环境变量一览（站点项目）

```bash
# 评论后端选择
VITE_COMMENT_PROVIDER=waline

# Waline 服务端地址
VITE_WALINE_SERVER_URL=https://hitwh-waline.vercel.app

# Twikoo 云函数地址（改用 twikoo 时填写）
VITE_TWIKOO_ENV_ID=

# 本地演示模式管理员密码（仅 provider=local 时生效）
VITE_LOCAL_ADMIN_PASSWORD=change-me-please
```

本地开发时把以上内容写入项目根目录的 `.env.local`（已被 `.gitignore` 排除）。

---

## 六、为什么不用 Giscus

Giscus 是基于 **GitHub Discussions** 的评论系统，技术上确实零成本、免运维，但与本项目的场景存在六项硬性冲突：

| # | 问题 | 具体影响 |
| --- | --- | --- |
| 1 | **强制 GitHub 账号登录** | 评论者必须拥有 GitHub 账号并授权 Giscus App。中国大陆用户的 GitHub 账号持有率极低，且 GitHub 访问本身不稳定，实际参与率会非常低。 |
| 2 | **不支持匿名评论** | 无法提供"昵称 + 邮箱 + 网址"的表单式匿名评论，与 B 站、微信公众号评论区的使用习惯不符。 |
| 3 | **置顶能力不可控** | 评论排序由 GitHub Discussions 的排序规则决定，站方无法把指定评论固定到列表最前——而**置顶管理是本项目的明确需求**。 |
| 4 | **没有独立管理后台与自定义密码** | 置顶 / 删除必须登录 GitHub 网页端逐条操作，无法通过"站内输入管理员密码"完成，权限模型与需求不匹配。 |
| 5 | **数据主权在 GitHub** | 评论存储于仓库的 Discussions 中，站方无法独立备份、迁移或导出数据库，也无法自定义审核与防刷策略。 |
| 6 | **需授予仓库读写权限** | 安装 Giscus App 时必须授予对目标仓库的访问权限，对一个纯静态展示站点而言是额外的安全面暴露。 |

**结论**：Giscus 适合"开发者向、面向国际受众、以 GitHub 账号为身份基础"的技术博客；
本项目面向国内考生与家长群体，需要匿名评论 + 置顶管理 + 独立后台，因此选择 **Waline（首选）/ Twikoo（备选）**。

---

## 七、免费额度与风险提示

| 服务 | 免费额度 | 说明 |
| --- | --- | --- |
| Vercel Hobby | 100 GB 带宽 / 月 | 仅限**非商业**用途，个人项目适用 |
| Neon Free | 0.5 GB 存储 + 计算自动休眠 | 评论数据量极小，足够使用 |
| Supabase Free | 500 MB 数据库 | 备选方案 |
| MongoDB Atlas M0 | 512 MB 存储 | 永久免费，Twikoo 方案使用 |
| Waline / Twikoo | 开源免费 | 部署在 Vercel 上，占用 Hobby 额度 |

**需要留意的三点**

1. **Vercel 默认域名在国内的访问稳定性**：`*.vercel.app` 在部分网络环境下可能访问缓慢或不稳定。
   若面向国内用户，建议绑定自有域名并接入国内可访问的 CDN（域名费用不属于本项目成本）。
2. **免费额度不是 SLA**：免费数据库可能因长期闲置被暂停（Neon 自动休眠后首次请求有冷启动延迟，约数百毫秒）。
3. **内容合规责任在站方**：评论功能上线后，需及时处理违法违规、广告与人身攻击内容。
   建议在 Waline 后台开启**评论审核**（`设置 → 评论审核`），新评论先进入待审队列。

---

## 八、常见问题排查

| 现象 | 原因 | 解决 |
| --- | --- | --- |
| 评论提交报 CORS 错误 | Waline 的 `SECURE_DOMAINS` 未包含本站域名 | 补上域名后重新部署 Waline |
| 改了环境变量但没生效 | Vite 变量在**构建时**注入 | 到 Vercel 手动 Redeploy 站点项目 |
| 深层链接刷新 404 | SPA 重写规则缺失 | 确认 `vercel.json` 的 `rewrites` 未被改动 |
| 评论能发但看不到 | 开启了评论审核，新评论为 `waiting` 状态 | 到 Waline 后台审核通过 |
| 置顶按钮不出现 | 未进入管理模式 | 点击评论区右上角「管理」并验证身份 |
| `local` 模式换浏览器后评论消失 | 数据存在 localStorage | 属预期行为，生产请切换到 waline / twikoo |
| Twikoo 报「未知的 event」 | 事件名版本差异 | 修改 `src/lib/comments/twikoo.ts` 顶部 `EVENTS` 常量 |
| 管理密码在浏览器里能看到 | `local` 模式为前端校验 | 仅用于演示，上线前切换为 waline / twikoo |

---

## 附：一键检查清单

上线前逐项确认：

- [ ] 页脚与关于页均展示「个人制作、非官方，有建议请联系QQ：3029624824」
- [ ] 页脚与关于页均展示完整免责声明
- [ ] 评论区顶部展示「评论内容与本平台及建站者无关」的身份隔离声明
- [ ] 全站无「推荐」「避坑」「学长说」等主观表述
- [ ] 每个大类详情页均渲染「官方原文对照」区块，原文逐字一致、出处链接可访问
- [ ] `src/data/official-quotes.json` 中每条原文的 `quoteDate` 与 `sourceUrl` 均已填写
- [ ] 全站无「不允许转专业」等无官方依据的表述（拔尖班口径为"大一学年所有考试及格，可申请在以上四个专业类内转专业（类）"）
- [ ] `VITE_COMMENT_PROVIDER` 已从 `local` 切换为 `waline` 或 `twikoo`
- [ ] Waline 后台已开启评论审核，防刷间隔已配置
- [ ] 已确认所有数据条目均带 `sources` 字段
- [ ] 官方未公开的字段以 `EmptyField` 留空，未做推测填充
