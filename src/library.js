export const RECON_COST = 5;
export const CLAIM_COST = 10;
export const ANNUAL_UPKEEP = 25;
export const HOUSING_CAPACITY = 4;

export const FLAVORS = {
    swamp: {
        Forest: " Ѱ ",
        Plain: " . ",
        Mountain: " ▲ ",
        Hill: " m ",
        Swamp: " ~ ",
        color: "text-green-500",
        text_suffix: "of the Glades"
    },
    icy: {
        Forest: " ❄ ",
        Plain: " _ ",
        Mountain: " 🏔 ",
        Hill: " ^ ",
        Swamp: " 🧊 ",
        color: "text-cyan-500",
        text_suffix: "of the Frozen North"
    },
    necromancy: {
        Forest: " ✝ ",
        Plain: " ☠ ",
        Mountain: " ⚰ ",
        Hill: " ☖ ",
        Swamp: " ☣ ",
        color: "text-fuchsia-500",
        text_suffix: "of the Grave"
    },
    desert: {
        Forest: " 🌵 ",
        Plain: " . ",
        Mountain: " ▲ ",
        Hill: " n ",
        Swamp: " ♒ ",
        color: "text-yellow-500",
        text_suffix: "of the Burning Sands"
    }
};

export const SETTLEMENT_NAMES = [
    "Alligator's End", "Mangrove Reach", "The Glades", "Sawgrass Outpost",
    "Ever-Mist", "Cypress Stand", "Keys of Chaos", "Spanish Moss Manor",
    "Restov", "Pitax", "Oleg's Rest", "Staglord's Folly", "Tuskdale",
    "Greenbelt Heart", "Varnhold", "Hooktongue Slough", "Lake Reykal", "Golushkin"
];

export const STRUCTURES_DB = {
    "academy": {lots: 2, cost_rp: 52, traits: ["building", "edifice"], desc: "An institution where advanced study in many fields can be pursued."},
    "alchemy laboratory": {lots: 1, cost_rp: 18, traits: ["building"], desc: "A factory for alchemists crafting elixirs and items."},
    "arena": {lots: 4, cost_rp: 40, traits: ["edifice", "yard"], desc: "A large public structure for gladiator combats and spectacle."},
    "bank": {lots: 1, cost_rp: 28, traits: ["building"], desc: "A secure building for storing valuables and granting loans."},
    "barracks": {lots: 1, cost_rp: 6, traits: ["building", "residential"], desc: "Housing and training for guards and militia. Reduces Unrest."},
    "brewery": {lots: 1, cost_rp: 6, traits: ["building"], desc: "Crafts alcohol and beverages. Reduces Unrest initially."},
    "castle": {lots: 4, cost_rp: 54, traits: ["building", "edifice", "famous", "infamous"], desc: "A fortified seat of government. Significantly reduces Unrest."},
    "cathedral": {lots: 4, cost_rp: 58, traits: ["building", "edifice", "famous", "infamous"], desc: "A focal point of spiritual worship."},
    "cemetery": {lots: 1, cost_rp: 4, traits: ["yard"], desc: "A plot of land to bury the dead. Mitigates Unrest from dangerous events."},
    "dump": {lots: 1, cost_rp: 4, traits: ["yard"], desc: "A centralized place for the disposal of refuse."},
    "farm": {lots: 1, cost_rp: 5, traits: ["yard"], desc: "Produces food for your citizens. Essential for survival."},
    "garrison": {lots: 2, cost_rp: 28, traits: ["building", "residential"], desc: "A complex for maintaining military forces."},
    "general store": {lots: 1, cost_rp: 8, traits: ["building"], desc: "A basic shop that provides standard goods to citizens."},
    "granary": {lots: 1, cost_rp: 12, traits: ["building"], desc: "Silos and warehouses for grain. Increases Food capacity."},
    "hospital": {lots: 2, cost_rp: 30, traits: ["building"], desc: "Dedicated to healing the sick through magical and mundane means."},
    "houses": {lots: 1, cost_rp: 3, traits: ["building", "residential"], desc: "Neighborhood dwellings for citizens to prevent overcrowding."},
    "illicit market": {lots: 1, cost_rp: 50, traits: ["building", "infamous"], desc: "Unregulated and illegal trade. Increases Crime ruin."},
    "inn": {lots: 1, cost_rp: 10, traits: ["building", "residential"], desc: "A safe place for visitors to rest."},
    "jail": {lots: 1, cost_rp: 14, traits: ["building"], desc: "Fortified structure that houses criminals. Reduces Crime."},
    "lumberyard": {lots: 2, cost_rp: 16, traits: ["yard"], desc: "Increases Lumber capacity. Must be built next to water."},
    "marketplace": {lots: 2, cost_rp: 48, traits: ["building", "residential"], desc: "A large neighborhood of shops around an open area."},
    "park": {lots: 1, cost_rp: 5, traits: ["yard"], desc: "Undeveloped land set aside for public use."},
    "shrine": {lots: 1, cost_rp: 8, traits: ["building"], desc: "A small building devoted to a deity or faith."},
    "tavern": {lots: 1, cost_rp: 24, traits: ["building"], desc: "A respectable establishment for entertainment, eating, and drinking."},
    "tenement": {lots: 1, cost_rp: 1, traits: ["building", "residential"], desc: "Hastily built shantytowns. Cheap, but increases a Ruin."},
    "watchtower": {lots: 1, cost_rp: 12, traits: ["building"], desc: "A guard post that grants advance warning to events."}
};
