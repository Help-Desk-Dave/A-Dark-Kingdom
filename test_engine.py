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

class TestEngineReconnoiter(unittest.TestCase):
    def setUp(self):
        # Initialize Kingdom with a fixed seed if possible,
        # but here we just want to test logic.
        self.game = Engine.Kingdom("Test Kingdom", flavor="swamp")
        self.game.bp = 60 # Ensure enough BP for tests

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

    def test_claim_hex_out_of_bounds(self):
        initial_bp = self.game.bp
        self.game.claim_hex(-1, -1)
        self.assertEqual(self.game.bp, initial_bp)
        self.assertTrue(any("[!] (-1,-1) is out of bounds!" in entry for entry in self.game.log))

        self.game.claim_hex(10, 10)
        self.assertEqual(self.game.bp, initial_bp)
        self.assertTrue(any("[!] (10,10) is out of bounds!" in entry for entry in self.game.log))

    def test_flavor_switching(self):
        from data_libraries import FLAVORS
        # Switch to icy
        self.game.flavor = "icy"
        self.game.style = FLAVORS["icy"]
        self.assertEqual(self.game.style["color"], "cyan")

        # Test rendering with icy flavor
        x, y = 0, 0
        self.game.world[y][x].status = 1
        self.game.world[y][x].terrain = "Mountain"

        # We need to mock the Text object's append method to see what's being added
        with patch('Engine.Text') as MockText:
            mock_text_inst = MockText.return_value
            self.game.render_map()

            # Check if it appended the icy mountain art " 🏔 "
            # It might append other things like " ?? ", "\n"
            # We look for a call that has " 🏔 " and style "cyan"
            found = False
            for call in mock_text_inst.append.call_args_list:
                if " 🏔 " in str(call) and "cyan" in str(call):
                    found = True
                    break
            self.assertTrue(found, "Should render icy mountain with cyan style.")

if __name__ == '__main__':
    unittest.main()
