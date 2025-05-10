// app.js - Client-side logic for Calcsheet Generator

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
 */
function displayProblems(numProblems = 15, numDigits = 3) {
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

    for (let i = 0; i < numProblems; i++) {
        let problemData;
        let operatorSymbol;
        let correctAnswer;

        // Randomly decide between addition and subtraction
        if (Math.random() < 0.5) {
            // Addition
            problemData = generateAdditionProblem(numDigits);
            operatorSymbol = '+';
            correctAnswer = problemData.sum;
        } else {
            // Subtraction
            problemData = generateSubtractionProblem(numDigits);
            operatorSymbol = '−'; // Using minus sign, not hyphen
            correctAnswer = problemData.difference;
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
    const urlParams = new URLSearchParams(window.location.search);
    let initialDigits = parseInt(urlParams.get('digits'), 10) || 3;
    let initialCount = parseInt(urlParams.get('count'), 10) || 15;

    // Clamp digits to 3 or 4
    if (initialDigits !== 3 && initialDigits !== 4) {
        initialDigits = 3;
    }
    if (initialCount < 1) {
        initialCount = 1;
    }


    const numDigitsInput = document.getElementById('num-digits');
    const numProblemsInput = document.getElementById('num-problems');
    const generateSheetButton = document.getElementById('generate-sheet-btn');

    if (numDigitsInput && numProblemsInput && generateSheetButton) {
        numDigitsInput.value = initialDigits;
        numProblemsInput.value = initialCount;

        generateSheetButton.addEventListener('click', () => {
            let digits = parseInt(numDigitsInput.value, 10);
            let count = parseInt(numProblemsInput.value, 10);

            // Validate and default if necessary
            if (digits !== 3 && digits !== 4) {
                digits = 3;
                numDigitsInput.value = digits; // Correct input field if invalid
            }
            if (count < 1) {
                count = 1;
                numProblemsInput.value = count; // Correct input field if invalid
            }
            
            // Optional: Update URL query parameters
            // const newUrl = `${window.location.pathname}?digits=${digits}&count=${count}`;
            // window.history.pushState({ path: newUrl }, '', newUrl);

            displayProblems(count, digits);
        });
    } else {
        console.warn('Configuration input fields or button not found. Using defaults or URL params for initial generation.');
    }

    // Initial call to display problems
    displayProblems(initialCount, initialDigits);
});