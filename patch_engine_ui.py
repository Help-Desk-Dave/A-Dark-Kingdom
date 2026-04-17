with open("Engine.py", "r") as f:
    content = f.read()

stats_orig = """    # Stats Table
    stats = Table.grid(expand=True)
    stats.add_row("BP (Treasury):", str(game.bp))
    stats.add_row("Unrest:", str(game.unrest))
    stats.add_row("Kingdom XP:", str(game.xp))
    stats.add_row("Turn:", str(game.turn))

    layout["stats"].update(Panel(stats, title="Kingdom Ledger"))
    layout["footer"].update(Panel("Commands: [R]econnoiter x,y | [C]laim x,y | [E]stablish Camp | View [W]orld / [S]ettlement | Flavor <name> | [N]ext | [Q]uit"))"""

stats_new = """    # Stats Table
    stats = Table.grid(expand=True)
    stats.add_row("BP (Treasury):", str(game.bp))
    stats.add_row("Unrest:", str(game.unrest))
    stats.add_row("Loyalty:", str(game.loyalty))
    stats.add_row("Kingdom XP:", str(game.xp))
    stats.add_row("Turn:", str(game.turn))

    stats.add_row("", "")
    stats.add_row("[bold]Advisors:[/bold]", "")
    for role, pop in game.advisors.items():
        stats.add_row(f"{role.capitalize()}:", pop.name if pop else "None")

    stats.add_row("", "")
    stats.add_row("[bold]Citizens:[/bold]", "")
    for pop in game.citizens:
        stats.add_row(f"{pop.name}", f"S:{pop.strength} I:{pop.intelligence} C:{pop.charisma}")

    ledger_style = "red" if game.bp < 10 else "white"
    layout["stats"].update(Panel(stats, title="Kingdom Ledger", border_style=ledger_style))
    layout["footer"].update(Panel("Commands: [R]econnoiter x,y | [C]laim x,y | [E]stablish Camp | View [W]orld / [S]ettlement | assign <role> <name> | Flavor <name> | [N]ext | [Q]uit"))"""

content = content.replace(stats_orig, stats_new)

with open("Engine.py", "w") as f:
    f.write(content)
