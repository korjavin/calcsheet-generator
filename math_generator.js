/**
 * Generates a random N-digit number.
 * @param {number} n - The number of digits.
 * @returns {number} A random n-digit number.
 */
export function generateRandomNDigitNumber(n) {
  if (n <= 0) {
    throw new Error("Number of digits must be positive.");
  }
  const min = Math.pow(10, n - 1);
  const max = Math.pow(10, n) - 1;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generates an addition problem with a specified number of digits, ensuring digit overflow.
 * @param {number} numDigits - The number of digits for the operands (3 or 4).
 * @returns {object} An object like { operand1, operand2, sum }.
 */
export function generateAdditionProblem(numDigits) {
  if (numDigits !== 3 && numDigits !== 4) {
    throw new Error("Number of digits must be 3 or 4 for addition problems.");
  }

  let operand1, operand2, sum;
  let hasOverflow = false;

  while (!hasOverflow) {
    operand1 = generateRandomNDigitNumber(numDigits);
    operand2 = generateRandomNDigitNumber(numDigits);
    sum = operand1 + operand2;

    // Check for overflow
    let tempOp1 = operand1;
    let tempOp2 = operand2;
    for (let i = 0; i < numDigits; i++) {
      const digit1 = tempOp1 % 10;
      const digit2 = tempOp2 % 10;
      if (digit1 + digit2 >= 10) {
        hasOverflow = true;
        break;
      }
      tempOp1 = Math.floor(tempOp1 / 10);
      tempOp2 = Math.floor(tempOp2 / 10);
    }
    // Also check if the sum has more digits than the operands, which is a clear overflow
    if (String(sum).length > numDigits) {
        hasOverflow = true;
    }
  }
  return { operand1, operand2, sum };
}

/**
 * Generates a subtraction problem with a specified number of digits, ensuring borrowing.
 * @param {number} numDigits - The number of digits for the operands (3 or 4).
 * @returns {object} An object like { operand1, operand2, difference }.
 */
export function generateSubtractionProblem(numDigits) {
  if (numDigits !== 3 && numDigits !== 4) {
    throw new Error("Number of digits must be 3 or 4 for subtraction problems.");
  }

  let operand1, operand2, difference;
  let hasBorrowing = false;

  while (!hasBorrowing) {
    operand1 = generateRandomNDigitNumber(numDigits);
    operand2 = generateRandomNDigitNumber(numDigits);

    // Ensure operand1 >= operand2 to avoid negative results
    if (operand1 < operand2) {
      [operand1, operand2] = [operand2, operand1]; // Swap them
    }
    difference = operand1 - operand2;

    // Check for borrowing
    let tempOp1 = operand1;
    let tempOp2 = operand2;
    for (let i = 0; i < numDigits; i++) {
      const digit1 = tempOp1 % 10;
      const digit2 = tempOp2 % 10;

      // Check if borrowing would be needed from the next digit for the current one
      // This is a simplified check; a more robust check would look at the actual subtraction process.
      // For now, if any digit in op1 is smaller than op2 (before considering previous borrows),
      // it's likely borrowing will occur.
      if (digit1 < digit2) {
          // To be more precise, we need to simulate the borrowing process.
          // Let's refine this check.
          let op1Str = String(operand1);
          let op2Str = String(operand2).padStart(op1Str.length, '0'); // Pad op2 if shorter
          let requiresBorrow = false;
          for (let j = op1Str.length - 1; j >= 0; j--) {
              let d1 = parseInt(op1Str[j]);
              let d2 = parseInt(op2Str[j]);
              if (d1 < d2) {
                  requiresBorrow = true;
                  break;
              } else if (d1 > d2) {
                  // If d1 > d2, no borrow needed for this column from higher columns,
                  // but a previous column might have borrowed from this d1.
                  // This simple check is tricky. A robust way is to perform subtraction digit by digit.
              }
          }
          // A simpler heuristic for borrowing:
          // If any digit of operand1 is less than the corresponding digit of operand2,
          // borrowing must occur from a higher place value *at some point*.
          // This isn't perfectly accurate for *guaranteeing* borrowing from an *adjacent* digit,
          // but it's a good proxy for "borrowing is involved".
          let o1Str = String(operand1);
          let o2Str = String(operand2).padStart(o1Str.length, '0');
          for (let k = 0; k < o1Str.length; k++) {
              if (parseInt(o1Str[o1Str.length - 1 - k]) < parseInt(o2Str[o2Str.length - 1 - k])) {
                  // Check if there's a non-zero digit to borrow from to the left
                  let canBorrow = false;
                  for (let l = o1Str.length - 2 - k; l >=0; l--) {
                      if (parseInt(o1Str[l]) > 0) {
                          canBorrow = true;
                          break;
                      }
                  }
                  if(canBorrow || k < o1Str.length -1) { // if it's not the most significant digit, borrowing is possible
                    hasBorrowing = true;
                    break;
                  }
              }
          }
          if (hasBorrowing) break; // from outer loop if borrowing found
      }
      if (hasBorrowing) break;
      tempOp1 = Math.floor(tempOp1 / 10);
      tempOp2 = Math.floor(tempOp2 / 10);
      if (tempOp1 === 0 && tempOp2 === 0) break; // no more digits
    }
     // Fallback: if the simple check didn't confirm, try a more direct simulation
    if (!hasBorrowing) {
        let o1Array = String(operand1).split('').map(Number).reverse();
        let o2Array = String(operand2).split('').map(Number).reverse();

        for (let i = 0; i < o1Array.length; i++) {
            let d2 = o2Array[i] || 0;
            if (o1Array[i] < d2) {
                hasBorrowing = true;
                break;
            }
            if (o1Array[i] > d2 && i + 1 < o1Array.length && o1Array[i+1] === 0) {
                // Check if a borrow would propagate through a zero
                let k = i + 1;
                while(k < o1Array.length && o1Array[k] === 0) {
                    k++;
                }
                if (k < o1Array.length && (o2Array[k] || 0) > 0) { // if there's something to subtract from the digit that will become 9
                   // This logic is getting complex. A simpler way:
                   // Iterate through digits. If op1_digit < op2_digit, then borrowing is needed.
                   // To ensure it's *actual* borrowing, we must ensure op1 > op2.
                }
            }
        }
    }
    // Refined borrowing check: iterate through digits from right to left.
    // If a digit in operand1 is less than operand2, borrowing is required.
    if (!hasBorrowing) {
        let s1 = String(operand1);
        let s2 = String(operand2).padStart(s1.length, '0');
        for (let i = s1.length - 1; i >= 0; i--) {
            let d1 = parseInt(s1[i]);
            let d2 = parseInt(s2[i]);
            if (d1 < d2) {
                // Borrowing is needed for this position.
                // We need to ensure there's something to borrow from.
                // Since operand1 >= operand2 is already ensured, if d1 < d2,
                // it implies borrowing must happen from a more significant digit.
                hasBorrowing = true;
                break;
            } else if (d1 > d2) {
                // No borrow needed for this digit from the left,
                // and this digit can provide for a borrow to its right.
            }
            // If d1 == d2, continue checking.
        }
    }


  }
  return { operand1, operand2, difference };
}

/**
 * Generates a multiplication problem.
 * @param {number} numDigits - The number of digits for the first operand.
 *                           The second operand will be 1-digit if numDigits is 3 or 4.
 *                           The second operand can be 1 or 2-digits if numDigits is 2.
 * @returns {object} An object like { operand1, operand2, product }.
 */
export function generateMultiplicationProblem(numDigits) {
  if (numDigits < 2 || numDigits > 4) {
    throw new Error("Number of digits for the first operand must be 2, 3, or 4 for multiplication problems.");
  }

  const operand1 = generateRandomNDigitNumber(numDigits);
  let operand2;

  if (numDigits === 3 || numDigits === 4) {
    // Second operand is a single-digit number (1-9)
    operand2 = Math.floor(Math.random() * 9) + 1;
  } else { // numDigits === 2
    // Second operand can be 1 or 2 digits
    const secondOperandDigits = Math.floor(Math.random() * 2) + 1; // 1 or 2
    operand2 = generateRandomNDigitNumber(secondOperandDigits);
  }

  const product = operand1 * operand2;
  return { operand1, operand2, product };
}

// Example Usage (for testing - not part of the final deliverable for this task)
/*
console.log("Addition Problems:");
for (let i = 0; i < 5; i++) {
  console.log(generateAdditionProblem(3));
}
for (let i = 0; i < 5; i++) {
  console.log(generateAdditionProblem(4));
}

console.log("\nSubtraction Problems:");
for (let i = 0; i < 5; i++) {
  console.log(generateSubtractionProblem(3));
}
for (let i = 0; i < 5; i++) {
  console.log(generateSubtractionProblem(4));
}
*/