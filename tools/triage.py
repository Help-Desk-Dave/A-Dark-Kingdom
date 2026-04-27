import os
try:
    from rich.console import Console
    from rich.panel import Panel
    from rich.markdown import Markdown
    from rich.prompt import Prompt
except ImportError:
    print("Please install rich: pip install rich")
    exit()

console = Console()

# Define the ledgers where Analysts dump their reports
LEDGER_FILES = [
    "docs/BALANCE_LEDGER.md",
    "docs/VIBE_LEDGER.md",
    "docs/NIGHTWATCH_REPORT.md"
]

# The master file where Builders look for authorized work
APPROVED_FILE = "docs/APPROVED_TASKS.md"

def process_ledgers():
    # Ensure the approved file exists
    if not os.path.exists(APPROVED_FILE):
        os.makedirs(os.path.dirname(APPROVED_FILE), exist_ok=True)
        with open(APPROVED_FILE, "w", encoding="utf-8") as f:
            f.write("# ✅ Authorized Tasks for Builders\n\n")

    for filepath in LEDGER_FILES:
        if not os.path.exists(filepath):
            continue
            
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        # Split the document by '### ' to isolate individual reports/proposals
        parts = content.split("\n### ")
        
        # If there's only 1 part, it means there are no proposals (just the header)
        if len(parts) <= 1:
            continue 
            
        header = parts[0]
        proposals = ["### " + p for p in parts[1:]]
        
        kept_proposals = []
        approved_proposals = []
        
        console.print(f"\n[bold cyan]Opening {filepath}...[/bold cyan]")
        
        for prop in proposals:
            console.print(Panel(Markdown(prop), title="Pending Review", border_style="yellow"))
            choice = Prompt.ask(
                "[bold green]Action[/bold green] [([a]pprove, [r]eject, [s]kip)]", 
                choices=["a", "r", "s"], 
                default="s"
            )
            
            if choice == "a":
                approved_proposals.append(prop)
                console.print("[bold green]✔ Approved and moved to queue.[/bold green]\n")
            elif choice == "r":
                console.print("[bold red]✖ Rejected and trashed.[/bold red]\n")
            else:
                kept_proposals.append(prop)
                console.print("[bold dim]⏭ Skipped. Will remain in ledger.[/bold dim]\n")
                
        # Rewrite the original ledger with only the skipped items
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(header)
            for prop in kept_proposals:
                f.write("\n" + prop)
                
        # Append approved items to the master queue
        if approved_proposals:
            with open(APPROVED_FILE, "a", encoding="utf-8") as f:
                for prop in approved_proposals:
                    f.write("\n" + prop + "\n")

if __name__ == "__main__":
    console.print("[bold magenta]=== The Ruler's Triage Desk ===[/bold magenta]")
    process_ledgers()
    console.print("\n[bold magenta]Triage Complete. Authorized tasks are ready in docs/APPROVED_TASKS.md.[/bold magenta]")
