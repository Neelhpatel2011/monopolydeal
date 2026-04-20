import { OpponentSummaryCard } from "./OpponentSummaryCard";
import type { OpponentSummary } from "../model/opponentExpansion";

type OpponentRailProps = {
  opponents: OpponentSummary[];
  onOpen?: (opponentId: string) => void;
  browseSuppressed?: boolean;
  targetableOpponentIds?: string[];
  invalidOpponentId?: string | null;
  previewedOpponentId?: string | null;
};

export function OpponentRail({
  opponents,
  onOpen,
  browseSuppressed = false,
  targetableOpponentIds = [],
  invalidOpponentId = null,
  previewedOpponentId = null,
}: OpponentRailProps) {
  const targetableOpponentIdSet = new Set(targetableOpponentIds);

  return (
    <section className="opponent-rail" aria-label="Opponents">
      {opponents.map((opponent) => (
        <OpponentSummaryCard
          key={opponent.id}
          opponent={opponent}
          onOpen={onOpen}
          browseSuppressed={browseSuppressed}
          isTargetable={targetableOpponentIdSet.has(opponent.id)}
          isInvalid={invalidOpponentId === opponent.id}
          isPreviewed={previewedOpponentId === opponent.id}
        />
      ))}
    </section>
  );
}
