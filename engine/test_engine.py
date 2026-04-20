import unittest
from unittest.mock import MagicMock, patch
import sys

# Mocking the rich library before importing Engine
mock_rich = MagicMock()
sys.modules['rich'] = mock_rich
sys.modules['rich.console'] = MagicMock()
sys.modules['rich.layout'] = MagicMock()
sys.modules['rich.panel'] = MagicMock()
sys.modules['rich.table'] = MagicMock()
sys.modules['rich.text'] = MagicMock()

import Engine

# --- TEST SUITE: WORLD MAP EXPLORATION ---
# Verifies that the 'reconnoiter' command correctly maps hexes and deducts BP.
class TestEnginePrologue(unittest.TestCase):
    def setUp(self):
        self.game = Engine.Kingdom("Test Kingdom", flavor="swamp")
        self.game.pending_hero_selection = False

    def test_stage_0_to_1_transition(self):
        self.assertEqual(self.game.stage, 0)
        self.game.sticks = 10

        # Simulate building fire logic
        with self.game.lock:
            self.game.stage = 1
            self.game.sticks -= 10

        self.assertEqual(self.game.stage, 1)
        self.assertEqual(self.game.sticks, 0)

    def test_stage_1_tick_finds_outcast(self):
        self.game.stage = 1
        # Force random to return < 0.20
        with patch('random.random', return_value=0.1):
            self.game.tick()
        self.assertEqual(self.game.stage, 2)
        self.assertEqual(len(self.game.citizens), 1)
        self.assertEqual(self.game.citizens[0].name, "Brevic Outcast")

    def test_stage_2_automation(self):
        self.game.stage = 2
        self.game.woodcutters = 2
        self.game.trappers = 1
        self.game.citizens.append(Engine.Pop("Outcast"))

        initial_timber = self.game.timber
        initial_rations = self.game.rations

        # 1 tick - produce but no consumption
        self.game.tick()
        self.assertEqual(self.game.timber, initial_timber + 2)
        self.assertEqual(self.game.rations, initial_rations + 1)

        # 2nd tick - produce and consume
        self.game.tick()
        self.assertEqual(self.game.timber, initial_timber + 4)
        self.assertEqual(self.game.rations, initial_rations + 2 - 1)

    def test_stage_3_charter_requirement(self):
        self.game.stage = 3
        self.game.timber = 100
        self.game.rations = 50

        # Mock structures
        with patch.object(self.game, 'count_structures', side_effect=lambda name: 3 if name == 'pioneer tent' else (1 if name == 'supply wagon' else 0)):
            self.assertTrue(self.game.count_structures("pioneer tent") >= 3)
            self.assertTrue(self.game.count_structures("supply wagon") >= 1)

            # Simulate map crafting
            self.game.timber -= 100
            self.game.rations -= 50
            self.game.scouting_map_crafted = True

        self.assertTrue(self.game.scouting_map_crafted)

class TestEngineReconnoiter(unittest.TestCase):
    def setUp(self):
        # Initialize Kingdom with a fixed seed if possible,
        # but here we just want to test logic.
        self.game = Engine.Kingdom("Test Kingdom", flavor="swamp")
        self.game.pending_hero_selection = False
        self.game.stage = 3 # Bypass stage progression for recon checks
        self.game.bp = 60 # Ensure enough BP for tests

    # Tests that the engine handles negative coordinate inputs gracefully without crashing.
    def test_reconnoiter_out_of_bounds_negative(self):
        initial_bp = self.game.bp
        self.game.reconnoiter(-1, -1)
        self.assertEqual(self.game.bp, initial_bp, "BP should not be deducted for out-of-bounds.")
        # Check that no hex status was changed (though -1,-1 is impossible to check in world array)
        # We can check that the log doesn't contain a success message
        self.assertFalse(any("[+] Reconnoitered" in entry for entry in self.game.log if "(-1,-1)" in entry))
        self.assertTrue(any("[!] (-1,-1) is out of bounds!" in entry for entry in self.game.log))

    def test_reconnoiter_out_of_bounds_positive(self):
        initial_bp = self.game.bp
        self.game.reconnoiter(10, 10)
        self.assertEqual(self.game.bp, initial_bp, "BP should not be deducted for out-of-bounds.")
        self.assertFalse(any("[+] Reconnoitered" in entry for entry in self.game.log if "(10,10)" in entry))
        self.assertTrue(any("[!] (10,10) is out of bounds!" in entry for entry in self.game.log))

    # Tests a successful recon operation, verifying BP deduction and status change.
    def test_reconnoiter_valid(self):
        # Find a hex that is hidden (status 0)
        x, y = 0, 0
        if self.game.world[y][x].status != 0:
            x, y = 1, 1 # Try another

        initial_bp = self.game.bp
        self.game.reconnoiter(x, y)
        self.assertEqual(self.game.world[y][x].status, 1)
        self.assertEqual(self.game.bp, initial_bp - 5)
        self.assertTrue(any(f"[+] Reconnoitered ({x},{y})" in entry for entry in self.game.log))

    def test_reconnoiter_insufficient_bp(self):
        self.game.bp = 4
        x, y = 0, 0
        initial_status = self.game.world[y][x].status
        self.game.reconnoiter(x, y)
        self.assertEqual(self.game.world[y][x].status, initial_status)
        self.assertEqual(self.game.bp, 4)
        self.assertTrue(any("[-] Treasurer: 'We literally cannot afford to map that area right now.'" in entry for entry in self.game.log))

    def test_reconnoiter_already_mapped(self):
        x, y = 2, 2
        self.game.world[y][x].status = 1
        initial_bp = self.game.bp
        self.game.reconnoiter(x, y)
        self.assertEqual(self.game.bp, initial_bp)
        self.assertTrue(any("[!] That area is already mapped." in entry for entry in self.game.log))

    def test_claim_hex_valid(self):
        x, y = 2, 2
        self.game.world[y][x].status = 1
        initial_bp = self.game.bp
        initial_xp = self.game.xp
        self.game.claim_hex(x, y)
        self.assertEqual(self.game.world[y][x].status, 2)
        self.assertEqual(self.game.bp, initial_bp - 10)
        self.assertEqual(self.game.xp, initial_xp + 10)
        self.assertTrue(any(f"[+] Claimed ({x},{y}). Kingdom Size +1." in entry for entry in self.game.log))

    def test_claim_hex_unmapped(self):
        x, y = 3, 3
        self.game.world[y][x].status = 0
        initial_bp = self.game.bp
        self.game.claim_hex(x, y)
        self.assertEqual(self.game.world[y][x].status, 0)
        self.assertEqual(self.game.bp, initial_bp)
        self.assertTrue(any("[!] You must map this area before claiming it!" in entry for entry in self.game.log))

    def test_claim_hex_insufficient_bp(self):
        x, y = 4, 4
        self.game.world[y][x].status = 1
        self.game.bp = 5
        initial_status = self.game.world[y][x].status
        self.game.claim_hex(x, y)
        self.assertEqual(self.game.world[y][x].status, initial_status)
        self.assertEqual(self.game.bp, 5)
        self.assertTrue(any("[-] Treasurer: 'Claiming land requires BP we don't have.'" in entry for entry in self.game.log))

    def test_claim_hex_low_funds(self):
        x, y = 5, 5
        self.game.world[y][x].status = 1
        self.game.bp = 20 # 20 - 10 = 10 < 15
        initial_status = self.game.world[y][x].status
        self.game.claim_hex(x, y)
        self.assertEqual(self.game.world[y][x].status, initial_status)
        self.assertEqual(self.game.bp, 20)
        self.assertTrue(any("[-] Treasurer WARNING: Funds are critically low! Reconsidering claim." in entry for entry in self.game.log))

    def test_claim_hex_early_stage(self):
        self.game.stage = 1
        x, y = 6, 6
        self.game.world[y][x].status = 1
        initial_bp = self.game.bp
        self.game.claim_hex(x, y)
        self.assertEqual(self.game.world[y][x].status, 1)
        self.assertEqual(self.game.bp, initial_bp)

    def test_claim_hex_out_of_bounds(self):
        initial_bp = self.game.bp
        self.game.claim_hex(-1, -1)
        self.assertEqual(self.game.bp, initial_bp)
        self.assertTrue(any("[!] (-1,-1) is out of bounds!" in entry for entry in self.game.log))

        self.game.claim_hex(10, 10)
        self.assertEqual(self.game.bp, initial_bp)
        self.assertTrue(any("[!] (10,10) is out of bounds!" in entry for entry in self.game.log))

    def test_flavor_switching(self):
        from library import FLAVORS
        # Switch to dark
        self.game.flavor = "dark"
        self.game.style = FLAVORS["dark"]
        self.assertEqual(self.game.style["color"], "magenta")

        # Test rendering with dark flavor
        x, y = 0, 0
        self.game.world[y][x].status = 1
        self.game.world[y][x].terrain = "Mountain"

        # We need to mock the Text object's append method to see what's being added
        with patch('Engine.Text') as MockText:
            mock_text_inst = MockText.return_value
            self.game.render_map()

            # Check if it appended the dark mountain art " ⚰ "
            # It might append other things like " ?? ", "\n"
            # We look for a call that has " ⚰ " and style "magenta"
            found = False
            for call in mock_text_inst.append.call_args_list:
                if " ⚰ " in str(call) and "magenta" in str(call):
                    found = True
                    break
            self.assertTrue(found, "Should render dark mountain with magenta style.")

class TestSettlement(unittest.TestCase):
    def test_overcrowded_logic(self):
        # A settlement is 'Overcrowded' if residential lots are less than a quarter of other occupied lots (residential_lots < other_lots // 4).
        settlement = Engine.Settlement()

        # 0 other, 0 residential
        self.assertFalse(settlement.is_overcrowded)

        # 4 other, 0 residential -> overcrowded
        settlement.other_lots = 4
        settlement.residential_lots = 0
        self.assertTrue(settlement.is_overcrowded)

        # 4 other, 1 residential -> not overcrowded
        settlement.residential_lots = 1
        self.assertFalse(settlement.is_overcrowded)

        # 9 other, 2 residential -> not overcrowded (9 // 4 = 2, 2 < 2 is false)
        settlement.other_lots = 9
        settlement.residential_lots = 2
        self.assertFalse(settlement.is_overcrowded)

        # 8 other, 1 residential -> overcrowded (8 // 4 = 2, 1 < 2 is true)
        settlement.other_lots = 8
        settlement.residential_lots = 1
        self.assertTrue(settlement.is_overcrowded)

class TestStructures(unittest.TestCase):
    def test_build_structure_logic(self):
        # We need to test the building placement on 5x5 grid
        settlement = Engine.Settlement()
        logs = []

        # Build 1-lot structure
        success = settlement.build("alchemy laboratory", 0, 0, logs)
        self.assertTrue(success)
        self.assertEqual(settlement.grid[0][0], "alchemy laboratory")

        # Build 2-lot structure (academy)
        # Assuming lots are verified horizontally
        success = settlement.build("academy", 0, 1, logs)
        self.assertTrue(success)
        self.assertEqual(settlement.grid[1][0], "academy")
        self.assertEqual(settlement.grid[1][1], "academy")

        # Build out of bounds
        success = settlement.build("alchemy laboratory", 5, 5, logs)
        self.assertFalse(success)

        # Build over existing structure
        success = settlement.build("alchemy laboratory", 0, 0, logs)
        self.assertFalse(success)

        # Build 4-lot structure (castle)
        success = settlement.build("castle", 3, 3, logs)
        self.assertTrue(success)
        self.assertEqual(settlement.grid[3][3], "castle")
        self.assertEqual(settlement.grid[3][4], "castle")
        self.assertEqual(settlement.grid[4][3], "castle")
        self.assertEqual(settlement.grid[4][4], "castle")

    def test_kingdom_build_structure(self):
        game = Engine.Kingdom("Test Kingdom", flavor="swamp")
        game.bp = 100
        game.timber = 100
        game.rations = 100
        game.stone = 100
        game.current_view = (5, 5) # Assuming we are viewing the capital
        game.stage = 3 # Bypass stage limitation for building test

        # We need a settlement
        game.world[5][5].settlement = Engine.Settlement("Capital")

        # Mock input to confirm building
        with patch('builtins.input', return_value='yes'):
            game.build_structure("alchemy laboratory", 0, 0)
            self.assertEqual(game.world[5][5].settlement.grid[0][0], "alchemy laboratory")

class TestEngineCitizens(unittest.TestCase):
    def setUp(self):
        self.game = Engine.Kingdom("Test Kingdom", flavor="swamp")
        self.game.pending_hero_selection = False

    def test_monthly_tick_increments_turn(self):
        initial_turn = self.game.turn
        self.game.monthly_tick()
        self.assertEqual(self.game.turn, initial_turn + 1)
        self.assertTrue(any(f"--- Month {initial_turn + 1} Begins ---" in entry for entry in self.game.log))

    def test_kingdom_founded_citizen_trigger(self):
        # We start with level 1, so "Kingdom founded" condition is always true.
        self.game.monthly_tick()
        self.assertIn("Edrist Hanvaki", self.game.spawned_citizens)
        self.assertTrue(any("Edrist Hanvaki" in entry for entry in self.game.log))

    def test_structure_citizen_trigger(self):
        # Edrist spawns immediately so clear spawned list for clear test
        self.game.spawned_citizens.clear()

        # Test "Build a Lumberyard" condition
        self.assertNotIn("Stas", self.game.spawned_citizens)

        # Manually create a settlement and a lumberyard
        # Ensure we don't accidentally pick the capital at 5,5
        x, y = 1, 1
        self.game.world[y][x].settlement = Engine.Settlement("Test Village")

        # Lumberyard takes 2 lots, place it on the settlement grid
        self.game.world[y][x].settlement.grid[0][0] = "lumberyard"
        self.game.world[y][x].settlement.grid[0][1] = "lumberyard"

        self.game.monthly_tick()

        # Check if the lumberjack spawned
        self.assertIn("Stas", self.game.spawned_citizens)
        self.assertTrue(any("Stas" in entry for entry in self.game.log))

if __name__ == '__main__':
    unittest.main()
