# 流萤主题 GitHub 主页 · 部署指南

一套以《崩坏：星穹铁道》流萤为主题的 GitHub Profile README。包含手绘 SVG 横幅、角色档案卡、引言卡、页脚，以及由 GitHub Actions 每日自动刷新的贡献统计卡。

## 1. 文件结构

```text
.
├── README.md                     # 主页正文（所有占位符都在这里）
├── setup.ps1                     # Windows 一键替换占位符
├── SETUP.md                      # 本文件
├── assets/
│   ├── banner-*.svg              # 1280×400 横幅，暗/亮两版
│   ├── pilot-*.svg               # 440×300 角色档案卡
│   ├── quote-*.svg               # 1000×220 引言卡
│   ├── footer-*.svg              # 1280×160 页脚
│   ├── icon-firefly*.svg         # 64×64 图标
│   └── generated/                # 由 Actions 自动生成的统计卡
├── scripts/
│   └── update-profile.mjs        # GraphQL 统计卡生成器（零依赖）
├── .github/workflows/
│   ├── update-profile.yml        # 每日更新统计卡
│   └── snake.yml                 # 每日更新贪吃蛇
├── extras/
│   └── optional-sections.md      # Spotify / WakaTime / 博客等可选模块
└── preview/                      # 本地预览页与截图（可删除）
```

## 2. 五分钟部署

### 2.1 创建 Profile 仓库

1. 在 GitHub 新建一个 **public** 仓库。
2. 仓库名必须和你的用户名 **完全一致**，例如用户名为 `octocat`，仓库名就是 `octocat`。
3. 不要勾选自动生成 README（本套文件自带）。

> 只有 `用户名/用户名` 这个仓库的 README 才会显示在个人主页顶部。

### 2.2 上传文件

把本目录下的 **全部文件** 上传到仓库根目录，注意保留 `.github`、`assets`、`scripts` 的目录结构。

用 Git 命令：

```bash
git init
git add .
git commit -m "feat: firefly profile"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/YOUR_GITHUB_USERNAME.git
git push -u origin main
```

### 2.3 打开 Actions 写权限

进入仓库 **Settings → Actions → General → Workflow permissions**，选择 **Read and write permissions**，保存。

统计卡和贪吃蛇都需要往仓库写文件；没有这个权限，Action 会失败在 `git push`。

### 2.4 手动跑一次

进入 **Actions**：

1. 左侧选 **Update profile cards** → **Run workflow** → 运行。
2. 左侧选 **Generate contribution snake** → **Run workflow** → 运行。

第一次运行会分别生成 `assets/generated/*.svg` 和 `output` 分支。之后每天自动更新。

### 2.5 查看主页

打开 `https://github.com/YOUR_GITHUB_USERNAME`，README 会显示在顶部。GitHub 的暗色/亮色主题会自动切换对应 SVG。

## 3. 个性化

### 3.1 用脚本替换（推荐）

在 Windows PowerShell 中进入本目录：

```powershell
powershell -ExecutionPolicy Bypass -File .\setup.ps1
```

按提示输入用户名、显示名称、身份、邮箱、社交账号等。也可以一次性传参：

```powershell
.\setup.ps1 -User octocat -Name "Octo Cat" -Role "前端工程师" -Affiliation "GitHub" -Email "me@example.com" -Blog "https://example.com" -Bilibili "123456" -Twitter "octocat"
```

脚本会：

- 备份原文件为 `README.md.bak`；
- 替换所有 `YOUR_*` 占位符；
- 未填写的 Bilibili / X 链接会自动删除，不会留下失效占位符；
- 保留 `PROJECT_ONE` / `PROJECT_TWO` / `PROJECT_THREE`，需要你手动改成真实项目；
- 提示仍未替换的占位符。

### 3.2 手动替换

至少替换这些：

| 占位符 | 含义 |
| :--- | :--- |
| `YOUR_GITHUB_USERNAME` | GitHub 用户名（同时用于仓库链接、访客计数、贪吃蛇） |
| `YOUR_NAME` | 显示名称 |
| `YOUR_ROLE` | 身份 / 职业 |
| `YOUR_AFFILIATION` | 组织、学校或当前状态 |
| `YOUR_EMAIL` | 邮箱 |
| `YOUR_BLOG_URL` | 博客 / 主页 |
| `YOUR_BILIBILI_ID` | Bilibili UID |
| `YOUR_TWITTER` | X / Twitter 用户名（不带 @） |
| `YOUR_FOCUS` | 正在做的事 |
| `YOUR_LEARNING` | 正在学的东西 |
| `YOUR_GOAL` | 今年目标 |
| `YOUR_INTERESTS` | 兴趣 |
| `PROJECT_ONE/TWO/THREE` | 精选项目名与链接 |

### 3.3 删除不需要的区块

每个可选区块都用注释包起来：

```html
<!-- SECTION:stats:start -->
...
<!-- SECTION:stats:end -->
```

可用名称：`stats`、`snake`、`projects`、`quote`。

```powershell
.\setup.ps1 -User octocat -RemoveSections stats,snake
```

删除区块不会删除对应的 workflow；如果确定不需要，可以再删除 `.github/workflows/` 下的文件。

## 4. Token 与权限

### 4.1 默认的 GITHUB_TOKEN

公开仓库的公开数据，GitHub 自动提供的 `GITHUB_TOKEN` 就够用。统计卡会拿到：

- 过去 12 个月的贡献日历；
- 公开仓库数、获得的 star 数、followers；
- 公开仓库的语言字节分布。

### 4.2 可选：PROFILE_TOKEN

如果你希望统计里包含 **私有仓库的贡献**，或者 GraphQL 因权限返回空数据，可以创建 Personal Access Token：

1. GitHub **Settings → Developer settings → Personal access tokens**。
2. 经典 token 勾选 `read:user`；如果贡献来自组织私有仓库，再勾选 `read:org` 和 `repo`。
3. 复制 token。
4. 进入 Profile 仓库 **Settings → Secrets and variables → Actions → New repository secret**。
5. 名称填 `PROFILE_TOKEN`，值粘贴 token。

`update-profile.yml` 会优先使用 `PROFILE_TOKEN`，没有时自动回退到 `GITHUB_TOKEN`。

不要把 token 写进任何文件，也不要在 README 里展示。

## 5. 常见问题

### 统计卡显示 NO SIGNAL

按顺序检查：

1. Actions 里 **Update profile cards** 是否成功跑过；
2. **Settings → Actions → General** 是否是 **Read and write**；
3. `PROFILE_USERNAME` 是否等于你的登录名（workflow 默认取仓库 owner，一般没问题）；
4. 如果用了 `PROFILE_TOKEN`，token 是否过期、是否有 `read:user`；
5. 打开 Actions 日志，搜索 `[warn]` 或 `GraphQL`。

### 贪吃蛇图片裂开

1. 先手动运行 **Generate contribution snake**；
2. 确认仓库多了一个 `output` 分支，里面有 `github-contribution-grid-snake-dark.svg` 和 `github-contribution-grid-snake-light.svg`；
3. 确认 README 里的链接是 `raw.githubusercontent.com/用户名/用户名/output/...`；
4. 如果是刚生成的，等一两分钟或强制刷新。

### 图片全部裂开

- Profile 仓库名必须与用户名一致；
- 文件必须保留 `assets/` 相对路径；
- 默认分支必须是 `main`（README 里的 Actions 配置按 `main` 写）；
- 不要只上传 README.md，SVG 也要上传。

### 贡献数字很少

GitHub 默认只统计公开贡献。到 **Settings → Profile → Contributions & Activity** 勾选 **Include private contributions on my profile**，统计卡才能拿到私有贡献（还需要 token 权限）。

### Action 一直在循环提交

`update-profile.yml` 已用 `paths-ignore: assets/generated/**` 避免自触发。如果你改过 workflow，保留这段。

### 图片更新了但主页还是旧的

GitHub 的 camo 图片缓存和浏览器缓存都会延迟。等几分钟、强制刷新，或在图片 URL 后加 `?v=2`（不推荐长期使用）。

### readme-typing-svg 无法访问

删除 README 顶部那张 `readme-typing-svg` 图片即可；其他部分不依赖它。

## 6. 自定义视觉

### 6.1 颜色

统计卡颜色在 `scripts/update-profile.mjs` 顶部的 `THEMES` 里：

- 暗色：`#04070E / #07121E / #0A1B24`，薄荷 `#7DF9C4`，琥珀 `#FFC27A`；
- 亮色：`#F8FFFD / #EFFCF9 / #E2F8F3`，深青 `#0F766E`，暖橙 `#B45309`。

横幅、档案卡、引言卡、页脚的配色直接写在 SVG 里，搜索 `#7DF9C4` 等色值即可批量替换。

### 6.2 文案

- 横幅：`assets/banner-*.svg` 中的 `流萤`、`FIREFLY`、`飞萤扑火，向死而生`；
- 档案卡：`assets/pilot-*.svg` 中的身份、命途、故乡、信号；
- 引言卡：`assets/quote-*.svg`；
- 页脚：`assets/footer-*.svg`。

SVG 是纯文本，直接用编辑器改即可。改完在浏览器打开检查有没有超出版面。

### 6.3 统计卡生成逻辑

`scripts/update-profile.mjs` 是零依赖 Node 脚本：

```bash
# 用假数据在本地预览
node scripts/update-profile.mjs --demo --out=preview/generated

# 用真实数据
GITHUB_TOKEN=xxx GITHUB_REPOSITORY=owner/owner node scripts/update-profile.mjs
```

输出：

- `overview-{dark,light}.svg`：贡献总数、仓库、star、followers、活跃天数；
- `languages-{dark,light}.svg`：语言占比；
- `activity-{dark,light}.svg`：53 周热力图、当前连续、最长连续、活跃天数；
- `stats.json`：原始汇总数据。

无 token 或接口失败时会写主题化空状态，并以 0 退出，不会让 workflow 红叉。

## 7. 本地预览

`preview/readme-dark.html` 与 `preview/readme-light.html` 是仿 GitHub 排版的本地预览页，直接双击打开即可。

预览页使用示例姓名、示例项目与 demo 统计卡，只用于检查排版，不代表你的真实数据。

注意：GitHub 会改写部分 HTML（例如 `<picture>` 的 `source`），本地预览与线上可能有细微差异，以线上为准。

## 8. 角色与版权

流萤（Firefly）及《崩坏：星穹铁道》相关名称、设定归米哈游所有。本套 SVG 与文案是为个人主页制作的非官方同人素材，请勿用于商业售卖；转载请注明来源。

如果你要把它作为模板分享，建议保留本段说明，并提醒使用者替换为自己的信息。
