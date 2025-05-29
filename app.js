// app.js - Client-side logic for Calcsheet Generator
import { 
    generateAdditionProblem, 
    generateSubtractionProblem, 
    generateMultiplicationProblem 
} from './math_generator.js';

/**
 * Calculates the sum of the digits of a given number.
 * @param {number} number - The number to process.
 * @returns {number} The sum of the digits.
 */
function getDigitSum(number) {
    const numStr = String(Math.abs(number));
    let sum = 0;
    for (let digit of numStr) {
        sum += parseInt(digit, 10);
    }
    return sum;
}

/**
 * Calculates the control sum based on the "Digital Root of the Sum of Digits of All Answers" method.
 * @param {number[]} answersArray - An array of correct answers to the problems.
 * @returns {number} The calculated control sum (a single digit from 0-9).
 */
function calculateControlSum(answersArray) {
    if (!answersArray || answersArray.length === 0) {
        return 0;
    }

    const sumOfIndividualDigitSums = answersArray
        .map(answer => getDigitSum(answer))
        .reduce((total, currentDigitSum) => total + currentDigitSum, 0);

    if (sumOfIndividualDigitSums === 0) {
        return 0;
    }
    // Digital root formula: (n-1) % 9 + 1 for n > 0
    return (sumOfIndividualDigitSums - 1) % 9 + 1;
}

/**
 * Generates and displays math problems on the page.
 * @param {number} numProblems - The total number of problems to generate.
 * @param {number} numDigits - The number of digits for the operands in the problems (e.g., 3 or 4).
 * @param {string} operationMode - The selected operation mode ("addition", "subtraction", "multiplication", "mixed").
 */
function displayProblems(numProblems = 15, numDigits = 3, operationMode = "mixed") {
    const problemsGrid = document.getElementById('problems-grid');
    const controlSumValueEl = document.getElementById('control-sum-value');
    const controlSumInstructionsEl = document.getElementById('control-sum-instructions');

    if (!problemsGrid || !controlSumValueEl || !controlSumInstructionsEl) {
        console.error('Required DOM elements not found!');
        return;
    }

    // Clear existing problems
    problemsGrid.innerHTML = '';
    const correctAnswers = [];
    let hasMultiplicationProblem = false; // Track if any multiplication problem is generated

    for (let i = 0; i < numProblems; i++) {
        let problemData;
        let operatorSymbol;
        let correctAnswer;

        let currentMode = operationMode;
        if (operationMode === "mixed") {
            const rand = Math.random();
            if (rand < 0.333) {
                currentMode = "addition";
            } else if (rand < 0.666) {
                currentMode = "subtraction";
            } else {
                currentMode = "multiplication";
                if (operationMode === "mixed") hasMultiplicationProblem = true; // Set flag if mixed mode picks multiplication
            }
        } else if (operationMode === "multiplication") {
            hasMultiplicationProblem = true; // Set flag if mode is explicitly multiplication
        }

        switch (currentMode) {
            case "addition":
                problemData = generateAdditionProblem(numDigits);
                operatorSymbol = '+';
                correctAnswer = problemData.sum;
                break;
            case "subtraction":
                problemData = generateSubtractionProblem(numDigits);
                operatorSymbol = '−'; // Using minus sign, not hyphen
                correctAnswer = problemData.difference;
                break;
            case "multiplication":
                // Adjust numDigits for multiplication if necessary,
                // as generateMultiplicationProblem expects 2, 3 or 4 for operand1.
                // For simplicity, we'll assume the global numDigits setting is appropriate here.
                // If numDigits is, for example, 1 (which isn't allowed by current UI for add/sub),
                // generateMultiplicationProblem would throw an error.
                // The UI currently restricts numDigits to 3 or 4.
                // generateMultiplicationProblem handles numDigits 2, 3, 4.
                // Let's ensure numDigits passed to generateMultiplicationProblem is valid.
                let multNumDigits = numDigits;
                if (numDigits < 2) multNumDigits = 2; // Default to 2 if global numDigits is too small
                if (numDigits > 4) multNumDigits = 4; // Default to 4 if global numDigits is too large (though UI prevents this)

                problemData = generateMultiplicationProblem(multNumDigits);
                operatorSymbol = '×'; // Using multiplication sign
                correctAnswer = problemData.product;
                break;
            default:
                console.error("Unknown operation mode:", currentMode);
                // Fallback to addition
                problemData = generateAdditionProblem(numDigits);
                operatorSymbol = '+';
                correctAnswer = problemData.sum;
        }
        correctAnswers.push(correctAnswer);

        const problemDiv = document.createElement('div');
        problemDiv.classList.add('problem');

        const operand1Div = document.createElement('div');
        operand1Div.classList.add('operand1');
        operand1Div.textContent = problemData.operand1;

        const operatorOperand2Div = document.createElement('div');
        operatorOperand2Div.classList.add('operator-operand2');
        operatorOperand2Div.textContent = `${operatorSymbol} ${problemData.operand2}`;
        
        const hr = document.createElement('hr');
        hr.classList.add('problem-line');

        const answerSpaceDiv = document.createElement('div');
        answerSpaceDiv.classList.add('answer-space');
        // answerSpaceDiv.textContent = correctAnswer; // For debugging, remove for actual sheet

        problemDiv.appendChild(operand1Div);
        problemDiv.appendChild(operatorOperand2Div);
        problemDiv.appendChild(hr);
        problemDiv.appendChild(answerSpaceDiv);

        problemsGrid.appendChild(problemDiv);
    }

    // Calculate and display control sum
    const controlSum = calculateControlSum(correctAnswers);
    controlSumValueEl.textContent = controlSum;

    // Adjust grid layout based on whether multiplication problems are present
    problemsGrid.classList.remove('two-columns-grid'); // Reset grid class
    if (hasMultiplicationProblem) {
        problemsGrid.classList.add('two-columns-grid');
    }

    // Display control sum instructions
    controlSumInstructionsEl.innerHTML = `
        <strong>Control Sum Calculation:</strong> Digital Root of the Sum of Digits of All Answers.
        <ol>
            <li>For each problem, find the correct answer.</li>
            <li>For each answer, sum all its digits (e.g., if an answer is 123, its digit sum is 1+2+3=6).</li>
            <li>Add all these individual digit sums together to get a grand total.</li>
            <li>Find the digital root of this grand total: repeatedly sum the digits of the total until you get a single-digit number (1-9). If the total is 0, the digital root is 0.</li>
        </ol>
    `;
}

// Main execution logic after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("MOCK_APP_DEBUG: app.js DOMContentLoaded callback STARTING");
    const urlParams = new URLSearchParams(window.location.search);
    let initialDigits = parseInt(urlParams.get('digits'), 10) || 3;
    let initialCount = parseInt(urlParams.get('count'), 10) || 15;
    // Default to "mixed" if no mode is specified or if the mode from URL is invalid
    let initialMode = urlParams.get('mode') || "mixed"; 
    const validModes = ["addition", "subtraction", "multiplication", "mixed"];
    if (!validModes.includes(initialMode)) {
        initialMode = "mixed";
    }


    // Mode-aware clamping for initialDigits
    if (initialMode === "multiplication") {
        if (initialDigits < 2 || initialDigits > 4) {
            initialDigits = 2; // Default for multiplication if out of range (2, 3, 4)
        }
    } else { // For "addition", "subtraction", "mixed"
        if (initialDigits !== 3 && initialDigits !== 4) {
            initialDigits = 3; // Default for these modes if not 3 or 4
        }
    }
    if (initialCount < 1) {
        initialCount = 1;
    }


    const numDigitsInput = document.getElementById('num-digits');
    const numProblemsInput = document.getElementById('num-problems');
    const operationModeInput = document.getElementById('operation-mode');
    const generateSheetButton = document.getElementById('generate-sheet-btn');

    console.log("MOCK_APP_DEBUG: numDigitsInput found?", !!numDigitsInput);
    console.log("MOCK_APP_DEBUG: numProblemsInput found?", !!numProblemsInput);
    console.log("MOCK_APP_DEBUG: operationModeInput found?", !!operationModeInput);
    console.log("MOCK_APP_DEBUG: generateSheetButton found?", !!generateSheetButton);

    if (numDigitsInput && numProblemsInput && operationModeInput && generateSheetButton) {
        console.log("MOCK_APP_DEBUG: All inputs and button found. Setting values and listener.");
        numDigitsInput.value = String(initialDigits); // Ensure string assignment
        numProblemsInput.value = String(initialCount); // Ensure string assignment
        operationModeInput.value = initialMode;

        generateSheetButton.addEventListener('click', () => {
            let digits = parseInt(numDigitsInput.value, 10);
            let count = parseInt(numProblemsInput.value, 10);
            let mode = operationModeInput.value;

            // Validate and default if necessary
            if (mode === "multiplication") {
                if (digits < 2 || digits > 4) { // Valid for mult: 2, 3, 4
                    digits = 2; // Default for mult if out of range (e.g. if user typed 1 or 5)
                    numDigitsInput.value = String(digits);
                }
            } else { // For addition, subtraction, mixed (which defaults to add/sub rules for digits)
                if (digits !== 3 && digits !== 4) {
                    digits = 3; // Default for add/sub if out of range
                    numDigitsInput.value = String(digits);
                }
            }

            if (count < 1) {
                count = 1;
                numProblemsInput.value = count; // Correct input field if invalid
            }
            
            // Optional: Update URL query parameters
            // const newUrl = `${window.location.pathname}?digits=${digits}&count=${count}&mode=${mode}`;
            // window.history.pushState({ path: newUrl }, '', newUrl);

            displayProblems(count, digits, mode);
            console.log("MOCK_APP_DEBUG: displayProblems called from button click.");

            const configurationSection = document.getElementById('configuration-section');
            if (configurationSection) {
                configurationSection.classList.add('hidden');
            }
        });
    } else {
        console.warn('MOCK_APP_DEBUG: WARN - Configuration input fields or button not found. Using defaults or URL params for initial generation.');
    }

    // Initial call to display problems
    console.log("MOCK_APP_DEBUG: Calling initial displayProblems with:", initialCount, initialDigits, initialMode);
    displayProblems(initialCount, initialDigits, initialMode);
    console.log("MOCK_APP_DEBUG: app.js DOMContentLoaded callback FINISHED");
});