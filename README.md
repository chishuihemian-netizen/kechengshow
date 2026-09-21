# 隽永东方 · 在地新生｜线上展览

这是无需安装依赖的静态网站。`index.html` 与 `assets/` 文件夹须一起上传，且保留相对位置。

## 发布到 GitHub Pages

1. 新建一个公开 GitHub 仓库。
2. 将 `index.html`、`assets/`、`vote-config.js`、`vote-live.js` 上传到仓库根目录（不要把外层文件夹当作唯一上传内容）。`vote-api/` 是后台源码，不会在 GitHub Pages 上运行。
3. 在仓库 **Settings → Pages** 中选择 **Deploy from a branch**、`main`、`/ (root)`，保存。
4. 等待 GitHub Pages 给出网址。更新图片或代码后，将文件推送到同一仓库即可。

也可以将完整文件夹放入仓库的 `docs/`，然后在 Pages 中选择 `/docs`。

## 启用全站汇总投票

GitHub Pages 只负责展示网页，`vote-api/` 需要单独部署到 Cloudflare Workers + D1。部署前按钮会显示“投票尚未启用”，不会展示误导性的本地票数。

1. 安装 Node.js，登录 Cloudflare 账号，在 `vote-api/` 目录运行 `npx wrangler login`。
2. 运行 `npx wrangler d1 create timeless-east-votes`，将返回的 `database_id` 填入 `vote-api/wrangler.toml`。
3. 将 `SITE_ORIGIN` 改为 GitHub Pages 的完整来源，例如 `https://YOUR_USERNAME.github.io`（不包含 `/仓库名`，也不加末尾 `/`）。自定义域名则填写自定义域名的 `https://` 来源。
4. 在 `vote-api/` 目录运行 `npx wrangler d1 execute timeless-east-votes --remote --file=schema.sql` 建表，再运行 `npx wrangler deploy`。
5. 将部署后得到的 Worker URL 填入根目录 `vote-config.js` 的 `VOTE_API_BASE`，然后把更新后的网页文件上传到 GitHub Pages。

同一浏览器对每件作品只能投一票；后台通过唯一键去重，所有访客读取同一数据库中的总票数。清除浏览器数据或更换设备仍可再次投票，因此它适合展览互动，不适合作为需要强身份核验的正式评奖投票。旧版浏览器本地票数不会自动合并到全站数据，后台从零开始统计。

## 当前版本说明

- 中文与英文呈现为同页辅助文案，仍有部分界面文案未做到逐句完整对照；这是当前工作版本的源码。
- 页面只有在后台部署并填写 `VOTE_API_BASE` 后才会显示全站票数；不要把未配置的代码包当作已上线的投票系统。
- 部分章节使用现有展板的重复展示素材；可以在 `index.html` 中的 `G` 图片列表替换为最终展板。
- GitHub Pages 的可用性取决于访客网络环境，不能保证中国大陆稳定访问。
