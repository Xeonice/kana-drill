type Props = {
  title: string;
  subtitle: string;
  round: number;
  remaining: number;
  finished: boolean;
};

export function Masthead({ title, subtitle, round, remaining, finished }: Props) {
  return (
    <header className="masthead">
      <div>
        <h1>{title}</h1>
        <div className="sub">{subtitle}</div>
      </div>
      <div className="roundtag">
        {finished ? "全巡了" : `第 ${round} 巡 · 残り ${remaining}`}
      </div>
    </header>
  );
}
