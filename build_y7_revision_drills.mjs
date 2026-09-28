import fs from 'node:fs';
import vm from 'node:vm';

const file='C:/Users/Bloomsbury/Desktop/Old stuff/bloomsbury-computing-pages/Drills/index.html';
const shellFile='C:/Users/Bloomsbury/Desktop/Apps Script/bloomsbury-computing-main/Index.html';
const markerStart='    /* YEAR 7 REVISION DRILLS START */';
const markerEnd='    /* YEAR 7 REVISION DRILLS END */';
const c=(id,category,prompt,answer,pattern,distractors,note)=>({id,category,prompt,answer,pattern,distractors,note});

const drills=[
  {
    id:'y7-flowcharts-foundations',
    title:'Year 7: Flowchart Foundations',
    subtitle:'Symbols, sequences and correcting algorithms',
    cards:[
      c('y7f1-01','y7-symbols','What is an algorithm? Give the meaning you used during the flowchart lessons.','A set of instructions for completing a task','^(?=.*\\b(set|series|list)\\b)(?=.*\\b(instructions|steps)\\b).*$',['A picture of a computer','One instruction only','A completed program','A type of output'],'An algorithm is an ordered set of instructions for completing a task. The instructions need to be clear enough to follow in the intended order.'),
      c('y7f1-02','y7-symbols','What does a flowchart use to show the instructions in an algorithm and the order in which they run?','Shapes and arrows','^(?=.*\\b(shapes?|symbols?)\\b)(?=.*\\barrows?\\b).*$',['Words and colours','Tables and formulas','Numbers and boxes','Inputs and sounds'],'The shapes identify the type of each instruction. The arrows show where execution goes next, so together they show both meaning and order.'),
      c('y7f1-03','y7-symbols','What is the purpose of the rounded Start and End symbols in a flowchart?','They show where the algorithm begins and finishes','^(?=.*\\b(start|begin|begins|beginning)\\b)(?=.*\\b(end|ends|finish|finishes)\\b).*$',['They contain every calculation','They ask a True or False question','They receive information','They join two variables'],'Start marks where execution begins. End marks where that flowchart finishes. These are terminal symbols rather than action blocks.'),
      c('y7f1-04','y7-symbols','What belongs inside a rectangular process symbol?','An instruction, action or calculation','^.*\\b(instruction|action|calculation|process|command)\\b.*$',['A Start or End label','A True or False branch','An arrow between blocks','The name of the user'],'A process symbol contains something the algorithm does, such as Move 50 steps, turn to a direction or carry out a calculation.'),
      c('y7f1-05','y7-symbols','What belongs inside the sloping input or output symbol?','Information entering or leaving the program','^(?=.*\\b(input|entering|received|output|leaving|displayed|said)\\b).*$',['Only movement instructions','Only comparison operators','The end of the algorithm','A connector with no label'],'The input or output symbol is used when information enters the program or when the program communicates a result. Ask and Say are examples.'),

      c('y7f1-06','y7-reading','What do the arrows in a flowchart tell the reader?','The order and direction in which the instructions run','^(?=.*\\b(order|direction|next|sequence)\\b)(?=.*\\b(instruction|instructions|step|steps|run|flow)\\b).*$',['The distance the sprite moves','The value stored in a variable','The colour of each symbol','The final answer only'],'Follow the arrows from Start one at a time. Each arrow tells you which symbol is reached next, including when a path loops back.'),
      c('y7f1-07','y7-reading','Trace this flowchart: Start -> Move 40 steps -> Say "Ready" -> End. What is the first action after Start?','Move 40 steps','^\\s*(move\\s*)?40\\s*(steps?)?\\s*$',['Say Ready','Reach End','Move 4 steps','Wait 40 seconds'],'The first arrow leaving Start reaches Move 40 steps. Say "Ready" happens after the movement.'),
      c('y7f1-08','y7-reading','Trace this flowchart: Start -> Move 40 steps -> Say "Ready" -> End. What information is output?','Ready','^\\s*(say\\s*)?["\']?ready["\']?\\s*$',['40','Start','Move','End'],'The Say block is an output instruction. It communicates the word "Ready" after the sprite has moved.'),
      c('y7f1-09','y7-reading','In the flowchart Start -> Move 30 steps -> Say "Complete" -> End, which type of symbol contains Say "Complete"?','An input or output symbol','^\\s*(an?\\s*)?(input(\\s*(or|and|\\/)\\s*output)?|output(\\s*(or|and|\\/)\\s*input)?|i\\s*o)\\s*(symbol|shape)?\\s*$',['A process symbol','A decision symbol','A terminal symbol','A connector'],'Say communicates information from the program to the user, so it belongs in the sloping input or output symbol.'),
      c('y7f1-10','y7-reading','Trace this complete sequence: Start -> Move 20 steps -> Say "Go" -> Move 10 steps -> End. Describe the actions in the correct order.','Move 20 steps, say Go, then move 10 steps','^.*move\\s*20.*(?:say|output)\\s*["\']?go["\']?.*move\\s*10.*$',['Move 10, say Go, move 20','Say Go and then stop','Move 30 before saying Go','Move 20 and ignore the rest'],'Execution follows every arrow in order. The sprite moves 20, says "Go", then moves another 10 before the flowchart ends.'),

      c('y7f1-11','y7-debugging','Requirement: Move 60 steps, then say "Finished". Faulty flowchart: Start -> Move 20 steps -> Say "Finished" -> End. Identify the error.','The Move value is 20 instead of 60','^(?=.*\\b20\\b)(?=.*\\b60\\b).*$',['The Say message is wrong','The End symbol is missing','The arrows are reversed','The output comes too early'],'Compare the requirement with each instruction. The message already matches, but the movement distance is 20 when the requirement says 60.'),
      c('y7f1-12','y7-debugging','Requirement: Move 60 steps, then say "Finished". What single correction is needed if the process currently says Move 20 steps?','Change it to Move 60 steps','^\\s*(change\\s+(it|the move|20)\\s+(to|into)\\s+)?(move\\s*)?60\\s*(steps?)?\\s*$',['Delete the Move block','Change Finished to Ready','Move the End to the top','Add a second Start'],'Only the incorrect value changes. The corrected process instruction is Move 60 steps, while the rest of the flowchart stays in place.'),
      c('y7f1-13','y7-debugging','Requirement: Move 40 steps, then say "Ready". Faulty flowchart: Start -> Move 40 steps -> End. Which instruction is missing?','Say "Ready"','^\\s*(add\\s+)?(say|output)\\s*["\']?ready["\']?\\s*$',['Move 40 steps','Start','End','Turn right 90'],'The movement already matches the requirement. The missing part is the output instruction that says "Ready" before End.'),
      c('y7f1-14','y7-debugging','A working flowchart currently moves 50 steps and says "Hello". The new requirement is to move 80 steps and say "Finished". State both changes.','Change 50 to 80 and change Hello to Finished','^(?=.*\\b50\\b.*\\b80\\b|.*\\b80\\b)(?=.*\\bhello\\b.*\\bfinished\\b|.*\\bfinished\\b).*$',['Only change 50 to 80','Only change Hello to Finished','Add another Start symbol','Reverse every arrow'],'Two parts of the requirement changed, so two instructions must change. The movement value becomes 80 and the Say message becomes "Finished".'),
      c('y7f1-15','y7-debugging','Why should a corrected flowchart be run and tested again after an error has been changed?','To check that it now meets the requirement','^(?=.*\\b(check|test|confirm|make sure)\\b)(?=.*\\b(requirement|correct|works|expected)\\b).*$',['To add more symbols','To change every instruction','To remove the Start symbol','To make the arrows decorative'],'Testing provides evidence that the correction produced the required result and did not leave another problem in the sequence.'),

      c('y7f1-16','y7-sequence','A flowchart contains Start, Say "Done", Move 25 steps and End. The requirement says move first and then say "Done". Which instruction must come immediately after Start?','Move 25 steps','^\\s*(move\\s*)?25\\s*(steps?)?\\s*$',['Say Done','End','Start','Move 2 steps'],'The requirement gives the sequence. Move 25 steps must happen before the output, so it is the first action after Start.'),
      c('y7f1-17','y7-sequence','What does reaching an End symbol mean for that flowchart?','The flowchart has finished running','^(?=.*\\b(flowchart|algorithm|program|execution|instructions?)\\b)?(?=.*\\b(end|ended|finish|finished|stop|stops)\\b).*$',['The program returns to Start forever','The next process runs twice','The user must type an input','Every arrow reverses'],'End marks the point where that flowchart finishes. There is no next instruction in the same flowchart after its End.'),
      c('y7f1-18','y7-sequence','Put these actions into the required sequence: the sprite must say "Ready" and then move 30 steps. Give the two instructions in order.','Say "Ready", then Move 30 steps','^.*(?:say|output)\\s*["\']?ready["\']?.*move\\s*30.*$',['Move 30, then Say Ready','Move 60 steps','Say Complete, then stop','Start, then End'],'The words "and then" specify the order. The output happens first, followed by the movement process.'),
      c('y7f1-19','y7-sequence','What should you compare a flowchart against when looking for an incorrect or missing instruction?','The requirement','^\\s*(the\\s+)?(requirement|specification|expected result)\\s*$',['The colour scheme','The longest arrow','A random program','The number of symbols'],'The requirement states what the algorithm should do. Checking each block against it reveals wrong values, wrong order and missing instructions.'),
      c('y7f1-20','y7-sequence','Which type of flowchart symbol should contain the instruction Move 80 steps?','A process symbol','^\\s*(a\\s+)?(rectangular\\s+)?process\\s*(symbol|shape|block)?\\s*$',['An input or output symbol','A Start or End symbol','A decision symbol','An arrow'],'Movement is an action performed by the program, so it belongs in a rectangular process symbol.')
    ]
  },
  {
    id:'y7-flowcharts-control',
    title:'Year 7: Inputs, Decisions and Loops',
    subtitle:'Movement, selection and Boolean logic',
    cards:[
      c('y7f2-01','y7-inputs','What is an input?','Information sent into a computer or program','^(?=.*\\binformation|data|signal|key\\b)(?=.*\\binto|enter|entered|sent|received\\b).*$',['Information produced by a computer','The final instruction only','A repeated process','A line joining two shapes'],'An input is information that enters a computer or program. Pressing a keyboard key is an input because the program receives the key state.'),
      c('y7f2-02','y7-inputs','In the keyboard movement flowchart, what input is checked by the decision Right arrow pressed?','Whether the right arrow key is being pressed','^(?=.*\\bright\\b)(?=.*\\b(key|arrow|pressed|pressing)\\b).*$',['The sprite position','The colour of the stage','The number of loops','The output message'],'The decision reads the state of the right arrow key. Pressed gives True and not pressed gives False.'),
      c('y7f2-03','y7-inputs','What is the purpose of a decision in a flowchart?','To check a condition and choose a path','^(?=.*\\b(check|test|question|condition|compare)\\b)(?=.*\\b(path|branch|true|false|choose)\\b).*$',['To stop every algorithm','To display text only','To store a picture','To connect without checking'],'A decision asks a question whose result is True or False. That result determines which outgoing path is followed.'),
      c('y7f2-04','y7-inputs','Name the two paths that leave a decision.','True and False','^(?=.*\\btrue\\b)(?=.*\\bfalse\\b).*$',['Start and End','Input and Output','Left and Right','Move and Turn'],'Every decision has a True branch and a False branch. FlowScratch lets you select a connector and set which branch it represents.'),
      c('y7f2-05','y7-inputs','The condition is Right arrow pressed? The key is being held down. Which branch runs?','True','^\\s*(the\\s+)?true(\\s+(path|branch))?\\s*$',['False','Both','Neither','End'],'The condition matches what is happening, so its value is True and the True connector is followed.'),

      c('y7f2-06','y7-movement','Which direction value makes a FlowScratch sprite point right?','90 degrees','^\\s*90\\s*(degrees?)?\\s*$',['-90 degrees','0 degrees','180 degrees','10 degrees'],'In the movement system used in the lesson, 90 degrees points right. The sprite should point before it moves.'),
      c('y7f2-07','y7-movement','Which direction value makes a FlowScratch sprite point left?','-90 degrees','^\\s*(-\\s*90|270)\\s*(degrees?)?\\s*$',['90 degrees','0 degrees','180 degrees','10 degrees'],'The lesson uses -90 degrees for left movement. After setting this direction, Move 10 steps sends the sprite left.'),
      c('y7f2-08','y7-movement','Which direction value was used in the extension to make the sprite move up?','0 degrees','^\\s*0\\s*(degrees?)?\\s*$',['90 degrees','-90 degrees','180 degrees','10 degrees'],'The extension maps 0 degrees to up. The decision checks the up arrow, then the process points to 0 before moving.'),
      c('y7f2-09','y7-movement','Which direction value was used in the extension to make the sprite move down?','180 degrees','^\\s*180\\s*(degrees?)?\\s*$',['90 degrees','-90 degrees','0 degrees','10 degrees'],'The extension maps 180 degrees to down. This keeps the four movement directions consistent.'),
      c('y7f2-10','y7-movement','Why must Point in direction run before Move steps?','Move uses the current direction, so the direction must be set first','^(?=.*\\b(direction|point)\\b)(?=.*\\b(before|first|current)\\b).*$',['Move chooses a random direction','Point in direction stops the loop','Move changes the key input','The order never matters'],'Move steps follows whichever direction the sprite currently faces. Setting the direction first makes the movement predictable.'),

      c('y7f2-11','y7-loops','What is an infinite loop?','Instructions that repeat until the program is stopped','^(?=.*\\b(repeat|repeats|repeating|again|continues)\\b)(?=.*\\b(stop|stopped|forever|infinite)\\b).*$',['A decision that runs once','A missing Start symbol','A calculation with no output','A sub-routine called once'],'The returning connectors make the algorithm revisit the decisions again and again. It continues until the user stops the program.'),
      c('y7f2-12','y7-loops','In the movement flowchart, where should both the completed True path and the False path eventually return?','To the connector leading back to the decision','^(?=.*\\b(return|back|join|loop)\\b)(?=.*\\bdecision|check|connector\\b).*$',['Directly to End','To a new Start symbol','To an output message','Outside the flowchart'],'Both paths rejoin the main loop connector so the key can be checked again. This keeps the program responsive whether a key is pressed or not.'),
      c('y7f2-13','y7-loops','The program checks the right and left arrow keys, but neither key is pressed. What should the sprite do?','Stay still and check the keys again','^(?=.*\\b(stay|still|wait|no change|not move|doesn.t move)\\b)(?=.*\\bcheck|again|loop|repeat\\b).*$',['Move right','Move left','Stop permanently','Jump to End'],'Both decisions follow their False paths. No movement process runs, but the loop returns and checks the inputs again.'),
      c('y7f2-14','y7-loops','After Right arrow pressed? is False, where does the lesson flowchart go next before returning to the main loop?','To the Left arrow pressed decision','^(?=.*\\bleft\\b)(?=.*\\bdecision|check|arrow|pressed\\b).*$',['To Move right','Directly to End','To Point 90','To Say Ready'],'The False path from the right-arrow decision leads to a second decision. This gives the left arrow its own check and True branch.'),
      c('y7f2-15','y7-loops','The movement algorithm has an infinite loop. How does the user finish the test?','Select the Stop button','^\\s*(select|press|click|use)?\\s*(the\\s+)?stop(\\s+button)?\\s*$',['Wait for End','Hold both arrow keys','Delete the Start block','Change True to False'],'An infinite loop has no automatic End while it is running. FlowScratch provides the Stop button so the user can end the test deliberately.'),

      c('y7f2-16','y7-logic','When is A AND B equal to 1?','When both A and B are 1','^(?=.*\\b(both|all|every)\\b)(?=.*\\b1|true\\b).*$',['When either one is 1','Only when both are 0','Whenever A is 0','It is always 1'],'AND requires every part to be 1. If either input is 0, the combined result is 0.'),
      c('y7f2-17','y7-logic','When is A OR B equal to 1?','When at least one of A or B is 1','^(?=.*\\b(at least|either|one)\\b)(?=.*\\b1|true\\b).*$',['Only when both are 1','Only when both are 0','Whenever A is 0','It is never 1'],'OR needs at least one part to be 1. One input or both inputs may be 1.'),
      c('y7f2-18','y7-logic','What does NOT do to the values 1 and 0?','It swaps or reverses them','^.*\\b(swap|swaps|flip|flips|reverse|reverses|invert|inverts|opposite)\\b.*$',['It adds them','It keeps both unchanged','It makes both 1','It chooses the larger value'],'NOT reverses one Boolean value. NOT 1 is 0, and NOT 0 is 1.'),
      c('y7f2-19','y7-logic','Score is 12 and Target is 20. What is the result of Score > Target? Give 1 for True or 0 for False.','0','^\\s*(0|false)\\s*$',['1','12','20','32'],'12 is not greater than 20, so the comparison is False. In the lesson, False is represented by 0.'),
      c('y7f2-20','y7-logic','A flowchart first checks Up AND Right pressed? Only Up is pressed. On the False path it checks Up pressed? What final action runs?','Move up','^\\s*(the\\s+sprite\\s+)?move(s)?\\s+up\\s*$',['Move diagonally up-right','Move right','Wait','Stop'],'Up AND Right is 0 because Right is not pressed. The second decision, Up pressed, is 1, so the algorithm follows its True path and moves up.')
    ]
  },
  {
    id:'y7-flowcharts-subroutines',
    title:'Year 7: Sub-routines and Complete Algorithms',
    subtitle:'CALL, tracing and reusable flowcharts',
    cards:[
      c('y7f3-01','y7-sub-purpose','What is a sub-routine?','A named reusable part of an algorithm','^(?=.*\\b(named|name)\\b)?(?=.*\\b(reusable|reuse|used again|repeated)\\b)(?=.*\\b(part|section|algorithm|instructions|flowchart)\\b).*$',['A random input value','The final arrow only','A decision with no paths','A separate computer'],'A sub-routine is a named group of instructions that can be run whenever the main algorithm calls it.'),
      c('y7f3-02','y7-sub-purpose','Why can a sub-routine make a program easier to create and correct?','Repeated instructions are written and fixed once','^(?=.*\\b(write|written|type|typed|fix|fixed|change|changed)\\b)(?=.*\\bonce|one time|single\\b).*$',['It removes every decision','It stops all loops','It makes arrows unnecessary','It runs every path together'],'The reusable instructions exist in one place. The main algorithm can call that one copy many times, so a correction only needs to be made once.'),
      c('y7f3-03','y7-sub-purpose','A sub-routine is called three times. How many times does its full flowchart need to be written?','Once','^\\s*(once|1|one time)\\s*$',['Three times','Twice','Four times','It is never written'],'The sub-routine is defined once. Each CALL reuses that same definition rather than making another copy.'),
      c('y7f3-04','y7-sub-purpose','Does a sub-routine have its own Start and End as a separate flowchart?','Yes','^\\s*(yes|true|it does)\\s*$',['No','Only a Start','Only an End','Only when called twice'],'The lesson treats the sub-routine as its own separate flowchart, complete with its own Start and End symbols.'),
      c('y7f3-05','y7-sub-purpose','What allows the main flowchart to refer to a reusable sub-routine without copying all of its instructions?','The sub-routine name in a CALL block','^(?=.*\\bcall\\b)(?=.*\\bname|named|sub.?routine\\b).*$',['A second End symbol','A False branch','The output message','A movement distance'],'A CALL block names the sub-routine to run, such as CALL DrawSquare. The detailed steps stay inside the separate DrawSquare flowchart.'),

      c('y7f3-06','y7-call-trace','What happens when execution reaches CALL DrawSquare in Main?','Execution jumps into the DrawSquare sub-routine','^(?=.*\\b(jump|jumps|go|goes|enter|enters|run|runs|start|starts)\\b)(?=.*\\bdrawsquare|sub.?routine\\b).*$',['Main immediately ends','A square appears without instructions','The previous line repeats forever','Every sub-routine runs'],'CALL hands control to the named sub-routine. DrawSquare begins at its own Start and its instructions then run in order.'),
      c('y7f3-07','y7-call-trace','Where does execution continue after a called sub-routine reaches its own End?','At the instruction directly after the CALL in Main','^(?=.*\\b(after|next|following)\\b)(?=.*\\bcall\\b)(?=.*\\bmain|instruction|line\\b).*$',['At Main Start','At the CALL again','At a random process','At the sub-routine Start'],'Finishing the sub-routine returns control to the calling flowchart. The next instruction is the one directly after that CALL.'),
      c('y7f3-08','y7-call-trace','After a sub-routine finishes, does execution return to Main own Start?','No','^\\s*(no|false|it does not|it doesn.t)\\s*$',['Yes','Only after two calls','Only for movement','Only when there is no End'],'Control does not restart Main. It resumes directly after the CALL so the remaining main instructions can continue.'),
      c('y7f3-09','y7-call-trace','Main contains CALL Flash followed later by another CALL Flash. How many times does Flash run?','Twice','^\\s*(twice|2|two times)\\s*$',['Once','Three times','Zero times','Forever'],'Each CALL runs the named sub-routine once. Two CALL blocks therefore cause two complete runs of Flash.'),
      c('y7f3-10','y7-call-trace','Sub-routine Beep says "Beep", waits, then says "Boop". Main calls Beep twice and then ends. What is the very last thing said?','Boop','^\\s*["\']?boop["\']?\\s*$',['Beep','Wait','Done','Nothing'],'The second CALL repeats the complete Beep sub-routine. Its final output is "Boop", so that is also the last output overall.'),

      c('y7f3-11','y7-call-effects','Main is Start -> CALL DrawSquare -> End. What is drawn?','One square','^\\s*(one|1|a)\\s+square\\s*$',['Two squares','Nothing','A triangle','Four separate lines only'],'One CALL runs DrawSquare once. Its four equal move-and-turn pairs complete one square.'),
      c('y7f3-12','y7-call-effects','Main is Start -> CALL DrawSquare -> Turn right 90 -> CALL DrawSquare -> End. Describe the result.','Two squares rotated 90 degrees apart','^(?=.*\\b(two|2)\\b)(?=.*\\bsquares?\\b)(?=.*\\b90|rotated|turn\\b).*$',['One square','Two squares in the same place','No shape','A single straight line'],'The first CALL draws one square. Main turns 90 degrees, then the second CALL draws the same square routine from the new direction.'),
      c('y7f3-13','y7-call-effects','Main calls DrawSquare twice with no turn or movement between the two CALLs. Where are the squares drawn?','In exactly the same place','^(?=.*\\b(same|exact)\\b)(?=.*\\b(place|position|location|overlap|top)\\b).*$',['90 degrees apart','On opposite sides','Only the second appears','At random positions'],'Nothing changes the sprite position or direction between the calls. The second square therefore follows the same path as the first and overlaps it.'),
      c('y7f3-14','y7-call-effects','Main is Start -> End, and never calls DrawSquare. How many squares does DrawSquare produce?','None','^\\s*(none|zero|0|no squares?)\\s*$',['One','Two','Four','Infinitely many'],'A sub-routine only runs when something calls it. Merely defining DrawSquare does not make its instructions execute.'),
      c('y7f3-15','y7-call-effects','The Beep sub-routine is written once. Main contains CALL Beep twice. How many times is the word Beep written out in full in the program definition?','Once','^\\s*(once|1|one time)\\s*$',['Twice','Three times','Zero times','Four times'],'The instructions are stored in one sub-routine definition. The two CALL blocks reuse that single copy.'),

      c('y7f3-16','y7-complete','Blink should turn a light on, wait, then turn it off. It currently says: 1 Start, 2 Light on, 3 Light on, 4 Wait, 5 End. Which numbered step is wrong?','Step 3','^\\s*(step\\s*)?3\\s*$',['Step 1','Step 2','Step 4','Step 5'],'Step 3 repeats Light on instead of completing the required on, wait, off behaviour. It is the instruction that must be corrected.'),
      c('y7f3-17','y7-complete','In the faulty Blink sub-routine, step 3 says Light on for a second time. What should step 3 say instead?','Light off','^\\s*(turn\\s+)?light\\s+off\\s*$|^\\s*off\\s*$',['Light on','Wait','CALL Blink','End'],'The required result includes turning the light off. Replacing the repeated Light on instruction with Light off supplies that missing action.'),
      c('y7f3-18','y7-complete','Flash is Start -> Light on -> Light off -> End. Main is Start -> CALL Flash -> Say "Done" -> End. What runs immediately after Flash finishes?','Say "Done"','^\\s*(say|output)\\s*["\']?done["\']?\\s*$',['Main Start','Light on','CALL Flash again','Nothing'],'Flash returns control to the point after CALL Flash. The next Main instruction is Say "Done".'),
      c('y7f3-19','y7-complete','Does a CALL block contain all of the sub-routine instructions itself? Explain briefly.','No, it names the sub-routine and hands control to its separate flowchart','^(?=.*\\b(no|does not|doesn.t)\\b)(?=.*\\b(name|named|jump|jumps|control|separate)\\b).*$',['Yes, it copies every instruction','Yes, but only for loops','No, it ends the whole program','No, it deletes the sub-routine'],'The CALL block is a reference to the named reusable flowchart. The actual instructions remain in the sub-routine definition.'),
      c('y7f3-20','y7-complete','Sub-routine MoveRight is Point in direction 90 -> Move 10 steps. Main calls MoveRight twice. How far and in which direction does the sprite move in total?','20 steps to the right','^(?=.*\\b20\\b)(?=.*\\bright\\b).*$',['10 steps right','20 steps left','90 steps right','The sprite does not move'],'Each CALL points right and moves 10 steps. Running the sub-routine twice gives 10 + 10 = 20 steps to the right.')
    ]
  }
];

function q(s){return JSON.stringify(s)}
function cardSource(card){
  return `        { id: ${q(card.id)}, category: ${q(card.category)},\n`+
    `          prompt: ${q(card.prompt)},\n`+
    `          answers: [${q(card.answer)}],\n`+
    `          keywords: [new RegExp(${q(card.pattern)}, "i")],\n`+
    `          distractors: ${JSON.stringify(card.distractors)},\n`+
    `          note: ${q(card.note)} }`;
}
function drillSource(drill){
  return `    ${q(drill.id)}: {\n      title: ${q(drill.title)},\n      subtitle: ${q(drill.subtitle)},\n      cards: [\n${drill.cards.map(cardSource).join(',\n')}\n      ]\n    }`;
}

let html=fs.readFileSync(file,'utf8');
const block=markerStart+'\n'+drills.map(drillSource).join(',\n')+'\n'+markerEnd+',\n';
const existing=new RegExp(markerStart.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'[\\s\\S]*?'+markerEnd.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+',?\\r?\\n?');
if(existing.test(html)) html=html.replace(existing,block);
else html=html.replace('    "y8-algorithms-l1": {',block+'    "y8-algorithms-l1": {');
fs.writeFileSync(file,html);
const ids=new Set();
for(const drill of drills){
  if(drill.cards.length!==20) throw new Error(drill.id+' has '+drill.cards.length+' cards, expected 20');
  const counts={};
  for(const card of drill.cards){
    if(ids.has(card.id)) throw new Error('Duplicate card id: '+card.id);
    ids.add(card.id); counts[card.category]=(counts[card.category]||0)+1;
    const re=new RegExp(card.pattern,'i');
    if(!re.test(card.answer)) throw new Error(card.id+' rejects its own answer: '+card.answer);
    for(const wrong of card.distractors){
      re.lastIndex=0;
      if(re.test(wrong)) throw new Error(card.id+' accepts distractor: '+wrong);
    }
  }
  for(const [category,count] of Object.entries(counts)) if(count!==5) throw new Error(drill.id+' category '+category+' has '+count+' cards');
}
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
for(const [i,script] of scripts.entries()) new vm.Script(script,{filename:'Drills/index.html script '+(i+1)});

const shell=fs.readFileSync(shellFile,'utf8');
const shellScripts=[...shell.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
for(const [i,script] of shellScripts.entries()) new vm.Script(script,{filename:'Index.html script '+(i+1)});
for(const drill of drills){
  const shellId='drill-'+drill.id;
  if((shell.match(new RegExp("id:\\s*['\\\"]"+shellId+"['\\\"]",'g'))||[]).length!==1) throw new Error(shellId+' is not registered exactly once in the shell');
  if((shell.match(new RegExp("drillId:\\s*['\\\"]"+drill.id+"['\\\"]",'g'))||[]).length!==1) throw new Error(drill.id+' does not have exactly one drillId registration');
  const categoryCounts={};
  for(const card of drill.cards) categoryCounts[card.category]=(categoryCounts[card.category]||0)+1;
  for(const category of Object.keys(categoryCounts)){
    const labelMatch=html.match(new RegExp('"'+category.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')+'"\\s*:\\s*"([^"]+)"'));
    if(!labelMatch) throw new Error('Missing category label for '+category);
    const sizePattern=new RegExp("['\\\"]"+labelMatch[1].replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')+"['\\\"]\\s*:\\s*"+categoryCounts[category]+"\\b");
    if(!sizePattern.test(shell)) throw new Error('Missing shell category size for '+labelMatch[1]);
  }
}
console.log('Inserted and validated '+drills.length+' drills and '+drills.reduce((n,d)=>n+d.cards.length,0)+' cards, including shell registrations and script syntax.');
