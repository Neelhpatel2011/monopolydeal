import type { LocalBankCard, LocalPlayerState, LocalPropertySet } from "../model/localPlayer";
import { BoardShell } from "../components/BoardShell";
import {
  type OpponentDetail,
  type OpponentSummary,
  toOpponentSummary,
} from "../../opponents/model/opponentExpansion";

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
          { id: "sam-brown-1", kind: "property" },
          { id: "sam-brown-2", kind: "property" },
        ],
      },
      {
        id: "sam-light-blue-set",
        name: "Light Blue",
        color: "light-blue",
        targetSize: 3,
        cards: [
          { id: "sam-light-blue-1", kind: "property" },
          { id: "sam-light-blue-2", kind: "property" },
        ],
      },
    ],
    moneyCards: [
      { id: "sam-money-1", label: "Money", amount: "1", tone: "sand" },
      { id: "sam-money-2", label: "Money", amount: "2", tone: "sky" },
      { id: "sam-money-3", label: "Rent", amount: "3", tone: "sage" },
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
          { id: "emily-brown-1", kind: "property" },
          { id: "emily-brown-2", kind: "property" },
        ],
      },
      {
        id: "emily-light-blue-set",
        name: "Light Blue",
        color: "light-blue",
        targetSize: 3,
        cards: [
          { id: "emily-light-blue-1", kind: "property" },
          { id: "emily-light-blue-2", kind: "property" },
          { id: "emily-light-blue-3", kind: "property" },
        ],
        buildings: ["House"],
      },
      {
        id: "emily-green-set",
        name: "Green",
        color: "green",
        targetSize: 3,
        cards: [
          { id: "emily-green-1", kind: "property" },
          { id: "emily-green-2", kind: "property" },
          { id: "emily-green-3", kind: "property" },
        ],
        buildings: ["House"],
      },
      {
        id: "emily-yellow-set",
        name: "Yellow",
        color: "yellow",
        targetSize: 3,
        cards: [
          { id: "emily-yellow-1", kind: "property" },
          { id: "emily-yellow-2", kind: "property" },
          { id: "emily-yellow-3", kind: "property" },
        ],
        buildings: ["House"],
      },
      {
        id: "emily-red-set",
        name: "Red",
        color: "red",
        targetSize: 3,
        cards: [
          { id: "emily-red-1", kind: "property" },
          { id: "emily-red-2", kind: "property" },
        ],
      },
    ],
    moneyCards: [
      { id: "emily-money-1", label: "Money", amount: "1", tone: "sand" },
      { id: "emily-money-2", label: "Money", amount: "2", tone: "sky" },
      { id: "emily-money-3", label: "Rent", amount: "3", tone: "sage" },
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
        cards: [{ id: "max-purple-1", kind: "property" }],
      },
      {
        id: "max-orange-set",
        name: "Orange",
        color: "orange",
        targetSize: 3,
        cards: [
          { id: "max-orange-1", kind: "property" },
          { id: "max-orange-2", kind: "property" },
        ],
      },
      {
        id: "max-blue-set",
        name: "Dark Blue",
        color: "blue",
        targetSize: 2,
        cards: [
          { id: "max-blue-1", kind: "property" },
          { id: "max-blue-2", kind: "property" },
        ],
      },
      {
        id: "max-red-set",
        name: "Red",
        color: "red",
        targetSize: 3,
        cards: [
          { id: "max-red-1", kind: "property" },
          { id: "max-red-2", kind: "property" },
          { id: "max-red-3", kind: "property" },
        ],
        buildings: ["House", "Hotel"],
      },
    ],
    moneyCards: [
      { id: "max-money-1", label: "Money", amount: "1", tone: "sand" },
      { id: "max-money-2", label: "Money", amount: "2", tone: "sky" },
      { id: "max-money-3", label: "Rent", amount: "3", tone: "sage" },
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
      { id: "brown-1", kind: "property" },
      { id: "brown-2", kind: "property" },
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
      { id: "light-blue-1", kind: "property" },
      { id: "light-blue-2", kind: "property" },
      { id: "light-blue-3", kind: "property" },
    ],
  },
  {
    id: "green-set",
    name: "Green",
    color: "green",
    count: 2,
    targetSize: 3,
    cards: [
      { id: "green-1", kind: "property" },
      { id: "green-2", kind: "wild" },
    ],
  },
  {
    id: "red-set",
    name: "Red",
    color: "red",
    count: 2,
    targetSize: 3,
    cards: [
      { id: "red-1", kind: "property" },
      { id: "red-2", kind: "property" },
    ],
  },
];

const bankCards: LocalBankCard[] = [
  { id: "bank-1", label: "Money", amount: "1", tone: "sand" },
  { id: "bank-2", label: "Money", amount: "2", tone: "sky" },
  { id: "bank-3", label: "Rent", amount: "3", tone: "sage" },
  { id: "bank-4", label: "Money", amount: "1", tone: "paper" },
];

const localPlayer: LocalPlayerState = {
  name: "Player",
  isCurrentTurn: true,
  handCount: 6,
  bankTotal: "$7M",
  handCards: [
    { id: "hand-deal-breaker", label: "Deal Breaker" },
    { id: "hand-just-say-no", label: "Just Say No!" },
    { id: "hand-brown-property", label: "Brown Property" },
    { id: "hand-light-blue-property", label: "Light Blue Property" },
    { id: "hand-rent", label: "Rent" },
    { id: "hand-wild", label: "Wild" },
  ],
  propertySets,
  bankCards,
};

const opponentSummaries: OpponentSummary[] = opponents.map(toOpponentSummary);

export function BoardScreen() {
  return (
    <BoardShell
      roundLabel="Round 5 / 12"
      actionsLeft={2}
      opponentSummaries={opponentSummaries}
      opponentDetails={opponents}
      localPlayer={localPlayer}
    />
  );
}
