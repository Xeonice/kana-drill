# 仮名から引く · Kana Drill

**▶ https://kana-drill-taupe.vercel.app**

只看假名回想汉字与释义的日语单词卡。按熟练度分箱（Leitner）安排复习，词单一天天加进来，每次练习的量却不会跟着无限膨胀。

## 怎么用

1. 首页选**形式**（三选一）和范围，显示**本日のおさらい** —— 今天该练多少词
2. 卡片正面给出题面，先在心里默想答案
3. 点「翻面 · 看答案」（或按 `空格`）揭晓
4. 自评 **正确** / **错误**（键盘 `→` / `←`）

一次练习内，判「错误」的词会排进下一巡，直到本次抽中的词全部答对为止。

## 三种形式

| 形式 | 正面 | 背面 | 场景 |
| --- | --- | --- | --- |
| 仮名 → 漢字 | 假名 | 汉字 + 释义 | 写作 |
| 漢字 → 読み | 汉字 | 假名 + 释义 | 阅读 |
| 聞いて答える | 只有声音 | 假名 + 汉字 + 释义 | 听力 |

**三种形式的熟练度各记一套** —— 看假名能写出汉字，不代表听到声音能反应过来。
単語台帳里三列并排，弱项一眼看得出。

「漢字 → 読み」不收片假名外来语（サークル、メリット…），正反面是同一串字，考它没意义。

## 朗读与音高重音

单词和例句的音频**预先用 [VOICEVOX](https://github.com/VOICEVOX/voicevox_engine) 生成好**，
当静态资源发出去（132 条，共 2.3 MB）。词库是固定的小集合，没必要为它常驻一个合成服务：

| | 常驻 TTS 服务 | 预生成（本项目） |
| --- | --- | --- |
| 服务器 | 要一台扛得住的 | 不用 |
| HTTPS / 混合内容 | 要配证书 | 没这问题 |
| 接口被白嫖 | 要加鉴权 | 没接口 |
| 播放延迟 | 每次合成等 0.5–2 秒 | 瞬时 |
| 离线 | 不可用 | 可用 |
| 跨设备音质 | 一致 | 一致 |

音色是 **No.7 アナウンス**（speaker 30）—— VOICEVOX 里的中性播音腔，不是角色声。

VOICEVOX 的合成管线显式建模日语音高重音（`yukarin_sa` 阶段逐 mora 预测 f0），
所以顺手把每个词的重音数据也烤进了 `src/data/accents.json`，翻面时画成曲线：
高音的拍在上沿、低音在下沿，降核处下折，和辞典记号一致，并标出平板型／頭高型／尾高型／中高型。

还有一点值得记：**喂给合成器的是汉字表记，不是假名。** 日语 TTS 靠汉字查词典才拿得到
正确的音调；给它一串纯平假名，它既分不了词也查不到 accent —— 「こうじょう」它分不清
是「向上」还是「工場」。

### 重新生成音频

加了新词单之后跑一次（需要 Docker 与 ffmpeg）：

```bash
docker run -d --name voicevox -p 50021:50021 \
  voicevox/voicevox_engine:cpu-arm64-latest    # Intel 机器去掉 -arm64
npm run voices
docker rm -f voicevox
```

脚本只合成新增的文本，已有的音频复用，删掉的词条留下的孤儿文件会被清理。
换音色用 `VOICEVOX_SPEAKER=31 npm run voices`（31 是 No.7 読み聞かせ）。

### 退路：系统语音

没有预生成音频的文本（比如刚加完词单还没跑脚本）自动退回浏览器自带的 Web Speech API。
这条通路的音色分级与黑名单取自 [readium/speech](https://github.com/readium/speech)，
内联在 `src/lib/voiceQuality.ts`：

| 档位 | 音色 | 哪里有 |
| --- | --- | --- |
| 最高音質 | Microsoft Nanami / Keita Online (Natural) | Edge |
| 高音質 | Hattori（Siri premium，需下载） | macOS / iOS |
| 高音質 | Google 日本語 | Chrome 桌面版预装 |
| 標準 | Microsoft Ayumi / Haruka / Ichiro | Windows |
| 簡易 | Kyoko / Otoya / O-Ren | macOS / iOS 预装 |

Grandma、Rocko、Eddy 这类玩具音色（Readium 归类为 novelty 与 veryLowQuality）会被滤掉。

## 数据存在哪

**本机**（localStorage，始终写）：

- `kana-drill:archive:v3` —— 长期档案，键是 `deckId:wordId@mode`
- `kana-drill:theme` / `kana-drill:voice` —— 主题与音色偏好

**云端**（Upstash Redis，经 `/api/archive` 读写）：整站开了 Vercel Authentication，
能走到这个接口的请求都已通过身份校验，所以只存一份档案，不分用户。

同步策略：打开时先用本机档案立刻开张，再拉云端**按条合并** —— 同一条成绩取
判定时刻更新的那个，所以手机练一半、电脑接着练不会互相覆盖整份。判定后防抖推送。
云端不可用时（没配数据库、断网）自动退回只用本机，界面上会如实显示状态，不挡着背单词。

单次练习的进度不落盘（关掉就重来）。「単語台帳」可以一键复制成 Markdown 表格，贴回 Notion 备份。
首页底部的「清空档案」会抹掉全部熟练度，需要二次确认。

### 环境变量

`api/archive.ts` 需要 Upstash Redis 的连接信息，由 Vercel 的 Upstash 集成自动注入：

```
KV_REST_API_URL      （或 UPSTASH_REDIS_REST_URL）
KV_REST_API_TOKEN    （或 UPSTASH_REDIS_REST_TOKEN）
```

没配也能跑，接口返回 503，前端退回本机存储。本地开发用 `vercel dev` 才会跑 `api/`；
`vite dev` / `vite preview` 下 `/api/archive` 是 404，同样走降级。

## 本地开发

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # 类型检查 + 产出 dist/
npm run preview    # 预览构建产物
```

## 部署

已经连上 Vercel，**推到 `main` 就会自动部署**到上面那个地址。

要手动发一次（比如没推 git 就想上线）：

```bash
vercel --prod --scope xeonices-projects
```

`--scope` 不能省 —— 非交互模式下不带它会报 `missing_scope`。

## 技术栈

React 18 + TypeScript + Vite。没有后端、没有账号、没有第三方追踪；只有 Google Fonts 的两款字体（Shippori Mincho / Zen Kaku Gothic New）走外部请求。

```
src/
  data/decks/day3.ts   词单（一天一个文件）
  data/index.ts        词单注册表 + 摊平成词池
  lib/archive.ts       Leitner 等级、到期计算、跨设备合并、v1/v2 存档迁移
  lib/session.ts       今日抽词（buildPlan）、模式过滤、跨词单去重
  lib/tts.ts           朗读：预生成音频优先，系统语音兜底
  lib/speech.ts        系统语音与音色挑选
  lib/voiceQuality.ts  音色分级表（取自 readium/speech）
  lib/cloud.ts         云端档案的读写
  data/accents.json    每个词的音高重音数据（VOICEVOX 生成）
  hooks/useDrill.ts    长期档案 + 单次练习两层状态
  components/          StartPanel / WordCard / ProgressBoard / DoneCard / Ledger / Toolbar
  components/PitchCurve.tsx   音高重音曲线
api/archive.ts         读写 Upstash Redis 的 Serverless Function
scripts/generate-voices.mjs  用 VOICEVOX 烤音频与音高数据
public/audio/          预生成的音频（132 条 / 2.3 MB）
```
