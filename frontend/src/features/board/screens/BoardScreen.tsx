import { useMemo, useState } from "react";
import type { LocalBankCard, LocalPlayerState, LocalPropertySet } from "../model/localPlayer";
import { BoardShell } from "../components/BoardShell";
import {
  type OpponentDetail,
  type OpponentSummary,
  toOpponentSummary,
} from "../../opponents/model/opponentExpansion";
import type { BoardBlockingState } from "../model/blocking-overlays";

const opponents: OpponentDetail[] = [
  {
    id: "sam",
    name: "Sam",
    avatarInitial: "S",
    avatarTone: "sky",
    handCount: 8,
    bankTotal: "$5M",
    properties: [
      { id: "sam-brown", color: "brown", count: 2, targetSize: 2, isComplete: true },
      { id: "sam-light-blue", color: "light-blue", count: 2, targetSize: 3 },
    ],
    propertySets: [
      {
        id: "sam-brown-set",
        name: "Brown",
        color: "brown",
        targetSize: 2,
        cards: [
          { id: "sam-brown-1", kind: "property", catalogCardId: "property-brown" },
          { id: "sam-brown-2", kind: "property", catalogCardId: "property-brown" },
        ],
      },
      {
        id: "sam-light-blue-set",
        name: "Light Blue",
        color: "light-blue",
        targetSize: 3,
        cards: [
          { id: "sam-light-blue-1", kind: "property", catalogCardId: "property-light-blue" },
          { id: "sam-light-blue-2", kind: "property", catalogCardId: "property-light-blue" },
        ],
      },
    ],
    moneyCards: [
      { id: "sam-money-1", label: "Money", amount: "1", tone: "sand", catalogCardId: "money-1" },
      { id: "sam-money-2", label: "Money", amount: "2", tone: "sky", catalogCardId: "money-2" },
      { id: "sam-money-3", label: "Rent", amount: "3", tone: "sage", catalogCardId: "rent-wild" },
    ],
  },
  {
    id: "emily",
    name: "Emily",
    avatarInitial: "E",
    avatarTone: "rose",
    handCount: 3,
    bankTotal: "$5M",
    isCurrentPlayer: true,
    properties: [
      { id: "emily-green", color: "green", count: 2, targetSize: 3 },
      { id: "emily-red", color: "red", count: 3, targetSize: 3, isComplete: true },
      { id: "emily-yellow", color: "yellow", count: 2, targetSize: 3 },
    ],
    propertySets: [
      {
        id: "emily-brown-set",
        name: "Brown",
        color: "brown",
        targetSize: 2,
        cards: [
          { id: "emily-brown-1", kind: "property", catalogCardId: "property-brown" },
          { id: "emily-brown-2", kind: "property", catalogCardId: "property-brown" },
        ],
      },
      {
        id: "emily-light-blue-set",
        name: "Light Blue",
        color: "light-blue",
        targetSize: 3,
        cards: [
          { id: "emily-light-blue-1", kind: "property", catalogCardId: "property-light-blue" },
          { id: "emily-light-blue-2", kind: "property", catalogCardId: "property-light-blue" },
          { id: "emily-light-blue-3", kind: "property", catalogCardId: "property-light-blue" },
        ],
        buildings: ["House"],
      },
      {
        id: "emily-green-set",
        name: "Green",
        color: "green",
        targetSize: 3,
        cards: [
          { id: "emily-green-1", kind: "property", catalogCardId: "property-green" },
          { id: "emily-green-2", kind: "property", catalogCardId: "property-green" },
          { id: "emily-green-3", kind: "property", catalogCardId: "property-green" },
        ],
        buildings: ["House"],
      },
      {
        id: "emily-yellow-set",
        name: "Yellow",
        color: "yellow",
        targetSize: 3,
        cards: [
          { id: "emily-yellow-1", kind: "property", catalogCardId: "property-yellow" },
          { id: "emily-yellow-2", kind: "property", catalogCardId: "property-yellow" },
          { id: "emily-yellow-3", kind: "property", catalogCardId: "property-yellow" },
        ],
        buildings: ["House"],
      },
      {
        id: "emily-red-set",
        name: "Red",
        color: "red",
        targetSize: 3,
        cards: [
          { id: "emily-red-1", kind: "property", catalogCardId: "property-red" },
          { id: "emily-red-2", kind: "property", catalogCardId: "property-red" },
        ],
      },
    ],
    moneyCards: [
      { id: "emily-money-1", label: "Money", amount: "1", tone: "sand", catalogCardId: "money-1" },
      { id: "emily-money-2", label: "Money", amount: "2", tone: "sky", catalogCardId: "money-2" },
      { id: "emily-money-3", label: "Rent", amount: "3", tone: "sage", catalogCardId: "rent-wild" },
    ],
  },
  {
    id: "max",
    name: "Max",
    avatarInitial: "M",
    avatarTone: "gold",
    handCount: 8,
    bankTotal: "$5M",
    properties: [
      { id: "max-purple", color: "purple", count: 1, targetSize: 3 },
      { id: "max-orange", color: "orange", count: 2, targetSize: 3 },
      { id: "max-blue", color: "blue", count: 2, targetSize: 2, isComplete: true },
      { id: "max-red", color: "red", count: 3, targetSize: 3, isComplete: true },
    ],
    propertySets: [
      {
        id: "max-purple-set",
        name: "Purple",
        color: "purple",
        targetSize: 3,
        cards: [{ id: "max-purple-1", kind: "property", catalogCardId: "property-pink" }],
      },
      {
        id: "max-orange-set",
        name: "Orange",
        color: "orange",
        targetSize: 3,
        cards: [
          { id: "max-orange-1", kind: "property", catalogCardId: "property-orange" },
          { id: "max-orange-2", kind: "property", catalogCardId: "property-orange" },
        ],
      },
      {
        id: "max-blue-set",
        name: "Dark Blue",
        color: "blue",
        targetSize: 2,
        cards: [
          { id: "max-blue-1", kind: "property", catalogCardId: "property-dark-blue" },
          { id: "max-blue-2", kind: "property", catalogCardId: "property-dark-blue" },
        ],
      },
      {
        id: "max-red-set",
        name: "Red",
        color: "red",
        targetSize: 3,
        cards: [
          { id: "max-red-1", kind: "property", catalogCardId: "property-red" },
          { id: "max-red-2", kind: "property", catalogCardId: "property-red" },
          { id: "max-red-3", kind: "property", catalogCardId: "property-red" },
        ],
        buildings: ["House", "Hotel"],
      },
    ],
    moneyCards: [
      { id: "max-money-1", label: "Money", amount: "1", tone: "sand", catalogCardId: "money-1" },
      { id: "max-money-2", label: "Money", amount: "2", tone: "sky", catalogCardId: "money-2" },
      { id: "max-money-3", label: "Rent", amount: "3", tone: "sage", catalogCardId: "rent-wild" },
    ],
  },
];

const propertySets: LocalPropertySet[] = [
  {
    id: "brown-set",
    name: "Brown",
    color: "brown",
    count: 2,
    isComplete: true,
    targetSize: 2,
    cards: [
      { id: "brown-1", kind: "property", catalogCardId: "property-brown" },
      { id: "brown-2", kind: "property", catalogCardId: "property-brown" },
    ],
    buildings: ["House"],
  },
  {
    id: "light-blue-set",
    name: "Light Blue",
    color: "light-blue",
    count: 3,
    isComplete: true,
    targetSize: 3,
    cards: [
      { id: "light-blue-1", kind: "property", catalogCardId: "property-light-blue" },
      { id: "light-blue-2", kind: "property", catalogCardId: "property-light-blue" },
      { id: "light-blue-3", kind: "property", catalogCardId: "property-light-blue" },
    ],
  },
  {
    id: "green-set",
    name: "Green",
    color: "green",
    count: 2,
    targetSize: 3,
    cards: [
      { id: "green-1", kind: "property", catalogCardId: "property-green" },
      { id: "green-2", kind: "wild", catalogCardId: "wild-green-darkblue" },
    ],
  },
  {
    id: "red-set",
    name: "Red",
    color: "red",
    count: 2,
    targetSize: 3,
    cards: [
      { id: "red-1", kind: "property", catalogCardId: "property-red" },
      { id: "red-2", kind: "property", catalogCardId: "property-red" },
    ],
  },
];

const bankCards: LocalBankCard[] = [
  { id: "bank-1", label: "Money", amount: "1", tone: "sand", catalogCardId: "money-1" },
  { id: "bank-2", label: "Money", amount: "2", tone: "sky", catalogCardId: "money-2" },
  { id: "bank-3", label: "Rent", amount: "3", tone: "sage", catalogCardId: "rent-wild" },
  { id: "bank-4", label: "Money", amount: "1", tone: "paper", catalogCardId: "money-1" },
];

const localPlayerTemplate: LocalPlayerState = {
  name: "Player",
  isCurrentTurn: true,
  handCount: 6,
  bankTotal: "$7M",
  handCards: [
    { id: "hand-deal-breaker", label: "Deal Breaker", catalogCardId: "action-deal-breaker" },
    { id: "hand-just-say-no", label: "Just Say No!", catalogCardId: "action-just-say-no" },
    { id: "hand-brown-property", label: "Brown Property", catalogCardId: "property-brown" },
    { id: "hand-light-blue-property", label: "Light Blue Property", catalogCardId: "property-light-blue" },
    { id: "hand-rent", label: "Rent", catalogCardId: "rent-wild" },
    { id: "hand-wild", label: "Wild", catalogCardId: "wild-any" },
  ],
  propertySets,
  bankCards,
};

const opponentSummaries: OpponentSummary[] = opponents.map(toOpponentSummary);

export function BoardScreen() {
  const [isCurrentTurn, setIsCurrentTurn] = useState(localPlayerTemplate.isCurrentTurn);
  const blockingState: BoardBlockingState | null = null;
  const localPlayer = useMemo(
    () => ({
      ...localPlayerTemplate,
      isCurrentTurn,
    }),
    [isCurrentTurn],
  );

  return (
    <BoardShell
      roundLabel="Round 5 / 12"
      actionsLeft={2}
      opponentSummaries={opponentSummaries}
      opponentDetails={opponents}
      localPlayer={localPlayer}
      blockingState={blockingState}
      onConfirmEndTurn={() => {
        setIsCurrentTurn(false);
      }}
    />
  );
}
