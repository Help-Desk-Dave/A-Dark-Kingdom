import unittest
from unittest.mock import patch
from Engine import Kingdom, Hex, Settlement, Building
from data_libraries import STRUCTURES_DB

class TestSettlement(unittest.TestCase):
    def setUp(self):
        self.settlement = Settlement("Testville")

    def test_initial_lots(self):
        self.assertEqual(self.settlement.residential_lots, 0)
        self.assertEqual(self.settlement.other_lots, 0)
        self.assertFalse(self.settlement.is_overcrowded)

    def test_place_residential_building(self):
        success, msg = self.settlement.place_building("houses", 0, 0)
        self.assertTrue(success)
        self.assertEqual(self.settlement.residential_lots, 1)
        self.assertFalse(self.settlement.is_overcrowded)

    def test_place_other_building(self):
        success, msg = self.settlement.place_building("farm", 0, 0)
        self.assertTrue(success)
        self.assertEqual(self.settlement.other_lots, 1)
        self.assertTrue(self.settlement.is_overcrowded)

    def test_place_occupied_lot(self):
        self.settlement.place_building("houses", 0, 0)
        success, msg = self.settlement.place_building("farm", 0, 0)
        self.assertFalse(success)
        self.assertEqual(msg, "Lot is occupied.")

    def test_place_invalid_lot(self):
        success, msg = self.settlement.place_building("houses", 3, 3)
        self.assertFalse(success)
        self.assertEqual(msg, "Invalid lot coordinates.")

    def test_unknown_structure(self):
        success, msg = self.settlement.place_building("super_laser", 0, 0)
        self.assertFalse(success)
        self.assertIn("Unknown structure", msg)

class TestStructures(unittest.TestCase):
    def test_all_structures_have_traits(self):
        for name, data in STRUCTURES_DB.items():
            self.assertIn("traits", data, f"Structure '{name}' missing 'traits'")
            self.assertIsInstance(data["traits"], list)

class TestKingdomEngine(unittest.TestCase):
    def setUp(self):
        self.game = Kingdom("Test Kingdom", flavor="swamp")

    def test_initial_state(self):
        self.assertEqual(self.game.name, "Test Kingdom")
        self.assertEqual(self.game.bp, 60)
        self.assertEqual(self.game.unrest, 0)
        self.assertEqual(len(self.game.world), 10)

    def test_reconnoiter(self):
        initial_bp = self.game.bp

        # Test out of bounds
        self.game.reconnoiter(-1, -1)
        self.assertEqual(self.game.bp, initial_bp)
        self.assertIn("out of bounds", self.game.log[-1])

        # Test valid reconnoiter
        self.game.reconnoiter(0, 0)
        self.assertEqual(self.game.world[0][0].status, 1)
        self.assertEqual(self.game.bp, initial_bp - 5)

    def test_claim_hex(self):
        # Must reconnoiter first
        self.game.claim_hex(1, 1)
        self.assertIn("must map this area", self.game.log[-1])

        self.game.reconnoiter(1, 1)
        initial_bp = self.game.bp

        # Now claim
        self.game.claim_hex(1, 1)
        self.assertEqual(self.game.world[1][1].status, 2)
        self.assertEqual(self.game.bp, initial_bp - 10)

    def test_flavor_initialization(self):
        swamp_game = Kingdom("Swampy", flavor="swamp")
        self.assertEqual(swamp_game.style["color"], "green")
        self.assertIn("swamp", swamp_game.log[0].lower())

        icy_game = Kingdom("Frosty", flavor="icy")
        self.assertEqual(icy_game.style["color"], "cyan")
        self.assertIn("frozen wastes", icy_game.log[0].lower())

    def test_flavor_dynamic_switching(self):
        self.game.flavor = "desert"
        from data_libraries import FLAVORS
        self.game.style = FLAVORS["desert"]
        self.assertEqual(self.game.style["color"], "yellow")

    @patch('data_libraries.random.choice')
    def test_get_random_citizen(self, mock_choice):
        mock_choice.return_value = "Urist"
        from data_libraries import get_random_citizen
        citizen = get_random_citizen()
        self.assertEqual(citizen, "Urist")

if __name__ == '__main__':
    unittest.main()
