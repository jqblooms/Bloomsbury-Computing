// Content for the Pseudocode Recap (Y11 Unit 7). Every model answer and every
// fill-the-gaps answer key is run against its own tests before shipping.
//
// Task levels:
//   1 = Fill the gaps     code contains {{answer|alternative}} blanks
//   2 = Finish the code   starter code with // TODO comments
//   3 = Write it yourself empty editor, with a plan, keyword bank and hints
//
// Tests: { inputs, givens?, expect, forbid?, useAllInputs? }
//   expect  values that must appear in the (non-prompt) output, in order.
//           Numbers match numerically, text matches as whole words.
//   forbid  values that must NOT appear for this input.
//   givens  arrays already declared and filled in for the student.
window.RECAP_TOPICS = [
  // ------------------------------------------------------------------ SEQUENCE
  {
    id: 'sequence',
    title: 'Sequence',
    group: 'Building blocks',
    colour: 'seq',
    summary: 'Variables, data types, INPUT, OUTPUT and calculations, run one line at a time from top to bottom.',
    rules: [
      'Every variable is DECLAREd with a data type before it is used: <code>DECLARE Total : INTEGER</code>.',
      '<code>&lt;-</code> stores a value. Work out the right-hand side first, then store it in the variable on the left.',
      'Lines run in order, top to bottom. A variable always holds its newest value; the old one is gone.',
      'Put an OUTPUT prompt before every INPUT, so the user knows what to type.',
      '<code>/</code> always gives a REAL answer. <code>DIV</code> gives the whole-number part and <code>MOD</code> gives the remainder.'
    ],
    syntax: [
      {
        title: 'Declare, input, process, output',
        code: `DECLARE Name : STRING
DECLARE Age : INTEGER
OUTPUT "Enter your name "
INPUT Name
Age <- 16
OUTPUT "Hello ", Name, ", you are ", Age`,
        notes: [
          [1, '<code>DECLARE Name : TYPE</code> creates the variable and fixes what type of value it can hold.'],
          [3, 'The OUTPUT prompt comes straight before the INPUT.'],
          [4, '<code>INPUT Name</code> stores whatever the user types in Name.'],
          [5, '<code>&lt;-</code> means "store". Read it as "Age becomes 16", never "Age equals 16".'],
          [6, 'Commas join text and variables into one line of output. Text always goes in double quotes.']
        ]
      },
      {
        title: 'The five data types',
        code: `DECLARE Count : INTEGER     // whole numbers: 7, -2
DECLARE Price : REAL        // decimals: 3.99
DECLARE Initial : CHAR      // one character: 'J'
DECLARE Name : STRING       // text: "Aiko"
DECLARE Found : BOOLEAN     // TRUE or FALSE`,
        notes: []
      },
      {
        title: 'Arithmetic operators',
        code: `Total <- Price * Quantity   // * multiply, + add, - subtract
Average <- Total / 3        // / divide, always gives a REAL
Hours <- Minutes DIV 60     // DIV: whole number of times 60 fits
Left <- Minutes MOD 60      // MOD: the remainder`,
        notes: []
      }
    ],
    examples: [
      {
        title: 'Minutes into hours and minutes',
        scenario: 'Convert a number of minutes into hours and minutes using DIV and MOD.',
        code: `DECLARE TotalMinutes : INTEGER
DECLARE Hours : INTEGER
DECLARE Minutes : INTEGER
OUTPUT "Enter a number of minutes "
INPUT TotalMinutes
Hours <- TotalMinutes DIV 60
Minutes <- TotalMinutes MOD 60
OUTPUT Hours, " hours and ", Minutes, " minutes"`,
        inputs: ['135'],
        predict: 'What will be output when the user enters 135?'
      },
      {
        title: 'Swapping two variables',
        scenario: 'To swap two values you need a third variable to hold one of them. You will use this again in bubble sort.',
        code: `DECLARE First : INTEGER
DECLARE Second : INTEGER
DECLARE Temp : INTEGER
First <- 5
Second <- 9
Temp <- First
First <- Second
Second <- Temp
OUTPUT First, " ", Second`,
        inputs: [],
        predict: 'What would go wrong if you deleted the Temp lines and just wrote First <- Second then Second <- First?'
      }
    ],
    tasks: [
      {
        id: 'seq-1',
        level: 1,
        title: 'Area of a rectangle',
        brief: 'Input the length and width of a rectangle (in metres, can be decimals) and output its area.',
        code: `DECLARE Length : REAL
DECLARE Width : REAL
DECLARE Area : {{REAL}}
OUTPUT "Enter the length in metres "
{{INPUT}} Length
OUTPUT "Enter the width in metres "
INPUT Width
Area {{<-|←}} Length {{*}} Width
{{OUTPUT}} "The area is ", Area, " square metres"`,
        tests: [
          { inputs: ['4', '2.5'], expect: [10] },
          { inputs: ['2.5', '3'], expect: [7.5] },
          { inputs: ['6', '7'], expect: [42] }
        ],
        hints: [
          'Area stores a decimal answer. Which data type holds decimals?',
          'The blank before Length reads in a value typed by the user.',
          'Assignment uses the arrow <- and multiplication uses *.'
        ]
      },
      {
        id: 'seq-2',
        level: 2,
        title: 'Average of three marks',
        brief: 'The program inputs three test marks. Finish it so it calculates the total, then the average, and outputs the average.',
        must: ['Store the sum of the three marks in Total.', 'Store Total divided by 3 in Average.', 'Output Average with a message.'],
        code: `DECLARE Mark1 : INTEGER
DECLARE Mark2 : INTEGER
DECLARE Mark3 : INTEGER
DECLARE Total : INTEGER
DECLARE Average : REAL
OUTPUT "Enter the first mark "
INPUT Mark1
OUTPUT "Enter the second mark "
INPUT Mark2
OUTPUT "Enter the third mark "
INPUT Mark3
// TODO 1: store the sum of the three marks in Total
// TODO 2: store Total divided by 3 in Average
// TODO 3: output Average with a message
`,
        tests: [
          { inputs: ['60', '70', '80'], expect: [70] },
          { inputs: ['55', '60', '62'], expect: [59] },
          { inputs: ['50', '50', '51'], expect: [151 / 3] }
        ],
        hints: [
          'TODO 1 is one assignment line: Total <- ... + ... + ...',
          'TODO 2 uses / to divide. Average is REAL, so a decimal answer is fine.',
          'TODO 3: OUTPUT "The average is ", Average'
        ],
        model: `DECLARE Mark1 : INTEGER
DECLARE Mark2 : INTEGER
DECLARE Mark3 : INTEGER
DECLARE Total : INTEGER
DECLARE Average : REAL
OUTPUT "Enter the first mark "
INPUT Mark1
OUTPUT "Enter the second mark "
INPUT Mark2
OUTPUT "Enter the third mark "
INPUT Mark3
Total <- Mark1 + Mark2 + Mark3
Average <- Total / 3
OUTPUT "The average mark is ", Average`
      },
      {
        id: 'seq-3',
        level: 3,
        title: 'Sharing sweets',
        brief: 'A number of sweets is shared equally between a number of people. Input both numbers. Output how many sweets each person gets, then how many are left over.',
        must: ['Input the number of sweets and the number of people.', 'Use DIV to work out how many each person gets.', 'Use MOD to work out how many are left over.', 'Output both answers, each person\'s share first.'],
        plan: {
          inputs: ['Number of sweets', 'Number of people'],
          process: ['Each person gets: sweets DIV people', 'Left over: sweets MOD people'],
          outputs: ['Sweets each', 'Sweets left over'],
          vars: [['Sweets', 'INTEGER', 'how many sweets'], ['People', 'INTEGER', 'how many people'], ['EachGets', 'INTEGER', 'share per person'], ['LeftOver', 'INTEGER', 'the remainder']]
        },
        tests: [
          { inputs: ['23', '5'], expect: [4, 3] },
          { inputs: ['30', '6'], expect: [5, 0] },
          { inputs: ['7', '10'], expect: [0, 7] }
        ],
        requires: [{ re: '\\bDIV\\b', msg: 'Use DIV to find how many sweets each person gets.' }, { re: '\\bMOD\\b', msg: 'Use MOD to find how many are left over.' }],
        hints: [
          'Start with four DECLARE lines, one for each variable in the plan.',
          'Two prompts and two INPUTs come next: OUTPUT "How many sweets? " then INPUT Sweets.',
          'EachGets <- Sweets DIV People. What is the matching line for LeftOver?',
          'Finish with two OUTPUT lines, EachGets first.'
        ],
        model: `DECLARE Sweets : INTEGER
DECLARE People : INTEGER
DECLARE EachGets : INTEGER
DECLARE LeftOver : INTEGER
OUTPUT "How many sweets are there? "
INPUT Sweets
OUTPUT "How many people are sharing them? "
INPUT People
EachGets <- Sweets DIV People
LeftOver <- Sweets MOD People
OUTPUT "Each person gets ", EachGets
OUTPUT "Sweets left over: ", LeftOver`
      }
    ]
  },

  // ------------------------------------------------------------------ SELECTION
  {
    id: 'selection',
    title: 'Selection',
    group: 'Building blocks',
    colour: 'sel',
    summary: 'IF...THEN...ELSE...ENDIF, nested IFs, AND / OR, and CASE OF.',
    rules: [
      'The condition after IF must be TRUE or FALSE, e.g. <code>Age &gt;= 18</code>.',
      'Compare with <code>=  &lt;&gt;  &lt;  &gt;  &lt;=  &gt;=</code>. Use <code>=</code> to compare and <code>&lt;-</code> to store.',
      'THEN starts the branch that runs when the condition is TRUE. ELSE (optional) runs when it is FALSE. Only one branch ever runs.',
      'Every IF is closed by exactly one ENDIF, including an IF nested inside an ELSE.',
      'AND needs both conditions TRUE. OR needs at least one. Write both sides out in full: <code>Age &gt;= 13 AND Age &lt;= 19</code>.',
      'CASE OF picks one option from a list of values, with OTHERWISE for anything else.'
    ],
    syntax: [
      {
        title: 'IF / THEN / ELSE / ENDIF',
        code: `IF Age >= 18
  THEN
    OUTPUT "Adult"
  ELSE
    OUTPUT "Child"
ENDIF`,
        notes: [
          [1, 'IF is followed by a condition that is TRUE or FALSE.'],
          [2, 'THEN goes on its own line (or at the end of the IF line).'],
          [4, 'ELSE never has a condition. Leave it out if nothing happens when the condition is FALSE.'],
          [6, 'ENDIF closes the block. One ENDIF for every IF.']
        ]
      },
      {
        title: 'A nested IF (more than two outcomes)',
        code: `IF Score >= 70
  THEN
    Grade <- "A"
  ELSE
    IF Score >= 50
      THEN
        Grade <- "B"
      ELSE
        Grade <- "U"
    ENDIF
ENDIF`,
        notes: [
          [5, 'The second IF only gets tested if the first condition was FALSE.'],
          [10, 'The inner IF needs its own ENDIF...'],
          [11, '...and so does the outer IF.']
        ]
      },
      {
        title: 'CASE OF',
        code: `CASE OF Choice
  1 : OUTPUT "Pizza"
  2 : OUTPUT "Pasta"
  OTHERWISE : OUTPUT "Not on the menu"
ENDCASE`,
        notes: [
          [1, 'CASE OF is followed by the variable being checked.'],
          [2, 'Each option is a value, a colon, then what to do.'],
          [4, 'OTHERWISE catches every value not listed.'],
          [5, 'ENDCASE closes the block.']
        ]
      }
    ],
    examples: [
      {
        title: 'Ticket price',
        scenario: 'Children under 12 pay $7. Everyone else pays $12.',
        code: `DECLARE Age : INTEGER
DECLARE Price : INTEGER
OUTPUT "Enter your age "
INPUT Age
IF Age < 12
  THEN
    Price <- 7
  ELSE
    Price <- 12
ENDIF
OUTPUT "Your ticket costs $", Price`,
        inputs: ['10'],
        predict: 'Which lines never run when the age is 10? Then try 12. Is 12 a child price?'
      },
      {
        title: 'Grades with a nested IF',
        scenario: 'A: 70 or more, B: 60 or more, C: 50 or more, otherwise U.',
        code: `DECLARE Score : INTEGER
DECLARE Grade : STRING
OUTPUT "Enter the score "
INPUT Score
IF Score >= 70
  THEN
    Grade <- "A"
  ELSE
    IF Score >= 60
      THEN
        Grade <- "B"
      ELSE
        IF Score >= 50
          THEN
            Grade <- "C"
          ELSE
            Grade <- "U"
        ENDIF
    ENDIF
ENDIF
OUTPUT "Grade: ", Grade`,
        inputs: ['64'],
        predict: 'How many conditions get tested for a score of 64? What about 85?'
      },
      {
        title: 'Menu with CASE OF',
        scenario: 'The user picks a menu option by number.',
        code: `DECLARE Choice : INTEGER
OUTPUT "1 Pizza, 2 Pasta, 3 Salad. Enter your choice "
INPUT Choice
CASE OF Choice
  1 : OUTPUT "Pizza ordered"
  2 : OUTPUT "Pasta ordered"
  3 : OUTPUT "Salad ordered"
  OTHERWISE : OUTPUT "Not on the menu"
ENDCASE`,
        inputs: ['2'],
        predict: 'What happens if the user enters 7?'
      }
    ],
    tasks: [
      {
        id: 'sel-1',
        level: 1,
        title: 'Pass or fail',
        brief: 'Input a mark. Output "Pass" if it is 50 or more, otherwise output "Fail".',
        code: `DECLARE Mark : INTEGER
OUTPUT "Enter the mark "
INPUT Mark
{{IF}} Mark {{>=}} 50
  {{THEN}}
    OUTPUT "Pass"
  {{ELSE}}
    OUTPUT "Fail"
{{ENDIF}}`,
        tests: [
          { inputs: ['50'], expect: ['Pass'], forbid: ['Fail'] },
          { inputs: ['49'], expect: ['Fail'], forbid: ['Pass'] },
          { inputs: ['72'], expect: ['Pass'], forbid: ['Fail'] }
        ],
        hints: [
          'A mark of exactly 50 is a pass. Which operator means "50 or more"?',
          'The block reads IF ... THEN ... ELSE ... ENDIF.'
        ]
      },
      {
        id: 'sel-2',
        level: 2,
        title: 'Cold, mild or hot',
        brief: 'Output "Cold" if the temperature is below 10, "Hot" if it is above 25, and "Mild" for anything in between. The first IF is done for you.',
        must: ['Put a second IF inside the ELSE branch.', 'It outputs "Hot" when Temp is over 25, otherwise "Mild".', 'Close the inner IF with its own ENDIF.'],
        code: `DECLARE Temp : INTEGER
OUTPUT "Enter the temperature "
INPUT Temp
IF Temp < 10
  THEN
    OUTPUT "Cold"
  ELSE
    // TODO: put a new IF here that outputs "Hot" if Temp is
    //       over 25, otherwise "Mild". It needs THEN, ELSE
    //       and its own ENDIF.
ENDIF`,
        tests: [
          { inputs: ['5'], expect: ['Cold'], forbid: ['Mild', 'Hot'] },
          { inputs: ['10'], expect: ['Mild'], forbid: ['Cold', 'Hot'] },
          { inputs: ['25'], expect: ['Mild'], forbid: ['Cold', 'Hot'] },
          { inputs: ['26'], expect: ['Hot'], forbid: ['Cold', 'Mild'] }
        ],
        hints: [
          'The new IF goes on the line where the TODO is, indented inside the ELSE.',
          'IF Temp > 25, then THEN on the next line.',
          'Inside: OUTPUT "Hot", then ELSE, then OUTPUT "Mild", then ENDIF. The outer ENDIF is already there.'
        ],
        model: `DECLARE Temp : INTEGER
OUTPUT "Enter the temperature "
INPUT Temp
IF Temp < 10
  THEN
    OUTPUT "Cold"
  ELSE
    IF Temp > 25
      THEN
        OUTPUT "Hot"
      ELSE
        OUTPUT "Mild"
    ENDIF
ENDIF`
      },
      {
        id: 'sel-3',
        level: 3,
        title: 'Theme park ride',
        brief: 'A ride only lets people on if they are at least 120 cm tall AND at least 8 years old. Input the height and the age. Output "Welcome aboard" or "Sorry, you cannot ride".',
        must: ['Input the height (cm) and the age.', 'Use ONE IF with AND to test both rules.', 'Output exactly "Welcome aboard" or "Sorry, you cannot ride".'],
        plan: {
          inputs: ['Height in cm', 'Age in years'],
          process: ['Allowed if Height >= 120 AND Age >= 8'],
          outputs: ['"Welcome aboard" or "Sorry, you cannot ride"'],
          vars: [['Height', 'INTEGER', 'height in cm'], ['Age', 'INTEGER', 'age in years']]
        },
        tests: [
          { inputs: ['130', '10'], expect: ['Welcome aboard'], forbid: ['Sorry'] },
          { inputs: ['130', '7'], expect: ['Sorry'], forbid: ['Welcome aboard'] },
          { inputs: ['110', '12'], expect: ['Sorry'], forbid: ['Welcome aboard'] },
          { inputs: ['120', '8'], expect: ['Welcome aboard'], forbid: ['Sorry'] }
        ],
        requires: [{ re: '\\bAND\\b', msg: 'Use AND to join the two rules into one condition.' }],
        hints: [
          'DECLARE Height and Age, then prompt and INPUT each one.',
          'Exactly 120 cm and exactly 8 years are both allowed, so use >=.',
          'IF Height >= 120 AND Age >= 8, then THEN on the next line.',
          'The THEN branch outputs "Welcome aboard", the ELSE branch outputs "Sorry, you cannot ride", then ENDIF.'
        ],
        model: `DECLARE Height : INTEGER
DECLARE Age : INTEGER
OUTPUT "Enter your height in cm "
INPUT Height
OUTPUT "Enter your age "
INPUT Age
IF Height >= 120 AND Age >= 8
  THEN
    OUTPUT "Welcome aboard"
  ELSE
    OUTPUT "Sorry, you cannot ride"
ENDIF`
      },
      {
        id: 'sel-4',
        level: 2,
        extension: true,
        title: 'Day names with CASE OF',
        brief: 'Input a day number. Output "Monday" for 1, "Tuesday" for 2, "Wednesday" for 3 and "Invalid day" for anything else.',
        must: ['Add an option for 2 and an option for 3.', 'Add OTHERWISE for every other number.'],
        code: `DECLARE Day : INTEGER
OUTPUT "Enter a day number "
INPUT Day
CASE OF Day
  1 : OUTPUT "Monday"
  // TODO: add options for 2 (Tuesday) and 3 (Wednesday)
  // TODO: add OTHERWISE to output "Invalid day"
ENDCASE`,
        tests: [
          { inputs: ['1'], expect: ['Monday'], forbid: ['Invalid day'] },
          { inputs: ['2'], expect: ['Tuesday'], forbid: ['Invalid day'] },
          { inputs: ['3'], expect: ['Wednesday'], forbid: ['Invalid day'] },
          { inputs: ['9'], expect: ['Invalid day'], forbid: ['Monday', 'Tuesday', 'Wednesday'] }
        ],
        requires: [{ re: '\\bOTHERWISE\\b', msg: 'Use OTHERWISE to catch every other day number.' }],
        hints: [
          'Copy the pattern of line 5: a value, a colon, then the OUTPUT.',
          'The last option is OTHERWISE : OUTPUT "Invalid day"'
        ],
        model: `DECLARE Day : INTEGER
OUTPUT "Enter a day number "
INPUT Day
CASE OF Day
  1 : OUTPUT "Monday"
  2 : OUTPUT "Tuesday"
  3 : OUTPUT "Wednesday"
  OTHERWISE : OUTPUT "Invalid day"
ENDCASE`
      }
    ]
  },

  // ------------------------------------------------------------------ FOR
  {
    id: 'for',
    title: 'FOR loops',
    group: 'Iteration',
    colour: 'iter',
    summary: 'Count-controlled loops, running totals and counting.',
    rules: [
      'Use FOR when you know how many times the loop will run before it starts.',
      '<code>FOR Count &lt;- 1 TO 5</code> sets Count to 1 once. <code>NEXT Count</code> adds 1 and goes back to the top.',
      'The loop stops as soon as the loop variable goes past the end value, so 1 TO 5 runs 5 times.',
      'NEXT names the same variable as the FOR line. The loop variable is DECLAREd as an INTEGER.',
      'Totalling: set <code>Total &lt;- 0</code> BEFORE the loop, then <code>Total &lt;- Total + Value</code> inside it.',
      'Counting: set <code>Count &lt;- 0</code> before the loop, then add 1 inside an IF each time the thing you are counting happens.'
    ],
    syntax: [
      {
        title: 'FOR ... NEXT',
        code: `FOR Count <- 1 TO 10
  OUTPUT Count
NEXT Count`,
        notes: [
          [1, 'The loop variable, a start value and an end value (inclusive).'],
          [2, 'The body is indented. It runs once for every value of Count.'],
          [3, 'NEXT adds 1 to Count and goes back to the top.']
        ]
      },
      {
        title: 'Totalling and counting',
        code: `Total <- 0
BigCount <- 0
FOR Index <- 1 TO 5
  INPUT Value
  Total <- Total + Value
  IF Value > 100
    THEN
      BigCount <- BigCount + 1
  ENDIF
NEXT Index`,
        notes: [
          [1, 'Start the total at 0 before the loop. Inside the loop it would reset every pass.'],
          [5, 'Add each new value onto the total so far.'],
          [8, 'Count only when the condition is TRUE.']
        ]
      }
    ],
    examples: [
      {
        title: 'Three times table',
        scenario: 'Output the first five lines of the three times table.',
        code: `DECLARE Count : INTEGER
FOR Count <- 1 TO 5
  OUTPUT Count, " x 3 = ", Count * 3
NEXT Count`,
        inputs: [],
        predict: 'What is the value of Count when the loop finally stops?'
      },
      {
        title: 'Running total',
        scenario: 'Input four numbers and output their total.',
        code: `DECLARE Total : INTEGER
DECLARE Number : INTEGER
DECLARE Count : INTEGER
Total <- 0
FOR Count <- 1 TO 4
  OUTPUT "Enter number ", Count
  INPUT Number
  Total <- Total + Number
NEXT Count
OUTPUT "The total is ", Total`,
        inputs: ['5', '8', '2', '10'],
        predict: 'What is Total after the second number has been added?'
      }
    ],
    tasks: [
      {
        id: 'for-1',
        level: 1,
        title: 'Seven times table',
        brief: 'Output 7, 14, 21 and so on, up to 70 (the first ten multiples of 7).',
        code: `DECLARE Count : INTEGER
{{FOR}} Count {{<-|←}} 1 TO {{10}}
  OUTPUT Count {{*}} 7
{{NEXT}} Count`,
        tests: [
          { inputs: [], expect: [7, 14, 21, 28, 35, 42, 49, 56, 63, 70], forbid: [77] }
        ],
        hints: [
          'The loop starts with the keyword FOR and ends with NEXT.',
          'Ten multiples means the loop runs from 1 TO 10.'
        ]
      },
      {
        id: 'for-2',
        level: 2,
        title: 'Shopping total',
        brief: 'Input the prices of 5 items and output the total cost.',
        must: ['Set Total to 0 before the loop.', 'Add each Price to Total inside the loop.'],
        code: `DECLARE Price : REAL
DECLARE Total : REAL
DECLARE Count : INTEGER
// TODO 1: set Total to 0 before the loop starts
FOR Count <- 1 TO 5
  OUTPUT "Enter the price of item ", Count
  INPUT Price
  // TODO 2: add Price to Total
NEXT Count
OUTPUT "The total is $", Total`,
        tests: [
          { inputs: ['2.5', '3', '4', '1.5', '10'], expect: [21] },
          { inputs: ['1', '1', '1', '1', '1'], expect: [5] },
          { inputs: ['0.99', '5', '12.01', '3', '4'], expect: [25] }
        ],
        hints: [
          'TODO 1 is one line: Total <- 0',
          'TODO 2 adds onto the old total: Total <- Total + Price',
          'Why must TODO 1 be before FOR? Try moving it inside the loop and step through to see.'
        ],
        model: `DECLARE Price : REAL
DECLARE Total : REAL
DECLARE Count : INTEGER
Total <- 0
FOR Count <- 1 TO 5
  OUTPUT "Enter the price of item ", Count
  INPUT Price
  Total <- Total + Price
NEXT Count
OUTPUT "The total is $", Total`
      },
      {
        id: 'for-3',
        level: 3,
        title: 'Counting passes',
        brief: 'Input 6 exam marks, one at a time. Count how many are 50 or more. Output that count at the end.',
        must: ['Use a FOR loop that runs 6 times.', 'Input one mark each time round the loop.', 'Use an IF inside the loop to count marks of 50 or more.', 'Output the count after the loop.'],
        plan: {
          inputs: ['6 marks, one per pass of the loop'],
          process: ['PassCount starts at 0', 'Inside the loop: if Mark >= 50, add 1 to PassCount'],
          outputs: ['PassCount, after the loop'],
          vars: [['Mark', 'INTEGER', 'the mark just entered'], ['PassCount', 'INTEGER', 'how many passes so far'], ['Index', 'INTEGER', 'the loop counter']]
        },
        tests: [
          { inputs: ['45', '50', '80', '12', '99', '50'], expect: [4], useAllInputs: true },
          { inputs: ['1', '2', '3', '4', '5', '6'], expect: [0], useAllInputs: true },
          { inputs: ['50', '60', '70', '80', '90', '100'], expect: [6], useAllInputs: true }
        ],
        requires: [{ re: '\\bFOR\\b', msg: 'Use a FOR loop, because you know it runs exactly 6 times.' }, { re: '\\bIF\\b', msg: 'Use an IF inside the loop to decide whether to count the mark.' }],
        hints: [
          'Declare Mark, PassCount and Index. Set PassCount <- 0 before the loop.',
          'FOR Index <- 1 TO 6 ... NEXT Index',
          'Inside the loop: prompt, INPUT Mark, then IF Mark >= 50 THEN PassCount <- PassCount + 1 ENDIF.',
          'The OUTPUT goes after NEXT, so it only runs once.'
        ],
        model: `DECLARE Mark : INTEGER
DECLARE PassCount : INTEGER
DECLARE Index : INTEGER
PassCount <- 0
FOR Index <- 1 TO 6
  OUTPUT "Enter mark ", Index
  INPUT Mark
  IF Mark >= 50
    THEN
      PassCount <- PassCount + 1
  ENDIF
NEXT Index
OUTPUT PassCount, " marks were 50 or more"`
      }
    ]
  },

  // ------------------------------------------------------------------ WHILE
  {
    id: 'while',
    title: 'WHILE loops',
    group: 'Iteration',
    colour: 'iter',
    summary: 'Pre-condition loops: the condition is checked before every pass. Validation loops.',
    rules: [
      'Use a condition-controlled loop when you do not know in advance how many passes are needed.',
      'WHILE tests its condition BEFORE every pass, including the first. If it starts FALSE, the body runs zero times.',
      'The loop keeps going while the condition is TRUE, so something inside the loop must change it.',
      'Validation shape: INPUT once before the loop; WHILE the value is invalid, INPUT it again inside the loop.',
      'Close the loop with ENDWHILE.'
    ],
    syntax: [
      {
        title: 'A validation loop',
        code: `OUTPUT "Enter a number from 1 to 10 "
INPUT Number
WHILE Number < 1 OR Number > 10 DO
  OUTPUT "Out of range, try again "
  INPUT Number
ENDWHILE`,
        notes: [
          [2, 'Input once BEFORE the loop, so the condition has a value to test.'],
          [3, 'The condition describes an INVALID value. OR, because being too small or too big are both invalid.'],
          [5, 'Input again INSIDE the loop, so the condition can change.'],
          [6, 'ENDWHILE closes the loop.']
        ]
      }
    ],
    examples: [
      {
        title: 'Range check',
        scenario: 'Keep asking until the number is between 1 and 10.',
        code: `DECLARE Number : INTEGER
OUTPUT "Enter a number from 1 to 10 "
INPUT Number
WHILE Number < 1 OR Number > 10 DO
  OUTPUT "Out of range. Enter a number from 1 to 10 "
  INPUT Number
ENDWHILE
OUTPUT "Accepted: ", Number`,
        inputs: ['14', '0', '7'],
        predict: 'How many times does the loop body run for the inputs 14, 0, 7? Now try just 5.'
      },
      {
        title: 'Keep doubling',
        scenario: 'Double a number until it goes over 100, counting the passes.',
        code: `DECLARE Number : INTEGER
DECLARE Passes : INTEGER
Number <- 3
Passes <- 0
WHILE Number <= 100 DO
  Number <- Number * 2
  Passes <- Passes + 1
ENDWHILE
OUTPUT "Number is ", Number, " after ", Passes, " passes"`,
        inputs: [],
        predict: 'Change line 3 to Number <- 200. How many passes happen now?'
      }
    ],
    tasks: [
      {
        id: 'while-1',
        level: 1,
        title: 'Countdown',
        brief: 'Count down from 5 to 1, then output "Lift off!".',
        code: `DECLARE Count : INTEGER
Count <- 5
WHILE Count {{>}} 0 {{DO}}
  OUTPUT Count
  Count <- Count {{-}} 1
{{ENDWHILE}}
OUTPUT "Lift off!"`,
        tests: [
          { inputs: [], expect: [5, 4, 3, 2, 1, 'Lift off'], forbid: [0] }
        ],
        hints: [
          'The loop should keep going while Count is still above 0.',
          'Count goes down by one each pass.',
          'A WHILE line ends with DO, and the loop is closed with ENDWHILE.'
        ]
      },
      {
        id: 'while-2',
        level: 2,
        title: 'Age check',
        brief: 'A secondary school only accepts ages from 11 to 18. Finish the validation loop so any other age is rejected and asked for again.',
        must: ['A WHILE loop that runs while Age is below 11 OR above 18.', 'Inside it, output an error message and INPUT Age again.', 'Close it with ENDWHILE.'],
        code: `DECLARE Age : INTEGER
OUTPUT "Enter your age "
INPUT Age
// TODO 1: WHILE Age is below 11 or above 18 ...
//         output an error message and INPUT Age again
// TODO 2: close the loop
OUTPUT "Age accepted: ", Age`,
        tests: [
          { inputs: ['25', '9', '15'], expect: [15], useAllInputs: true },
          { inputs: ['16'], expect: [16], useAllInputs: true },
          { inputs: ['4', '19', '12'], expect: [12], useAllInputs: true }
        ],
        requires: [{ re: '\\bWHILE\\b', msg: 'Use a WHILE loop for this task.' }],
        hints: [
          'The condition describes a WRONG age: Age < 11 OR Age > 18',
          'WHILE Age < 11 OR Age > 18 DO',
          'Inside: OUTPUT "Invalid age, try again " then INPUT Age. Then ENDWHILE.'
        ],
        model: `DECLARE Age : INTEGER
OUTPUT "Enter your age "
INPUT Age
WHILE Age < 11 OR Age > 18 DO
  OUTPUT "That age is not accepted. Enter your age "
  INPUT Age
ENDWHILE
OUTPUT "Age accepted: ", Age`
      },
      {
        id: 'while-3',
        level: 3,
        title: 'Add until zero',
        brief: 'Keep inputting numbers and adding them to a total until the user enters 0. Then output the total. If the very first number is 0, the total is 0.',
        must: ['Use a WHILE loop.', 'Input the first number before the loop.', 'Stop when 0 is entered (0 is not added).', 'Output the total after the loop.'],
        plan: {
          inputs: ['Numbers, until 0 is entered'],
          process: ['Total starts at 0', 'While Number is not 0: add it to Total, input the next number'],
          outputs: ['Total'],
          vars: [['Number', 'INTEGER', 'the number just entered'], ['Total', 'INTEGER', 'the running total']]
        },
        tests: [
          { inputs: ['5', '10', '3', '0'], expect: [18], useAllInputs: true },
          { inputs: ['0'], expect: [0], useAllInputs: true },
          { inputs: ['7', '-2', '0'], expect: [5], useAllInputs: true }
        ],
        requires: [{ re: '\\bWHILE\\b', msg: 'Use a WHILE loop for this task.' }],
        hints: [
          'Total <- 0, then prompt and INPUT Number, all before the loop.',
          'WHILE Number <> 0 DO',
          'Inside the loop: add Number to Total, then prompt and INPUT Number again. The order matters.',
          'After ENDWHILE, OUTPUT the total.'
        ],
        model: `DECLARE Number : INTEGER
DECLARE Total : INTEGER
Total <- 0
OUTPUT "Enter a number (0 to stop) "
INPUT Number
WHILE Number <> 0 DO
  Total <- Total + Number
  OUTPUT "Enter a number (0 to stop) "
  INPUT Number
ENDWHILE
OUTPUT "The total is ", Total`
      }
    ]
  },

  // ------------------------------------------------------------------ REPEAT
  {
    id: 'repeat',
    title: 'REPEAT loops',
    group: 'Iteration',
    colour: 'iter',
    summary: 'Post-condition loops: the body always runs at least once, and the condition is checked at UNTIL.',
    rules: [
      'REPEAT...UNTIL always runs its body at least once. The condition is checked at the end of every pass.',
      'It keeps looping UNTIL the condition becomes TRUE, the opposite of WHILE.',
      'For validation you do not need an INPUT before the loop: the INPUT inside runs at least once.',
      'WHILE Age &lt; 11 OR Age &gt; 18 and UNTIL Age &gt;= 11 AND Age &lt;= 18 describe the same rule. The conditions are opposites.'
    ],
    syntax: [
      {
        title: 'REPEAT ... UNTIL',
        code: `REPEAT
  OUTPUT "Enter a password of at least 8 characters "
  INPUT Password
UNTIL LENGTH(Password) >= 8`,
        notes: [
          [1, 'REPEAT goes on a line by itself. No condition here.'],
          [3, 'No separate INPUT is needed before the loop.'],
          [4, 'UNTIL describes the VALID value: stop once this is TRUE.']
        ]
      },
      {
        title: 'Which loop?',
        code: `FOR    // you know how many times: "input 10 marks"
WHILE  // may need to run zero times: "until 0 is entered"
REPEAT // must run at least once: "ask until valid"`,
        notes: []
      }
    ],
    examples: [
      {
        title: 'Password length',
        scenario: 'Keep asking until the password has at least 8 characters.',
        code: `DECLARE Password : STRING
REPEAT
  OUTPUT "Choose a password of at least 8 characters "
  INPUT Password
UNTIL LENGTH(Password) >= 8
OUTPUT "Password saved"`,
        inputs: ['cat', 'dragonfly'],
        predict: 'How many times is the UNTIL condition checked?'
      },
      {
        title: 'Guessing game',
        scenario: 'Keep guessing until the secret number is found, counting the guesses.',
        code: `DECLARE Secret : INTEGER
DECLARE Guess : INTEGER
DECLARE Guesses : INTEGER
Secret <- 7
Guesses <- 0
REPEAT
  OUTPUT "Guess the number "
  INPUT Guess
  Guesses <- Guesses + 1
UNTIL Guess = Secret
OUTPUT "Correct in ", Guesses, " guesses"`,
        inputs: ['4', '9', '7'],
        predict: 'What is output if the first guess is 7?'
      }
    ],
    tasks: [
      {
        id: 'repeat-1',
        level: 1,
        title: 'Four-character PIN',
        brief: 'Keep asking for a PIN until it is exactly 4 characters long, then output "PIN accepted".',
        code: `DECLARE PIN : STRING
{{REPEAT}}
  OUTPUT "Enter a four-character PIN "
  INPUT PIN
{{UNTIL}} {{LENGTH}}(PIN) {{=}} 4
OUTPUT "PIN accepted"`,
        tests: [
          { inputs: ['12', '12345', '2468'], expect: ['PIN accepted'], useAllInputs: true },
          { inputs: ['1234'], expect: ['PIN accepted'], useAllInputs: true }
        ],
        hints: [
          'The loop starts with REPEAT and ends with UNTIL.',
          'LENGTH(PIN) gives the number of characters in PIN.',
          'Stop when the length is exactly 4.'
        ]
      },
      {
        id: 'repeat-2',
        level: 2,
        title: 'Higher or lower',
        brief: 'The guessing game should tell the player "Too low" or "Too high" after each wrong guess.',
        must: ['After INPUT Guess, output "Too low" if Guess is less than Secret.', 'Output "Too high" if Guess is greater than Secret.', 'Output nothing extra for a correct guess.'],
        code: `DECLARE Secret : INTEGER
DECLARE Guess : INTEGER
Secret <- 7
REPEAT
  OUTPUT "Guess the number between 1 and 10 "
  INPUT Guess
  // TODO: if Guess is less than Secret output "Too low",
  //       if Guess is greater than Secret output "Too high"
UNTIL Guess = Secret
OUTPUT "Correct!"`,
        tests: [
          { inputs: ['3', '9', '7'], expect: ['Too low', 'Too high', 'Correct'], useAllInputs: true },
          { inputs: ['7'], expect: ['Correct'], forbid: ['Too low', 'Too high'] },
          { inputs: ['10', '8', '1', '7'], expect: ['Too high', 'Too high', 'Too low', 'Correct'], useAllInputs: true }
        ],
        hints: [
          'You need two separate tests. Either two IFs, or one IF with a nested IF in its ELSE.',
          'IF Guess < Secret, then THEN, OUTPUT "Too low", ENDIF',
          'The second test is IF Guess > Secret. A correct guess fails both tests, so nothing extra is output.'
        ],
        model: `DECLARE Secret : INTEGER
DECLARE Guess : INTEGER
Secret <- 7
REPEAT
  OUTPUT "Guess the number between 1 and 10 "
  INPUT Guess
  IF Guess < Secret
    THEN
      OUTPUT "Too low"
  ENDIF
  IF Guess > Secret
    THEN
      OUTPUT "Too high"
  ENDIF
UNTIL Guess = Secret
OUTPUT "Correct!"`
      },
      {
        id: 'repeat-3',
        level: 3,
        title: 'Saving for a bike',
        brief: 'Sam is saving for a $100 bike. Input the amount saved each week and add it to a running total, repeating until the total reaches at least 100. Then output how many weeks it took.',
        must: ['Use REPEAT...UNTIL.', 'Keep a running total of the money saved.', 'Count the weeks.', 'Output the number of weeks after the loop.'],
        plan: {
          inputs: ['The amount saved each week (can be a decimal)'],
          process: ['Total and Weeks start at 0', 'Each pass: input the amount, add it to Total, add 1 to Weeks', 'Stop when Total >= 100'],
          outputs: ['Weeks'],
          vars: [['Saved', 'REAL', 'this week\'s amount'], ['Total', 'REAL', 'total saved so far'], ['Weeks', 'INTEGER', 'weeks so far']]
        },
        tests: [
          { inputs: ['30', '30', '30', '30'], expect: [4], useAllInputs: true },
          { inputs: ['120'], expect: [1], useAllInputs: true },
          { inputs: ['50', '49.5', '0.5'], expect: [3], useAllInputs: true }
        ],
        requires: [{ re: '\\bREPEAT\\b', msg: 'Use REPEAT...UNTIL for this task.' }, { re: '\\bUNTIL\\b', msg: 'Close the loop with UNTIL and a condition.' }],
        hints: [
          'Set Total <- 0 and Weeks <- 0 before REPEAT.',
          'Inside the loop: prompt, INPUT Saved, Total <- Total + Saved, Weeks <- Weeks + 1.',
          'UNTIL Total >= 100',
          'OUTPUT "It took ", Weeks, " weeks"'
        ],
        model: `DECLARE Saved : REAL
DECLARE Total : REAL
DECLARE Weeks : INTEGER
Total <- 0
Weeks <- 0
REPEAT
  OUTPUT "How much did you save this week? "
  INPUT Saved
  Total <- Total + Saved
  Weeks <- Weeks + 1
UNTIL Total >= 100
OUTPUT "It took ", Weeks, " weeks"`
      }
    ]
  },

  // ------------------------------------------------------------------ ARRAYS
  {
    id: 'arrays',
    title: 'Arrays: total, max, min',
    group: 'Standard methods',
    colour: 'arr',
    summary: '1D arrays with FOR loops: totalling, averages, and finding the highest or lowest value.',
    rules: [
      '<code>DECLARE Scores : ARRAY[1:30] OF INTEGER</code> holds 30 values, Scores[1] to Scores[30].',
      'A FOR loop with the same range as the array visits every element: <code>FOR Index &lt;- 1 TO 30</code>, then use <code>Scores[Index]</code>.',
      'Average: total everything first, then divide by how many there are, after the loop.',
      'Highest (or lowest): start with the FIRST element, then compare every other element and replace it when you find a bigger (or smaller) one.',
      'In the tasks here, the array is already declared and filled for you. Look at the Given data box.'
    ],
    syntax: [
      {
        title: 'Declaring and filling an array',
        code: `DECLARE Scores : ARRAY[1:5] OF INTEGER
DECLARE Index : INTEGER
FOR Index <- 1 TO 5
  OUTPUT "Enter score ", Index
  INPUT Scores[Index]
NEXT Index`,
        notes: [
          [1, '[1:5] means indexes 1 to 5. Every element has the same type.'],
          [3, 'The loop range matches the array range.'],
          [5, 'Index picks a different element on each pass.']
        ]
      },
      {
        title: 'Finding the highest value',
        code: `Highest <- Scores[1]
FOR Index <- 2 TO 5
  IF Scores[Index] > Highest
    THEN
      Highest <- Scores[Index]
  ENDIF
NEXT Index`,
        notes: [
          [1, 'Start with the first element, not 0 (the values could all be negative).'],
          [3, 'Use < instead to find the lowest.']
        ]
      }
    ],
    examples: [
      {
        title: 'Filling an array',
        scenario: 'Input four scores into an array, then output the first and last.',
        code: `DECLARE Scores : ARRAY[1:4] OF INTEGER
DECLARE Index : INTEGER
FOR Index <- 1 TO 4
  OUTPUT "Enter score ", Index
  INPUT Scores[Index]
NEXT Index
OUTPUT "The first score was ", Scores[1]
OUTPUT "The last score was ", Scores[4]`,
        inputs: ['12', '18', '7', '15'],
        predict: 'What would happen if the FOR loop went up to 5?'
      },
      {
        title: 'Average and highest',
        scenario: 'Temps already holds a week of temperatures. Find the average and the highest.',
        givens: [{ name: 'Temps', type: 'INTEGER', values: [18, 21, 25, 19, 23, 26, 20] }],
        code: `DECLARE Total : INTEGER
DECLARE Highest : INTEGER
DECLARE Day : INTEGER
Total <- 0
Highest <- Temps[1]
FOR Day <- 1 TO 7
  Total <- Total + Temps[Day]
  IF Temps[Day] > Highest
    THEN
      Highest <- Temps[Day]
  ENDIF
NEXT Day
OUTPUT "Average: ", Total / 7
OUTPUT "Highest: ", Highest`,
        inputs: [],
        predict: 'On which days does Highest change?'
      }
    ],
    tasks: [
      {
        id: 'arr-1',
        level: 1,
        title: 'Total and average',
        brief: 'Scores holds 6 scores. Output their total and their average.',
        givens: [{ name: 'Scores', type: 'INTEGER', values: [12, 15, 9, 20, 14, 8] }],
        code: `DECLARE Total : INTEGER
DECLARE Average : REAL
DECLARE Index : INTEGER
Total <- {{0}}
FOR Index <- 1 TO {{6}}
  Total <- Total + Scores[{{Index}}]
NEXT Index
Average <- Total {{/}} 6
OUTPUT "Total: ", Total
OUTPUT "Average: ", Average`,
        tests: [
          { inputs: [], expect: [78, 13] },
          { inputs: [], givens: [{ name: 'Scores', type: 'INTEGER', values: [10, 10, 10, 10, 10, 16] }], expect: [66, 11] },
          { inputs: [], givens: [{ name: 'Scores', type: 'INTEGER', values: [1, 2, 3, 4, 5, 6] }], expect: [21, 3.5] }
        ],
        hints: [
          'A running total always starts at 0.',
          'The loop visits all 6 elements, and the loop variable picks which element.',
          'The average is the total divided by how many.'
        ]
      },
      {
        id: 'arr-2',
        level: 2,
        title: 'Tallest student',
        brief: 'Heights holds the heights of 8 students in cm. Finish the loop so it finds the tallest height.',
        givens: [{ name: 'Heights', type: 'INTEGER', values: [152, 167, 149, 171, 160, 158, 175, 163] }],
        must: ['Inside the loop, compare Heights[Index] with Highest.', 'If it is bigger, store it in Highest.'],
        code: `DECLARE Highest : INTEGER
DECLARE Index : INTEGER
Highest <- Heights[1]
FOR Index <- 2 TO 8
  // TODO: if this height is bigger than Highest,
  //       store it in Highest
NEXT Index
OUTPUT "The tallest height is ", Highest, " cm"`,
        tests: [
          { inputs: [], expect: [175] },
          { inputs: [], givens: [{ name: 'Heights', type: 'INTEGER', values: [180, 150, 151, 152, 153, 154, 155, 156] }], expect: [180] },
          { inputs: [], givens: [{ name: 'Heights', type: 'INTEGER', values: [140, 150, 145, 160, 155, 170, 165, 190] }], expect: [190] }
        ],
        hints: [
          'IF Heights[Index] > Highest',
          'THEN on the next line, then Highest <- Heights[Index], then ENDIF.',
          'Why does the loop start at 2? Look at line 3.'
        ],
        model: `DECLARE Highest : INTEGER
DECLARE Index : INTEGER
Highest <- Heights[1]
FOR Index <- 2 TO 8
  IF Heights[Index] > Highest
    THEN
      Highest <- Heights[Index]
  ENDIF
NEXT Index
OUTPUT "The tallest height is ", Highest, " cm"`
      },
      {
        id: 'arr-3',
        level: 3,
        title: 'Coldest day',
        brief: 'Temps holds the midday temperature for 7 days (day 1 to day 7). Output the lowest temperature, then the day number it happened on. If two days tie, give the first one.',
        givens: [{ name: 'Temps', type: 'INTEGER', values: [14, 11, 16, 9, 12, 9, 15] }],
        must: ['Find the lowest value in Temps.', 'Remember which day (index) it was on.', 'Output the lowest temperature, then the day.'],
        plan: {
          inputs: ['None: Temps is already filled'],
          process: ['Start with Lowest <- Temps[1] and LowDay <- 1', 'For days 2 to 7: if Temps[Day] < Lowest, update Lowest AND LowDay'],
          outputs: ['Lowest', 'LowDay'],
          vars: [['Lowest', 'INTEGER', 'lowest temperature so far'], ['LowDay', 'INTEGER', 'the day it happened'], ['Day', 'INTEGER', 'the loop counter']]
        },
        tests: [
          { inputs: [], expect: [9, 4] },
          { inputs: [], givens: [{ name: 'Temps', type: 'INTEGER', values: [5, 8, 8, 8, 8, 8, 8] }], expect: [5, 1] },
          { inputs: [], givens: [{ name: 'Temps', type: 'INTEGER', values: [20, 19, 18, 17, 16, 15, 3] }], expect: [3, 7] }
        ],
        requires: [{ re: '\\bFOR\\b', msg: 'Use a FOR loop to visit every day.' }],
        hints: [
          'This is the "highest" method from the Learn tab, with < instead of >.',
          'Before the loop: Lowest <- Temps[1] and LowDay <- 1',
          'Inside the IF, update two variables: Lowest <- Temps[Day] and LowDay <- Day',
          'Use < rather than <= so a tie keeps the first day.'
        ],
        model: `DECLARE Lowest : INTEGER
DECLARE LowDay : INTEGER
DECLARE Day : INTEGER
Lowest <- Temps[1]
LowDay <- 1
FOR Day <- 2 TO 7
  IF Temps[Day] < Lowest
    THEN
      Lowest <- Temps[Day]
      LowDay <- Day
  ENDIF
NEXT Day
OUTPUT "Lowest temperature: ", Lowest
OUTPUT "It was on day ", LowDay`
      }
    ]
  },

  // ------------------------------------------------------------------ LINEAR SEARCH
  {
    id: 'search',
    title: 'Linear search',
    group: 'Standard methods',
    colour: 'arr',
    summary: 'Check each element in turn, using a Found flag, and stop early when the item is found.',
    rules: [
      'A linear search checks element 1, then 2, then 3, in order, until it finds the item or runs out of elements.',
      'Set a BOOLEAN flag <code>Found &lt;- FALSE</code> before the search. Set it to TRUE when there is a match.',
      'A FOR loop checks every element. A WHILE loop can stop as soon as the item is found: <code>WHILE Index &lt;= 6 AND NOT Found DO</code>.',
      'After the loop, use the flag to decide what to output, including a "not found" message.',
      'If the item is found, Index tells you where it is. Use it to look up matching data in another array.'
    ],
    syntax: [
      {
        title: 'Linear search that stops early',
        code: `Found <- FALSE
Index <- 1
WHILE Index <= 6 AND NOT Found DO
  IF Names[Index] = SearchName
    THEN
      Found <- TRUE
    ELSE
      Index <- Index + 1
  ENDIF
ENDWHILE`,
        notes: [
          [1, 'The flag starts FALSE: nothing found yet.'],
          [3, 'Keep going while there are elements left AND the item has not been found.'],
          [6, 'Found: the loop stops, and Index stays pointing at the match.'],
          [8, 'Not this one: move on to the next element.']
        ]
      }
    ],
    examples: [
      {
        title: 'Find a name',
        scenario: 'Names already holds 6 names. Search for the name the user enters.',
        givens: [{ name: 'Names', type: 'STRING', values: ['Aiko', 'Ben', 'Chloe', 'Dev', 'Priya', 'Sam'] }],
        code: `DECLARE SearchName : STRING
DECLARE Index : INTEGER
DECLARE Found : BOOLEAN
OUTPUT "Who are you looking for? "
INPUT SearchName
Found <- FALSE
Index <- 1
WHILE Index <= 6 AND NOT Found DO
  IF Names[Index] = SearchName
    THEN
      Found <- TRUE
    ELSE
      Index <- Index + 1
  ENDIF
ENDWHILE
IF Found
  THEN
    OUTPUT SearchName, " found at position ", Index
  ELSE
    OUTPUT SearchName, " is not in the list"
ENDIF`,
        inputs: ['Dev'],
        predict: 'How many comparisons are made to find Dev? Now try Zak, who is not in the list.'
      }
    ],
    tasks: [
      {
        id: 'search-1',
        level: 1,
        title: 'Is the number there?',
        brief: 'Numbers holds 8 numbers. Input a number and output "Number found" or "Number is not in the list".',
        givens: [{ name: 'Numbers', type: 'INTEGER', values: [42, 17, 8, 99, 23, 61, 5, 30] }],
        code: `DECLARE Target : INTEGER
DECLARE Index : INTEGER
DECLARE Found : BOOLEAN
OUTPUT "Enter the number to find "
INPUT Target
Found <- {{FALSE}}
FOR Index <- 1 TO {{8}}
  IF Numbers[Index] {{=}} Target
    THEN
      Found <- {{TRUE}}
  ENDIF
NEXT Index
IF Found
  THEN
    OUTPUT "Number found"
  ELSE
    OUTPUT "Number is not in the list"
ENDIF`,
        tests: [
          { inputs: ['99'], expect: ['Number found'], forbid: ['not in the list'] },
          { inputs: ['30'], expect: ['Number found'], forbid: ['not in the list'] },
          { inputs: ['50'], expect: ['not in the list'], forbid: ['Number found'] }
        ],
        hints: [
          'Before the search nothing has been found yet.',
          'The loop must reach the last element, Numbers[8].',
          'Compare with =. When there is a match the flag becomes TRUE.'
        ]
      },
      {
        id: 'search-2',
        level: 2,
        title: 'Product code lookup',
        brief: 'Codes holds 8 product codes. Finish the search so it stops as soon as the code is found and outputs its position.',
        givens: [{ name: 'Codes', type: 'STRING', values: ['A12', 'B07', 'C33', 'D41', 'E05', 'F19', 'G62', 'H28'] }],
        must: ['A WHILE loop that runs while Index <= 8 AND NOT Found.', 'Inside: if Codes[Index] = Target set Found to TRUE, otherwise add 1 to Index.', 'Close the loop with ENDWHILE.'],
        code: `DECLARE Target : STRING
DECLARE Index : INTEGER
DECLARE Found : BOOLEAN
OUTPUT "Enter the product code "
INPUT Target
Found <- FALSE
Index <- 1
// TODO 1: WHILE there are still codes to check AND the code
//         has not been found yet...
  // TODO 2: if Codes[Index] matches Target, set Found to TRUE,
  //         otherwise add 1 to Index
// TODO 3: close the loop
IF Found
  THEN
    OUTPUT "Code found at position ", Index
  ELSE
    OUTPUT "Code not recognised"
ENDIF`,
        tests: [
          { inputs: ['C33'], expect: ['Code found', 3], forbid: ['not recognised'] },
          { inputs: ['H28'], expect: ['Code found', 8], forbid: ['not recognised'] },
          { inputs: ['A12'], expect: ['Code found', 1], forbid: ['not recognised'] },
          { inputs: ['Z99'], expect: ['Code not recognised'], forbid: ['Code found'] }
        ],
        requires: [{ re: '\\bWHILE\\b|\\bREPEAT\\b', msg: 'Use a WHILE loop so the search stops as soon as the code is found.' }],
        hints: [
          'WHILE Index <= 8 AND NOT Found DO',
          'Inside: IF Codes[Index] = Target, THEN Found <- TRUE, ELSE Index <- Index + 1, ENDIF',
          'Why does Index only go up in the ELSE branch? Think about what Index should be when the loop stops.'
        ],
        model: `DECLARE Target : STRING
DECLARE Index : INTEGER
DECLARE Found : BOOLEAN
OUTPUT "Enter the product code "
INPUT Target
Found <- FALSE
Index <- 1
WHILE Index <= 8 AND NOT Found DO
  IF Codes[Index] = Target
    THEN
      Found <- TRUE
    ELSE
      Index <- Index + 1
  ENDIF
ENDWHILE
IF Found
  THEN
    OUTPUT "Code found at position ", Index
  ELSE
    OUTPUT "Code not recognised"
ENDIF`
      },
      {
        id: 'search-3',
        level: 3,
        title: 'Look up a mark',
        brief: 'Students holds 5 names and Marks holds their marks: Marks[1] belongs to Students[1], and so on. Input a name. If it is found, output that student\'s mark. Otherwise output "Student not found".',
        givens: [
          { name: 'Students', type: 'STRING', values: ['Amir', 'Bella', 'Chen', 'Dana', 'Eli'] },
          { name: 'Marks', type: 'INTEGER', values: [67, 82, 45, 91, 58] }
        ],
        must: ['Input the name to search for.', 'Linear search Students using a Found flag.', 'If found, output Marks at the same index.', 'If not found, output "Student not found".'],
        plan: {
          inputs: ['The name to look up'],
          process: ['Linear search Students for the name, stopping when found', 'The matching mark is Marks[Index]'],
          outputs: ['The mark, or "Student not found"'],
          vars: [['SearchName', 'STRING', 'the name entered'], ['Index', 'INTEGER', 'the position being checked'], ['Found', 'BOOLEAN', 'has it been found yet?']]
        },
        tests: [
          { inputs: ['Chen'], expect: [45], forbid: ['Student not found'] },
          { inputs: ['Eli'], expect: [58], forbid: ['Student not found'] },
          { inputs: ['Amir'], expect: [67], forbid: ['Student not found'] },
          { inputs: ['Zara'], expect: ['Student not found'] }
        ],
        requires: [{ re: 'Marks\\s*\\[', msg: 'Output the mark from the Marks array, using the index where the name was found.' }],
        hints: [
          'Start from the "Find a name" example in the Learn tab.',
          'The loop condition: WHILE Index <= 5 AND NOT Found DO',
          'After the loop: IF Found THEN OUTPUT Marks[Index] ELSE OUTPUT "Student not found" ENDIF'
        ],
        model: `DECLARE SearchName : STRING
DECLARE Index : INTEGER
DECLARE Found : BOOLEAN
OUTPUT "Enter the student's name "
INPUT SearchName
Found <- FALSE
Index <- 1
WHILE Index <= 5 AND NOT Found DO
  IF Students[Index] = SearchName
    THEN
      Found <- TRUE
    ELSE
      Index <- Index + 1
  ENDIF
ENDWHILE
IF Found
  THEN
    OUTPUT SearchName, "'s mark is ", Marks[Index]
  ELSE
    OUTPUT "Student not found"
ENDIF`
      }
    ]
  },

  // ------------------------------------------------------------------ BUBBLE SORT
  {
    id: 'sort',
    title: 'Bubble sort',
    group: 'Standard methods',
    colour: 'arr',
    summary: 'Compare neighbours, swap them if they are in the wrong order, and repeat passes until nothing swaps.',
    rules: [
      'Each pass compares element 1 with 2, then 2 with 3, and so on to the end: only neighbours are compared.',
      'If a pair is the wrong way round, swap them using a Temp variable (three lines).',
      'After each pass the largest unsorted value has "bubbled" to the end.',
      'A Swap flag records whether anything moved. When a whole pass makes no swaps, the array is sorted and the loop stops.',
      'The inner FOR loop runs to one less than the number of elements, because it compares Index with Index + 1.',
      'For descending order, swap when the first value is SMALLER than the next one.'
    ],
    syntax: [
      {
        title: 'Bubble sort with a Swap flag',
        code: `REPEAT
  Swap <- FALSE
  FOR Index <- 1 TO 4
    IF Numbers[Index] > Numbers[Index + 1]
      THEN
        Temp <- Numbers[Index]
        Numbers[Index] <- Numbers[Index + 1]
        Numbers[Index + 1] <- Temp
        Swap <- TRUE
    ENDIF
  NEXT Index
UNTIL Swap = FALSE`,
        notes: [
          [2, 'Reset the flag at the start of every pass.'],
          [3, 'For 5 elements, compare pairs 1-2, 2-3, 3-4 and 4-5: so 1 TO 4.'],
          [4, 'Wrong order for ascending? Use < for descending.'],
          [6, 'The three-line swap: save one value in Temp...'],
          [8, '...then put it back into the other position.'],
          [12, 'A pass with no swaps means the array is sorted. UNTIL NOT Swap means the same thing.']
        ]
      }
    ],
    examples: [
      {
        title: 'Sorting five numbers',
        scenario: 'Numbers already holds 5, 1, 4, 2, 8. Step through to watch each pass.',
        givens: [{ name: 'Numbers', type: 'INTEGER', values: [5, 1, 4, 2, 8] }],
        code: `DECLARE Index : INTEGER
DECLARE Temp : INTEGER
DECLARE Swap : BOOLEAN
REPEAT
  Swap <- FALSE
  FOR Index <- 1 TO 4
    IF Numbers[Index] > Numbers[Index + 1]
      THEN
        Temp <- Numbers[Index]
        Numbers[Index] <- Numbers[Index + 1]
        Numbers[Index + 1] <- Temp
        Swap <- TRUE
    ENDIF
  NEXT Index
UNTIL Swap = FALSE
FOR Index <- 1 TO 5
  OUTPUT Numbers[Index]
NEXT Index`,
        inputs: [],
        predict: 'How many passes will it take? Remember the last pass is the one where nothing swaps.'
      }
    ],
    tasks: [
      {
        id: 'sort-1',
        level: 1,
        title: 'Sort the ages',
        brief: 'Ages holds 6 ages. Complete the bubble sort so they are output from youngest to oldest.',
        givens: [{ name: 'Ages', type: 'INTEGER', values: [15, 12, 17, 11, 16, 13] }],
        code: `DECLARE Index : INTEGER
DECLARE Temp : INTEGER
DECLARE Swap : BOOLEAN
REPEAT
  Swap <- {{FALSE}}
  FOR Index <- 1 TO 5
    IF Ages[Index] > Ages[Index + 1]
      THEN
        {{Temp}} <- Ages[Index]
        Ages[Index] <- Ages[{{Index + 1}}]
        Ages[Index + 1] <- {{Temp}}
        Swap <- {{TRUE}}
    ENDIF
  NEXT Index
UNTIL Swap = {{FALSE}}
FOR Index <- 1 TO 6
  OUTPUT Ages[Index]
NEXT Index`,
        tests: [
          { inputs: [], expect: [11, 12, 13, 15, 16, 17] },
          { inputs: [], givens: [{ name: 'Ages', type: 'INTEGER', values: [6, 5, 4, 3, 2, 1] }], expect: [1, 2, 3, 4, 5, 6] }
        ],
        hints: [
          'At the start of each pass nothing has been swapped yet.',
          'The swap saves Ages[Index] in Temp, moves the next element down, then puts Temp into the next position.',
          'Stop repeating when a whole pass made no swaps.'
        ]
      },
      {
        id: 'sort-2',
        level: 2,
        title: 'Leaderboard (highest first)',
        brief: 'Scores holds 6 scores. Finish the bubble sort so they are output from highest to lowest.',
        givens: [{ name: 'Scores', type: 'INTEGER', values: [40, 85, 62, 91, 55, 70] }],
        must: ['Inside the FOR loop, test whether Scores[Index] is SMALLER than Scores[Index + 1].', 'If so, swap them with Temp and set Swap to TRUE.', 'Close the IF with ENDIF.'],
        code: `DECLARE Index : INTEGER
DECLARE Temp : INTEGER
DECLARE Swap : BOOLEAN
REPEAT
  Swap <- FALSE
  FOR Index <- 1 TO 5
    // TODO: if Scores[Index] is SMALLER than the next score,
    //       swap them using Temp and set Swap to TRUE.
    //       Remember ENDIF.
  NEXT Index
UNTIL Swap = FALSE
FOR Index <- 1 TO 6
  OUTPUT Scores[Index]
NEXT Index`,
        tests: [
          { inputs: [], expect: [91, 85, 70, 62, 55, 40] },
          { inputs: [], givens: [{ name: 'Scores', type: 'INTEGER', values: [1, 2, 3, 4, 5, 6] }], expect: [6, 5, 4, 3, 2, 1] }
        ],
        hints: [
          'IF Scores[Index] < Scores[Index + 1]',
          'The swap is three lines: Temp <- Scores[Index], Scores[Index] <- Scores[Index + 1], Scores[Index + 1] <- Temp',
          'Then Swap <- TRUE, still inside the IF, then ENDIF.'
        ],
        model: `DECLARE Index : INTEGER
DECLARE Temp : INTEGER
DECLARE Swap : BOOLEAN
REPEAT
  Swap <- FALSE
  FOR Index <- 1 TO 5
    IF Scores[Index] < Scores[Index + 1]
      THEN
        Temp <- Scores[Index]
        Scores[Index] <- Scores[Index + 1]
        Scores[Index + 1] <- Temp
        Swap <- TRUE
    ENDIF
  NEXT Index
UNTIL Swap = FALSE
FOR Index <- 1 TO 6
  OUTPUT Scores[Index]
NEXT Index`
      },
      {
        id: 'sort-3',
        level: 3,
        title: 'Alphabetical register',
        brief: 'Names holds 6 names. Write a complete bubble sort that puts them in alphabetical order, then output them in order.',
        givens: [{ name: 'Names', type: 'STRING', values: ['Mia', 'Leo', 'Zoe', 'Ava', 'Kai', 'Ben'] }],
        must: ['Declare Index, Temp and Swap (Temp must be a STRING here).', 'Repeat passes until a pass makes no swaps.', 'Output all 6 names in order after sorting.'],
        plan: {
          inputs: ['None: Names is already filled'],
          process: ['Repeat passes: Swap <- FALSE, compare each neighbouring pair, swap if the first comes later in the alphabet', 'Stop when a pass makes no swaps'],
          outputs: ['The 6 names, in order'],
          vars: [['Index', 'INTEGER', 'position being compared'], ['Temp', 'STRING', 'holds a name during a swap'], ['Swap', 'BOOLEAN', 'did this pass swap anything?']]
        },
        tests: [
          { inputs: [], expect: ['Ava', 'Ben', 'Kai', 'Leo', 'Mia', 'Zoe'] },
          { inputs: [], givens: [{ name: 'Names', type: 'STRING', values: ['Tom', 'Sara', 'Raj', 'Pia', 'Omar', 'Nia'] }], expect: ['Nia', 'Omar', 'Pia', 'Raj', 'Sara', 'Tom'] }
        ],
        requires: [{ re: '\\bTemp\\b', msg: 'Swap the names using a Temp variable.' }, { re: '\\bREPEAT\\b|\\bWHILE\\b', msg: 'Use REPEAT (or WHILE) so passes continue until nothing swaps.' }],
        hints: [
          'Text compares alphabetically, so > works for names just like numbers.',
          'The structure is REPEAT, Swap <- FALSE, FOR Index <- 1 TO 5 ... NEXT Index, UNTIL Swap = FALSE.',
          'Inside the FOR: IF Names[Index] > Names[Index + 1] THEN the three-line swap and Swap <- TRUE, ENDIF.',
          'Finish with a FOR loop from 1 TO 6 that outputs Names[Index].'
        ],
        model: `DECLARE Index : INTEGER
DECLARE Temp : STRING
DECLARE Swap : BOOLEAN
REPEAT
  Swap <- FALSE
  FOR Index <- 1 TO 5
    IF Names[Index] > Names[Index + 1]
      THEN
        Temp <- Names[Index]
        Names[Index] <- Names[Index + 1]
        Names[Index + 1] <- Temp
        Swap <- TRUE
    ENDIF
  NEXT Index
UNTIL Swap = FALSE
FOR Index <- 1 TO 6
  OUTPUT Names[Index]
NEXT Index`
      }
    ]
  },

  // ------------------------------------------------------------------ EXAM MIX
  {
    id: 'exam',
    title: 'Exam-style mix',
    group: 'Put it together',
    colour: 'exam',
    summary: 'Longer, exam-style algorithms that combine sequence, selection and iteration.',
    rules: [
      'Read the question twice. Underline every INPUT, every rule (a decision or a loop) and every OUTPUT.',
      'Plan before you write: which variables, which loop (FOR, WHILE or REPEAT) and which IFs.',
      'Write it one block at a time. Close each block (ENDIF, NEXT, ENDWHILE, UNTIL) as soon as you open it, then fill in the middle.',
      'Test it: run it with normal data, boundary data (like exactly 50) and invalid data.',
      'Check the list below before you move on.'
    ],
    syntax: [
      {
        title: 'Before you submit',
        code: `// Every variable DECLAREd with a data type?
// Every IF has ENDIF, FOR has NEXT, WHILE has ENDWHILE,
//   REPEAT has UNTIL, CASE OF has ENDCASE?
// Totals and counters set to 0 BEFORE the loop?
// An OUTPUT prompt before every INPUT?
// Lines inside each block indented?
// Tested with a boundary value, e.g. exactly 50?`,
        notes: []
      }
    ],
    examples: [],
    tasks: [
      {
        id: 'exam-1',
        level: 3,
        title: 'Shop total with discount',
        brief: 'A shop lets a customer enter the prices of 5 items, one at a time, and totals them. If the total is $50 or more, $5 is taken off. Output the final total.',
        must: ['Input 5 prices using a loop.', 'Total them.', 'Take off $5 if the total is 50 or more.', 'Output the final total.'],
        plan: {
          inputs: ['5 prices (can be decimals)'],
          process: ['Total the prices in a FOR loop', 'After the loop: IF Total >= 50, subtract 5'],
          outputs: ['The final total'],
          vars: [['Price', 'REAL', 'the price just entered'], ['Total', 'REAL', 'running total'], ['Count', 'INTEGER', 'loop counter']]
        },
        tests: [
          { inputs: ['10', '10', '10', '10', '10'], expect: [45], useAllInputs: true },
          { inputs: ['49', '0', '0', '0', '0'], expect: [49], useAllInputs: true },
          { inputs: ['20', '15', '8', '4', '7.5'], expect: [49.5], useAllInputs: true },
          { inputs: ['5', '5', '5', '5', '5'], expect: [25], useAllInputs: true }
        ],
        hints: [
          'Total <- 0, then FOR Count <- 1 TO 5 with a prompt, INPUT Price and Total <- Total + Price inside.',
          'The discount is decided once, AFTER the loop, not inside it.',
          'IF Total >= 50 THEN Total <- Total - 5 ENDIF, then OUTPUT the total.'
        ],
        model: `DECLARE Price : REAL
DECLARE Total : REAL
DECLARE Count : INTEGER
Total <- 0
FOR Count <- 1 TO 5
  OUTPUT "Enter the price of item ", Count
  INPUT Price
  Total <- Total + Price
NEXT Count
IF Total >= 50
  THEN
    Total <- Total - 5
ENDIF
OUTPUT "Final total: $", Total`
      },
      {
        id: 'exam-2',
        level: 3,
        title: 'New password',
        brief: 'Input a new password. Keep asking until it has at least 10 characters. Then ask for it to be entered again. If both match, output "Password accepted". If they do not match, output "Passwords do not match" and start the whole process again.',
        must: ['Validate the length (at least 10 characters) with a loop.', 'Input the password a second time and compare.', 'Output "Passwords do not match" and start again if they differ.', 'Output "Password accepted" at the end.'],
        plan: {
          inputs: ['The password, then the password again'],
          process: ['An outer loop that repeats until the two entries match', 'Inside it, a validation loop for the length'],
          outputs: ['"Passwords do not match" each time they differ', '"Password accepted" at the end'],
          vars: [['Password', 'STRING', 'first entry'], ['Check', 'STRING', 'second entry'], ['Matched', 'BOOLEAN', 'did they match?']]
        },
        tests: [
          { inputs: ['short', 'computer2026', 'computer2026'], expect: ['Password accepted'], forbid: ['do not match'], useAllInputs: true },
          { inputs: ['computer2026', 'computer2025', 'library1234', 'library1234'], expect: ['do not match', 'Password accepted'], useAllInputs: true },
          { inputs: ['abc', 'abcdefg', 'abcdefghij', 'abcdefghij'], expect: ['Password accepted'], forbid: ['do not match'], useAllInputs: true }
        ],
        requires: [{ re: 'LENGTH\\s*\\(', msg: 'Use LENGTH(Password) to check the number of characters.' }],
        hints: [
          'You need a loop inside a loop. The outer loop repeats the whole process: REPEAT ... UNTIL Matched',
          'Inside the outer loop, first get a valid password: INPUT Password, then WHILE LENGTH(Password) < 10 DO ... ENDWHILE',
          'Then prompt and INPUT Check. IF Check = Password THEN Matched <- TRUE ELSE OUTPUT "Passwords do not match" ENDIF',
          'Set Matched <- FALSE before the outer loop, and OUTPUT "Password accepted" after it.'
        ],
        model: `DECLARE Password : STRING
DECLARE Check : STRING
DECLARE Matched : BOOLEAN
Matched <- FALSE
REPEAT
  OUTPUT "Enter a new password (at least 10 characters) "
  INPUT Password
  WHILE LENGTH(Password) < 10 DO
    OUTPUT "Too short. Enter a new password "
    INPUT Password
  ENDWHILE
  OUTPUT "Enter the password again "
  INPUT Check
  IF Check = Password
    THEN
      Matched <- TRUE
    ELSE
      OUTPUT "Passwords do not match"
  ENDIF
UNTIL Matched
OUTPUT "Password accepted"`
      },
      {
        id: 'exam-3',
        level: 3,
        title: 'Class results',
        brief: 'Input 5 exam marks. Each mark must be from 0 to 100: reject and re-input any mark outside that range. Then output the highest mark, the average mark and how many marks were 50 or more, in that order.',
        must: ['Input 5 marks, validating each one (0 to 100).', 'Track the total, the highest mark and a count of marks of 50 or more.', 'Output the highest, then the average, then the count.'],
        plan: {
          inputs: ['5 marks, each re-entered until it is 0 to 100'],
          process: ['FOR loop, 5 passes, with a WHILE validation loop inside', 'Add each mark to Total', 'Update Highest if the mark is bigger', 'Add 1 to PassCount if the mark is 50 or more'],
          outputs: ['Highest', 'Total / 5', 'PassCount'],
          vars: [['Mark', 'INTEGER', 'the mark just entered'], ['Total', 'INTEGER', 'running total'], ['Highest', 'INTEGER', 'highest so far'], ['PassCount', 'INTEGER', 'marks of 50 or more'], ['Count', 'INTEGER', 'loop counter']]
        },
        tests: [
          { inputs: ['45', '120', '80', '-5', '62', '30', '91'], expect: [91, 61.6, 3], useAllInputs: true },
          { inputs: ['50', '50', '50', '50', '50'], expect: [50, 50, 5], useAllInputs: true },
          { inputs: ['0', '100', '101', '99', '0', '1'], expect: [100, 40, 2], useAllInputs: true }
        ],
        requires: [{ re: '\\bWHILE\\b|\\bREPEAT\\b', msg: 'Validate each mark with a WHILE (or REPEAT) loop.' }],
        hints: [
          'Set Total, Highest and PassCount to 0 before a FOR Count <- 1 TO 5 loop. (Highest can start at 0 because no valid mark is below 0.)',
          'Inside the FOR: prompt, INPUT Mark, then WHILE Mark < 0 OR Mark > 100 DO ... ENDWHILE',
          'Still inside the FOR, after validation: add to Total, IF Mark > Highest update it, IF Mark >= 50 add 1 to PassCount.',
          'After NEXT Count: output Highest, then Total / 5, then PassCount.'
        ],
        model: `DECLARE Mark : INTEGER
DECLARE Total : INTEGER
DECLARE Highest : INTEGER
DECLARE PassCount : INTEGER
DECLARE Count : INTEGER
Total <- 0
Highest <- 0
PassCount <- 0
FOR Count <- 1 TO 5
  OUTPUT "Enter mark ", Count
  INPUT Mark
  WHILE Mark < 0 OR Mark > 100 DO
    OUTPUT "Invalid. Enter a mark from 0 to 100 "
    INPUT Mark
  ENDWHILE
  Total <- Total + Mark
  IF Mark > Highest
    THEN
      Highest <- Mark
  ENDIF
  IF Mark >= 50
    THEN
      PassCount <- PassCount + 1
  ENDIF
NEXT Count
OUTPUT "Highest mark: ", Highest
OUTPUT "Average mark: ", Total / 5
OUTPUT "Marks of 50 or more: ", PassCount`
      }
    ]
  }
];
