import random

FLAVORS = {
    "swamp": {
        "Forest": " Ѱ ",
        "Plain": " . ",
        "Mountain": " ▲ ",
        "Hill": " m ",
        "Swamp": " ~ ",
        "color": "green",
        "text_suffix": "of the Glades"
    },
    "icy": {
        "Forest": " ❄ ",
        "Plain": " _ ",
        "Mountain": " 🏔 ",
        "Hill": " ^ ",
        "Swamp": " 🧊 ",
        "color": "cyan",
        "text_suffix": "of the Frozen North"
    },
    "necromancy": {
        "Forest": " ✝ ",
        "Plain": " ☠ ",
        "Mountain": " ⚰ ",
        "Hill": " ☖ ",
        "Swamp": " ☣ ",
        "color": "magenta",
        "text_suffix": "of the Grave"
    },
    "desert": {
        "Forest": " 🌵 ",
        "Plain": " . ",
        "Mountain": " ▲ ",
        "Hill": " n ",
        "Swamp": " ♒ ",
        "color": "yellow",
        "text_suffix": "of the Burning Sands"
    }
}

import random

# Text Note: This library has been greatly expanded using the Kingmaker PDF.
# By keeping this data structured as lists and dictionaries, your main game logic
# (in kingdom_sim.py) can loop through them without needing thousands of lines of hard-coded text.

# --- LOCATIONS & SETTLEMENTS ---
SETTLEMENT_NAMES = [
    # Florida/Swamp Inspired
    "Alligator's End", "Mangrove Reach", "The Glades", "Sawgrass Outpost",
    "Ever-Mist", "Cypress Stand", "Keys of Chaos", "Spanish Moss Manor",
    # Pathfinder Stolen Lands / Brevoy Lore
    "Restov", "Pitax", "Oleg's Rest", "Staglord's Folly", "Tuskdale",
    "Greenbelt Heart", "Varnhold", "Hooktongue Slough", "Lake Reykal", "Golushkin"
]

# --- BACKGROUNDS & LINEAGES ---
KINGMAKER_BACKGROUNDS = [
    {"name": "Borderlands Pioneer", "skill": "Nature", "desc": "You have long lived along the southern border of Brevoy."},
    {"name": "Brevic Noble", "skill": "Society", "desc": "You claim a connection to one of Brevoy's noble families (Garess, Lebeda, Lodovka, Medvyed, Orlovsky, Surtova)."},
    {"name": "Brevic Outcast", "skill": "Politics", "desc": "You have noble blood but no proof, seeking to make a name of your own."},
    {"name": "Issian Patriot", "skill": "Society", "desc": "You grew up in northern Brevoy, answering the call for heroes."},
    {"name": "Local Brigand", "skill": "Intimidation", "desc": "You hail from the lawless reaches and are looking to lie low."},
    {"name": "Rostlander", "skill": "Athletics", "desc": "Raised in the south of Brevoy, you come from hardy stock."},
    {"name": "Sword Scion", "skill": "Warfare", "desc": "You grew up on tales of the legendary Aldori swordlords."}
]

# --- KINGDOM LEADERSHIP & SKILLS ---
LEADERSHIP_ROLES = [
    {"role": "Ruler", "attribute": "Loyalty", "vacancy_penalty": "Unrest increases, Control DC increases"},
    {"role": "Counselor", "attribute": "Culture", "vacancy_penalty": "-1 to Culture checks"},
    {"role": "General", "attribute": "Stability", "vacancy_penalty": "-4 to Warfare activities"},
    {"role": "Emissary", "attribute": "Loyalty", "vacancy_penalty": "-1 to Loyalty checks"},
    {"role": "Magister", "attribute": "Culture", "vacancy_penalty": "-4 to Warfare activities"},
    {"role": "Treasurer", "attribute": "Economy", "vacancy_penalty": "-1 to Economy checks"},
    {"role": "Viceroy", "attribute": "Economy", "vacancy_penalty": "-1 to Stability checks"},
    {"role": "Warden", "attribute": "Stability", "vacancy_penalty": "-4 to Region activities"}
]

KINGDOM_SKILLS = [
    "Agriculture", "Arts", "Boating", "Defense", "Engineering", "Exploration",
    "Folklore", "Industry", "Intrigue", "Magic", "Politics", "Scholarship",
    "Statecraft", "Trade", "Warfare", "Wilderness"
]

# --- PROMINENT CITIZENS (QUEST GIVERS) ---
# Text Note: These NPCs are pulled directly from the PDF sidebars.
# You can use the "trigger" property to spawn them when the Kingdom hits specific milestones.
PROMINENT_CITIZENS = [
    {"name": "Arven", "title": "The Fisher", "trigger": "Build a Pier", "quest": "Wants you to clear a monster from his secret fishing hole."},
    {"name": "Stas", "title": "The Lumberjack", "trigger": "Build a Lumberyard", "quest": "Lost his magical spear and needs it retrieved."},
    {"name": "Lily Teskertin", "title": "The Aristocrat", "trigger": "Build a Manor/Craft Luxuries", "quest": "Fascinated with elven artistry and ruins."},
    {"name": "Edrist Hanvaki", "title": "The Merchant", "trigger": "Kingdom founded", "quest": "His brother Temin travels without guards and needs rescuing."},
    {"name": "Jemanda Orlashen", "title": "The Detective", "trigger": "Random Event", "quest": "Seeking an instructor who caused a scandal at the Kitharodian Academy."},
    {"name": "Tamerak Elenark", "title": "The Scholar", "trigger": "Build an Academy or Museum", "quest": "Researching the ancient cyclopes empire in Iobaria."},
    {"name": "Chundis", "title": "The Swamper", "trigger": "Claim a swamp hex", "quest": "Tells tales of real swamp monsters that need dealing with."},
    {"name": "Jennavieve Kensen", "title": "The Collector", "trigger": "Build a Noble Villa", "quest": "Wants to build a stable and collect exotic mounts."},
    {"name": "Bixen Libixyten", "title": "The Brewer", "trigger": "Build 3 Breweries", "quest": "Needs a public feat of glory performed after drinking his new blackberry mead."},
    {"name": "Loris Shadwest", "title": "The Taxidermist", "trigger": "Kingdom Level 17", "quest": "Wants to taxidermy a real winged owlbear."}
]

# --- SETTLEMENT STRUCTURES DB ---
# Text Note: This dictionary maps a structure's name to its exact cost (in Resource Points),
# the number of lots it takes up on your Urban Grid, and its benefits.
STRUCTURES_DB = {
    "academy": {"lots": 2, "cost_rp": 52, "traits": ["building", "edifice"], "desc": "An institution where advanced study in many fields can be pursued."},
    "alchemy laboratory": {"lots": 1, "cost_rp": 18, "traits": ["building"], "desc": "A factory for alchemists crafting elixirs and items."},
    "arena": {"lots": 4, "cost_rp": 40, "traits": ["edifice", "yard"], "desc": "A large public structure for gladiator combats and spectacle."},
    "bank": {"lots": 1, "cost_rp": 28, "traits": ["building"], "desc": "A secure building for storing valuables and granting loans."},
    "barracks": {"lots": 1, "cost_rp": 6, "traits": ["building", "residential"], "desc": "Housing and training for guards and militia. Reduces Unrest."},
    "brewery": {"lots": 1, "cost_rp": 6, "traits": ["building"], "desc": "Crafts alcohol and beverages. Reduces Unrest initially."},
    "castle": {"lots": 4, "cost_rp": 54, "traits": ["building", "edifice", "famous", "infamous"], "desc": "A fortified seat of government. Significantly reduces Unrest."},
    "cathedral": {"lots": 4, "cost_rp": 58, "traits": ["building", "edifice", "famous", "infamous"], "desc": "A focal point of spiritual worship."},
    "cemetery": {"lots": 1, "cost_rp": 4, "traits": ["yard"], "desc": "A plot of land to bury the dead. Mitigates Unrest from dangerous events."},
    "dump": {"lots": 1, "cost_rp": 4, "traits": ["yard"], "desc": "A centralized place for the disposal of refuse."},
    "garrison": {"lots": 2, "cost_rp": 28, "traits": ["building", "residential"], "desc": "A complex for maintaining military forces."},
    "general store": {"lots": 1, "cost_rp": 8, "traits": ["building"], "desc": "A basic shop that provides standard goods to citizens."},
    "granary": {"lots": 1, "cost_rp": 12, "traits": ["building"], "desc": "Silos and warehouses for grain. Increases Food capacity."},
    "hospital": {"lots": 2, "cost_rp": 30, "traits": ["building"], "desc": "Dedicated to healing the sick through magical and mundane means."},
    "houses": {"lots": 1, "cost_rp": 3, "traits": ["building", "residential"], "desc": "Neighborhood dwellings for citizens to prevent overcrowding."},
    "illicit market": {"lots": 1, "cost_rp": 50, "traits": ["building", "infamous"], "desc": "Unregulated and illegal trade. Increases Crime ruin."},
    "inn": {"lots": 1, "cost_rp": 10, "traits": ["building", "residential"], "desc": "A safe place for visitors to rest."},
    "jail": {"lots": 1, "cost_rp": 14, "traits": ["building"], "desc": "Fortified structure that houses criminals. Reduces Crime."},
    "lumberyard": {"lots": 2, "cost_rp": 16, "traits": ["yard"], "desc": "Increases Lumber capacity. Must be built next to water."},
    "marketplace": {"lots": 2, "cost_rp": 48, "traits": ["building", "residential"], "desc": "A large neighborhood of shops around an open area."},
    "park": {"lots": 1, "cost_rp": 5, "traits": ["yard"], "desc": "Undeveloped land set aside for public use."},
    "shrine": {"lots": 1, "cost_rp": 8, "traits": ["building"], "desc": "A small building devoted to a deity or faith."},
    "tavern": {"lots": 1, "cost_rp": 24, "traits": ["building"], "desc": "A respectable establishment for entertainment, eating, and drinking."},
    "tenement": {"lots": 1, "cost_rp": 1, "traits": ["building", "residential"], "desc": "Hastily built shantytowns. Cheap, but increases a Ruin."},
    "watchtower": {"lots": 1, "cost_rp": 12, "traits": ["building"], "desc": "A guard post that grants advance warning to events."}
}

# --- RANDOM EVENTS ---
RANDOM_EVENTS = [
    {"name": "Crop Failure", "type": "Danger", "desc": "Blight strikes the farmlands, draining food reserves."},
    {"name": "Squatters", "type": "Danger", "desc": "Refugees settle in your lands, increasing Unrest unless dealt with."},
    {"name": "Bandit Activity", "type": "Danger", "desc": "Thieves operate on the roads, threatening trade and Economy."},
    {"name": "Plague", "type": "Danger", "desc": "Sickness spreads. Hospitals and Herbalists are needed to stem the tide."}
]

# --- ARMIES & WARFARE ---
ARMY_TYPES = [
    {"type": "Infantry", "desc": "Platoon of armored soldiers on foot."},
    {"type": "Cavalry", "desc": "Armored soldiers mounted on horses. Gains bonuses on Overrun."},
    {"type": "Skirmishers", "desc": "Lightly armored, fast units. Excellent Maneuver and Morale."},
    {"type": "Siege Engines", "desc": "Catapults and ballistae. High damage against fortifications."}
]

def get_random_citizen():
    """Helper function to generate a generic pop."""
    first_names = ["Urist", "Bomvur", "Elara", "Mila", "Finn", "Grog", "Kael", "Zora"]
    return random.choice(first_names)
