type Props = {
  total: number;
  rounds: number;
  missedCount: number;
  onRetryWrong: () => void;
  onResetAll: () => void;
};

export function DoneCard({ total, rounds, missedCount, onRetryWrong, onResetAll }: Props) {
  return (
    <div className="card">
      <div className="done">
        <div className="seal">全巡了</div>
        <p>
          {total} 個の単語、すべて正解になりました。
          <br />
          共 {rounds} 巡
          {missedCount > 0
            ? `，其中 ${missedCount} 个词曾经想不起来 —— 錯題帳里留着。`
            : "，一次都没错。"}
        </p>
        <div className="actions actions-done">
          {missedCount > 0 && (
            <button type="button" onClick={onRetryWrong}>
              再来一巡（只练错过的）
            </button>
          )}
          <button type="button" onClick={onResetAll}>
            从头再来
          </button>
        </div>
      </div>
    </div>
  );
}
