import os
import random
import threading
import time
from rich.console import Console
from rich.layout import Layout
from rich.panel import Panel
from rich.table import Table
from rich.text import Text
from data_libraries import FLAVORS, STRUCTURES_DB, PROMINENT_CITIZENS

console = Console()

class Pop:
    def __init__(self, name):
        self.name = name
        self.job = None
        self.starving = False

class Building:
    def __init__(self, b_type):
        self.type = b_type
        data = STRUCTURES_DB.get(b_type, {})
        self.capacity = data.get("capacity", 0)
        self.housing_capacity = data.get("housing_capacity", 0)
        self.production = data.get("production", {})
        self.workers = []

    def assign_worker(self, pop):
        if len(self.workers) < self.capacity and pop.job is None:
            self.workers.append(pop)
            pop.job = self
            return True
        return False

class Settlement:
    def __init__(self, name):
        self.name = name
        self.grid = []
        # Generate a 2x2 grid representing 4 lots
        for y in range(2):
            row = []
            for x in range(2):
                row.append(None) # None means empty lot
            self.grid.append(row)

    @property
    def residential_lots(self):
        count = 0
        for row in self.grid:
            for b in row:
                if b and "residential" in STRUCTURES_DB[b.type]["traits"]:
                    count += 1
        return count

    @property
    def other_lots(self):
        count = 0
        for row in self.grid:
            for b in row:
                if b and "residential" not in STRUCTURES_DB[b.type]["traits"]:
                    count += 1
        return count

    @property
    def is_overcrowded(self):
        return self.other_lots > self.residential_lots

    def place_building(self, b_type, lot_x, lot_y):
        data = STRUCTURES_DB.get(b_type)
        if not data:
            return False, f"Unknown structure '{b_type}'"

        # Simple placement: assumes 1 lot buildings for now
        if 0 <= lot_x < 2 and 0 <= lot_y < 2:
            if self.grid[lot_y][lot_x] is None:
                new_building = Building(b_type)
                self.grid[lot_y][lot_x] = new_building
                return True, new_building
            return False, "Lot is occupied."
        return False, "Invalid lot coordinates."

    def render_grid(self):
        display = Text()
        display.append(f"Settlement: {self.name}\n\n", style="bold underline")
        for y in range(2):
            for x in range(2):
                building = self.grid[y][x]
                if building is None:
                    display.append("[   ] ", style="dim")
                else:
                    code = building.type[:3].upper()
                    if "residential" in STRUCTURES_DB[building.type]["traits"]:
                        display.append(f"[{code}] ", style="green")
                    else:
                        display.append(f"[{code}] ", style="blue")
            display.append("\n")
        return display

class Hex:
    def __init__(self, terrain):
        self.terrain = terrain
        self.feature = None
        # Status: 0 = Hidden (??), 1 = Reconnoitered (Terrain Visible), 2 = Claimed ([C])
        self.status = 0 
        self.settlement = None

class Kingdom:
    def __init__(self, name, flavor="swamp"):
        self.name = name
        self.flavor = flavor
        self.bp = 60 # Starting Build Points
        self.food = 40
        self.unrest = 0
        self.xp = 0
        from data_libraries import get_random_citizen
        self.pops = [Pop(get_random_citizen()) for _ in range(3)]
        self.buildings = []
        self.level = 1
        self.lock = threading.Lock()
        
        # UI State
        self.current_view = "world" # either "world" or a tuple (x, y) for a hex view
        self.stage = 1 # 1: Camp, 2: Setup, 3: Expansion

        # Flavor Set Config
        self.style = FLAVORS[flavor]
        
        # World Generation (10x10)
        self.world = []
        self.generate_world()
        
        # Starting position (Heartland)
        self.start_x, self.start_y = 5, 5
        self.world[self.start_y][self.start_x].status = 2 # Capital is claimed

        # Establish Capital Settlement automatically
        self.world[self.start_y][self.start_x].settlement = Settlement("Capital")

        self.log = [f"Expedition landed {self.style.get('text_suffix', 'in the regions')}.", "Capital founded."]

    def tick(self):
        from data_libraries import get_random_citizen

        with self.lock:
            # Calculate production
            produced_food = 0.0
            produced_bp = 0.0

            for building in self.buildings:
                if building.production and building.capacity > 0:
                    efficiency = len(building.workers) / building.capacity
                    prod_amount = building.production.get("base_rate", 0) * efficiency

                    if building.production.get("type") == "food":
                        produced_food += prod_amount
                    elif building.production.get("type") == "bp":
                        produced_bp += prod_amount

            self.food += produced_food
            self.bp += produced_bp

            # Consumption
            food_consumed = len(self.pops) * 1.0
            self.food -= food_consumed

            # Starvation
            if self.food < 0:
                for pop in self.pops:
                    pop.starving = True
                self.log.append("[!] Your pops are starving!")
            else:
                for pop in self.pops:
                    pop.starving = False

            # Migration
            max_housing = sum(b.housing_capacity for b in self.buildings)
            if len(self.pops) < max_housing:
                new_pop = Pop(get_random_citizen())
                self.pops.append(new_pop)
                self.log.append(f"[+] Migrant arrived: {new_pop.name}")

    def monthly_tick(self):
        """Processes monthly updates."""
        # Ensure we are in a high enough stage
        if self.stage >= 3:
             # Check for overcrowding
             overcrowded_settlements = False
             for row in self.world:
                  for hex_obj in row:
                       if hex_obj.settlement and hex_obj.settlement.is_overcrowded:
                            overcrowded_settlements = True
             if overcrowded_settlements:
                  self.unrest += 1
                  self.log.append("[!] Overcrowded settlements caused Unrest to increase.")
             self.log.append("[+] A month has passed.")

    def generate_world(self):
        """Note: Uses a simple nested loop to fill the map with random terrain types."""
        terrain_types = ["Forest", "Plain", "Mountain", "Hill", "Swamp"]
        for y in range(10):
            row = [Hex(random.choice(terrain_types)) for x in range(10)]
            self.world.append(row)

    def reconnoiter(self, x, y):
        """Note: Pathfinder Rule - Surveying a hex reveals its contents but costs resources."""
        # Treasurer's Warning: Using a check to prevent overspending
        cost = 5
        if self.bp < cost:
            self.log.append("[-] Treasurer: 'We literally cannot afford to map that area right now.'")
            return

        if 0 <= x < 10 and 0 <= y < 10:
            if self.world[y][x].status == 0:
                self.bp -= cost
                self.world[y][x].status = 1
                self.log.append(f"[+] Reconnoitered ({x},{y}). It is a {self.world[y][x].terrain}.")
            else:
                self.log.append("[!] That area is already mapped.")
        else:
            self.log.append(f"[!] ({x},{y}) is out of bounds!")

    def claim_hex(self, x, y):
        """Note: You must Reconnoiter a hex (status 1) before you can Claim it (status 2)."""
        cost = 10
        if 0 <= x < 10 and 0 <= y < 10:
            if self.world[y][x].status == 1:
                if self.bp >= cost:
                    self.bp -= cost
                    self.world[y][x].status = 2
                    self.xp += 10 # Milestone: 10 XP per hex
                    self.world[y][x].settlement = Settlement("Outpost")
                    self.log.append(f"[+] Claimed ({x},{y}) and established an outpost. Kingdom Size +1.")
                else:
                    self.log.append("[-] Treasurer: 'Claiming land requires BP we don't have.'")
            else:
                self.log.append("[!] You must map this area before claiming it!")
        else:
            self.log.append(f"[!] ({x},{y}) is out of bounds!")

    def build_structure(self, structure_name, x, y):
        if self.current_view == "world":
            self.log.append("[-] View a settlement hex to build structures.")
            return

        # Attempt to find the structure
        data = STRUCTURES_DB.get(structure_name)
        if not data:
            self.log.append(f"[-] Unknown structure: '{structure_name}'.")
            return

        cost = data["cost_rp"]
        if self.bp < cost:
            self.log.append(f"[-] Treasurer: 'A {structure_name} costs {cost} BP. We cannot afford it.'")
            return

        sx, sy = self.current_view
        hex_obj = self.world[sy][sx]
        if not hex_obj.settlement:
            self.log.append("[-] There is no settlement here to build in.")
            return

        success, msg = hex_obj.settlement.place_building(structure_name, x, y)
        if success:
             self.bp -= cost
             building_obj = msg # msg is the building object on success
             self.buildings.append(building_obj)
             self.log.append(f"[+] Built {structure_name} at ({x},{y}) in {hex_obj.settlement.name}.")
        else:
             self.log.append(f"[-] Build failed: {msg}")

    def render_map(self):
        """Note: This logic checks the 'status' of every hex to decide what to show Jules."""
        map_display = Text()
        for y in range(10):
            for x in range(10):
                hex_obj = self.world[y][x]
                if hex_obj.status == 0:
                    map_display.append(" ?? ", style="dim")
                elif hex_obj.status == 1:
                    # Show terrain based on Flavor
                    char = self.style.get(hex_obj.terrain, " . ")
                    map_display.append(char, style=self.style.get("color", "green"))
                elif hex_obj.status == 2:
                    map_display.append(" [C]", style="bold gold1")
            map_display.append("\n")
        return map_display

def draw_ui(game):
    layout = Layout()
    layout.split_column(
        Layout(name="header", size=3),
        Layout(name="main", ratio=1),
        Layout(name="footer", size=3)
    )
    # Redefine layout
    layout["main"].split_column(
        Layout(name="map_and_stats", ratio=3),
        Layout(name="log", ratio=1)
    )
    layout["main"]["map_and_stats"].split_row(
        Layout(name="map", ratio=2),
        Layout(name="stats", ratio=1)
    )

    # Apply Flavor Visuals
    header_color = game.style.get("color", "green")
    layout["header"].update(Panel(f"👑 {game.name.upper()} | Flavor: {game.flavor.capitalize()}", style=f"bold {header_color}"))
    
    if game.current_view == "world":
        layout["main"]["map_and_stats"]["map"].update(Panel(game.render_map(), title="World Map (Stolen Lands)", border_style=header_color))
    else:
        sx, sy = game.current_view
        hex_obj = game.world[sy][sx]
        if hex_obj.settlement:
            map_content = hex_obj.settlement.render_grid()
            title = f"Settlement: {hex_obj.settlement.name} at ({sx},{sy})"
            if hex_obj.settlement.is_overcrowded:
                title += " [bold red](OVERCROWDED)[/]"
        else:
            map_content = Text("No settlement here.", style="dim")
            title = f"Hex ({sx},{sy})"
        layout["main"]["map_and_stats"]["map"].update(Panel(map_content, title=title, border_style="blue"))
    
    # Stats Table
    stats = Table.grid(expand=True)

    if game.stage >= 3:
        stats.add_row("BP (Treasury):", str(int(game.bp)))
        stats.add_row("Food Stores:", str(int(game.food)))
        stats.add_row("Unrest:", str(game.unrest))
        stats.add_row("Kingdom XP:", str(game.xp))
        stats.add_row("Population:", str(len(game.pops)))

        if game.current_view != "world":
            sx, sy = game.current_view
            if game.world[sy][sx].settlement:
                settlement = game.world[sy][sx].settlement
                stats.add_row("---", "---")
                stats.add_row("Res. Lots:", str(settlement.residential_lots))
                stats.add_row("Other Lots:", str(settlement.other_lots))
    else:
         stats.add_row("BP (Treasury):", "???")
         stats.add_row("Food Stores:", str(int(game.food)))
         stats.add_row("Unrest:", "???")
         stats.add_row("Kingdom XP:", "???")
         stats.add_row("Population:", str(len(game.pops)))
    
    layout["stats"].update(Panel(stats, title="Kingdom Ledger"))

    # Render log
    log_content = "\n".join(game.log[-5:])
    layout["log"].update(Panel(log_content, title="Event Log", border_style="white"))

    if game.stage == 1:
        layout["footer"].update(Panel("Commands: [E]stablish Camp | [Q]uit | [aa] Auto-Assign"))
    elif game.stage == 2:
        layout["footer"].update(Panel("Commands: [V]iew x,y | [B]uild <structure> x,y | Flavor <name> | [Q]uit | [aa] Auto-Assign"))
    else:
        layout["footer"].update(Panel("Commands: [V]iew x,y/world | [R]econnoiter x,y | [C]laim x,y | [B]uild <structure> x,y | Flavor <name> | [N]ext | [Q]uit | [aa] Auto-Assign"))

    console.print(layout)

def simulation_loop(game):
    while True:
        time.sleep(5)
        game.tick()
        # In a real CLI, we might need a better way to refresh the UI asynchronously.
        # For now, it refreshes on input.

# --- Logic Phase ---
if __name__ == "__main__":
    my_game = Kingdom("The Sunken Glades", flavor="swamp")
    # For testing, push to stage 3
    my_game.stage = 3

    sim_thread = threading.Thread(target=simulation_loop, args=(my_game,), daemon=True)
    sim_thread.start()

    while True:
        os.system('cls' if os.name == 'nt' else 'clear')
        with my_game.lock:
            draw_ui(my_game)

        action = input("\n> ").lower().split()
        if not action: continue

        if action[0] == 'q': break
        if action[0] in ['n', 'next']:
            with my_game.lock:
                my_game.monthly_tick()
        if action[0] == 'r' and len(action) == 2:
            try:
                coords = action[1].split(',')
                with my_game.lock:
                    my_game.reconnoiter(int(coords[0]), int(coords[1]))
            except Exception: pass
        if action[0] == 'c' and len(action) == 2:
            try:
                coords = action[1].split(',')
                with my_game.lock:
                    my_game.claim_hex(int(coords[0]), int(coords[1]))
            except Exception: pass
        if action[0] == 'v' and len(action) == 2:
            if action[1] == 'world':
                with my_game.lock:
                    my_game.current_view = 'world'
                    my_game.log.append('[+] Viewing World Map.')
            else:
                try:
                    coords = action[1].split(',')
                    vx, vy = int(coords[0]), int(coords[1])
                    if 0 <= vx < 10 and 0 <= vy < 10:
                        with my_game.lock:
                            if my_game.world[vy][vx].status > 0:
                                my_game.current_view = (vx, vy)
                                my_game.log.append(f'[+] Viewing Hex ({vx},{vy}).')
                            else:
                                my_game.log.append(f'[-] Hex ({vx},{vy}) is unmapped.')
                    else:
                        with my_game.lock:
                            my_game.log.append(f'[!] ({vx},{vy}) is out of bounds!')
                except Exception:
                    pass
        if action[0] == 'b' and len(action) >= 3:
            try:
                structure_name = ' '.join(action[1:-1])
                coords = action[-1].split(',')
                bx, by = int(coords[0]), int(coords[1])
                with my_game.lock:
                    my_game.build_structure(structure_name, bx, by)
            except Exception:
                pass
        if action[0] in ['flavor', 'f'] and len(action) == 2:
            new_flavor = action[1]
            if new_flavor in FLAVORS:
                with my_game.lock:
                    my_game.flavor = new_flavor
                    my_game.style = FLAVORS[new_flavor]
                    my_game.log.append(f"[!] Kingdom aesthetic shifted to {new_flavor.capitalize()}.")
            else:
                with my_game.lock:
                    my_game.log.append(f"[!] Unknown flavor: {new_flavor}")
        if action[0] == 'aa':
            with my_game.lock:
                # Auto-Assign
                unemployed = [p for p in my_game.pops if p.job is None]
                if not unemployed:
                    my_game.log.append("[!] No unemployed pops to assign.")
                    continue

                empty_slots = []
                for b in my_game.buildings:
                    empty_slots.extend([b] * (b.capacity - len(b.workers)))

                if not empty_slots:
                    my_game.log.append("[!] No empty building slots.")
                    continue

                # Determine demand based on what resource we are lowest on relative to a baseline
                # Food is constantly consumed, so it usually has higher priority if low
                food_demand_score = 100 - my_game.food
                bp_demand_score = 100 - my_game.bp

                # Sort buildings by which resource they produce that we need the most
                def get_building_priority(b):
                    if not b.production: return 0
                    if b.production.get("type") == "food": return food_demand_score
                    if b.production.get("type") == "bp": return bp_demand_score
                    return 1

                empty_slots.sort(key=get_building_priority, reverse=True)

                assigned_count = 0
                while unemployed and empty_slots:
                    pop = unemployed.pop(0)
                    building = empty_slots.pop(0)
                    if building.assign_worker(pop):
                        assigned_count += 1

                my_game.log.append(f"[+] Auto-assigned {assigned_count} pops.")
