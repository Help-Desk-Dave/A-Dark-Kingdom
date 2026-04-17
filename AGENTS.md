# AGENTS.md: Project Standards for "A Dark Kingdom"

## 🗺️ Project Overview
A real-time kingdom simulator merging Pathfinder: Kingmaker rules and Dwarf Fortress pop simulation. Developed as a dual-track project (Python CLI and React Web).

## 🏗️ Architecture
* **Data Layer (`library.py`)**: Static templates, structure costs, and naming pools.
* **Logic Layer (`Engine.py` / `App.jsx`)**: Threaded simulation loops and state management.
* **Constraint**: Never hardcode mechanical values in the logic layer. Always reference the Data Layer.

## ⚖️ The "Law" (Core Rules)
* **Real-Time**: The simulation ticks automatically every 5 seconds. Logic must be non-blocking.
* **Financial Guardrails**: The "Treasurer" must warn the player if BP < 15. Block purchases if BP is insufficient.
* **Pathfinder Fidelity**: 5 BP for Recon, 10 BP for Claim, 25 BP for Annual Upkeep.
* **Advisor Math**: Bonuses are calculated as `Attribute // 4`.
* **Source of Truth**: All mechanical values (costs, bonuses, DC checks) must align with the Kingmaker Second Edition Player's Guide. AI should reference the provided PDF or `library.py` before suggesting balance changes.

## 💻 Technical Standards
* **Thread Safety**: Use `threading.Lock` in Python for all state changes to prevent race conditions during the real-time tick.
* **UI First**: Use the `rich` library for CLI visuals and Tailwind for Web visuals. (No incompatible libraries like tkinter or pygame).
* **Error Handling**: Log errors to the in-game "Event Log" rather than crashing the process.
* **Naming Conventions**: Use `PascalCase` for classes (e.g., Kingdom, Pop) and `snake_case` for variables and functions in Python. In React, use `camelCase` for variables and `PascalCase` for components.
* **Event Logging**: Instead of standard `print()` statements, all game events must be routed through the `log_event()` or `addLog()` methods to ensure they appear in the UI's event ledger.

## 🧪 Testing & Validation
* Run `test_engine.py` after changes to resource math. Ensure unit tests exist for the "Monthly Tick" to ensure consumption (Food/Pop) and income (BP/Advisors) are calculating correctly.
* Verify that new structures update the "Overcrowded" logic.
* **State Persistence**: Verify that any new features are added to the localStorage logic in the web version and don't break the `__init__` states in Python.

## 🌟 Additional Information
* **Flavor Extensibility**: The UI must support "Flavor Sets" (Swamp, Icy, Necromancy). Do not hardcode specific flavor strings (like "Swamp") if the logic should be dynamic.
* **Dual-Track Sync**: Any logic change in the Python engine should be mirrored in the React/Vite application to keep the two versions identical in difficulty and feel.
