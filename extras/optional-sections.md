# 可选模块

以下模块都不包含在默认 README 里，按需复制。复制后记得把 `YOUR_*` 占位符替换掉。

---

## 1. Spotify 正在播放

效果：一张实时显示当前播放歌曲的卡片。

1. 访问 `https://github.com/kittinan/spotify-github-profile`，按它的说明授权 Spotify；
2. 拿到部署地址后，把下面这段放到「连接」之前：

```html
<p align="center">
  <img src="https://spotify-github-profile.vercel.app/api/view?uid=YOUR_SPOTIFY_UID&redirect=true" alt="Spotify now playing">
</p>
```

注意：这类服务依赖 Vercel，部分地区/网络可能无法访问。无法访问时直接删掉即可。

---

## 2. WakaTime 编程时长

效果：每周自动更新语言与编辑器时长。

1. 在 WakaTime 获取 API Key；
2. 仓库 **Settings → Secrets and variables → Actions** 新建 `WAKATIME_API_KEY`；
3. 新建 `.github/workflows/waka.yml`：

```yaml
name: WakaTime readme

on:
  schedule:
    - cron: "0 0 * * *"
  workflow_dispatch:

permissions:
  contents: write

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: athul/waka-readme@master
        with:
          WAKATIME_API_KEY: ${{ secrets.WAKATIME_API_KEY }}
          SHOW_TITLE: true
          BLOCKS: "░▒▓█"
          TIME_RANGE: last_7_days
          SHOW_TIME: true
          SHOW_TOTAL: true
```

它会在 README 里寻找 `<!--START_SECTION:waka-->` 与 `<!--END_SECTION:waka-->`，把统计插进去。在「技术栈」后面加：

```html
<!--START_SECTION:waka-->
<!--END_SECTION:waka-->
```

---

## 3. 最新博客文章

效果：自动抓取 RSS，列出最近 5 篇。

1. 新建 `.github/workflows/blog.yml`：

```yaml
name: Latest blog posts

on:
  schedule:
    - cron: "0 2 * * *"
  workflow_dispatch:

permissions:
  contents: write

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: gautamkrishnar/blog-post-workflow@v1
        with:
          feed_list: "https://YOUR_BLOG_URL/feed.xml"
          max_post_count: 5
```

2. 在 README 里加：

```html
<!-- BLOG-POST-LIST:START -->
<!-- BLOG-POST-LIST:END -->
```

RSS 地址按你的博客调整（Hexo 常见 `/atom.xml`，Hugo 常见 `/index.xml`）。

---

## 4. GitHub Trophy

效果：奖杯墙。

```html
<p align="center">
  <img src="https://github-profile-trophy.vercel.app/?username=YOUR_GITHUB_USERNAME&theme=algolia&no-frame=true&no-bg=true&column=7&margin-w=8&margin-h=8" alt="trophies">
</p>
```

同样依赖 Vercel；如果图片裂开，删掉即可，不影响其他部分。

---

## 5. Skill Icons

效果：比 shields 更图形化的技术栈图标墙。

```html
<p align="center">
  <img src="https://skillicons.dev/icons?i=ts,js,py,react,nodejs,rust,go,docker,postgres,redis,git,linux&theme=dark" alt="skills">
</p>
```

亮色主题把 `theme=dark` 改成 `theme=light`。它不支持自动跟随 GitHub 主题，二选一即可。

---

## 6. Metrics 信息图

效果：一张包含日历、语言、星标、最近活动的大图。

1. 新建 `.github/workflows/metrics.yml`：

```yaml
name: Metrics

on:
  schedule:
    - cron: "0 3 * * *"
  workflow_dispatch:

permissions:
  contents: write

jobs:
  metrics:
    runs-on: ubuntu-latest
    steps:
      - uses: lowlighter/metrics@latest
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          user: YOUR_GITHUB_USERNAME
          template: classic
          base: header, activity, community, repositories
          plugin_languages: yes
          plugin_languages_limit: 6
          plugin_habits: yes
          config_timezone: Asia/Shanghai
```

2. README 里引用生成的 `metrics.svg`。

Metrics 配置项很多，建议先看官方 examples，再删减到适合你的长度。

---

## 7. 随机开发者格言

```html
<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Noto+Sans+SC&size=18&pause=2000&color=7DF9C4&center=true&vCenter=true&width=700&lines=%E6%84%BF%E6%AD%A4%E8%A1%8C%EF%BC%8C%E7%BB%88%E6%8A%B5%E7%BE%A4%E6%98%9F%E3%80%82" alt="quote">
</p>
```

---

## 8. 赞助 / 支持

```html
<p align="center">
  <a href="https://afdian.com/a/YOUR_AFDIAN"><img src="https://img.shields.io/badge/爱发电-请我喝一杯-946CE6?style=for-the-badge&logo=afdian&logoColor=white" alt="Afdian"></a>
  <a href="https://ko-fi.com/YOUR_KOFI"><img src="https://img.shields.io/badge/Ko--fi-Support-FF5E5B?style=for-the-badge&logo=kofi&logoColor=white" alt="Ko-fi"></a>
</p>
```

---

## 9. 访问统计的替代方案

默认用 komarev 的 `ghpvc`。如果想自建，可以用：

- `https://github.com/yogeshwaran01/github-stats`
- `https://github.com/antonkomarev/github-profile-views-counter`

自建的好处是不依赖第三方，坏处是要维护一个服务；个人主页一般没必要。

---

## 10. 使用建议

- 可选模块不要全开。主页太长会稀释重点，3–5 个区块最舒服。
- 所有依赖 Vercel 的卡片都可能在某些网络下裂开，正式使用前用手机网络检查一次。
- 每加一个 Action，都要确认它不会每天产生大量无意义 commit；能设 `paths-ignore` 就设。
