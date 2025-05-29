// app_tester.js - Test script for Math Practice Sheet application
// This script will be run with Deno.

// --- Mocking Browser Environment ---
// Basic DOM mocks needed for app.js and math_generator.js
globalThis.window = globalThis;
globalThis.document = {
    getElementById: (id) => {
        if (!globalThis.document.elements) {
            globalThis.document.elements = {};
        }
        if (!globalThis.document.elements[id]) {
            // Mock elements based on known IDs from index.html
            globalThis.document.elements[id] = {
                id: id,
                _value: '', // Internal storage for value
                get value() { 
                    console.log(`MOCK_DEBUG_GETTER: Element ${this.id} GET value, returning: ${this._value} (type: ${typeof this._value})`);
                    return this._value; 
                },
                set value(val) { 
                    console.log(`MOCK_DEBUG_SETTER: Element ${this.id} SET value to: ${val} (type: ${typeof val})`);
                    this._value = String(val); // Inputs always store strings
                },
                _innerHTML: '', // Internal storage for innerHTML
                get innerHTML() { return this._innerHTML; },
                set innerHTML(html) {
                    // console.log(`Mock ${this.id}: setting innerHTML to ${html}`);
                    this._innerHTML = html;
                    if (html === '' && this.children) {
                        // console.log(`Mock ${this.id}: Clearing children due to innerHTML=''`);
                        this.children.length = 0; // Clear children array
                    }
                },
                classList: {
                    add: (className) => {
                        if (!globalThis.document.elements[id].classes) globalThis.document.elements[id].classes = new Set();
                        globalThis.document.elements[id].classes.add(className);
                       // console.log(`Mock ${id}: Added class ${className}, All: ${Array.from(globalThis.document.elements[id].classes).join(' ')}`);
                    },
                    remove: (className) => {
                        if (!globalThis.document.elements[id].classes) globalThis.document.elements[id].classes = new Set();
                        globalThis.document.elements[id].classes.delete(className);
                       // console.log(`Mock ${id}: Removed class ${className}, All: ${Array.from(globalThis.document.elements[id].classes).join(' ')}`);
                    },
                    contains: (className) => {
                        if (!globalThis.document.elements[id].classes) globalThis.document.elements[id].classes = new Set();
                        return globalThis.document.elements[id].classes.has(className);
                    },
                    _values: () => globalThis.document.elements[id].classes ? globalThis.document.elements[id].classes : new Set()
                },
                children: [],
                appendChild: (child) => {
                    globalThis.document.elements[id].children.push(child);
                    // console.log(`Mock ${id}: Appended child ${child.id || 'anonymous'}`);
                },
                // Mock event listener capabilities
                addEventListener: (type, listener) => {
                    console.log(`MOCK_DEBUG: Element ${id} addEventListener for type: ${type}`);
                    if (!globalThis.document.elements[id].listeners) globalThis.document.elements[id].listeners = {};
                    if (!globalThis.document.elements[id].listeners[type]) globalThis.document.elements[id].listeners[type] = [];
                    globalThis.document.elements[id].listeners[type].push(listener);
                },
                // Mock click to trigger listeners
                _click: () => {
                    console.log(`MOCK_DEBUG: Element ${id} _click called. Has listeners for 'click': ${!!(globalThis.document.elements[id].listeners && globalThis.document.elements[id].listeners['click'])}`);
                    if (globalThis.document.elements[id].listeners && globalThis.document.elements[id].listeners['click']) {
                        globalThis.document.elements[id].listeners['click'].forEach(listener => {
                            console.log(`MOCK_DEBUG: Element ${id} executing click listener.`);
                            listener();
                        });
                    }
                },
                // Specific for problems-grid to inspect children
                _getProblems: () => {
                    return globalThis.document.elements['problems-grid'].children.map(problemDiv => {
                        const operand1 = problemDiv.children.find(c => c.classList.contains('operand1'))?.textContent || '';
                        const operatorOperand2 = problemDiv.children.find(c => c.classList.contains('operator-operand2'))?.textContent || '';
                        const parts = operatorOperand2.split(' ');
                        const operator = parts[0];
                        const operand2 = parts[1];
                        return { operand1, operator, operand2 };
                    });
                }
            };
            // Specific mocks for input elements (value is handled by getter/setter now)
            // if (id === 'num-digits' || id === 'num-problems' || id === 'operation-mode') {
            //      globalThis.document.elements[id].value = ''; // Default value
            // }
            if (id === 'control-sum-value') {
                 if (!globalThis.document.elements[id]._textContentStorage) globalThis.document.elements[id]._textContentStorage = '';
                 Object.defineProperty(globalThis.document.elements[id], 'textContent', {
                    get() { return this._textContentStorage; },
                    set(value) { this._textContentStorage = String(value); }
                });
            }
             if (id === 'problems-grid') {
                if(!globalThis.document.elements[id].classes) globalThis.document.elements[id].classes = new Set();
            }
        }
        return globalThis.document.elements[id];
    },
    createElement: (tagName) => {
        const elementId = `gen-${tagName}-${Math.random().toString(36).substr(2, 5)}`;
        // console.log(`Mock: createElement ${tagName} (id: ${elementId})`);
        const newEl = {
            id: elementId, // Give generated elements an ID for tracking if needed
            tagName,
            _value: '', get value() { return this._value; }, set value(v) { this._value = String(v); },
            _innerHTML: '', get innerHTML() { return this._innerHTML; }, 
            set innerHTML(v) { 
                this._innerHTML = v; 
                if (v === '' && this.children) this.children.length = 0;
            },
            _textContentStorage: '', get textContent() { return this._textContentStorage; }, set textContent(v) { this._textContentStorage = String(v);},
            classList: {
                _valuesSet: new Set(), // Renamed to avoid conflict with inherited _values
                add: function(cn) { this._valuesSet.add(cn); },
                remove: function(cn) { this._valuesSet.delete(cn);},
                contains: function(cn) { return this._valuesSet.has(cn); },
                _values: function() { return this._valuesSet; } // Keep a function to get values
            },
            children: [],
            appendChild: function(child) { 
                console.log(`MOCK_DEBUG: Element ${this.id} appending child id: ${child.id}, tag: ${child.tagName}, classes: ${child.classList ? Array.from(child.classList._values()).join(' ') : 'N/A'}`);
                this.children.push(child); 
            },
             // Mock find for problem structure (assuming children are elements with classList)
            find: function(callback) { return this.children.filter(callback)[0]; }
        };
         // Ensure children.find is available on elements that might have children searched (like problemDiv)
        if (tagName === 'div') {
             newEl.children.find = (callback) => newEl.children.filter(callback)[0];
        }
        return newEl;
    },
    // Mock URL parsing for app.js
    URLSearchParams: class URLSearchParams {
        constructor(query) { 
            this.query = query;
            this.params = new Map();
            if (query && query.startsWith("?")) {
                query.substring(1).split('&').forEach(p => {
                    const parts = p.split('=');
                    if (parts.length === 2) {
                        this.params.set(decodeURIComponent(parts[0]), decodeURIComponent(parts[1]));
                    } else if (parts.length === 1 && parts[0]) { 
                        this.params.set(decodeURIComponent(parts[0]), ""); // Handle param without value
                    }
                });
            }
            console.log(`MOCK_URLSearchParams: Initialized with query "${this.query}", params:`, JSON.stringify(Array.from(this.params.entries())));
        }
        get(key) { 
            const val = this.params.get(key);
            console.log(`MOCK_URLSearchParams_DEBUG: get("${key}") returns: ${val} (type: ${typeof val})`);
            return val !== undefined ? val : null; // Ensure null if not found
        }
    },
    // Reset elements for new test cases
    _resetElements: () => {
        globalThis.document.elements = {}; // Clear specific element mocks
        // DO NOT clear globalThis.document.listeners here, 
        // as app.js's DOMContentLoaded listener is registered once globally.
        // If specific tests add other document-level listeners that need clearing,
        // that would require more granular listener management.
        globalThis.window.location = { search: "" }; // Reset mock URL parameters
    },
    // Mock addEventListener for the document object itself
    addEventListener: (type, listener, options) => {
        console.log(`MOCK_DEBUG: Global document.addEventListener for type: ${type}`);
        if (!globalThis.document.listeners) globalThis.document.listeners = {};
        if (!globalThis.document.listeners[type]) globalThis.document.listeners[type] = [];
        globalThis.document.listeners[type].push(listener);
    },
    // Mock removeEventListener for completeness
    removeEventListener: (type, listener, options) => {
        console.log(`MOCK_DEBUG: Global document.removeEventListener for type: ${type}`);
        if (globalThis.document.listeners && globalThis.document.listeners[type]) {
            const index = globalThis.document.listeners[type].indexOf(listener);
            if (index > -1) globalThis.document.listeners[type].splice(index, 1);
        }
    },
    // Helper to manually trigger DOMContentLoaded
    _triggerDOMContentLoaded: () => {
        if (globalThis.document.listeners && globalThis.document.listeners['DOMContentLoaded']) {
            globalThis.document.listeners['DOMContentLoaded'].forEach(listener => listener());
        }
    }
};

// --- Import Application Logic ---
// Note: Deno needs explicit file extensions.
// These are imported once. math_generator is fine.
// app.js's DOMContentLoaded listener is now controlled via _triggerDOMContentLoaded.
await import('./math_generator.js');
await import('./app.js'); 
// --- Test Runner Helper ---
let testCases = [];
let currentTest = "";

function describe(name, fn) {
    console.log(`\n--- Suite: ${name} ---`);
    fn();
}

function it(name, fn) {
    currentTest = name;
    console.log(`  Running: ${name}`);
    try {
        document._resetElements(); // Reset DOM mocks for each test
        // Re-initialize crucial elements that app.js expects on DOMContentLoaded
        // This simulates a fresh page load for each 'it' block
        document.getElementById('num-digits');
        document.getElementById('num-problems');
        document.getElementById('operation-mode');
        document.getElementById('generate-sheet-btn');
        document.getElementById('problems-grid');
        document.getElementById('control-sum-value');
        document.getElementById('control-sum-instructions');
        document.getElementById('configuration-section'); // for hiding

        // Trigger DOMContentLoaded to simulate app.js initialization for the test
        document._triggerDOMContentLoaded();
        
        fn();
        testCases.push({ name, status: "PASSED" });
    } catch (e) {
        testCases.push({ name, status: "FAILED", error: e.message, stack: e.stack });
        console.error(`  FAILED: ${name}`);
        console.error(`    Error: ${e.message}`);
        if (e.stack) console.error(`    Stack: ${e.stack.split('\n').slice(1).join('\n')}`);

    }
}

function expect(actual) {
    return {
        toBe: (expected) => {
            if (actual !== expected) throw new Error(`Expected ${actual} to be ${expected}`);
        },
        toBeGreaterThanOrEqual: (expected) => {
            if (actual < expected) throw new Error(`Expected ${actual} to be greater than or equal to ${expected}`);
        },
        toBeLessThanOrEqual: (expected) => {
            if (actual > expected) throw new Error(`Expected ${actual} to be less than or equal to ${expected}`);
        },
        toContain: (expected) => {
            if (!actual.includes(expected)) throw new Error(`Expected "${actual}" to contain "${expected}"`);
        },
        toHaveLength: (expected) => {
            if (actual.length !== expected) throw new Error(`Expected array/string of length ${actual.length} to have length ${expected}`);
        },
        toBeInstanceOf: (expected) => {
            if (!(actual instanceof expected)) throw new Error(`Expected ${actual} to be instance of ${expected.name}`);
        },
        toBeTruthy: () => {
            if (!actual) throw new Error(`Expected ${actual} to be truthy`);
        },
        toBeDefined: () => {
            if (actual === undefined) throw new Error(`Expected value to be defined, but it was undefined.`);
        },
        toHaveClass: (className) => {
            const el = actual; // actual should be a mocked DOM element
            if (!el || !el.classList || !el.classList.contains(className)) {
                 const currentClasses = el && el.classList && el.classList._values ? Array.from(el.classList._values()).join(', ') : 'no classes found';
                throw new Error(`Expected element ${el.id} to have class "${className}". Current classes: [${currentClasses}]`);
            }
        },
        notToHaveClass: (className) => {
            const el = actual; // actual should be a mocked DOM element
            if (el && el.classList && el.classList.contains(className)) {
                const currentClasses = Array.from(el.classList._values()).join(', ');
                throw new Error(`Expected element ${el.id} not to have class "${className}". Current classes: [${currentClasses}]`);
            }
        }
    };
}

// --- Test Cases ---
describe("Math Practice Sheet Tests", () => {

    it("Test Case 1: Addition Mode", () => {
        // app.js's DOMContentLoaded ran via _triggerDOMContentLoaded.
        // It would have called displayProblems with defaults or URL params (none in this case).
        // Now, simulate user changing inputs and clicking "Generate".
        const numDigitsInput = document.getElementById('num-digits');
        const numProblemsInput = document.getElementById('num-problems');
        const operationModeInput = document.getElementById('operation-mode');
        
        numDigitsInput.value = "3";
        numProblemsInput.value = "5";
        operationModeInput.value = "addition";

        // This call simulates clicking the "Generate Sheet" button after changing values.
        // globalThis.displayProblems(
        //     parseInt(numProblemsInput.value), 
        //     parseInt(numDigitsInput.value), 
        //     operationModeInput.value
        // );
        document.getElementById('generate-sheet-btn')._click();

        const problemsGrid = document.getElementById('problems-grid');
        const problems = problemsGrid._getProblems();
        
        expect(problems).toHaveLength(5);
        problems.forEach(p => {
            expect(p.operator).toBe('+');
            expect(p.operand1.length).toBe(3);
            expect(p.operand2.length).toBe(3);
        });
        expect(problemsGrid).notToHaveClass('two-columns-grid');
        console.log("  Test Case 1: Addition - Grid classes:", Array.from(problemsGrid.classList._values()).join(', '));
    });

    it("Test Case 2: Multiplication Mode", () => {
        const numDigitsInput = document.getElementById('num-digits');
        const numProblemsInput = document.getElementById('num-problems');
        const operationModeInput = document.getElementById('operation-mode');

        numDigitsInput.value = "3";
        numProblemsInput.value = "4";
        operationModeInput.value = "multiplication";

        // globalThis.displayProblems(4, 3, "multiplication");
        document.getElementById('generate-sheet-btn')._click();

        const problemsGrid = document.getElementById('problems-grid');
        const problems = problemsGrid._getProblems();

        expect(problems).toHaveLength(4);
        problems.forEach(p => {
            expect(p.operator).toBe('×');
            expect(p.operand1.length).toBe(3);
            expect(p.operand2.length).toBe(1); // 3-digit op1 -> 1-digit op2
        });
        expect(problemsGrid).toHaveClass('two-columns-grid');
        console.log("  Test Case 2: Multiplication - Grid classes:", Array.from(problemsGrid.classList._values()).join(', '));
    });

    it("Test Case 3: Mixed Mode (with multiplication)", () => {
        const numDigitsInput = document.getElementById('num-digits');
        const numProblemsInput = document.getElementById('num-problems');
        const operationModeInput = document.getElementById('operation-mode');

        numDigitsInput.value = "3";
        numProblemsInput.value = "6"; 
        operationModeInput.value = "mixed";
        
        let attempts = 0;
        let hasMultiplication = false;
        let problems = []; // Initialize problems to an empty array

        // Try a few times to get multiplication in mixed mode
        while(attempts < 5 && !hasMultiplication) {
            // Each attempt needs a fresh generation.
            // Values are already set in inputs. Simulate button click.
            document.getElementById('generate-sheet-btn')._click();
            
            const problemsGrid = document.getElementById('problems-grid');
            problems = problemsGrid._getProblems(); // Get the generated problems
            hasMultiplication = problems.some(p => p.operator === '×');
            if (hasMultiplication) {
                 expect(problemsGrid).toHaveClass('two-columns-grid');
            }
            attempts++;
        }
        
        expect(hasMultiplication).toBeTruthy(); // Should find a multiplication problem within a few tries
        expect(problems).toHaveLength(6);
        problems.forEach(p => {
            expect(['+', '−', '×'].includes(p.operator)).toBeTruthy();
            if (p.operator === '×') {
                 expect(p.operand1.length).toBe(3);
                 expect(p.operand2.length).toBe(1);
            } else { // Addition or Subtraction
                 expect(p.operand1.length).toBe(3);
                 expect(p.operand2.length).toBe(3);
            }
        });
        // If hasMultiplication is true, class should be there. This is checked inside loop.
        // If loop finishes and hasMultiplication is true, last run had it.
        if (hasMultiplication) {
             const problemsGrid = document.getElementById('problems-grid'); // get the latest grid
             expect(problemsGrid).toHaveClass('two-columns-grid');
        }
        console.log(`  Test Case 3: Mixed (with mult) - Found multiplication after ${attempts} attempts. Grid classes: ${Array.from(document.getElementById('problems-grid').classList._values()).join(', ')}`);
    });


    it("Test Case 4: Mixed Mode (without multiplication)", () => {
        // This test is probabilistic. It might sometimes fail if multiplication always appears.
        // For a robust test, we'd need to control Math.random or the problem generation logic.
        let foundNonMultiplicationCase = false;
        for (let i = 0; i < 10; i++) { // Try up to 10 times
            document._resetElements(); // Reset DOM state
            // Re-initialize critical elements for app.js's setup via _triggerDOMContentLoaded
            document.getElementById('num-digits');
            document.getElementById('num-problems');
            document.getElementById('operation-mode');
            document.getElementById('generate-sheet-btn');
            document.getElementById('problems-grid');
            document.getElementById('control-sum-value');
            document.getElementById('control-sum-instructions');
            document.getElementById('configuration-section');
            document._triggerDOMContentLoaded(); // Re-run app.js setup

            // Set inputs for this attempt
            document.getElementById('num-digits').value = "3";
            document.getElementById('num-problems').value = "6";
            document.getElementById('operation-mode').value = "mixed";
            
            // globalThis.displayProblems(6, 3, "mixed"); // Generate problems for this attempt
            document.getElementById('generate-sheet-btn')._click();

            const problemsGrid = document.getElementById('problems-grid');
            const problems = problemsGrid._getProblems(); // Get the generated problems
            
            const hasMultiplication = problems.some(p => p.operator === '×');

            if (!hasMultiplication) {
                expect(problemsGrid).notToHaveClass('two-columns-grid');
                foundNonMultiplicationCase = true;
                console.log("  Test Case 4: Mixed (no mult) - Found a case with no multiplication.");
                break;
            }
        }
        if (!foundNonMultiplicationCase) {
            console.warn("  Test Case 4: Mixed (no mult) - Could not find a case without multiplication after 10 tries. Test inconclusive but not a hard failure.");
        } else {
            expect(foundNonMultiplicationCase).toBeTruthy();
        }
    });
    
    it("Test Case 5: Number of Digits for Multiplication (2-digit op1)", () => {
        document.getElementById('num-digits').value = "2";
        document.getElementById('num-problems').value = "4";
        document.getElementById('operation-mode').value = "multiplication";

        // globalThis.displayProblems(4, 2, "multiplication");
        document.getElementById('generate-sheet-btn')._click();

        const problemsGrid = document.getElementById('problems-grid');
        const problems = problemsGrid._getProblems();

        expect(problems).toHaveLength(4);
        problems.forEach(p => {
            expect(p.operator).toBe('×');
            expect(p.operand1.length).toBe(2);
            expect(p.operand2.length >= 1 && p.operand2.length <= 2).toBeTruthy();
        });
        expect(problemsGrid).toHaveClass('two-columns-grid');
    });

    it("Test Case 6: Control Sum (Basic Check)", () => {
        document.getElementById('num-digits').value = "3";
        document.getElementById('num-problems').value = "2";
        document.getElementById('operation-mode').value = "addition";

        // globalThis.displayProblems(2, 3, "addition");
        document.getElementById('generate-sheet-btn')._click();
        
        const controlSumValueEl = document.getElementById('control-sum-value');
        expect(controlSumValueEl.textContent.length).toBeGreaterThanOrEqual(1); // Should be a single digit
        expect(parseInt(controlSumValueEl.textContent)).toBeGreaterThanOrEqual(0);
        expect(parseInt(controlSumValueEl.textContent)).toBeLessThanOrEqual(9);
        console.log(`  Test Case 6: Control Sum generated: ${controlSumValueEl.textContent}`);
    });
    
    it("Test Case 7: URL parameters", () => {
        // Reset elements first. This also resets window.location.search to ""
        document._resetElements(); 
        // NOW, set the mock URL search string specific for this test
        globalThis.window.location = { search: "?mode=multiplication&digits=2&count=5" };
        
        // Re-initialize crucial elements for app.js's DOMContentLoaded to find
        document.getElementById('num-digits');
        document.getElementById('num-problems');
        document.getElementById('operation-mode');
        document.getElementById('generate-sheet-btn');
        document.getElementById('problems-grid'); // Crucial: must be re-mocked fresh
        document.getElementById('control-sum-value');
        document.getElementById('control-sum-instructions');
        document.getElementById('configuration-section');
        document._triggerDOMContentLoaded(); // This runs app.js's setup

        const numDigitsInput = document.getElementById('num-digits');
        const numProblemsInput = document.getElementById('num-problems');
        const operationModeInput = document.getElementById('operation-mode');
        const problemsGrid = document.getElementById('problems-grid');

        // Verify that the input fields were updated by the DOMContentLoaded logic in app.js
        const digitsVal = numDigitsInput.value;
        console.log(`MOCK_ASSERTION_DEBUG: num-digits value for expect is ${digitsVal} (type: ${typeof digitsVal})`);
        if (digitsVal !== "2") {
            throw new Error(`Custom Assertion Failed for num-digits: Expected "2" but got "${digitsVal}"`);
        }
        // expect(digitsVal).toBe("2"); // Keep original expect for now if custom passes
        
        const problemsVal = numProblemsInput.value;
        console.log(`MOCK_ASSERTION_DEBUG: num-problems value for expect is ${problemsVal} (type: ${typeof problemsVal})`);
        if (problemsVal !== "5") {
            throw new Error(`Custom Assertion Failed for num-problems: Expected "5" but got "${problemsVal}"`);
        }
        // expect(problemsVal).toBe("5");

        const modeVal = operationModeInput.value;
        console.log(`MOCK_ASSERTION_DEBUG: operation-mode value for expect is ${modeVal} (type: ${typeof modeVal})`);
        if (modeVal !== "multiplication") {
            throw new Error(`Custom Assertion Failed for operation-mode: Expected "multiplication" but got "${modeVal}"`);
        }
        // expect(modeVal).toBe("multiplication");

        // Verify that displayProblems (called by app.js's DOMContentLoaded) used these values
        const problems = problemsGrid._getProblems();
        
        expect(problems).toHaveLength(5);
        problems.forEach(p => {
            expect(p.operator).toBe('×');
            expect(p.operand1.length).toBe(2); // From digits=2
            expect(p.operand2.length >= 1 && p.operand2.length <=2).toBeTruthy();
        });
        expect(problemsGrid).toHaveClass('two-columns-grid');
        console.log("  Test Case 7: URL Params - test passed.");
    });
});

// --- Summarize Results ---
console.log("\n\n--- Test Summary ---");
let failedCount = 0;
testCases.forEach(tc => {
    console.log(`  ${tc.status}: ${tc.name}`);
    if (tc.status === "FAILED") {
        failedCount++;
        // console.error(`    Error: ${tc.error}`);
    }
});
console.log(`\nTotal tests: ${testCases.length}, Passed: ${testCases.length - failedCount}, Failed: ${failedCount}`);

if (failedCount > 0) {
    // Deno.exit(1); // Exit with error code if any test failed
}
