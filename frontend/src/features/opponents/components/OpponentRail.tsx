import { OpponentSummaryCard } from "./OpponentSummaryCard";
import type { OpponentSummary } from "../model/opponentExpansion";

type OpponentRailProps = {
  opponents: OpponentSummary[];
  onOpen?: (opponentId: string) => void;
};

export function OpponentRail({ opponents, onOpen }: OpponentRailProps) {
  return (
    <section className="opponent-rail" aria-label="Opponents">
      {opponents.map((opponent) => (
        <OpponentSummaryCard key={opponent.id} opponent={opponent} onOpen={onOpen} />
      ))}
    </section>
  );
}
