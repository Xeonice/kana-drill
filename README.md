# 仮名から引く · Kana Drill

只看假名回想汉字与释义的日语单词卡。答错的词自动排进下一巡，直到整组词全部答对为止。

当前牌组：**Day 3 · 単語 40**（源自个人 Notion 单词表）。

## 怎么用

1. 卡片正面只显示假名 —— 先在心里默想它的汉字和意思
2. 点「翻面 · 看答案」（或按 `空格`）揭晓汉字、释义、例句
3. 自评 **正确** / **错误**（键盘 `→` / `←`）

判「错误」的词会累加错误次数，并排进下一巡；一巡结束后只重练没答对的词，直到全部答对。

### 界面上的信息

- **顶部 40 格点阵** —— 绿=已掌握，红=错过待重来，灰=本巡还没轮到，蓝=当前这个词
- **錯題帳** —— 按错误次数排序，可一键复制成 Markdown 表格贴回笔记
- **打乱顺序** —— 只打乱还没判过的部分，防止靠位置记忆
- **进度存在浏览器本地**（localStorage），刷新和关掉页面都不丢；换设备不同步

## 本地开发

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # 类型检查 + 产出 dist/
npm run preview    # 预览构建产物
```

## 部署到 Vercel

纯静态前端，零配置：

```bash
npx vercel        # 首次会问一遍项目设置
npx vercel --prod
```

或在 [vercel.com/new](https://vercel.com/new) 导入这个仓库 —— Vercel 会自动识别 Vite：

| 设置 | 值 |
| --- | --- |
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |

## 换成自己的单词

单词表在 `src/data/day3.ts`，一行一个词，顺序是「假名 / 汉字 / 释义 / 例句」：

```ts
["こうじょう", "向上", "提高", "サービス内容を向上させていくことも必要にはあります"],
```

片假名外来语把假名和汉字写成同一个值即可（如 `["メリット", "メリット", "优点", "…"]`），卡片会自动只考释义。例句留空字符串就不显示。

想加新的一天，复制 `src/data/day3.ts` 改成 `day4.ts`，把 `Deck` 的 `id` 换成 `"day4"`（`id` 是本地存档的键，必须唯一），再在 `src/App.tsx` 里换掉 `deck` 的来源。

## 技术栈

React 18 + TypeScript + Vite。没有后端、没有账号、没有第三方追踪；只有 Google Fonts 的两款字体（Shippori Mincho / Zen Kaku Gothic New）走外部请求。
