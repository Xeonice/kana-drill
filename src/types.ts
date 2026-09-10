/** 一个待掌握的单词。id 稳定不变，用作进度记录的键。 */
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

/** 一份牌组的元信息 */
export type Deck = {
  id: string;
  title: string;
  subtitle: string;
  words: Word[];
};

/** 存在 localStorage 里的学习进度 */
export type Progress = {
  /** 数据结构版本，用于将来迁移 */
  version: 1;
  deckId: string;
  /** 本巡的出题顺序（存 word.id） */
  order: number[];
  /** 本巡已经判过的词数 */
  cursor: number;
  /** 第几巡 */
  round: number;
  /** word.id -> 累计答错次数 */
  wrong: Record<number, number>;
  /** word.id -> 是否已在本巡答对 */
  mastered: Record<number, boolean>;
  updatedAt: string;
};
