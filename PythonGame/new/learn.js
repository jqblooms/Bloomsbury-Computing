// Python Defense: what to learn before each level. A topic is a few short points and worked examples. Each example is
// real code: the Learn screen runs it (run.js) when the student presses Run it, so the output or error shown is always
// what the code really does. expect (ok | syntax | runtime) is what the example is meant to do; ?selftest checks it.
// Text is a string, or { py, ps } when the two languages say it differently.
var LEARN = (function () {
  'use strict';
  var L = function (py, ps) { return { py: py, ps: ps }; };
  var X = function (py, ps, expect, note, inputs) { return { code: L(py, ps), expect: expect || 'ok', note: note, inputs: inputs || [] }; };

  var T = {
    // ------------------------------------------------------------ stage 1
    output: { title: L('print shows things on the screen', 'OUTPUT shows things on the screen'), points: [
      L('print( ) shows what is inside the brackets.', 'OUTPUT shows what comes after it.'),
      'Text goes inside quote marks. The quote marks are not shown.',
      'Maths with no quote marks is worked out first. Maths inside quote marks is just text.',
      L('Each print starts a new line.', 'Each OUTPUT starts a new line.')],
      examples: [
        X('print("Hello")\nprint(3 + 4)', 'OUTPUT "Hello"\nOUTPUT 3 + 4', 'ok', 'The text is shown without its quote marks. 3 + 4 has no quote marks, so it is worked out: 7.'),
        X('print("3 + 4")', 'OUTPUT "3 + 4"', 'ok', 'Inside quote marks, 3 + 4 is just text, so it is shown exactly as it is written.')] },
    errors: { title: 'Three kinds of error', points: [
      L('Syntax error: the code breaks the rules of Python, like a missing quote mark or bracket. Python cannot run the program at all.', 'Syntax error: the code breaks the rules of the language, like a missing quote mark. The program cannot run at all.'),
      'Runtime error: the code follows the rules, but something impossible happens while it runs, like dividing by 0. The program stops at that line.',
      'Logic error: the program runs to the end with no error message, but it does the wrong thing. Only you can spot it, by comparing what it does with what it should do.'],
      examples: [
        X('print("Hi")\nprint("Bye)', 'OUTPUT "Hi"\nOUTPUT "Bye', 'syntax', 'Syntax error: the second quote mark is missing. Nothing runs, not even line 1.'),
        X('print("Hi")\nprint(10 / 0)', 'OUTPUT "Hi"\nOUTPUT 10 / 0', 'runtime', 'Runtime error: line 1 runs and shows Hi. Then line 2 tries to divide by 0, which cannot be done, so the program stops.'),
        X('print("The total of 5 and 3 is")\nprint(5 - 3)', 'OUTPUT "The total of 5 and 3 is"\nOUTPUT 5 - 3', 'ok', 'Logic error: it runs with no error message, but it should add. 5 - 3 gives 2, not 8. The wrong line is line 2.')] },
    fix: { title: 'Fixing an error', points: [
      'Read what the program should do first.',
      'A syntax error: look for a missing quote mark or bracket. Every opening one needs a closing one.',
      'A logic error: compare what it shows with what it should show. Find the line that makes the difference.',
      'Change as little as you can. Then run it again to check.'],
      examples: [
        X('print("Well done)', 'OUTPUT "Well done', 'syntax', L('The text has an opening quote mark but no closing one. The fix: add " before the closing bracket.', 'The text has an opening quote mark but no closing one. The fix: add " at the end.')),
        X('print("Well done")', 'OUTPUT "Well done"', 'ok', 'The fixed version: every quote mark and bracket is closed.')] },
    writeout: { title: 'Writing your first program', points: [
      'The output must match exactly: the same letters, capitals, spaces and lines.',
      L('One print for each line you want to show.', 'One OUTPUT for each line you want to show.'),
      'When the task says let the computer do the maths, write the sum with no quote marks.'],
      examples: [
        X('print("Ready")\nprint("Go")', 'OUTPUT "Ready"\nOUTPUT "Go"', 'ok', 'Two lines need two outputs.'),
        X('print(12 + 30)', 'OUTPUT 12 + 30', 'ok', 'The computer works out 12 + 30. Typing 42 yourself would not count.')] },
    comments: { title: 'Comments', points: [
      L('A line starting with # is a comment.', 'A line starting with // is a comment.'),
      'The computer skips comments. They are notes for people reading the code.',
      'Comments never change what a program shows.'],
      examples: [
        X('# Show a greeting\nprint("Hello")', '// Show a greeting\nOUTPUT "Hello"', 'ok', 'Only Hello is shown. The comment is skipped.')] },

    // ------------------------------------------------------------ stage 2
    variables: { title: 'Variables', points: [
      'A variable is a named store for one value.',
      L('score = 5 stores 5 in score. The right side is worked out first, then stored on the left.', 'Score <- 5 stores 5 in Score. The right side is worked out first, then stored on the left.'),
      'A variable holds one value at a time. Storing a new value replaces the old one.',
      L('Without quote marks, print(score) shows the value in score.', 'Every variable is DECLAREd with its data type before it is used. OUTPUT Score shows the value in Score.')],
      examples: [
        X('score = 5\nscore = score + 3\nprint(score)', 'DECLARE Score : INTEGER\nScore <- 5\nScore <- Score + 3\nOUTPUT Score', 'ok', L('score + 3 is worked out first: 5 + 3 = 8. Then 8 is stored in score, replacing 5.', 'Score + 3 is worked out first: 5 + 3 = 8. Then 8 is stored in Score, replacing 5.')),
        X('coins = 4\ncoins = 9\nprint(coins)', 'DECLARE Coins : INTEGER\nCoins <- 4\nCoins <- 9\nOUTPUT Coins', 'ok', 'The second value replaces the first. Only 9 is left.')] },
    datatypes: { title: 'Data types', points: [
      'Integer: a whole number, like 7 or -3.',
      'Real: a number with a decimal point, like 2.5.',
      'String: text in quote marks, like "Ana" or even "42".',
      L('Boolean: only True or False.', 'Boolean: only TRUE or FALSE.')],
      examples: [
        X('age = 14\nprice = 2.5\nname = "Ana"\nready = True\nprint(name)', 'DECLARE Age : INTEGER\nDECLARE Price : REAL\nDECLARE Name : STRING\nDECLARE Ready : BOOLEAN\nAge <- 14\nPrice <- 2.5\nName <- "Ana"\nReady <- TRUE\nOUTPUT Name', 'ok', 'An Integer, a Real, a String and a Boolean. "42" in quote marks would be a String too.')] },
    trace: { title: 'Tracing variables', points: [
      'Go through the program one line at a time, from the top.',
      'Write down each variable every time it changes. Cross out the old value.',
      'Use the newest value whenever a line reads the variable.'],
      examples: [
        X('a = 3\nb = a + 4\na = b * 2\nprint(a)\nprint(b)', 'DECLARE A : INTEGER\nDECLARE B : INTEGER\nA <- 3\nB <- A + 4\nA <- B * 2\nOUTPUT A\nOUTPUT B', 'ok', 'a starts at 3. b = 3 + 4 = 7. Then a = 7 * 2 = 14. b is still 7.')] },
    varerrors: { title: L('Errors with variables', 'Errors with variables and data types'), points: [
      L('A misspelt name is a different name. Python has never seen it, so it stops with an error.', 'Using a name that was never DECLAREd is an error. A misspelt name is a different name.'),
      L('"5" in quote marks is a String. A String and a number cannot be added.', 'A variable only holds its own data type. "5" in quote marks is a STRING, not an INTEGER.'),
      L('To join text and a number, turn the number into text with str().', 'Use the right operator: + adds, - takes away.')],
      examples: [
        X('score = 10\nprint(scor)', 'DECLARE Score : INTEGER\nScore <- 10\nOUTPUT Scor', 'runtime', 'scor is not score. Check every letter of a name.'),
        X('score = 10\nprint("You have " + str(score))', 'DECLARE Score : INTEGER\nScore <- 10\nOUTPUT "You have ", Score', 'ok', L('str(score) turns 10 into the text "10", so + can join it to the other text.', 'The comma shows the text and then the value, one after the other.'))] },
    writevar: { title: 'Writing with variables', points: [
      L('Store the value first, then change it, then show it.', 'DECLARE the variable, store the value, change it, then OUTPUT it.'),
      'Use the variable in the sum, not the number you worked out yourself.',
      'The game checks the value in your variable too.'],
      examples: [
        X('points = 20\npoints = points + 5\nprint(points)', 'DECLARE Points : INTEGER\nPoints <- 20\nPoints <- Points + 5\nOUTPUT Points', 'ok', L('points ends holding 25, and print shows it.', 'Points ends holding 25, and OUTPUT shows it.'))] },

    // ------------------------------------------------------------ stage 3
    input: { title: L('input( ): the user types', 'INPUT: the user types'), points: [
      L('name = input() waits for the user to type, then stores what they typed in name.', 'INPUT Name waits for the user to type, then stores what they typed in Name.'),
      L('input() always gives a String, even when the user types digits.', 'The value is stored as the data type Name was DECLAREd with.'),
      'Each input reads the next thing the user types.'],
      examples: [
        X('name = input()\nprint("Hello " + name)', 'DECLARE Name : STRING\nINPUT Name\nOUTPUT "Hello ", Name', 'ok', 'Whatever the user types is stored, then used in the greeting.', ['Ana'])] },
    casting: { title: L('Changing the data type', 'Inputting numbers'), points: [
      L('input() gives a String. "7" + "7" joins them: 77.', 'DECLARE the variable as INTEGER and INPUT stores a whole number, ready for maths.'),
      L('int(input()) turns what is typed into an Integer, so it can be used in maths.', 'DECLARE it as STRING and the digits are kept as text.'),
      L('float(input()) turns it into a Real, for numbers with a decimal point.', 'DECLARE it as REAL for numbers with a decimal point.')],
      examples: [
        X('n = input()\nprint(n + n)', 'DECLARE N : STRING\nINPUT N\nOUTPUT N & N', 'ok', L('n is the String "7", so + joins the two copies: 77.', 'N is a STRING, so & joins the two copies: 77.'), ['7']),
        X('n = int(input())\nprint(n + n)', 'DECLARE N : INTEGER\nINPUT N\nOUTPUT N + N', 'ok', L('int() makes n the Integer 7, so + adds: 14.', 'N is an INTEGER, so + adds: 14.'), ['7'])] },
    inputerrors: { title: 'Errors with input', points: [
      L('A String and a number cannot be added: the program stops with a runtime error.', 'A STRING cannot be used in maths: the program stops.'),
      L('int() cannot turn a word like "ten" into a number: a runtime error.', 'Typing a word into an INTEGER variable stops the program.'),
      'Using the wrong operator gives a logic error: it runs, but the answer is wrong.'],
      examples: [
        X('age = input()\nprint(age + 1)', 'DECLARE Age : STRING\nINPUT Age\nOUTPUT Age + 1', 'runtime', L('age is a String, so + 1 cannot work. Fix: age = int(input()).', 'Age is a STRING, so + 1 cannot work. Fix: DECLARE Age : INTEGER.'), ['14'])] },
    writeinput: { title: 'Writing with input', points: [
      L('Use int(input()) when you need to do maths with what is typed.', 'DECLARE an INTEGER when you need to do maths with what is typed.'),
      'Do not add a message inside the input. Show only what the task asks for.',
      'Your program is tested with other values too, so never type the answer in yourself.'],
      examples: [
        X('a = int(input())\nb = int(input())\nprint(a + b)', 'DECLARE A : INTEGER\nDECLARE B : INTEGER\nINPUT A\nINPUT B\nOUTPUT A + B', 'ok', 'Two inputs, read in order, then added.', ['5', '9'])] },

    // ------------------------------------------------------------ stage 4
    if: { title: 'Selection: IF', points: [
      L('if checks a condition. When it is True, the indented lines run.', 'IF checks a condition. When it is TRUE, the lines after THEN run.'),
      L('else: runs when the condition is False.', 'ELSE runs when the condition is FALSE. ENDIF ends it.'),
      L('elif checks another condition, only if the ones before were False.', 'ELSEIF checks another condition, only if the ones before were FALSE.'),
      'Only one branch runs.'],
      examples: [
        X('mark = 65\nif mark >= 50:\n    print("Pass")\nelse:\n    print("Try again")', 'DECLARE Mark : INTEGER\nMark <- 65\nIF Mark >= 50 THEN\n    OUTPUT "Pass"\nELSE\n    OUTPUT "Try again"\nENDIF', 'ok', '65 >= 50 is true, so only Pass is shown.')] },
    operators: { title: 'Comparison operators', points: [
      L('== equal to, != not equal to', '= equal to, <> not equal to'),
      '> more than, < less than',
      '>= more than or equal to, <= less than or equal to',
      'Check the edge: 50 >= 50 is true, but 50 > 50 is false.'],
      examples: [
        X('n = 50\nif n > 50:\n    print("Over")\nelse:\n    print("Not over")', 'DECLARE N : INTEGER\nN <- 50\nIF N > 50 THEN\n    OUTPUT "Over"\nELSE\n    OUTPUT "Not over"\nENDIF', 'ok', '50 is not more than 50, so the ELSE part runs.')] },
    iferrors: { title: 'Errors in IF', points: [
      L('if needs a colon at the end, and the lines inside must be indented. Missing either is a syntax error.', 'IF needs THEN, and every IF needs an ENDIF. Missing either is a syntax error.'),
      L('= stores a value. == compares. Using = in an if is a syntax error.', '= compares in an IF. <- stores a value.'),
      'The wrong comparison, like > instead of >=, is a logic error: it runs but gets the edge case wrong.'],
      examples: [
        X('n = 7\nif n > 5\n    print("Big")', 'DECLARE N : INTEGER\nN <- 7\nIF N > 5\n    OUTPUT "Big"\nENDIF', 'syntax', L('The colon is missing after the condition.', 'THEN is missing after the condition.'))] },
    writeif: { title: 'Writing an IF', points: [
      'Read the task for the condition: which number, and is the edge included?',
      'Test it in your head with a value just below, on, and just above the edge.',
      L('Use else for the other case.', 'Use ELSE for the other case, and finish with ENDIF.')],
      examples: [
        X('age = int(input())\nif age >= 13:\n    print("Teen")\nelse:\n    print("Child")', 'DECLARE Age : INTEGER\nINPUT Age\nIF Age >= 13 THEN\n    OUTPUT "Teen"\nELSE\n    OUTPUT "Child"\nENDIF', 'ok', '13 is on the edge. >= includes it, so 13 shows Teen.', ['13'])] },

    // ------------------------------------------------------------ stage 5
    for: { title: 'FOR loops', points: [
      L('A for loop repeats its indented lines a set number of times.', 'A FOR loop repeats the lines before NEXT a set number of times.'),
      L('range(1, 4) gives 1, 2, 3. It stops before the end number.', 'FOR I <- 1 TO 3 gives 1, 2, 3. It includes the end number.'),
      'The loop variable takes the next value each time round.'],
      examples: [
        X('for i in range(1, 4):\n    print(i * 10)', 'DECLARE I : INTEGER\nFOR I <- 1 TO 3\n    OUTPUT I * 10\nNEXT I', 'ok', 'i is 1, then 2, then 3. Each time the line inside runs once.')] },
    forcount: { title: 'How many times does it loop?', points: [
      L('range(a, b) runs b - a times. range(5) runs 5 times, from 0 to 4.', 'FOR I <- A TO B runs B - A + 1 times.'),
      L('range(a, b, 2) goes up in steps of 2.', 'STEP 2 goes up in steps of 2.')],
      examples: [
        X('for i in range(2, 11, 2):\n    print(i)', 'DECLARE I : INTEGER\nFOR I <- 2 TO 10 STEP 2\n    OUTPUT I\nNEXT I', 'ok', 'It counts 2, 4, 6, 8, 10: five times.')] },
    forerrors: { title: 'Errors in FOR loops', points: [
      L('Missing the colon, or not indenting the loop body, is a syntax error.', 'A FOR with no NEXT is a syntax error.'),
      L('The wrong end number is a logic error: range stops one before its end.', 'The wrong start or end number is a logic error: the loop runs too many or too few times.'),
      'A line that should run once, but is inside the loop, runs every time: a logic error.'],
      examples: [
        X('for i in range(1, 5):\n    print(i)', 'DECLARE I : INTEGER\nFOR I <- 1 TO 5\n    OUTPUT I\nNEXT I', 'ok', L('Meant to show 1 to 5, but range(1, 5) stops at 4: a logic error. range(1, 6) fixes it.', 'This shows 1 to 5. FOR I <- 1 TO 4 would stop at 4: a logic error.'))] },
    writefor: { title: 'Writing a FOR loop', points: [
      'Work out the first value, the last value and the step.',
      L('Remember range stops before its end number: add 1.', 'FOR ... TO ... includes the last value.'),
      'Put the lines to repeat inside the loop. Lines after the loop run once.'],
      examples: [
        X('total = 0\nfor i in range(1, 6):\n    total = total + i\nprint(total)', 'DECLARE Total : INTEGER\nDECLARE I : INTEGER\nTotal <- 0\nFOR I <- 1 TO 5\n    Total <- Total + I\nNEXT I\nOUTPUT Total', 'ok', '1 + 2 + 3 + 4 + 5 = 15. The OUTPUT is after the loop, so it runs once.')] },

    // ------------------------------------------------------------ stage 6
    while: { title: 'WHILE loops', points: [
      'A WHILE loop repeats while its condition is true. It checks before every pass.',
      'Something inside the loop must change, or it never stops.',
      'If the condition is false at the start, the loop body never runs.'],
      examples: [
        X('n = 1\nwhile n < 20:\n    n = n * 2\nprint(n)', 'DECLARE N : INTEGER\nN <- 1\nWHILE N < 20 DO\n    N <- N * 2\nENDWHILE\nOUTPUT N', 'ok', 'n goes 2, 4, 8, 16, 32. 32 < 20 is false, so the loop stops and 32 is shown.')] },
    forwhile: { title: 'FOR or WHILE?', points: [
      'FOR: you know how many times before the loop starts, like 10 times.',
      'WHILE: you do not know, it depends on something, like until the user types 0.'],
      examples: [
        X('n = int(input())\nwhile n != 0:\n    print(n * 2)\n    n = int(input())', 'DECLARE N : INTEGER\nINPUT N\nWHILE N <> 0 DO\n    OUTPUT N * 2\n    INPUT N\nENDWHILE', 'ok', 'Nobody knows how many numbers will come before 0, so this needs WHILE.', ['4', '9', '0'])] },
    whileerrors: { title: 'Errors in WHILE loops', points: [
      'If nothing changes the condition, the loop never ends.',
      'The wrong comparison can stop the loop one pass too early or too late: a logic error.',
      L('A while needs a colon and an indented body.', 'A WHILE needs DO and an ENDWHILE.')],
      examples: [
        X('n = 3\nwhile n > 0:\n    print(n)\n    n = n - 1', 'DECLARE N : INTEGER\nN <- 3\nWHILE N > 0 DO\n    OUTPUT N\n    N <- N - 1\nENDWHILE', 'ok', 'n - 1 changes n each pass, so it reaches 0 and stops. Without that line it would never stop.')] },
    writewhile: { title: 'Keep going until 0', points: [
      'Read the first value before the loop.',
      'Inside the loop: use the value, then read the next one, last.',
      'The loop checks the new value at the top of the next pass.'],
      examples: [
        X('total = 0\nn = int(input())\nwhile n != 0:\n    total = total + n\n    n = int(input())\nprint(total)', 'DECLARE Total : INTEGER\nDECLARE N : INTEGER\nTotal <- 0\nINPUT N\nWHILE N <> 0 DO\n    Total <- Total + N\n    INPUT N\nENDWHILE\nOUTPUT Total', 'ok', 'The 0 stops the loop and is never added.', ['5', '7', '0'])] },

    // ------------------------------------------------------------ stage 7
    lists: { title: L('Lists', 'Arrays'), points: [
      L('A list holds many values under one name: scores = [4, 8, 6].', 'An array holds many values under one name. DECLARE Scores : ARRAY[1:3] OF INTEGER.'),
      L('Each item has an index. The first index is 0: scores[0] is 4.', 'Each item has an index. The first index is 1: Scores[1].'),
      L('len(scores) is how many items there are.', 'The upper bound (3 here) is how many items there are.')],
      examples: [
        X('scores = [4, 8, 6]\nprint(scores[1])', 'DECLARE Scores : ARRAY[1:3] OF INTEGER\nScores[1] <- 4\nScores[2] <- 8\nScores[3] <- 6\nOUTPUT Scores[2]', 'ok', L('Counting from 0: index 1 is the second item, 8.', 'Counting from 1: index 2 is the second item, 8.'))] },
    listerrors: { title: 'Errors with indexes', points: [
      L('An index past the end of the list is a runtime error: the item does not exist.', 'An index outside the array bounds is a runtime error: the item does not exist.'),
      L('Forgetting that indexes start at 0 picks the wrong item: a logic error.', 'Picking the wrong index gives the wrong item: a logic error.')],
      examples: [
        X('scores = [4, 8, 6]\nprint(scores[3])', 'DECLARE Scores : ARRAY[1:3] OF INTEGER\nScores[1] <- 4\nScores[2] <- 8\nScores[3] <- 6\nOUTPUT Scores[4]', 'runtime', L('There are 3 items, at indexes 0, 1 and 2. Index 3 does not exist.', 'The array goes from 1 to 3. Index 4 does not exist.'))] },
    listloop: { title: L('Looping through a list', 'Looping through an array'), points: [
      L('for i in range(len(scores)) gives every index: 0, 1, 2.', 'FOR I <- 1 TO 3 gives every index of an ARRAY[1:3].'),
      L('scores[i] is the item at that index.', 'Scores[I] is the item at that index.')],
      examples: [
        X('scores = [4, 8, 6]\nfor i in range(len(scores)):\n    print(scores[i] * 2)', 'DECLARE Scores : ARRAY[1:3] OF INTEGER\nDECLARE I : INTEGER\nScores[1] <- 4\nScores[2] <- 8\nScores[3] <- 6\nFOR I <- 1 TO 3\n    OUTPUT Scores[I] * 2\nNEXT I', 'ok', 'Every item, in order, doubled.')] },
    listtotal: { title: 'The total of a list', points: [
      'Set the total to 0 before the loop.',
      'Inside the loop, add the item at each index to the total.',
      'Show the total after the loop.'],
      examples: [
        X('scores = [4, 8, 6]\ntotal = 0\nfor i in range(len(scores)):\n    total = total + scores[i]\nprint(total)', 'DECLARE Scores : ARRAY[1:3] OF INTEGER\nDECLARE Total : INTEGER\nDECLARE I : INTEGER\nScores[1] <- 4\nScores[2] <- 8\nScores[3] <- 6\nTotal <- 0\nFOR I <- 1 TO 3\n    Total <- Total + Scores[I]\nNEXT I\nOUTPUT Total', 'ok', '0 + 4 + 8 + 6 = 18.')] },

    // ------------------------------------------------------------ stage 8
    strings: { title: 'String handling', points: [
      L('len(word) counts the characters. A space is a character too.', 'LENGTH(Word) counts the characters. A space is a character too.'),
      L('word.upper() gives capitals. word.lower() gives small letters.', 'UCASE(Word) gives capitals. LCASE(Word) gives small letters.'),
      L('word[0:3] is a slice: from index 0, stopping before index 3. That is the first 3 characters.', 'SUBSTRING(Word, 1, 3) starts at position 1 and takes 3 characters.')],
      examples: [
        X('word = "planet"\nprint(len(word))\nprint(word.upper())\nprint(word[0:3])', 'DECLARE Word : STRING\nWord <- "planet"\nOUTPUT LENGTH(Word)\nOUTPUT UCASE(Word)\nOUTPUT SUBSTRING(Word, 1, 3)', 'ok', '6 characters, the capitals, then the first three letters: pla.')] },
    stringerrors: { title: 'Errors with strings', points: [
      L('The first character is index 0. word[1:4] misses it: a logic error.', 'The first character is position 1. SUBSTRING(Word, 2, 3) misses it: a logic error.'),
      L('len() gives a number. Joining it to text with + needs str(), or it is a runtime error.', 'LENGTH gives a number. Join it to text with a comma or &, not +, or it is a runtime error.')],
      examples: [
        X('word = "castle"\nprint("Letters: " + str(len(word)))', 'DECLARE Word : STRING\nWord <- "castle"\nOUTPUT "Letters: ", LENGTH(Word)', 'ok', L('str() turns 6 into text, so it can be joined.', 'The comma shows the text, then the number.'))] },

    // ------------------------------------------------------------ stage 9
    totals: { title: 'Totals and counts', points: [
      'A total starts at 0 before the loop. Each pass adds the next value.',
      'A count starts at 0. Each time something is true, add 1.',
      'Show the total or count after the loop, once.'],
      examples: [
        X('nums = [12, 30, 7, 25]\ncount = 0\nfor i in range(len(nums)):\n    if nums[i] > 20:\n        count = count + 1\nprint(count)', 'DECLARE Nums : ARRAY[1:4] OF INTEGER\nDECLARE Count : INTEGER\nDECLARE I : INTEGER\nNums[1] <- 12\nNums[2] <- 30\nNums[3] <- 7\nNums[4] <- 25\nCount <- 0\nFOR I <- 1 TO 4\n    IF Nums[I] > 20 THEN\n        Count <- Count + 1\n    ENDIF\nNEXT I\nOUTPUT Count', 'ok', '30 and 25 are over 20, so the count is 2.')] },
    startvalues: { title: 'Why start there?', points: [
      'A total starts at 0 once, before the loop. Inside the loop it would go back to 0 on every pass.',
      'The largest starts at the first item, not at 0. Then the answer is always one of the items, even if they are all below 0.'],
      examples: [
        X('nums = [-4, -9, -2]\nlargest = nums[0]\nfor i in range(len(nums)):\n    if nums[i] > largest:\n        largest = nums[i]\nprint(largest)', 'DECLARE Nums : ARRAY[1:3] OF INTEGER\nDECLARE Largest : INTEGER\nDECLARE I : INTEGER\nNums[1] <- -4\nNums[2] <- -9\nNums[3] <- -2\nLargest <- Nums[1]\nFOR I <- 1 TO 3\n    IF Nums[I] > Largest THEN\n        Largest <- Nums[I]\n    ENDIF\nNEXT I\nOUTPUT Largest', 'ok', 'Every item is below 0. Starting at 0 would wrongly show 0. Starting at the first item gives -2.')] },
    largest: { title: 'The largest value', points: [
      'Keep the largest so far in a variable.',
      'Compare each new value with it. If the new value is bigger, it becomes the largest.',
      'For the smallest, use < instead of >.'],
      examples: [
        X('largest = 0\nfor i in range(3):\n    n = int(input())\n    if n > largest:\n        largest = n\nprint(largest)', 'DECLARE Largest : INTEGER\nDECLARE N : INTEGER\nDECLARE I : INTEGER\nLargest <- 0\nFOR I <- 1 TO 3\n    INPUT N\n    IF N > Largest THEN\n        Largest <- N\n    ENDIF\nNEXT I\nOUTPUT Largest', 'ok', '15 replaces 0, 41 replaces 15, and 22 is not bigger than 41.', ['15', '41', '22'])] },

    // ------------------------------------------------------------ stage 10
    validation: { title: 'Validation checks', points: [
      'Validation checks that data is sensible before it is used.',
      'Range check: between two values, like 0 to 100.',
      'Length check: the right number of characters. Type check: the right data type.',
      'Presence check: not left empty. Format check: the right pattern, like 12/05/2026.',
      'Check digit: a digit worked out from the others, to catch typing mistakes.'],
      examples: [] },
    rangecheck: { title: 'A range check with a loop', points: [
      'Read the value. While it is outside the range, show a message and read it again.',
      L('Outside the range: n < 1 or n > 10. Use or: either one makes it invalid.', 'Outside the range: N < 1 OR N > 10. Use OR: either one makes it invalid.'),
      'Check the edges: 1 and 10 must be accepted.'],
      examples: [
        X('n = int(input())\nwhile n < 1 or n > 10:\n    print("Invalid")\n    n = int(input())\nprint(n)', 'DECLARE N : INTEGER\nINPUT N\nWHILE N < 1 OR N > 10 DO\n    OUTPUT "Invalid"\n    INPUT N\nENDWHILE\nOUTPUT N', 'ok', '15 and 0 are outside, so each shows Invalid. 10 is on the edge and is accepted.', ['15', '0', '10'])] },

    // ------------------------------------------------------------ stage 11
    linear: { title: 'Linear search', points: [
      'Check each item in order, from the first.',
      'Stop when you find the target. If you reach the end, it is not there.',
      'A linear search works on any list, sorted or not.'],
      examples: [
        X('names = ["Ana", "Ben", "Chi"]\nfound = False\nfor i in range(len(names)):\n    if names[i] == "Ben":\n        found = True\nprint(found)', 'DECLARE Names : ARRAY[1:3] OF STRING\nDECLARE Found : BOOLEAN\nDECLARE I : INTEGER\nNames[1] <- "Ana"\nNames[2] <- "Ben"\nNames[3] <- "Chi"\nFound <- FALSE\nFOR I <- 1 TO 3\n    IF Names[I] = "Ben" THEN\n        Found <- TRUE\n    ENDIF\nNEXT I\nOUTPUT Found', 'ok', 'Each name is compared with Ben. The second one matches.')] },
    bubble: { title: 'Bubble sort: one pass', points: [
      'Compare the first two items. If they are in the wrong order, swap them.',
      'Move along one place and compare the next two. Go to the end.',
      'After one pass, the largest item has bubbled to the end. More passes sort the rest.'],
      examples: [
        X('nums = [5, 2, 8, 1]\nfor i in range(3):\n    if nums[i] > nums[i + 1]:\n        temp = nums[i]\n        nums[i] = nums[i + 1]\n        nums[i + 1] = temp\nprint(nums)', 'DECLARE Nums : ARRAY[1:4] OF INTEGER\nDECLARE Temp : INTEGER\nDECLARE I : INTEGER\nNums[1] <- 5\nNums[2] <- 2\nNums[3] <- 8\nNums[4] <- 1\nFOR I <- 1 TO 3\n    IF Nums[I] > Nums[I + 1] THEN\n        Temp <- Nums[I]\n        Nums[I] <- Nums[I + 1]\n        Nums[I + 1] <- Temp\n    ENDIF\nNEXT I\nOUTPUT Nums[1], ", ", Nums[2], ", ", Nums[3], ", ", Nums[4]', 'ok', '5 and 2 swap, 5 and 8 stay, 8 and 1 swap: 2, 5, 1, 8. 8 is now at the end.')] },

    // ------------------------------------------------------------ stage 12: IGCSE Paper 2
    tracetable: { title: 'Trace tables', points: [
      'A trace table has a column for each variable and one for the output.',
      'Go one line at a time. Write a new value in the column each time it changes.',
      L('DIV and MOD: n // 10 removes the last digit, n % 10 gives the last digit.', 'N DIV 10 removes the last digit. N MOD 10 gives the last digit.')],
      examples: [
        X('n = 472\nwhile n > 0:\n    print(n % 10)\n    n = n // 10', 'DECLARE N : INTEGER\nN <- 472\nWHILE N > 0 DO\n    OUTPUT N MOD 10\n    N <- N DIV 10\nENDWHILE', 'ok', 'n goes 472, 47, 4, 0. Each pass shows the last digit: 2, 7, 4.')] },
    divmod: { title: 'DIV and MOD', points: [
      L('// (DIV) gives how many whole times one number goes into another.', 'DIV gives how many whole times one number goes into another.'),
      L('% (MOD) gives the remainder.', 'MOD gives the remainder.'),
      L('17 // 5 is 3, and 17 % 5 is 2, because 5 goes into 17 three times with 2 left.', '17 DIV 5 is 3, and 17 MOD 5 is 2, because 5 goes into 17 three times with 2 left.'),
      'With 10: DIV 10 removes the last digit and MOD 10 gives it.'],
      examples: [
        X('mins = 135\nprint(mins // 60)\nprint(mins % 60)', 'DECLARE Mins : INTEGER\nMins <- 135\nOUTPUT Mins DIV 60\nOUTPUT Mins MOD 60', 'ok', '135 minutes is 2 whole hours, with 15 minutes left.')] },
    purpose: { title: 'State the purpose', points: [
      'The purpose is what the algorithm does overall, not what each line does.',
      'Run it in your head with a few values, then say what the result means.',
      'Look for clues: a running total, a count, a largest, a rogue value like -1 that stops the input.'],
      examples: [
        X('total = 0\nn = int(input())\nwhile n != -1:\n    total = total + n\n    n = int(input())\nprint(total)', 'DECLARE Total : INTEGER\nDECLARE N : INTEGER\nTotal <- 0\nINPUT N\nWHILE N <> -1 DO\n    Total <- Total + N\n    INPUT N\nENDWHILE\nOUTPUT Total', 'ok', 'Purpose: to add up the numbers input, until -1 is input.', ['4', '6', '-1'])] },
    errorline: { title: 'Find the line with the error', points: [
      'Read what the algorithm should do, then trace it with the values given.',
      'Find the first line where what happens is different from what should happen.',
      'Common Paper 2 errors: a total or count starting at 1 not 0, > instead of >=, DIV and MOD swapped, the wrong variable added.'],
      examples: [
        X('total = 1\nfor i in range(3):\n    n = int(input())\n    total = total + n\nprint(total)', 'DECLARE Total : INTEGER\nDECLARE N : INTEGER\nDECLARE I : INTEGER\nTotal <- 1\nFOR I <- 1 TO 3\n    INPUT N\n    Total <- Total + N\nNEXT I\nOUTPUT Total', 'ok', 'It should add three numbers. 2 + 3 + 4 is 9, but it shows 10. The error is line 1: the total must start at 0.', ['2', '3', '4'])] },
    findcorrect: { title: 'Find and correct the errors', points: [
      'Paper 2 often has more than one error. Fix every one.',
      'For each error, change only that line, then trace again.',
      'Test with the values given, and with a value on the edge of any range.'],
      examples: [
        X('count = 0\nfor i in range(3):\n    mark = int(input())\n    if mark > 50:\n        count = count + 1\nprint(count)', 'DECLARE Count : INTEGER\nDECLARE Mark : INTEGER\nDECLARE I : INTEGER\nCount <- 0\nFOR I <- 1 TO 3\n    INPUT Mark\n    IF Mark > 50 THEN\n        Count <- Count + 1\n    ENDIF\nNEXT I\nOUTPUT Count', 'ok', 'It should count marks of 50 or more. 50 is not counted, so it shows 1, not 2. Correct it to >= 50.', ['50', '72', '31'])] },
    writealg: { title: 'Write the algorithm', points: [
      'Plan first: what is input, what is worked out, what is output.',
      'Set totals and counts to 0 before the loop. Validate input with a loop.',
      L('A REPEAT loop runs at least once. In Python use while True: and break.', 'REPEAT ... UNTIL runs the body first, then checks. It always runs at least once.'),
      'Output exactly what the task asks for.'],
      examples: [
        X('tries = 0\nwhile True:\n    pw = input()\n    tries = tries + 1\n    if len(pw) >= 8:\n        break\nprint(tries)', 'DECLARE Pw : STRING\nDECLARE Tries : INTEGER\nTries <- 0\nREPEAT\n    INPUT Pw\n    Tries <- Tries + 1\nUNTIL LENGTH(Pw) >= 8\nOUTPUT Tries', 'ok', 'cat is too short, so it asks again. password has 8 characters, so the loop ends after 2 tries.', ['cat', 'password'])] }
  };

  // the topic of each level (boss waves: a recap of their stage)
  var LEVEL = {
    1: 'output', 2: 'errors', 3: 'fix', 4: 'writeout', 5: 'comments',
    7: 'variables', 8: 'datatypes', 9: 'trace', 10: 'varerrors', 11: 'writevar',
    13: 'input', 14: 'casting', 15: 'inputerrors', 16: 'inputerrors', 17: 'writeinput',
    19: 'if', 20: 'operators', 21: 'iferrors', 22: 'iferrors', 23: 'writeif',
    25: 'for', 26: 'forcount', 27: 'forerrors', 28: 'forerrors', 29: 'writefor',
    31: 'while', 32: 'forwhile', 33: 'whileerrors', 34: 'whileerrors', 35: 'writewhile',
    37: 'lists', 38: 'listerrors', 39: 'listloop', 40: 'listtotal',
    42: 'strings', 43: 'stringerrors', 44: 'stringerrors', 45: 'strings',
    47: 'totals', 48: 'startvalues', 49: 'totals', 50: 'largest',
    52: 'validation', 53: 'rangecheck', 54: 'rangecheck', 55: 'rangecheck',
    57: 'linear', 58: 'bubble', 59: 'linear', 60: 'linear',
    62: 'tracetable', 63: 'divmod', 64: 'purpose', 65: 'errorline', 66: 'findcorrect', 67: 'writealg'
  };
  return { TOPICS: T, LEVEL: LEVEL };
})();
