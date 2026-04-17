with open("Engine.py", "r") as f:
    content = f.read()
import re
new_content = re.sub(r'<<<<<<< HEAD(.*?)=======(.*?)>>>>>>> origin/main', r'\1', content, flags=re.DOTALL)
with open("Engine.py", "w") as f:
    f.write(new_content)
