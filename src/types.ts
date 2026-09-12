/** 一个待掌握的单词。id 在牌组内稳定不变。 */
export type Word = {
  id: number;
  /** 卡片正面唯一展示的内容 */
  kana: string;
  /** 片假名外来语时与 kana 相同，此时卡片不重复展示 */
  kanji: string;
  /** 中文释义 */
  gloss: string;
  /** 例句，可能为空 */
  example: string;
};

/** 一天的词单。id 是长期档案的键的一部分，注册后不要再改。 */
export type Deck = {
  id: string;
  /** 界面上的短标签，如「Day 3」 */
  label: string;
  words: Word[];
};

/** 一个词在全部牌组里的唯一身份，供练习和档案使用。 */
export type Card = Word & {
  /** `${deckId}:${word.id}`，长期档案的键 */
  key: string;
  deckId: string;
  deckLabel: string;
};

/** 熟练度等级：1 最生，5 已定着。 */
export type Box = 1 | 2 | 3 | 4 | 5;

/**
 * 练习模式。同一个词在三种模式下各记一套熟练度 ——
 * 看着假名能写出汉字，不代表听到声音能反应过来。
 * - kana  仮名 → 漢字・釈義（写作场景）
 * - kanji 漢字 → 読み・釈義（阅读场景）
 * - audio 聞く → 仮名・漢字・釈義（听力场景）
 */
export type Mode = "kana" | "kanji" | "audio";

/** 一个词在一种模式下的长期成绩，跨天累积，不随单次练习清空。 */
export type WordStat = {
  box: Box;
  /** 累计答错次数 */
  wrong: number;
  /** 累计答对次数 */
  right: number;
  /** 上次判定的日期（YYYY-MM-DD） */
  lastSeen: string;
  /** 下次该复习的日期（YYYY-MM-DD） */
  dueOn: string;
  /** 上次判定的时刻（ISO），多设备合并时比这个 */
  updatedAt: string;
};

/**
 * 长期档案：所有练过的「词 × 模式」的成绩单。
 * 键是 `${deckId}:${wordId}@${mode}`，见 statKey()。
 */
export type Archive = {
  version: 3;
  stats: Record<string, WordStat>;
  updatedAt: string;
};

/** 一个词在本次练习里的来源，用于开始面板的分组说明。 */
export type Origin = "new" | "review" | "check";

/** 一次练习：从档案里抽出来的一批词 + 当前进度。练完即弃。 */
export type Session = {
  /** 这次练的是哪种模式 */
  mode: Mode;
  /** 抽中的词，按 key 记录来源 */
  origins: Record<string, Origin>;
  /** 本巡的出题顺序（存 card.key） */
  order: string[];
  /** 本巡已经判过的词数 */
  cursor: number;
  /** 第几巡 */
  round: number;
  /** key -> 是否已在本巡答对 */
  mastered: Record<string, boolean>;
  /** key -> 本次练习内答错次数（只影响本次，不是长期累计） */
  missed: Record<string, number>;
  /** 已经写进长期档案的词，保证一次练习只升降一级 */
  graded: Record<string, true>;
};
