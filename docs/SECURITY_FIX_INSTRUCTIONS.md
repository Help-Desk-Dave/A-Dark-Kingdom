# 🔒 Security Fix: Insecure Randomness (Math.random)

## 🎯 What
The vulnerability involved using `Math.random()` for game logic that requires a degree of unpredictability (names, bed assignments, event rolls). While not high-severity for a game, `Math.random()` is not cryptographically secure and is considered poor security hygiene.

## 🛡️ Solution
I replaced all instances of `Math.random()` in the frontend with a new `secureRandom()` utility.

### Changes:
1.  **New Utility:** Created `frontend/src/utils/random.js`.
    - Uses `window.crypto.getRandomValues()` for strong randomness.
    - Includes a fallback to `Math.random()` for non-browser environments (SSR/Testing).
2.  **Logic Update:**
    - Updated `frontend/src/hooks/usePopulationEngine.jsx` (13 instances replaced).
    - Updated `frontend/src/App.jsx` (10 instances replaced).

## ⚠️ Environmental Note
During the task, the sandbox `node_modules` were lost and `pnpm install` failed due to network timeouts. **Manual verification** was performed:
- `grep` confirms all `Math.random()` calls are replaced.
- Syntax checked via `node -c` for JS files.
- `secureRandom()` verified to return valid floats [0, 1) in Node.

## ✅ Instructions for Local Verification
If you are running this locally, please perform the following checks:

1.  **Install Dependencies:**
    ```bash
    cd frontend
    pnpm install
    ```
2.  **Run Quality Checks:**
    ```bash
    pnpm lint
    pnpm format
    pnpm test
    pnpm build
    ```
3.  **Visual Check:**
    Start the dev server (`pnpm dev`) and ensure:
    - New settlers still arrive with random names.
    - World map generation still works correctly.
    - Progress bars and gathering actions still function.
