import sys

with open("Engine.py", "r") as f:
    content = f.read()

# Add Pop class
pop_class = """class Pop:
    def __init__(self, name):
        self.name = name
        self.hunger = 0
        self.happiness = 100
        self.is_alive = True

        # Determine alignment based on pathfinder
        alignments = ["Lawful Good", "Neutral Good", "Chaotic Good", "Lawful Neutral", "True Neutral", "Chaotic Neutral", "Lawful Evil", "Neutral Evil", "Chaotic Evil"]
        self.alignment = random.choice(alignments)

        # Stats ranging from 8 to 18
        self.strength = random.randint(8, 18)
        self.intelligence = random.randint(8, 18)
        self.charisma = random.randint(8, 18)

class Hex:"""

content = content.replace("class Hex:", pop_class)

# Add citizens and advisors to Kingdom init
kingdom_init_orig = """        self.log = [f"Expedition landed {self.style['text_suffix']}.", "Awaiting orders to establish camp."]"""
kingdom_init_new = """        self.log = [f"Expedition landed {self.style['text_suffix']}.", "Awaiting orders to establish camp."]

        self.loyalty = 0
        self.citizens = [Pop(get_random_citizen()) for _ in range(5)]
        self.advisors = {"general": None, "treasurer": None, "diplomat": None}"""

content = content.replace(kingdom_init_orig, kingdom_init_new)

# Add logic to tick
tick_orig = """            # Advisor Modifiers (Attribute // 4)
            treasurer_bonus = self.advisors.get("Treasurer", {}).get("attribute", 0) // 4
            self.bp += treasurer_bonus"""

tick_new = """            # Passive Shield Mechanic
            if self.loyalty > 10 and self.unrest > 0:
                if random.random() < 0.5: # 50% chance
                    self.unrest = max(0, self.unrest - 1)
                    self.log.append("[+] High Loyalty automatically reduced Unrest by 1.")

            # Advisor Modifiers
            if self.advisors.get("treasurer") and self.advisors["treasurer"].is_alive:
                bonus = self.advisors["treasurer"].intelligence // 4
                self.bp += bonus
                self.log.append(f"[+] Treasurer {self.advisors['treasurer'].name} collected {bonus} extra BP.")

            if self.advisors.get("general") and self.advisors["general"].is_alive:
                reduction = self.advisors["general"].strength // 4
                if self.unrest > 0:
                    self.unrest = max(0, self.unrest - reduction)
                    self.log.append(f"[+] General {self.advisors['general'].name} reduced Unrest by {reduction}.")

            if self.advisors.get("diplomat") and self.advisors["diplomat"].is_alive:
                boost = self.advisors["diplomat"].charisma // 4
                self.loyalty += boost
                self.log.append(f"[+] Diplomat {self.advisors['diplomat'].name} improved Loyalty by {boost}.")"""

content = content.replace(tick_orig, tick_new)


with open("Engine.py", "w") as f:
    f.write(content)
