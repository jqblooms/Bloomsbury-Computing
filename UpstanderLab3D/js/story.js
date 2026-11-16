// Upstander Lab 3D: the people, the messages and every conversation, as data. Edit the words here; main.js,
// talk.js and phone.js run them.
// James, 2026-11-16: no staff names and no student names. People are roles (rep, target, poster ...); the names shown
// are drawn at random from NAME_POOL every time the game loads (randomiseNames), so no character ever has a fixed
// name. Staff are roles only (the Safeguarding Lead). Text says {role} and fill() swaps in this visit's name. Messages are
// mild and fit a Year 9 class (13 to 14): no slurs, nothing about who someone is, no pronouns for the people, and
// nothing asks the player about their own life. This is an online safety game, not a coding one.
//
// A conversation is a list of lines: { say, choices?: [{ t, ok, why, act }], act? }.
//   ok: false choices are not taken: the player sees `why` and chooses again (it counts as a slip for the stars).
//   act(S) changes the mission state S when the line is reached or the choice is taken.

export const ROLES = {
  rep: { colour: 1, x: 3.5, y: 2.5, where: 'the Classroom', job: 'looks after the class chat' },
  newcomer: { colour: 9, x: 7.5, y: 1.6, where: 'the Classroom' },
  bystander: { colour: 5, x: 15.5, y: 2.5, where: 'the Library' },
  teammate: { colour: 2, x: 20.5, y: 3.5, where: 'the Library' },
  poster: { colour: 4, x: 17.5, y: 6, where: 'the Corridor' },   // at the edge: the corridor is 2 tiles wide
  friend: { colour: 3, x: 3.5, y: 11.5, where: 'the Canteen' },
  joker: { colour: 0, x: 9.5, y: 10.2, where: 'the Canteen' },
  target: { colour: 7, x: 21, y: 11, where: 'the Playground' },
  // A British school: students tell any trusted adult, and the safeguarding team (the DSL and deputies) acts on it.
  coun: { colour: 8, x: 15.5, y: 10.2, where: 'the Safeguarding office', staff: 'Safeguarding Lead' },
};
// Made-up names that no real student has (James, 2026-11-16, after the content review: real names and Thai nicknames
// could land on a classmate as the target). Checked: not English words, not names or nicknames in use, no Thai rude
// words or insulting prefixes ("Ai", "Ee"), nothing mocking. Eight are drawn at random each visit.
export const NAME_POOL = ['Zuvi', 'Pexo', 'Ravlo', 'Tivra', 'Morvi', 'Quilo', 'Yaxo', 'Brivo', 'Delvi', 'Fenvo', 'Gorvi', 'Jexa',
  'Kivro', 'Lumvi', 'Nuvra', 'Ovri', 'Pavri', 'Sivro', 'Tovri', 'Ulvo', 'Vanro', 'Wivo', 'Xavo', 'Yenvi', 'Zarvo', 'Bivra', 'Cirvo',
  'Davri', 'Elvo', 'Firvo', 'Gevri', 'Hovra', 'Ivro', 'Jovra', 'Korvi', 'Lavro', 'Mivro', 'Novri', 'Orvi', 'Pirvo'];
export const NAMES = {};
export function randomiseNames(rand = Math.random) {
  const pool = NAME_POOL.slice();
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  let k = 0;
  for (const [id, r] of Object.entries(ROLES)) NAMES[id] = r.staff || pool[k++];
  return NAMES;
}
randomiseNames();
export const fill = (s) => String(s == null ? '' : s).replace(/\{(\w+)\}/g, (m, k) => NAMES[k] || m);
export const nameOf = (id) => NAMES[id];

// The messages people ask you to test (Mission 1). unkind: what a person reading it would say.
export const MESSAGES = [
  { id: 'm0', from: 'rep', text: 'good luck in the match tomorrow!', unkind: false },
  { id: 'm1', from: 'joker', text: "you're such a loser, nobody picked you", unkind: true },
  { id: 'm2', from: 'teammate', text: "we got knocked into the losers' bracket, still fun!", unkind: false },
  { id: 'm3', from: 'friend', text: 'my laptop is so stupid slow today', unkind: false },
  { id: 'm4', from: 'poster', text: 'ur such a l0s3r', unkind: true },
  { id: 'm5', from: 'bystander', text: 'nice drawing. said nobody ever.', unkind: true },
  { id: 'm6', from: 'target', text: 'everyone come to football on Saturday, except {target}', unkind: true },
];
export const msgById = Object.fromEntries(MESSAGES.map((m) => [m.id, m]));
export const WHY = {
  right: (m) => (m.unkind ? 'The filter caught it, and it is unkind. Right.' : 'The filter let it through, and it is not unkind. Right.'),
  'false-alarm': (m) => 'Hidden, but it is not unkind: ' + hiddenWord(m.text) + ' That is a false alarm.',
  missed: (m) => 'Let through, but it is unkind. None of the banned words is in it' + (/[0-9]/.test(m.text) ? ', because numbers replace letters.' : '.') + ' That is a miss.',
};
function hiddenWord(t) {
  const u = t.toUpperCase();
  const w = ['LOSER', 'UGLY', 'STUPID', 'WEIRDO'].find((x) => u.includes(x));
  return '"' + w + '" is inside it, but nobody is being insulted.';
}

// The class chats for Missions 3 and 4 (what the phone shows). Speakers are roles.
export const CHAT = {
  upstander: { title: 'Year 9 class chat', lines: [
    ['joker', 'lol did you see {target} trip in PE'],
    ['poster', 'who even added {target} to this chat'],
    ['teammate', 'haha'],
    ['joker', '{target} is so weird'],
    ['poster', 'add a laughing face if you agree'],
  ] },
  challenge: { title: 'Squad (game chat)', lines: [
    ['poster', "don't add {newcomer} to the squad, so bad at the game"],
    ['joker', 'yeah leave them out'],
    ['poster', 'I made a funny picture of {newcomer}, sending it round later'],
  ] },
};

// ---------------------------------------------------------------- the missions
const give = (id) => (S) => { S.got[id] = true; };
const say = (t, more) => Object.assign({ say: t }, more || {});

export const MISSIONS = [
  {
    id: 'filter', title: 'The Filter', mins: 15, phone: 'messages',
    intro: 'The class chat app hides messages with banned words. Does that stop unkind messages?',
    fresh: () => ({ met: false, got: {}, tested: {}, fixed: false, finished: false }),
    steps(S) {
      const got = Object.keys(S.got).length, tested = Object.keys(S.tested).length;
      const next = MESSAGES.find((m) => !S.got[m.id]);
      return [
        { text: 'Talk to <b>{rep}</b> in the Classroom.', done: S.met, who: 'rep' },
        { text: 'Collect the messages people want tested (' + got + ' of 7). The <b>!</b> shows who.', done: got === 7, who: next && next.from },
        { text: 'Test every message on your phone (<b>P</b>): would the filter hide it, and was that right? (' + tested + ' of 7)', done: tested === 7, phone: true },
        { text: 'Go back to <b>{rep}</b> and say what you found.', done: S.finished, who: 'rep' },
      ];
    },
    done: (S) => S.finished,
    talk: {
      rep(S) {
        if (!S.met) return [
          say('Hi! I look after our class chat. The app has a filter: it hides any message with a banned word in it.'),
          say('The banned words are LOSER, UGLY, STUPID and WEIRDO. It checks for them anywhere in a message, even inside a longer word.'),
          say('Does it actually stop unkind messages? Could you test it with real messages people got this week?', {
            choices: [
              { t: 'Sure. I will check what it hides and what it lets through.', ok: true },
              { t: 'It must work. Apps always get it right.', ok: false, why: 'Automatic filters make mistakes. The only way to know is to test them with real messages.' },
            ] }),
          say("Thanks! Here's one a friend sent me, to start you off. Your phone can run the filter on each message.", { act: (S) => { S.met = true; give('m0')(S); } }),
        ];
        if (Object.keys(S.tested).length < 7) return [say('Have you tested all seven yet? Open your phone with P.')];
        if (S.finished) return [say('Thanks for testing. The filter helps, but people still have to look out for each other.')];
        return [
          say('So, how did the filter do?', { choices: [
            { t: 'It hid two messages that were not unkind, and let three unkind ones through.', ok: true },
            { t: 'It was perfect.', ok: false, why: 'Look at your results again: there were false alarms and misses.' },
          ] }),
          say('What if the app also banned "L0S3R"? Would "ur such a LOOOSER" be hidden then?', { choices: [
            { t: 'No. People can always spell it a new way.', ok: true, act: (S) => { S.fixed = true; } },
            { t: 'Yes, every spelling would be caught now.', ok: false, why: '"LOOOSER" does not contain "LOSER" or "L0S3R". People can always invent a new spelling.' },
          ] }),
          say('So what does the filter really check?', { choices: [
            { t: 'Only the words in a message, not what it means.', ok: true },
            { t: 'Whether a message is kind.', ok: false, why: 'It only looks for banned words. "except ' + '{target}' + '" has no banned word, but it leaves someone out.' },
          ] }),
          say('Then what still has to happen?', { choices: [
            { t: 'People notice what the filter misses, and report it.', ok: true, act: (S) => { S.finished = true; } },
            { t: 'Nothing, the filter is enough.', ok: false, why: 'Three unkind messages got through. Someone has to notice them.' },
          ] }),
          say('Agreed. A filter checks words. People understand meaning.'),
        ];
      },
      joker: (S) => S.got.m1 ? null : [say('Someone posted this under my photo. Would the filter hide it?', { act: give('m1') })],
      teammate: (S) => S.got.m2 ? null : [say('My friend sent this after our match. Does the filter hide it?', { act: give('m2') })],
      friend: (S) => S.got.m3 ? null : [say('I sent this to my cousin. Would it get hidden?', { act: give('m3') })],
      poster: (S) => S.got.m4 ? null : [say('Someone sent me this. Try it with the filter.', { act: give('m4') })],
      bystander: (S) => S.got.m5 ? null : [say('This was under the art I posted. Test it?', { act: give('m5') })],
      target: (S) => S.got.m6 ? null : [say('This was in the class chat. I saw it.', { act: give('m6') })],
    },
  },
  {
    id: 'spread', title: 'One Screenshot', mins: 12, phone: 'spread',
    intro: '{poster} shared a screenshot of {target}. How far can one post go?',
    fresh: () => ({ krit1: false, q4: false, q8: false, krit2: false, sam: false }),
    steps(S) {
      return [
        { text: 'Talk to <b>{poster}</b> in the Corridor.', done: S.krit1, who: 'poster' },
        { text: 'On your phone (<b>P</b>), watch it spread. How many people have it after step 4?', done: S.q4, phone: true },
        { text: 'How many after step 8?', done: S.q8, phone: true },
        { text: 'Talk to <b>{poster}</b> again.', done: S.krit2, who: 'poster' },
        { text: 'Talk to <b>{target}</b> on the Playground.', done: S.sam, who: 'target' },
      ];
    },
    done: (S) => S.sam,
    talk: {
      poster(S) {
        if (!S.krit1) return [
          say("Look, I shared a screenshot of {target} pulling a face. It's only funny."),
          say('Want me to send it to you?', { choices: [
            { t: "No. It isn't fair on {target}. Who did you send it to?", ok: true },
            { t: 'Yes, send it.', ok: false, why: 'Every person who forwards it makes it spread further, and {target} has no say in it.' },
          ] }),
          say('Just two people. They probably sent it on to two more each... Check your phone.', { act: (S) => { S.krit1 = true; } }),
        ];
        if (!S.q8) return [say('Have you seen how far it has gone? Check your phone.')];
        if (!S.krit2) return [
          say('OK, I deleted my post. Problem solved.', { choices: [
            { t: "The copies are still on everyone else's phones.", ok: true },
            { t: 'Great, so it has gone.', ok: false, why: 'Deleting the first post does not delete the copies. Hundreds of people may still have it.' },
          ] }),
          say('So what should I do now?', { choices: [
            { t: 'Ask the people you sent it to to delete it, and say sorry to {target}.', ok: true, act: (S) => { S.krit2 = true; } },
            { t: 'Nothing. It was just a joke.', ok: false, why: 'It is not a joke if {target} is hurt by it. It can still be stopped from spreading further.' },
          ] }),
          say("Fine. I'll message them now, and say sorry."),
        ];
        return [say("I've asked everyone to delete it.")];
      },
      target(S) {
        if (!S.krit2) return [say('Hi.')];
        if (S.sam) return [say('Thanks for checking on me.')];
        return [
          say("Everyone's seen that photo of me.", { choices: [
            { t: "That wasn't fair. Are you OK? People are being asked to delete it.", ok: true, act: (S) => { S.sam = true; } },
            { t: "Just ignore it, it's only a photo.", ok: false, why: 'It matters to {target}. Telling someone to ignore it can make them feel nobody cares.' },
            { t: 'Why do people always pick on you?', ok: false, why: 'This can make {target} feel it is their fault. It is not.' },
          ] }),
          say('Thanks. That helps.'),
        ];
      },
    },
  },
  {
    id: 'upstander', title: 'Be an Upstander', mins: 15, phone: 'chat',
    intro: 'The class chat is ganging up on {target}. Do the right things, in the right order.',
    fresh: () => ({ read: false, saved: false, reported: false, blocked: false, sam: false, mali: false, told: false }),
    steps(S) {
      return [
        { text: 'Open your phone (<b>P</b>) and read the class chat.', done: S.read, phone: true },
        { text: 'Do not reply. <b>Save the evidence</b> first (a screenshot kept for an adult, not shared).', done: S.saved, phone: true },
        { text: '<b>Report</b> the messages in the app.', done: S.reported, phone: true },
        { text: 'Talk to <b>{target}</b> on the Playground.', done: S.sam, who: 'target' },
        { text: 'Talk to <b>{bystander}</b> in the Library.', done: S.mali, who: 'bystander' },
        { text: '<b>Tell a trusted adult</b>: go to the Safeguarding Lead in the Safeguarding office.', done: S.told, who: 'coun' },
      ];
    },
    done: (S) => S.saved && S.reported && S.sam && S.mali && S.told,
    talk: {
      target(S) {
        if (S.sam) return [say('Thanks for coming to find me.')];
        return [
          say('Have you seen the class chat?', { choices: [
            { t: "I have. It's not OK, and it's not your fault. I've saved it and I'm telling an adult.", ok: true, act: (S) => { S.sam = true; } },
            { t: "It's just teasing, don't take it so seriously.", ok: false, why: 'It is only a joke if everyone is laughing. {target} is not.' },
            { t: 'Maybe try not to trip next time.', ok: false, why: 'This blames {target}. The people being unkind are the problem.' },
          ] }),
          say("Thanks. I didn't think anyone would notice."),
        ];
      },
      bystander(S) {
        if (S.mali) return [say("You're right. I'll stop reacting to it.")];
        return [
          say("Did you see the chat? It's just a laugh, everyone does it.", { choices: [
            { t: "If {target} isn't laughing, it isn't a laugh. Don't add to it.", ok: true, act: (S) => { S.mali = true; } },
            { t: 'Yeah, true.', ok: false, why: 'Agreeing makes ganging up feel normal. Bystanders can change what happens next.' },
            { t: 'Not my business.', ok: false, why: 'Staying silent can look like agreeing. A small word from a bystander can stop it.' },
          ] }),
        ];
      },
      // Telling an adult never waits for evidence (UK practice: tell straight away; evidence helps but is not needed).
      coun(S) {
        if (S.told) return [say('Thank you. The safeguarding team will look after it from here.')];
        return [
          say('Hello. Is something wrong?', { choices: [
            { t: 'People are ganging up on {target} in the class chat.' + (S.saved ? ' I saved the messages so you can see them.' : ''), ok: true, act: (S) => { S.told = true; } },
            { t: 'Nothing. Never mind.', ok: false, why: 'Telling a trusted adult is how it actually stops. You will not get in trouble for telling.' },
          ] }),
          say(S.saved ? 'Thank you for telling me, and for saving the messages. You did the right thing.' : 'Thank you for telling me. You were right to come, even without the messages. If you can, show me them on your phone, but never forward them.'),
          say('Any adult in school would have passed this on to us, so you can always tell any of them.'),
        ];
      },
    },
  },
  {
    id: 'challenge', title: 'Challenge: The Squad Chat', mins: 10, phone: 'chat', noHelp: true,
    intro: '{newcomer} is new, and the game squad chat is leaving them out. No hints this time.',
    fresh: () => ({ read: false, saved: false, reported: false, blocked: false, leo: false, krit: false, told: false }),
    steps(S) {
      return [{ text: 'Help {newcomer}: deal with the chat, be kind to {newcomer}, stop the picture spreading and tell an adult.', done: S.saved && S.leo && S.krit && S.told }];
    },
    done: (S) => S.saved && S.leo && S.krit && S.told,
    talk: {
      newcomer(S) {
        if (S.leo) return [say('Thanks. Want to play at lunch?')];
        return [
          say("I'm new. Everyone's in a squad except me.", { choices: [
            { t: "That's not fair. Come and play with us. I'm telling a teacher about the chat.", ok: true, act: (S) => { S.leo = true; } },
            { t: 'Maybe practise more and they will add you.', ok: false, why: 'Leaving {newcomer} out is the problem, not how good anyone is at the game.' },
            { t: 'Just play on your own.', ok: false, why: 'Leaving someone out on purpose, again and again, is bullying too. {newcomer} needs someone on their side.' },
          ] }),
        ];
      },
      poster(S) {
        if (S.krit) return [say("OK, I won't send it.")];
        return [
          say('I made a funny picture of {newcomer}. Help me send it round?', { choices: [
            { t: "No. Don't send it. Making fun of someone new isn't funny.", ok: true, act: (S) => { S.krit = true; } },
            { t: 'Send it to me first.', ok: false, why: 'Every forward spreads it further, and copies cannot be taken back.' },
          ] }),
        ];
      },
      coun(S) {
        if (S.told) return [say('Thank you. The safeguarding team will deal with the squad chat.')];
        return [
          say('Hello. What is it?', { choices: [
            { t: '{newcomer} is being left out of the squad chat on purpose.' + (S.saved ? ' I saved the messages.' : ''), ok: true, act: (S) => { S.told = true; } },
            { t: 'Nothing.', ok: false, why: 'Telling a trusted adult is how it stops. You will not get in trouble for telling.' },
          ] }),
          say(S.saved ? 'Thank you for telling me, and for saving the messages.' : 'Thank you for telling me. You were right to come. If you can, show me the messages on your phone, but never forward them.'),
        ];
      },
    },
  },
];

export const LESSONS = [{ id: 'abw', title: 'Anti-Bullying Week (Year 9)', missions: ['filter', 'spread', 'upstander'], ext: ['challenge'] }];

// Small talk when someone has nothing for the current mission.
export const IDLE = {
  rep: 'Class chat is quiet today.', newcomer: 'Hi.', bystander: 'Shh, this is the library.', teammate: 'Hi!', poster: 'Hey.',
  friend: 'The noodles are good today.', joker: 'Did you do the homework?', target: 'Hi.', coun: 'If anything worries you, any adult in school will listen.',
};

// Phone actions in the chat missions. ok: false actions show why and count as a slip.
export const CHAT_ACTIONS = [
  { id: 'reply', label: 'Reply in the chat', ok: false, why: 'Replying feeds it or starts an argument, and it can make things worse for the person being targeted. Do not reply.' },
  { id: 'forward', label: 'Forward the messages to friends', ok: false, why: 'Forwarding spreads them further. Evidence is for a trusted adult, not for sharing.' },
  { id: 'save', label: 'Save the evidence (screenshot, keep it private)', ok: true },
  { id: 'report', label: 'Report the messages in the app', ok: true },
  { id: 'block', label: 'Block the senders', ok: true, needs: 'saved', why: 'Save the evidence first: blocking can hide the messages, and then you cannot show an adult.' },
];
