# Scribe Journal
## 2024-04-20 - [Synced STATE_MACHINE with current game state]
**Learning:** The UI progression state machine frequently drifts, especially around transitions, because mechanics are simplified over time and specific checks shift logic layers. State machine transitions must be documented with explicit variable conditions from the code rather than broad narrative descriptions to remain accurate and helpful.
**Action:** Always search the codebase for literal variables and thresholds, rather than relying on textual summaries, and use explicit markdown conditions when documenting states.
