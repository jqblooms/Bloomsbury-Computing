// The generator: fresh questions at Easy, Medium, Hard and Master.
// ======================================================
// PROCEDURAL GENERATOR LOGIC (EASY/MED/HARD/MASTER)
// ======================================================
let genQuestion = null;

const CONTEXT_BANK = [
  { theme: "an athletics tournament", vars: ["throws", "dist", "wind", "foul", "bonus", "score"] },
  { theme: "a football season", vars: ["matches", "goals", "assists", "fouls", "cards", "points"] },
  { theme: "an esports match", vars: ["round", "kills", "deaths", "assists", "gold", "xp"] },
  { theme: "a retail store", vars: ["stock", "sold", "price", "tax", "discount", "profit"] },
  { theme: "student grading", vars: ["students", "score", "bonus", "penalty", "absences", "total"] },
  { theme: "a racing game", vars: ["laps", "speed", "fuel", "damage", "boost", "time"] },
  { theme: "a fitness tracker", vars: ["days", "steps", "cals", "water", "sleep", "weight"] },
  { theme: "a social media post", vars: ["posts", "likes", "shares", "comments", "views", "followers"] },
  { theme: "a bakery inventory", vars: ["batches", "flour", "sugar", "eggs", "butter", "milk"] },
  { theme: "a spaceship dashboard", vars: ["orbits", "fuel", "oxygen", "speed", "shield", "power"] }
];

function generateProceduralAlgorithm() {
  const diff = document.getElementById('gen-difficulty').value;
  const selectedType = document.getElementById('gen-type').value;
  const selectedContext = CONTEXT_BANK[Math.floor(Math.random() * CONTEXT_BANK.length)];

  let questionType = selectedType;
  if (questionType === 'mixed') {
      const mixedTypes = ['sequence', 'for', 'while', 'conditional', 'do-until'];
      if (diff === 'hard' || diff === 'master') mixedTypes.push('array');
      questionType = mixedTypes[Math.floor(Math.random() * mixedTypes.length)];
  }

  if (questionType === 'sequence') return generateSequenceAlgorithm(selectedContext, diff);
  if (questionType === 'conditional') return generateConditionalAlgorithm(selectedContext, diff);
  if (questionType === 'array') return generateArrayAlgorithm(selectedContext, diff);
  return generateStandardAlgorithm(selectedContext, diff, questionType);
}

function generateSequenceAlgorithm(contextData, diff) {
    const [firstVar, secondVar, thirdVar] = contextData.vars;
    const templatePools = {
        easy: ['add-multiply', 'multiply-subtract', 'multiple-outputs'],
        medium: ['add-multiply', 'multiply-subtract', 'multiple-outputs', 'derived-value', 'combine-values'],
        hard: ['derived-value', 'combine-values', 'swap-values', 'three-stage'],
        master: ['combine-values', 'swap-values', 'three-stage', 'multiple-outputs']
    };
    const pool = templatePools[diff];
    const template = pool[Math.floor(Math.random() * pool.length)];
    const templateVars = {
        'add-multiply': [firstVar],
        'multiply-subtract': [firstVar],
        'multiple-outputs': [firstVar],
        'derived-value': [firstVar, secondVar],
        'combine-values': [firstVar, secondVar],
        'swap-values': [firstVar, secondVar, 'temp'],
        'three-stage': [firstVar, secondVar, thirdVar]
    };
    const activeVars = templateVars[template];
    const cols = ['Line', ...activeVars, 'Output'];
    const lines = [];
    const answers = [];
    const inputParts = [];
    const startValue = Math.floor(Math.random() * 6) + 3;
    const secondValue = Math.floor(Math.random() * 5) + 2;
    const amount = Math.floor(Math.random() * 5) + 2;
    const multiplier = Math.floor(Math.random() * 3) + 2;
    const useInputs = diff !== 'easy';
    const useSecondInput = diff === 'hard' || diff === 'master';

    function addRow(changes, output) {
        const row = { Line: lines.length.toString(), Output: output === undefined ? '' : output.toString() };
        activeVars.forEach(name => row[name] = '');
        Object.entries(changes || {}).forEach(([name, value]) => row[name] = value.toString());
        answers.push(row);
    }

    function initialise(name, value, asInput) {
        if (asInput) {
            lines.push(`${name} = int(input("Enter ${name}:"))`);
            inputParts.push(`<strong>${name} = ${value}</strong>`);
        } else {
            lines.push(`${name} = ${value}`);
        }
        addRow({ [name]: value });
    }

    function assign(name, expression, value) {
        lines.push(`${name} = ${expression}`);
        addRow({ [name]: value });
    }

    function output(name, value) {
        lines.push(`print(${name})`);
        addRow({}, value);
    }

    if (template === 'add-multiply') {
        let value = startValue;
        initialise(firstVar, value, useInputs);
        value += amount;
        assign(firstVar, `${firstVar} + ${amount}`, value);
        value *= multiplier;
        assign(firstVar, `${firstVar} * ${multiplier}`, value);
        output(firstVar, value);
    } else if (template === 'multiply-subtract') {
        let value = startValue;
        initialise(firstVar, value, useInputs);
        value *= multiplier;
        assign(firstVar, `${firstVar} * ${multiplier}`, value);
        value -= amount;
        assign(firstVar, `${firstVar} - ${amount}`, value);
        output(firstVar, value);
    } else if (template === 'multiple-outputs') {
        let value = startValue;
        initialise(firstVar, value, useInputs);
        output(firstVar, value);
        value += amount;
        assign(firstVar, `${firstVar} + ${amount}`, value);
        output(firstVar, value);
        value *= multiplier;
        assign(firstVar, `${firstVar} * ${multiplier}`, value);
        output(firstVar, value);
    } else if (template === 'derived-value') {
        let first = startValue;
        initialise(firstVar, first, useInputs);
        let second = first + amount;
        assign(secondVar, `${firstVar} + ${amount}`, second);
        output(secondVar, second);
        first = second * multiplier;
        assign(firstVar, `${secondVar} * ${multiplier}`, first);
        output(firstVar, first);
    } else if (template === 'combine-values') {
        let first = startValue;
        let second = secondValue;
        initialise(firstVar, first, useInputs);
        initialise(secondVar, second, useSecondInput);
        first *= multiplier;
        assign(firstVar, `${firstVar} * ${multiplier}`, first);
        second += amount;
        assign(secondVar, `${secondVar} + ${amount}`, second);
        first += second;
        assign(firstVar, `${firstVar} + ${secondVar}`, first);
        output(firstVar, first);
    } else if (template === 'swap-values') {
        let first = startValue;
        let second = secondValue;
        initialise(firstVar, first, useInputs);
        initialise(secondVar, second, useSecondInput);
        const temp = first;
        assign('temp', firstVar, temp);
        first = second;
        assign(firstVar, secondVar, first);
        second = temp;
        assign(secondVar, 'temp', second);
        output(firstVar, first);
        output(secondVar, second);
    } else {
        let first = startValue;
        let second = secondValue;
        initialise(firstVar, first, useInputs);
        initialise(secondVar, second, useSecondInput);
        let third = first + second;
        assign(thirdVar, `${firstVar} + ${secondVar}`, third);
        output(thirdVar, third);
        first = third - amount;
        assign(firstVar, `${thirdVar} - ${amount}`, first);
        second = first * multiplier;
        assign(secondVar, `${firstVar} * ${multiplier}`, second);
        output(secondVar, second);
    }

    const context = inputParts.length
        ? `This sequence processes information for ${contextData.theme}. The user entered ${inputParts.join(' and ')}.`
        : `Trace this sequence for ${contextData.theme}. Follow each instruction in order.`;
    return { context, code: lines, cols, answers, solved: false, failedAttempt: false, questionType: 'Sequence' };
}

function generateConditionalAlgorithm(contextData, diff) {
    const valueName = contextData.vars[0];
    const resultName = contextData.vars[1];
    const value = Math.floor(Math.random() * 12) + 1;
    const increase = Math.floor(Math.random() * 4) + 2;
    const decrease = Math.min(value, Math.floor(Math.random() * 3) + 1);
    const cols = ['Line', valueName, resultName, 'Output'];
    let lines;
    let result;
    let executedLine;

    if (diff === 'easy') {
        const threshold = Math.floor(Math.random() * 5) + 5;
        lines = [
            `${valueName} = int(input("Enter ${valueName}:"))`,
            `if ${valueName} >= ${threshold}:`,
            `    ${resultName} = 1`,
            `else:`,
            `    ${resultName} = 0`,
            `print(${resultName})`
        ];
        result = value >= threshold ? 1 : 0;
        executedLine = value >= threshold ? '3' : '5';
    } else if (diff === 'medium') {
        const threshold = Math.floor(Math.random() * 5) + 5;
        lines = [
            `${valueName} = int(input("Enter ${valueName}:"))`,
            `if ${valueName} >= ${threshold}:`,
            `    ${resultName} = ${valueName} + ${increase}`,
            `else:`,
            `    ${resultName} = ${valueName} - ${decrease}`,
            `print(${resultName})`
        ];
        result = value >= threshold ? value + increase : value - decrease;
        executedLine = value >= threshold ? '3' : '5';
    } else {
        const low = Math.floor(Math.random() * 3) + 4;
        const high = low + Math.floor(Math.random() * 3) + 3;
        lines = [
            `${valueName} = int(input("Enter ${valueName}:"))`,
            `if ${valueName} >= ${high}:`,
            `    ${resultName} = ${valueName} + ${increase}`,
            `elif ${valueName} >= ${low}:`,
            `    ${resultName} = ${valueName}`,
            `else:`,
            `    ${resultName} = ${valueName} - ${decrease}`,
            `print(${resultName})`
        ];
        if (value >= high) {
            result = value + increase;
            executedLine = '3';
        } else if (value >= low) {
            result = value;
            executedLine = '5';
        } else {
            result = value - decrease;
            executedLine = '7';
        }
    }

    const printLine = lines.length.toString();
    const answers = [
        { Line: '1', [valueName]: value.toString(), [resultName]: '', Output: '' },
        { Line: executedLine, [valueName]: '', [resultName]: result.toString(), Output: '' },
        { Line: printLine, [valueName]: '', [resultName]: '', Output: result.toString() }
    ];
    const context = `When prompted for ${valueName}, the user enters <strong>${value}</strong>. Record the input, test the conditions in order and follow only the branch that runs.`;
    return { context, code: lines, cols, answers, solved: false, failedAttempt: false, questionType: 'Selection' };
}

function generateArrayAlgorithm(contextData, diff) {
    const arrName = contextData.vars[0] + "Data"; // e.g., throwsData
    const accName = contextData.vars[1]; // e.g., dist
    const loopVar = "x";

    const arrayLengths = { easy: 3, medium: 4, hard: 5 };
    let arrLen = diff === 'master'
        ? Math.min(7, 5 + Math.floor(genStats.score / 10))
        : arrayLengths[diff];
    let arrVals = [];
    for(let i=0; i<arrLen; i++) arrVals.push(Math.floor(Math.random() * 5) + 1);

    let lines = [];
    let context = `The program processes an array of ${contextData.theme}. The array is pre-defined as: <strong>${arrName} = [${arrVals.join(', ')}]</strong>.`;

    lines.push(`${accName} = 0`);

    // Array iteration using either For or While loop
    const loopType = Math.random() < 0.5 ? 'for' : 'while';

    let cols = ['Line', accName, loopVar, 'Output'];
    let answers = [];

    answers.push({ Line: '1', [accName]: '0', [loopVar]: '', Output: '' });
    let currentAcc = 0;

    if (loopType === 'for') {
        lines.push(`for ${loopVar} in range(0, ${arrLen}):`);
        lines.push(`    ${accName} = ${accName} + ${arrName}[${loopVar}]`);
        lines.push(`print(${accName})`);

        for (let i = 0; i < arrLen; i++) {
            answers.push({ Line: '2', [accName]: '', [loopVar]: i.toString(), Output: '' });
            currentAcc += arrVals[i];
            answers.push({ Line: '3', [accName]: currentAcc.toString(), [loopVar]: '', Output: '' });
        }
        answers.push({ Line: '4', [accName]: '', [loopVar]: '', Output: currentAcc.toString() });
    } else {
        lines.push(`${loopVar} = 0`);
        lines.push(`while ${loopVar} < ${arrLen}:`);
        lines.push(`    ${accName} = ${accName} + ${arrName}[${loopVar}]`);
        lines.push(`    ${loopVar} = ${loopVar} + 1`);
        lines.push(`print(${accName})`);

        answers.push({ Line: '2', [accName]: '', [loopVar]: '0', Output: '' });
        for (let i = 0; i < arrLen; i++) {
            currentAcc += arrVals[i];
            answers.push({ Line: '4', [accName]: currentAcc.toString(), [loopVar]: '', Output: '' });
            answers.push({ Line: '5', [accName]: '', [loopVar]: (i + 1).toString(), Output: '' });
        }
        answers.push({ Line: '6', [accName]: '', [loopVar]: '', Output: currentAcc.toString() });
    }

    return { context, code: lines, cols, answers, solved: false, failedAttempt: false, questionType: 'Arrays' };
}

function generateStandardAlgorithm(contextData, diff, forcedLoopType) {
    let numVars = 2, numInputs = 0;
    if (diff === 'easy') { numVars = 2; numInputs = 0; }
    else if (diff === 'medium') { numVars = 2; numInputs = 1; }
    else if (diff === 'hard') { numVars = 2; numInputs = 2; }
    else if (diff === 'master') {
        numVars = Math.min(4, 2 + Math.floor(genStats.score / 5)); // Capped at 4 vars to prevent massive scrolling
        numInputs = numVars - 1;
    }

    const VAR_NAMES = contextData.vars;
    let startVals = [];
    for(let i=0; i<numVars; i++) startVals.push(Math.floor(Math.random() * 3) + 1);

    let loopTypes = ['for', 'while', 'do-until'];
    let loopType = forcedLoopType || loopTypes[Math.floor(Math.random() * loopTypes.length)];

    let isCountdown = loopType !== 'for' && Math.random() < 0.5; // Do-Until and While can count downwards

    if (isCountdown) {
        startVals[0] = Math.floor(Math.random() * 10) + 15; // Set a high starting point to subtract from
    }

    let targetIterations = 3 + Math.floor(Math.random() * 2); // 3-4 loops

    // Precisely simulate loop math to find target limit without logical errors
    let simVals = [...startVals];
    for(let iter=0; iter<targetIterations; iter++) {
        for(let j=0; j<numVars-1; j++) {
            if (isCountdown) simVals[j] -= simVals[j+1];
            else simVals[j] += simVals[j+1];
        }
    }
    let limit = simVals[0];

    let contextParts = [];
    let lines = [];

    // Initialise Variables
    for (let i=0; i<numVars; i++) {
       if (i < numInputs) {
           lines.push(`${VAR_NAMES[i]} = int(input("Enter ${VAR_NAMES[i]}:"))`);
           contextParts.push(`<strong>${VAR_NAMES[i]} = ${startVals[i]}</strong>`);
       } else {
           lines.push(`${VAR_NAMES[i]} = ${startVals[i]}`);
       }
    }

    let activeVars = VAR_NAMES.slice(0, numVars);
    if (loopType === 'for') activeVars.push('i');

    let cols = ['Line', ...activeVars, 'Output'];
    let answers = [];
    let currentVals = [...startVals];

    for(let i=0; i<numVars; i++) {
        let row = { Line: (i+1).toString(), Output: '' };
        activeVars.forEach(v => row[v] = '');
        row[VAR_NAMES[i]] = currentVals[i].toString();
        answers.push(row);
    }

    let context = diff === 'easy'
        ? `Trace this algorithm which calculates abstract stats for ${contextData.theme}.`
        : `A program calculates abstract stats for ${contextData.theme}. The user entered the following starting values: ${contextParts.join(', ')}.`;

    let loopStartLine = lines.length + 1;

    // Build the Loop Blocks
    if (loopType === 'for') {
        lines.push(`for i in range(1, ${targetIterations + 1}):`);
        lines.push(`    print(${VAR_NAMES[0]})`);

        let updateCommands = [];
        for(let i=0; i<numVars-1; i++) {
            updateCommands.push({ lineNum: lines.length + 1, varIdx: i, addsIdx: i+1 });
            lines.push(`    ${VAR_NAMES[i]} = ${VAR_NAMES[i]} + ${VAR_NAMES[i+1]}`);
        }

        for(let iter=1; iter<=targetIterations; iter++) {
            let rowI = { Line: loopStartLine.toString(), Output: '' };
            activeVars.forEach(v => rowI[v] = '');
            rowI['i'] = iter.toString();
            answers.push(rowI);

            let rowPrint = { Line: (loopStartLine + 1).toString(), Output: currentVals[0].toString() };
            activeVars.forEach(v => rowPrint[v] = '');
            answers.push(rowPrint);

            for(let u of updateCommands) {
                currentVals[u.varIdx] += currentVals[u.addsIdx];
                let rowUp = { Line: u.lineNum.toString(), Output: '' };
                activeVars.forEach(v => rowUp[v] = '');
                rowUp[VAR_NAMES[u.varIdx]] = currentVals[u.varIdx].toString();
                answers.push(rowUp);
            }
        }

    } else if (loopType === 'while') {
        let op = isCountdown ? '>' : '<';
        lines.push(`while ${VAR_NAMES[0]} ${op} ${limit}:`);
        lines.push(`    print(${VAR_NAMES[0]})`);

        let updateCommands = [];
        for(let i=0; i<numVars-1; i++) {
            updateCommands.push({ lineNum: lines.length + 1, varIdx: i, addsIdx: i+1 });
            let mathOp = isCountdown ? '-' : '+';
            lines.push(`    ${VAR_NAMES[i]} = ${VAR_NAMES[i]} ${mathOp} ${VAR_NAMES[i+1]}`);
        }
        lines.push(`print("Finished")`);

        while(true) {
            if (isCountdown ? currentVals[0] <= limit : currentVals[0] >= limit) break;

            let rowPrint = { Line: (loopStartLine + 1).toString(), Output: currentVals[0].toString() };
            activeVars.forEach(v => rowPrint[v] = '');
            answers.push(rowPrint);

            for(let u of updateCommands) {
                if(isCountdown) currentVals[u.varIdx] -= currentVals[u.addsIdx];
                else currentVals[u.varIdx] += currentVals[u.addsIdx];

                let rowUp = { Line: u.lineNum.toString(), Output: '' };
                activeVars.forEach(v => rowUp[v] = '');
                rowUp[VAR_NAMES[u.varIdx]] = currentVals[u.varIdx].toString();
                answers.push(rowUp);
            }
        }
        let rowFin = { Line: lines.length.toString(), Output: 'Finished' };
        activeVars.forEach(v => rowFin[v] = '');
        answers.push(rowFin);

    } else if (loopType === 'do-until') {
        // Python has no do-until construct, so this is written as
        // while True: with a break once the exit condition is met.
        lines.push(`while True:`);
        lines.push(`    print(${VAR_NAMES[0]})`);

        let updateCommands = [];
        for(let i=0; i<numVars-1; i++) {
            updateCommands.push({ lineNum: lines.length + 1, varIdx: i, addsIdx: i+1 });
            let mathOp = isCountdown ? '-' : '+';
            lines.push(`    ${VAR_NAMES[i]} = ${VAR_NAMES[i]} ${mathOp} ${VAR_NAMES[i+1]}`);
        }
        lines.push(`    if ${VAR_NAMES[0]} == ${limit}:`);
        lines.push(`        break`);
        lines.push(`print("Finished")`);

        while(true) {
            let rowPrint = { Line: (loopStartLine + 1).toString(), Output: currentVals[0].toString() };
            activeVars.forEach(v => rowPrint[v] = '');
            answers.push(rowPrint);

            for(let u of updateCommands) {
                if (isCountdown) currentVals[u.varIdx] -= currentVals[u.addsIdx];
                else currentVals[u.varIdx] += currentVals[u.addsIdx];

                let rowUp = { Line: u.lineNum.toString(), Output: '' };
                activeVars.forEach(v => rowUp[v] = '');
                rowUp[VAR_NAMES[u.varIdx]] = currentVals[u.varIdx].toString();
                answers.push(rowUp);
            }
            if (currentVals[0] === limit) break; // Check exit condition
        }
        let rowFin = { Line: lines.length.toString(), Output: 'Finished' };
        activeVars.forEach(v => rowFin[v] = '');
        answers.push(rowFin);
    }

    const typeLabels = { for: 'For Loops', while: 'While Loops', 'do-until': 'Do Until Loops' };
    return { context, code: lines, cols, answers, solved: false, failedAttempt: false, questionType: typeLabels[loopType] };
}

function resetGeneratedPractice() {
   genQuestionIdCounter++;

   genQuestion = generateProceduralAlgorithm();
   genQuestion.id = 'gen' + genQuestionIdCounter;
   genQuestion.title = `${genQuestion.questionType || 'Generated'} Question ${genQuestionIdCounter}`;

   // The "gen" DOM slot and editor are reused across questions (only the
   // data changes), so drop any leftover typed code/table entries from the
   // last question rather than letting them bleed into the new one.
   delete codeAnswers.gen;
   progressData = progressData.filter(item => item.id !== '__gen_live__');
   renderPracEntry('gen', genQuestion);

   const badge = document.getElementById('gen-result');
   badge.className = 'result-badge';
   badge.innerHTML = '';
}

function checkGeneratedPractice() {
  if(!genQuestion) return;
  if (currentPracticeMode === 'code') return checkGeneratedPracticeCode();
  const view = codeView(genQuestion);
  const prefix = 'gen';
  const totalRows = view.answers.length + EXTRA_ROWS;
  let correct = 0; let total = 0;

  for(let r = 0; r < totalRows; r++) {
    const row = view.answers[r] || {};
    genQuestion.cols.forEach(k => {
       const td = document.getElementById(`${prefix}-r${r}-${k}`);
       if(!td) return;
       const expected = (row[k] || '').toString().trim().toLowerCase().replace(/\s+/g,' ');
       const given = td.querySelector('input').value.trim().toLowerCase().replace(/\s+/g,' ');
       td.className = '';
       if(given === expected) {
         if(given !== '') td.classList.add('correct');
         correct++;
       } else if(given !== '') td.classList.add('wrong');
       // A cell left blank never gets a red box here, even when it should
       // have held a value (still counted wrong below, just not shown
       // that way) - a red box only where blank is genuinely blank vs.
       // needs a value would draw the exact shape of the answer key
       // across the table, telling a student which cells to fill before
       // they have worked that out themselves, the one thing this
       // exercise is meant to test. A cell they actually typed something
       // into still gets marked right or wrong as normal.
       total++;
    });
  }

  const isCorrect = (correct === total);
  recordAttempt(genQuestion.id, genQuestion.title, isCorrect, extractTableData(prefix, genQuestion.cols, totalRows), view.code);

  if (isCorrect) {
     if (!genQuestion.solved) {
         genStats.score++;
         if (!genQuestion.failedAttempt) {
             genStats.streak++;
             if(genStats.streak > genStats.maxStreak) genStats.maxStreak = genStats.streak;
         }
         genQuestion.solved = true;
     }
  } else {
     if (!genQuestion.solved) {
         genQuestion.failedAttempt = true;
         genStats.streak = 0;
     }
  }
  saveProgress();
  updateStatsUI();
  reportGeneratorProgress();
  recordSupportOutcome(isCorrect);

  const badge = document.getElementById('gen-result');
  badge.className = `result-badge show ${isCorrect ? 'pass' : 'fail'}`;
  badge.innerHTML = isCorrect ? `✓ Perfect! ${correct}/${total} correct.` : `✗ ${correct}/${total} correct. A red cell is wrong; a blank cell might still need a value, review the whole table.`;
}

function checkGeneratedPracticeCode() {
  const view = codeView(genQuestion);
  const { correct, total } = checkCodeLines('gen', view.code, currentCodeLanguage);
  const isCorrect = correct === total;
  recordAttempt(genQuestion.id, genQuestion.title, isCorrect, null, view.code);

  if (isCorrect) {
     if (!genQuestion.solved) {
         genStats.score++;
         if (!genQuestion.failedAttempt) {
             genStats.streak++;
             if(genStats.streak > genStats.maxStreak) genStats.maxStreak = genStats.streak;
         }
         genQuestion.solved = true;
     }
  } else {
     if (!genQuestion.solved) {
         genQuestion.failedAttempt = true;
         genStats.streak = 0;
     }
  }
  saveProgress();
  updateStatsUI();
  reportGeneratorProgress();

  const badge = document.getElementById('gen-result');
  badge.className = `result-badge show ${isCorrect ? 'pass' : 'fail'}`;
  badge.innerHTML = isCorrect ? `✓ Perfect! ${correct}/${total} lines correct.` : `✗ ${correct}/${total} lines correct. Check the red line numbers.`;
}
