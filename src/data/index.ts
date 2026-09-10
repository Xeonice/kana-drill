import type { Card, Deck } from "../types";
import { day3 } from "./decks/day3";

/**
 * 全部词单。新增一天：在 decks/ 下加一个文件，然后挂到这个数组末尾。
 * deck.id 是长期档案的键的一部分，注册之后不要再改，否则历史成绩会对不上。
 */
export const DECKS: Deck[] = [day3];

export function cardKey(deckId: string, wordId: number): string {
  return `${deckId}:${wordId}`;
}

function toCards(deck: Deck): Card[] {
  return deck.words.map((w) => ({
    ...w,
    key: cardKey(deck.id, w.id),
    deckId: deck.id,
    deckLabel: deck.label,
  }));
}

/** 所有牌组的词，摊平成一个池子。 */
export const ALL_CARDS: Card[] = DECKS.flatMap(toCards);

export const CARD_BY_KEY: Map<string, Card> = new Map(
  ALL_CARDS.map((c) => [c.key, c]),
);

export function cardsOfDecks(deckIds: string[]): Card[] {
  const wanted = new Set(deckIds);
  return ALL_CARDS.filter((c) => wanted.has(c.deckId));
}
