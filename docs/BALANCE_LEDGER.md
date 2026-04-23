### ⚖️ Balance Report: Stage 2 Economy / Construction Queue
**Target System:** Stage 2 Economy / Construction Queue
**The Problem:** The manual gathering rates for Timber (50ms * 100 = 5s), Rations (5s), and Stone (80ms * 100 = 8s) create significant player fatigue and grind. Building a simple House (6 Timber, 6 Rations, 3 Stone) requires 30s of Timber gathering, 30s of Ration hunting, and 24s of Stone gathering, totaling 84 seconds of real-time, non-stop clicking and waiting just to afford the materials for *one* house. This extreme "Sweat Equity" burden makes scaling up a settlement un-fun and mathematically tedious.
**Simulation Data:** Simulation of 1 house cost requires 6 Timber, 6 Rations, 3 Stone. With current speeds, that's ~1.4 real-time minutes of waiting.

**Proposed Adjustments (DO NOT IMPLEMENT):**
* `App.jsx`: Reduce `handleGatherTimber` interval from `50` to `20`.
* `App.jsx`: Reduce `handleHuntRations` interval from `50` to `20`.
* `App.jsx`: Reduce `handleGatherStone` interval from `80` to `30`.

**Notes for Future Agents:** The time scaling here was too punishing for basic resources. Speeding it up allows for a much smoother transition into mid-game macro-management.

### ⚖️ Balance Report: Unrest Death Spiral & Annual Upkeep
**Target System:** Stage 4 Economy / Annual Upkeep
**The Problem:** The game forces a 25 BP `ANNUAL_UPKEEP` every in-game year. If the player cannot afford this, `unrest` increases by 1. If `unrest` reaches 10, the population stops growing (`usePopulationEngine.js` immigration threshold). The fatal flaw is that **there is currently no mechanism to reduce unrest** once it is gained, even though structures like the "Castle" and "Barracks" claim to do so in their descriptions. This means if a player misses the upkeep 10 times, the game soft-locks into a permanent zero-growth state (Death Spiral).
**Simulation Data:** 10 missed upkeeps = 10 Unrest. Immigration stops. No new pops = No more builders. Economy stagnates permanently.

**Proposed Adjustments (DO NOT IMPLEMENT):**
* `App.jsx`: Implement a mechanism when a `Castle` or `Barracks` is built to reduce `unrest` (e.g., `setUnrest(u => Math.max(0, u - 2))`).
* `App.jsx`: Add a manual action or advisor action to spend BP or Resources to lower unrest.
* `library.js`: The description for Castle and Barracks needs to be mechanically supported in `App.jsx`.

**Notes for Future Agents:** The Death Spiral is mathematically guaranteed if the player makes enough early mistakes, as unrest is strictly monotonic increasing.

### ⚖️ Balance Report: Stage 0 and 1 Soft-Lock Verification
**Target System:** Stage 0 and 1 Economy
**The Problem:** I have verified the math for early game soft-locks. In Stage 0, players only gather sticks and there is no mechanism that reduces sticks. Thus, no soft-lock is possible. In Stage 1, players gather Timber, Rations, and Stone to establish a camp. The only mechanism that reduces Timber/Rations is the "Sell Resources" button, but that requires Stage 2 to appear. Therefore, Stage 1 is perfectly safe from soft-locks. The player is guaranteed a mathematical path forward.
**Simulation Data:** `sticks` monotonically increases. `timber`/`rations` monotonically increases until Stage 2.

**Proposed Adjustments (DO NOT IMPLEMENT):**
* None. The Stage 0/1 math is secure.

**Notes for Future Agents:** Guardrails passed successfully.

### ⚖️ Balance Report: Late Game Resource Scaling
**Target System:** Stage 3+ Economy
**The Problem:** Mid-to-late game structures have high resource costs that do not scale well with manual gathering rates. For example, a `Castle` costs 108 Timber, 108 Rations, and 54 Stone. With current base gather rates, it takes 1512 real-time seconds (over 25 minutes) of non-stop clicking to afford the materials for a single Castle if relying primarily on manual gathering. This fundamentally breaks the "Sweat Equity" pacing, turning what should be a milestone achievement into a tedious grind.
**Simulation Data:** 108 clicks * 5s (Timber) + 108 clicks * 5s (Rations) + 54 clicks * 8s (Stone) = 1512s.

**Proposed Adjustments (DO NOT IMPLEMENT):**
* `App.jsx`: Increase the base yield of `handleGatherTimber`, `handleHuntRations`, and `handleGatherStone` based on the current `stage` (e.g., `setTimber(t => t + (1 + stage))`).
* `App.jsx`: Alternatively, increase the click yield multiplier if specific structures (like `Lumberyard` or `Granary`) have been built.
* `library.js`: Consider reducing the material costs of high-end `edifice` structures if manual gathering is intended to remain the primary fallback.

**Notes for Future Agents:** Ensuring "Sweat Equity" remains viable means manual clicks should still feel impactful even when the kingdom scales. A flat +1 yield in late game is mathematically demoralizing.

### ⚖️ Balance Report: 2026-04-21
**Target System:** Stage 2/3 Economy / Construction Queue
**The Problem:** The manual "Help Build" and manual resource gathering actions scale extremely poorly compared to passive systems, mathematically discouraging manual play and violating the "Sweat Equity" metric. Passive building yields 1 progress per second per builder. In contrast, "Help Build" takes 5 seconds to yield +2 progress (0.4 progress/sec). Gathering resources manually yields only 0.2 resources per second. For a mid-game structure like a Castle (costing 270 total materials requiring 135 progress), clicking "Help Build" every 5 seconds is barely impactful and induces high player fatigue compared to waiting 135 seconds passively with a single builder.

**Simulation Data:** Simulation of construction timings shows that a Castle takes 135 seconds passively with 1 builder. Clicking "Help Build" non-stop only reduces this time to ~96 seconds. "Help Build" adds only 0.4 progress per second, compared to the base passive rate of 1.0 progress per second per builder.

**Proposed Adjustments (DO NOT IMPLEMENT):**
* `App.jsx`: Increase the "Help Build" progress yield from `+2` to `+10` or reduce the time interval significantly to bring the manual effort rate closer to or exceeding the passive build rate (e.g., > 1.0 progress/sec).
* `App.jsx`: Increase manual resource gathering yields (Timber, Rations, Stone) from `+1` to at least `+5` per 5 seconds.

**Notes for Future Agents:** Mason, if you implement this, consider adding a visual cooldown or charge indicator so that large bursts of progress feel weighty, avoiding the need for constant frantic clicking to achieve optimal build speeds.

### ⚖️ Balance Report: 2026-04-21 / Help Build Macro Analysis
**Target System:** Stage 2/3 Economy / Construction Queue
**The Problem:** The manual "Help Build" and manual resource gathering actions scale extremely poorly compared to passive systems, mathematically discouraging manual play and violating the "Sweat Equity" metric. Passive building yields 1 progress per second per builder. In contrast, "Help Build" takes 5 seconds to yield +2 progress (0.4 progress/sec). Gathering resources manually yields only 0.2 resources per second. For a mid-game structure like a Castle (costing 270 total materials requiring 270 progress base), clicking "Help Build" every 5 seconds is barely impactful and induces high player fatigue compared to waiting passively with a single builder.

**Simulation Data:** Simulation of construction timings shows that a Castle takes 270 seconds passively with 1 builder. Clicking "Help Build" non-stop only reduces this time to 194 seconds. "Help Build" adds only 0.4 progress per second, compared to the base passive rate of 1.0 progress per second per builder. If the player never clicks "Help Build", it takes 270 seconds. The differential effort-to-reward ratio for clicking continuously over 3+ minutes is far too low.

**Proposed Adjustments (DO NOT IMPLEMENT):**
* `App.jsx`: Increase the "Help Build" progress yield from `+2` to `+10` or reduce the time interval significantly to bring the manual effort rate closer to or exceeding the passive build rate (e.g., > 1.0 progress/sec).

**Notes for Future Agents:** Mason, if you implement this, consider adding a visual cooldown or charge indicator so that large bursts of progress feel weighty, avoiding the need for constant frantic clicking to achieve optimal build speeds.

### ⚖️ Balance Report: 2026-04-21 / Death Spiral & Upkeep
**Target System:** Stage 4 Economy / Annual Upkeep
**The Problem:** The annual upkeep requires 25 BP starting year 4710. A player starting with the default 60 BP will run out in Year 3. Since unrest monotonically increases by 1 for every year in debt, and a Treasurer bonus might be 0 without specific advisors or if early-game sells are missed, the game mathematically guarantees a soft-lock (unrest = 10 stopping all immigration) by Year 12 (4722). There is no reliable mechanism to shed unrest or quickly recover BP once the death spiral begins, meaning a player who isn't aggressively selling 250 Timber and Rations every year will face a slow, mathematically inevitable game over.

**Simulation Data:** Starting BP: 60. Year 1: 35. Year 2: 10. Year 3: -15 (Unrest 1). Year 12: Unrest 10. Immigration stops. Population caps. Economy stagnates.

**Proposed Adjustments (DO NOT IMPLEMENT):**
* `App.jsx`: Add a base static income or reduce `ANNUAL_UPKEEP`.
* `App.jsx`: Add an "Amnesty" action or event to reset unrest at a massive raw resource cost to allow a bounce back.
* `library.js`: The descriptions for 'Castle' and 'Barracks' claim they reduce unrest, but currently `unrest` is never reduced in code.

**Notes for Future Agents:** The unrest soft-lock is one of the most fatal mechanical dead ends in the current loop.

### ⚖️ Balance Report: 2026-04-23 / Help Build Optimization
**Target System:** Stage 2/3 Economy / Construction Queue
**The Problem:** The "Sweat Equity" burden for mid-to-late game structures like the Castle is too high. Waiting passively takes 270 seconds. With the current "Help Build" yield (+2 progress every 5 seconds), clicking optimally only reduces the time to 194 seconds. This differential effort-to-reward ratio for constant manual clicking is too low and induces player fatigue.
**Simulation Data:** A simulation script testing an increased yield of +10 progress every 5 seconds shows a reduction in total build time from 270 seconds to 90 seconds for a Castle. This significantly improves the manual effort reward and makes the "Sweat Equity" viable.

**Proposed Adjustments (DO NOT IMPLEMENT):**
* `App.jsx`: Increase the "Help Build" progress yield from `+2` to `+10`.

**Notes for Future Agents:** Mason, if you implement this, consider adding a visual cooldown or charge indicator so that large bursts of progress feel weighty, avoiding the need for constant frantic clicking to achieve optimal build speeds.
