with open("Engine.py", "r") as f:
    content = f.read()

cmds_orig = """        if action[0] == 'q': break

        # Lock the game state while processing user commands
        with my_game.lock:"""

cmds_new = """        if action[0] == 'q': break

        # Lock the game state while processing user commands
        with my_game.lock:
            if action[0] == 'assign' and len(action) == 3:
                role = action[1].lower()
                pop_name = action[2].lower()

                if role in my_game.advisors:
                    target_pop = next((p for p in my_game.citizens if p.name.lower() == pop_name), None)
                    if target_pop:
                        if target_pop.is_alive:
                            my_game.advisors[role] = target_pop
                            my_game.log.append(f"[+] Assigned {target_pop.name} to {role.capitalize()}.")
                        else:
                            my_game.log.append(f"[-] {target_pop.name} is dead and cannot be an advisor.")
                    else:
                        my_game.log.append(f"[-] Could not find a citizen named {pop_name}.")
                else:
                    my_game.log.append(f"[-] Invalid advisor role: {role}.")"""

content = content.replace(cmds_orig, cmds_new)

with open("Engine.py", "w") as f:
    f.write(content)
