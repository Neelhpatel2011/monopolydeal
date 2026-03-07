/**
 * Complete card catalog mapping every backend card ID to its display data.
 * Card IDs must match the backend's card catalog exactly.
 */

export type CardKind = 'money' | 'property' | 'property_wild' | 'rent' | 'action'

export interface CatalogEntry {
  id: string
  name: string
  kind: CardKind
  bankValue: number
  /** Tailwind bg class for the card's primary color */
  color: string
  /** Tailwind bg class for a lighter tint (for card body/background) */
  lighterColor: string
  description?: string
  // Property / wild fields
  propertyGroup?: string
  setSize?: number
  rentByCount?: number[]
  wildColors?: string[]   // for property_wild cards
  // Rent card fields
  rentColors?: string[]   // colors this rent card can charge
  rentTarget?: 'one_player' | 'all_others'
}

// ─── Color helpers ────────────────────────────────────────────────────────────

/** Map backend property group name → Tailwind bg class */
export const groupColorMap: Record<string, { color: string; lighter: string; text: string }> = {
  brown:      { color: 'bg-amber-800',   lighter: 'bg-amber-100',   text: 'text-white' },
  light_blue: { color: 'bg-sky-400',     lighter: 'bg-sky-100',     text: 'text-black' },
  pink:       { color: 'bg-pink-400',    lighter: 'bg-pink-100',    text: 'text-white' },
  orange:     { color: 'bg-orange-500',  lighter: 'bg-orange-100',  text: 'text-white' },
  red:        { color: 'bg-red-500',     lighter: 'bg-red-100',     text: 'text-white' },
  yellow:     { color: 'bg-yellow-400',  lighter: 'bg-yellow-100',  text: 'text-black' },
  green:      { color: 'bg-green-600',   lighter: 'bg-green-100',   text: 'text-white' },
  dark_blue:  { color: 'bg-blue-800',    lighter: 'bg-blue-100',    text: 'text-white' },
  railroad:   { color: 'bg-gray-700',    lighter: 'bg-gray-100',    text: 'text-white' },
  utility:    { color: 'bg-lime-500',    lighter: 'bg-lime-100',    text: 'text-black' },
}

// ─── Money Cards ─────────────────────────────────────────────────────────────

const moneyCards: CatalogEntry[] = [
  { id: 'money_1m',  name: '$1M',  kind: 'money', bankValue: 1,  color: 'bg-amber-200',  lighterColor: 'bg-amber-50',   description: 'Play to your bank.' },
  { id: 'money_2m',  name: '$2M',  kind: 'money', bankValue: 2,  color: 'bg-pink-300',   lighterColor: 'bg-pink-100',   description: 'Play to your bank.' },
  { id: 'money_3m',  name: '$3M',  kind: 'money', bankValue: 3,  color: 'bg-amber-300',  lighterColor: 'bg-amber-100',  description: 'Play to your bank.' },
  { id: 'money_4m',  name: '$4M',  kind: 'money', bankValue: 4,  color: 'bg-blue-300',   lighterColor: 'bg-blue-100',   description: 'Play to your bank.' },
  { id: 'money_5m',  name: '$5M',  kind: 'money', bankValue: 5,  color: 'bg-purple-300', lighterColor: 'bg-purple-100', description: 'Play to your bank.' },
  { id: 'money_10m', name: '$10M', kind: 'money', bankValue: 10, color: 'bg-amber-400',  lighterColor: 'bg-amber-200',  description: 'Play to your bank.' },
]

// ─── Property Cards ───────────────────────────────────────────────────────────

const propertyCards: CatalogEntry[] = [
  // Brown (set size 2, rent [1,2])
  { id: 'prop_brown_mediterranean_avenue', name: 'Mediterranean Avenue', kind: 'property', bankValue: 1, color: 'bg-amber-800', lighterColor: 'bg-amber-100', propertyGroup: 'brown', setSize: 2, rentByCount: [1, 2] },
  { id: 'prop_brown_baltic_avenue',        name: 'Baltic Avenue',        kind: 'property', bankValue: 1, color: 'bg-amber-800', lighterColor: 'bg-amber-100', propertyGroup: 'brown', setSize: 2, rentByCount: [1, 2] },

  // Light Blue (set size 3, rent [1,2,3])
  { id: 'prop_light_blue_oriental_avenue',   name: 'Oriental Avenue',   kind: 'property', bankValue: 1, color: 'bg-sky-400', lighterColor: 'bg-sky-100', propertyGroup: 'light_blue', setSize: 3, rentByCount: [1, 2, 3] },
  { id: 'prop_light_blue_vermont_avenue',    name: 'Vermont Avenue',    kind: 'property', bankValue: 1, color: 'bg-sky-400', lighterColor: 'bg-sky-100', propertyGroup: 'light_blue', setSize: 3, rentByCount: [1, 2, 3] },
  { id: 'prop_light_blue_connecticut_avenue',name: 'Connecticut Avenue', kind: 'property', bankValue: 1, color: 'bg-sky-400', lighterColor: 'bg-sky-100', propertyGroup: 'light_blue', setSize: 3, rentByCount: [1, 2, 3] },

  // Pink (set size 3, rent [1,2,4])
  { id: 'prop_pink_st_charles_place', name: "St. Charles Place", kind: 'property', bankValue: 2, color: 'bg-pink-400', lighterColor: 'bg-pink-100', propertyGroup: 'pink', setSize: 3, rentByCount: [1, 2, 4] },
  { id: 'prop_pink_states_avenue',    name: 'States Avenue',    kind: 'property', bankValue: 2, color: 'bg-pink-400', lighterColor: 'bg-pink-100', propertyGroup: 'pink', setSize: 3, rentByCount: [1, 2, 4] },
  { id: 'prop_pink_virginia_avenue',  name: 'Virginia Avenue',  kind: 'property', bankValue: 2, color: 'bg-pink-400', lighterColor: 'bg-pink-100', propertyGroup: 'pink', setSize: 3, rentByCount: [1, 2, 4] },

  // Orange (set size 3, rent [1,3,5])
  { id: 'prop_orange_st_james_place',    name: 'St. James Place',   kind: 'property', bankValue: 2, color: 'bg-orange-500', lighterColor: 'bg-orange-100', propertyGroup: 'orange', setSize: 3, rentByCount: [1, 3, 5] },
  { id: 'prop_orange_tennessee_avenue',  name: 'Tennessee Avenue',  kind: 'property', bankValue: 2, color: 'bg-orange-500', lighterColor: 'bg-orange-100', propertyGroup: 'orange', setSize: 3, rentByCount: [1, 3, 5] },
  { id: 'prop_orange_new_york_avenue',   name: 'New York Avenue',   kind: 'property', bankValue: 2, color: 'bg-orange-500', lighterColor: 'bg-orange-100', propertyGroup: 'orange', setSize: 3, rentByCount: [1, 3, 5] },

  // Red (set size 3, rent [2,3,6])
  { id: 'prop_red_kentucky_avenue', name: 'Kentucky Avenue', kind: 'property', bankValue: 3, color: 'bg-red-500', lighterColor: 'bg-red-100', propertyGroup: 'red', setSize: 3, rentByCount: [2, 3, 6] },
  { id: 'prop_red_indiana_avenue',  name: 'Indiana Avenue',  kind: 'property', bankValue: 3, color: 'bg-red-500', lighterColor: 'bg-red-100', propertyGroup: 'red', setSize: 3, rentByCount: [2, 3, 6] },
  { id: 'prop_red_illinois_avenue', name: 'Illinois Avenue', kind: 'property', bankValue: 3, color: 'bg-red-500', lighterColor: 'bg-red-100', propertyGroup: 'red', setSize: 3, rentByCount: [2, 3, 6] },

  // Yellow (set size 3, rent [2,4,6])
  { id: 'prop_yellow_atlantic_avenue', name: 'Atlantic Avenue', kind: 'property', bankValue: 3, color: 'bg-yellow-400', lighterColor: 'bg-yellow-100', propertyGroup: 'yellow', setSize: 3, rentByCount: [2, 4, 6] },
  { id: 'prop_yellow_ventnor_avenue',  name: 'Ventnor Avenue',  kind: 'property', bankValue: 3, color: 'bg-yellow-400', lighterColor: 'bg-yellow-100', propertyGroup: 'yellow', setSize: 3, rentByCount: [2, 4, 6] },
  { id: 'prop_yellow_marvin_gardens',  name: 'Marvin Gardens',  kind: 'property', bankValue: 3, color: 'bg-yellow-400', lighterColor: 'bg-yellow-100', propertyGroup: 'yellow', setSize: 3, rentByCount: [2, 4, 6] },

  // Green (set size 3, rent [2,4,7])
  { id: 'prop_green_north_carolina_avenue', name: 'North Carolina Avenue', kind: 'property', bankValue: 4, color: 'bg-green-600', lighterColor: 'bg-green-100', propertyGroup: 'green', setSize: 3, rentByCount: [2, 4, 7] },
  { id: 'prop_green_pacific_avenue',        name: 'Pacific Avenue',        kind: 'property', bankValue: 4, color: 'bg-green-600', lighterColor: 'bg-green-100', propertyGroup: 'green', setSize: 3, rentByCount: [2, 4, 7] },
  { id: 'prop_green_pennsylvania_avenue',   name: 'Pennsylvania Avenue',   kind: 'property', bankValue: 4, color: 'bg-green-600', lighterColor: 'bg-green-100', propertyGroup: 'green', setSize: 3, rentByCount: [2, 4, 7] },

  // Dark Blue (set size 2, rent [3,8])
  { id: 'prop_dark_blue_park_place', name: 'Park Place', kind: 'property', bankValue: 4, color: 'bg-blue-800', lighterColor: 'bg-blue-100', propertyGroup: 'dark_blue', setSize: 2, rentByCount: [3, 8] },
  { id: 'prop_dark_blue_boardwalk',  name: 'Boardwalk',  kind: 'property', bankValue: 4, color: 'bg-blue-800', lighterColor: 'bg-blue-100', propertyGroup: 'dark_blue', setSize: 2, rentByCount: [3, 8] },

  // Railroad (set size 4, rent [1,2,3,4])
  { id: 'prop_railroad_reading_railroad',      name: 'Reading Railroad',      kind: 'property', bankValue: 2, color: 'bg-gray-700', lighterColor: 'bg-gray-100', propertyGroup: 'railroad', setSize: 4, rentByCount: [1, 2, 3, 4] },
  { id: 'prop_railroad_pennsylvania_railroad', name: 'Pennsylvania Railroad', kind: 'property', bankValue: 2, color: 'bg-gray-700', lighterColor: 'bg-gray-100', propertyGroup: 'railroad', setSize: 4, rentByCount: [1, 2, 3, 4] },
  { id: 'prop_railroad_b_and_o_railroad',      name: 'B. & O. Railroad',      kind: 'property', bankValue: 2, color: 'bg-gray-700', lighterColor: 'bg-gray-100', propertyGroup: 'railroad', setSize: 4, rentByCount: [1, 2, 3, 4] },
  { id: 'prop_railroad_short_line',            name: 'Short Line',            kind: 'property', bankValue: 2, color: 'bg-gray-700', lighterColor: 'bg-gray-100', propertyGroup: 'railroad', setSize: 4, rentByCount: [1, 2, 3, 4] },

  // Utility (set size 2, rent [1,2])
  { id: 'prop_utility_electric_company', name: 'Electric Company', kind: 'property', bankValue: 2, color: 'bg-lime-500', lighterColor: 'bg-lime-100', propertyGroup: 'utility', setSize: 2, rentByCount: [1, 2] },
  { id: 'prop_utility_water_works',      name: 'Water Works',      kind: 'property', bankValue: 2, color: 'bg-lime-500', lighterColor: 'bg-lime-100', propertyGroup: 'utility', setSize: 2, rentByCount: [1, 2] },
]

// ─── Wild Property Cards ─────────────────────────────────────────────────────

const wildPropertyCards: CatalogEntry[] = [
  { id: 'wild_light_blue_brown',   name: 'Wild: Light Blue / Brown',   kind: 'property_wild', bankValue: 1, color: 'bg-sky-400',    lighterColor: 'bg-sky-100',    description: 'Place as Light Blue or Brown.', wildColors: ['light_blue', 'brown'] },
  { id: 'wild_light_blue_railroad',name: 'Wild: Light Blue / Railroad', kind: 'property_wild', bankValue: 4, color: 'bg-sky-400',    lighterColor: 'bg-gray-100',   description: 'Place as Light Blue or Railroad.', wildColors: ['light_blue', 'railroad'] },
  { id: 'wild_pink_orange',        name: 'Wild: Pink / Orange',         kind: 'property_wild', bankValue: 2, color: 'bg-pink-400',   lighterColor: 'bg-orange-100', description: 'Place as Pink or Orange.', wildColors: ['pink', 'orange'] },
  { id: 'wild_pink_orange_2',      name: 'Wild: Pink / Orange',         kind: 'property_wild', bankValue: 2, color: 'bg-pink-400',   lighterColor: 'bg-orange-100', description: 'Place as Pink or Orange.', wildColors: ['pink', 'orange'] },
  { id: 'wild_red_yellow',         name: 'Wild: Red / Yellow',          kind: 'property_wild', bankValue: 3, color: 'bg-red-500',    lighterColor: 'bg-yellow-100', description: 'Place as Red or Yellow.', wildColors: ['red', 'yellow'] },
  { id: 'wild_red_yellow_2',       name: 'Wild: Red / Yellow',          kind: 'property_wild', bankValue: 3, color: 'bg-red-500',    lighterColor: 'bg-yellow-100', description: 'Place as Red or Yellow.', wildColors: ['red', 'yellow'] },
  { id: 'wild_dark_blue_green',    name: 'Wild: Dark Blue / Green',     kind: 'property_wild', bankValue: 4, color: 'bg-blue-800',   lighterColor: 'bg-green-100',  description: 'Place as Dark Blue or Green.', wildColors: ['dark_blue', 'green'] },
  { id: 'wild_green_railroad',     name: 'Wild: Green / Railroad',      kind: 'property_wild', bankValue: 4, color: 'bg-green-600',  lighterColor: 'bg-gray-100',   description: 'Place as Green or Railroad.', wildColors: ['green', 'railroad'] },
  { id: 'wild_railroad_utility',   name: 'Wild: Railroad / Utility',    kind: 'property_wild', bankValue: 2, color: 'bg-gray-700',   lighterColor: 'bg-lime-100',   description: 'Place as Railroad or Utility.', wildColors: ['railroad', 'utility'] },
  { id: 'wild_multicolor_any',     name: 'Wild: Any Color',             kind: 'property_wild', bankValue: 0, color: 'bg-gradient-to-br from-pink-400 to-blue-500', lighterColor: 'bg-white', description: 'Place as any color. Cannot complete a set alone.', wildColors: ['brown','light_blue','pink','orange','red','yellow','green','dark_blue','railroad','utility'] },
  { id: 'wild_multicolor_any_2',   name: 'Wild: Any Color',             kind: 'property_wild', bankValue: 0, color: 'bg-gradient-to-br from-pink-400 to-blue-500', lighterColor: 'bg-white', description: 'Place as any color. Cannot complete a set alone.', wildColors: ['brown','light_blue','pink','orange','red','yellow','green','dark_blue','railroad','utility'] },
]

// ─── Rent Cards ───────────────────────────────────────────────────────────────

const rentCards: CatalogEntry[] = [
  { id: 'rent_light_blue_brown',   name: 'Rent: Light Blue / Brown',     kind: 'rent', bankValue: 1, color: 'bg-sky-400',    lighterColor: 'bg-amber-100',  description: 'Charge all other players rent on your Light Blue or Brown properties.', rentColors: ['light_blue', 'brown'],  rentTarget: 'all_others' },
  { id: 'rent_light_blue_brown_2', name: 'Rent: Light Blue / Brown',     kind: 'rent', bankValue: 1, color: 'bg-sky-400',    lighterColor: 'bg-amber-100',  description: 'Charge all other players rent on your Light Blue or Brown properties.', rentColors: ['light_blue', 'brown'],  rentTarget: 'all_others' },
  { id: 'rent_pink_orange',        name: 'Rent: Pink / Orange',           kind: 'rent', bankValue: 1, color: 'bg-pink-400',   lighterColor: 'bg-orange-100', description: 'Charge all other players rent on your Pink or Orange properties.', rentColors: ['pink', 'orange'],       rentTarget: 'all_others' },
  { id: 'rent_pink_orange_2',      name: 'Rent: Pink / Orange',           kind: 'rent', bankValue: 1, color: 'bg-pink-400',   lighterColor: 'bg-orange-100', description: 'Charge all other players rent on your Pink or Orange properties.', rentColors: ['pink', 'orange'],       rentTarget: 'all_others' },
  { id: 'rent_red_yellow',         name: 'Rent: Red / Yellow',            kind: 'rent', bankValue: 1, color: 'bg-red-500',    lighterColor: 'bg-yellow-100', description: 'Charge all other players rent on your Red or Yellow properties.', rentColors: ['red', 'yellow'],        rentTarget: 'all_others' },
  { id: 'rent_red_yellow_2',       name: 'Rent: Red / Yellow',            kind: 'rent', bankValue: 1, color: 'bg-red-500',    lighterColor: 'bg-yellow-100', description: 'Charge all other players rent on your Red or Yellow properties.', rentColors: ['red', 'yellow'],        rentTarget: 'all_others' },
  { id: 'rent_dark_blue_green',    name: 'Rent: Dark Blue / Green',       kind: 'rent', bankValue: 1, color: 'bg-blue-800',   lighterColor: 'bg-green-100',  description: 'Charge all other players rent on your Dark Blue or Green properties.', rentColors: ['dark_blue', 'green'],  rentTarget: 'all_others' },
  { id: 'rent_dark_blue_green_2',  name: 'Rent: Dark Blue / Green',       kind: 'rent', bankValue: 1, color: 'bg-blue-800',   lighterColor: 'bg-green-100',  description: 'Charge all other players rent on your Dark Blue or Green properties.', rentColors: ['dark_blue', 'green'],  rentTarget: 'all_others' },
  { id: 'rent_railroad_utility',   name: 'Rent: Railroad / Utility',      kind: 'rent', bankValue: 1, color: 'bg-gray-700',   lighterColor: 'bg-lime-100',   description: 'Charge all other players rent on your Railroad or Utility properties.', rentColors: ['railroad', 'utility'], rentTarget: 'all_others' },
  { id: 'rent_railroad_utility_2', name: 'Rent: Railroad / Utility',      kind: 'rent', bankValue: 1, color: 'bg-gray-700',   lighterColor: 'bg-lime-100',   description: 'Charge all other players rent on your Railroad or Utility properties.', rentColors: ['railroad', 'utility'], rentTarget: 'all_others' },
  { id: 'multicolor_rent',         name: 'Multicolor Rent',               kind: 'rent', bankValue: 3, color: 'bg-purple-500', lighterColor: 'bg-purple-100', description: 'Choose ONE player to charge rent on any color you have.', rentColors: ['brown','light_blue','pink','orange','red','yellow','green','dark_blue','railroad','utility'], rentTarget: 'one_player' },
  { id: 'multicolor_rent_2',       name: 'Multicolor Rent',               kind: 'rent', bankValue: 3, color: 'bg-purple-500', lighterColor: 'bg-purple-100', description: 'Choose ONE player to charge rent on any color you have.', rentColors: ['brown','light_blue','pink','orange','red','yellow','green','dark_blue','railroad','utility'], rentTarget: 'one_player' },
  { id: 'multicolor_rent_3',       name: 'Multicolor Rent',               kind: 'rent', bankValue: 3, color: 'bg-purple-500', lighterColor: 'bg-purple-100', description: 'Choose ONE player to charge rent on any color you have.', rentColors: ['brown','light_blue','pink','orange','red','yellow','green','dark_blue','railroad','utility'], rentTarget: 'one_player' },
]

// ─── Action Cards ─────────────────────────────────────────────────────────────

const actionCards: CatalogEntry[] = [
  { id: 'action_deal_breaker',    name: 'Deal Breaker',      kind: 'action', bankValue: 5, color: 'bg-purple-700',  lighterColor: 'bg-purple-100',  description: 'Steal a complete property set (including buildings) from any player.' },
  { id: 'action_debt_collector',  name: 'Debt Collector',    kind: 'action', bankValue: 3, color: 'bg-emerald-600', lighterColor: 'bg-emerald-100', description: 'Force any one player to pay you $5M.' },
  { id: 'action_double_the_rent', name: 'Double The Rent!',  kind: 'action', bankValue: 1, color: 'bg-amber-600',   lighterColor: 'bg-amber-100',   description: 'Play with a Rent card to double the amount owed.' },
  { id: 'action_forced_deal',     name: 'Forced Deal',       kind: 'action', bankValue: 3, color: 'bg-stone-600',   lighterColor: 'bg-stone-100',   description: 'Swap one of your properties with one from any player (not from a full set).' },
  { id: 'action_hotel',           name: 'Hotel',             kind: 'action', bankValue: 4, color: 'bg-blue-700',    lighterColor: 'bg-blue-100',    description: 'Add a Hotel to a full property set that already has a House. +4 rent bonus.' },
  { id: 'action_house',           name: 'House',             kind: 'action', bankValue: 3, color: 'bg-amber-600',   lighterColor: 'bg-amber-100',   description: 'Add a House to a full property set. +3 rent bonus.' },
  { id: 'action_its_my_birthday', name: "It's My Birthday",  kind: 'action', bankValue: 2, color: 'bg-pink-600',    lighterColor: 'bg-pink-100',    description: 'Collect $2M from every other player.' },
  { id: 'action_just_say_no',     name: 'Just Say No!',      kind: 'action', bankValue: 4, color: 'bg-green-700',   lighterColor: 'bg-green-100',   description: 'Cancel any action played against you. Can be countered.' },
  { id: 'action_pass_go',         name: 'Pass Go',           kind: 'action', bankValue: 1, color: 'bg-stone-200',   lighterColor: 'bg-stone-50',    description: 'Draw 2 extra cards from the deck.' },
  { id: 'action_sly_deal',        name: 'Sly Deal',          kind: 'action', bankValue: 3, color: 'bg-slate-600',   lighterColor: 'bg-slate-100',   description: 'Steal any one property card from another player (not from a full set).' },
]

// ─── Catalog Map ─────────────────────────────────────────────────────────────

const allCards: CatalogEntry[] = [
  ...moneyCards,
  ...propertyCards,
  ...wildPropertyCards,
  ...rentCards,
  ...actionCards,
]

export const cardCatalog: Record<string, CatalogEntry> = {}
for (const card of allCards) {
  cardCatalog[card.id] = card
}

/** Look up a card by backend ID. Returns a placeholder if unknown. */
export function getCard(id: string): CatalogEntry {
  return cardCatalog[id] ?? {
    id,
    name: id,
    kind: 'action',
    bankValue: 0,
    color: 'bg-gray-400',
    lighterColor: 'bg-gray-200',
    description: 'Unknown card',
  }
}

/** Sum the bank values of a list of card IDs */
export function sumBankValue(cardIds: string[]): number {
  return cardIds.reduce((sum, id) => sum + (cardCatalog[id]?.bankValue ?? 0), 0)
}

/** Get the display name for a property group */
export const groupDisplayNames: Record<string, string> = {
  brown:      'Brown',
  light_blue: 'Light Blue',
  pink:       'Pink',
  orange:     'Orange',
  red:        'Red',
  yellow:     'Yellow',
  green:      'Green',
  dark_blue:  'Dark Blue',
  railroad:   'Railroad',
  utility:    'Utility',
}

/** Set sizes for each property group */
export const groupSetSizes: Record<string, number> = {
  brown: 2, light_blue: 3, pink: 3, orange: 3,
  red: 3, yellow: 3, green: 3, dark_blue: 2,
  railroad: 4, utility: 2,
}
