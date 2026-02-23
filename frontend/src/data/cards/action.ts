import { Card } from "@/types/card";

export const actionCards: Card[] = [
  {
    id: "action_deal_breaker",
    name: "Deal Breaker",
    category: "action",
    bankValue: 5,
    copies: 2,
    description: "Steal a full set of properties from another player.",
    description2: "(Includes buildings.)",
    effect: [
      {
        type: "stealFullSet",
        target: "opponent",
        includesBuildings: true
      }
    ],
    color: "bg-purple-200",
    lighterColor: "bg-purple-100"
  },
  {
    id: "action_debt_collector",
    name: "Debt Collector",
    category: "action",
    bankValue: 3,
    copies: 3,
    description: "Force one player to pay you 5M.",
    effect: [
      {
        type: "chargePlayer",
        target: "one_player",
        value: 5
      }
    ],
    color: "bg-emerald-100",
    lighterColor: "bg-emerald-50"
  },
  {
    id: "action_double_the_rent",
    name: "Double The Rent!",
    category: "action",
    bankValue: 1,
    copies: 2,
    description: "Needs to be played with a rent card.",
    effect: [
      {
        type: "modifier",
        target: "rent",
        value: 2
      }
    ],
    color: "bg-amber-100",
    lighterColor: "bg-amber-50"
  },
  {
    id: "action_forced_deal",
    name: "Forced Deal",
    category: "action",
    bankValue: 3,
    copies: 3,
    description: "Swap one of your properties with another player.",
    description2: "(Cannot be part of a full set.)",
    effect: [
      {
        type: "swapProperty",
        target: "opponent",
        value: 1
      }
    ],
    color: "bg-stone-300",
    lighterColor: "bg-stone-200"
  },
  {
    id: "action_hotel",
    name: "Hotel",
    category: "action",
    bankValue: 4,
    copies: 2,
    description: "Add a hotel to a full set with a house.",
    effect: [
      {
        type: "building",
        building: "hotel",
        rentBonus: 4,
        requiresFullSet: true,
        requiresHouse: true
      }
    ],
    color: "bg-blue-200",
    lighterColor: "bg-blue-100"
  },
  {
    id: "action_house",
    name: "House",
    category: "action",
    bankValue: 3,
    copies: 3,
    description: "Add a house to a full set.",
    effect: [
      {
        type: "building",
        building: "house",
        rentBonus: 1,
        requiresFullSet: true,
        requiresHouse: false
      }
    ],
    color: "bg-amber-200",
    lighterColor: "bg-amber-100"
  },
  {
    id: "action_its_my_birthday",
    name: "It's My Birthday",
    category: "action",
    bankValue: 2,
    copies: 3,
    description: "All other players pay you $2M.",
    effect: [
      {
        type: "chargePlayers",
        target: "all_others",
        value: 2
      }
    ],
    color: "bg-pink-200",
    lighterColor: "bg-pink-100"
  },
  {
    id: "action_just_say_no",
    name: "Just Say No!",
    category: "action",
    bankValue: 4,
    copies: 3,
    description: "Cancel any action played against you.",
    effect: [
      {
        type: "counterAction"
      }
    ],
    color: "bg-cyan-200",
    lighterColor: "bg-cyan-100"
  },
  {
    id: "action_pass_go",
    name: "Pass Go",
    category: "action",
    bankValue: 1,
    copies: 10,
    description: "Draw 2 cards.",
    effect: [
      {
        type: "drawCards",
        value: 2
      }
    ],
    color: "bg-amber-100",
    lighterColor: "bg-amber-50"
  },
  {
    id: "action_sly_deal",
    name: "Sly Deal",
    category: "action",
    bankValue: 3,
    copies: 3,
    description: "Steal a property from another player.",
    description2: "(Cannot be part of a full set.)",
    effect: [
      {
        type: "stealProperty",
        target: "opponent",
        value: 1
      }
    ],
    color: "bg-slate-300",
    lighterColor: "bg-slate-200"
  }
];