with open("Engine.py", "r") as f:
    content = f.read()

import_orig = "from library import STRUCTURES_DB, PROMINENT_CITIZENS"
import_new = "from library import STRUCTURES_DB, PROMINENT_CITIZENS, get_random_citizen"

content = content.replace(import_orig, import_new)

with open("Engine.py", "w") as f:
    f.write(content)
