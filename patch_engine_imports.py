with open("Engine.py", "r") as f:
    content = f.read()
import re
new_content = content.replace("from library import", "from data_libraries import")
with open("Engine.py", "w") as f:
    f.write(new_content)

with open("test_engine.py", "r") as f:
    content = f.read()
new_content = content.replace("from library import", "from data_libraries import")
with open("test_engine.py", "w") as f:
    f.write(new_content)
