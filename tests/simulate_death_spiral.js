import { ANNUAL_UPKEEP } from '../frontend/src/library.js';

function simulateDeathSpiral() {
    let year = 1;
    let bp = 60; // Starting BP
    let unrest = 0;

    // In usePopulationEngine.jsx, we see immigration occurs if unrest < 10.
    // At unrest >= 10, the death spiral is reached.
    // Upkeep is demanded annually, which is gameTime.day === 1 && gameTime.month === 1 && gameTime.year > 4710
    // So 1st upkeep is year 1 (in game year 4711).

    while (unrest < 10 && year < 100) {
        bp -= ANNUAL_UPKEEP;
        if (bp < 0) {
            unrest += 1;
        }
        year++;
    }

    return {
        yearsToDeathSpiral: year - 1, // Subtract 1 because loop increments at the end of the year it reaches 10
        finalUnrest: unrest,
        finalBp: bp
    };
}

const result = simulateDeathSpiral();
console.log(`DEATH SPIRAL SIMULATION:`);
console.log(`- Years until Death Spiral (Unrest = 10): ${result.yearsToDeathSpiral}`);
console.log(`- Final Unrest: ${result.finalUnrest}`);
console.log(`- Final BP: ${result.finalBp}`);
