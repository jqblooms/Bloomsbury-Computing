// Upstander Lab 3D: the people, the messages and every conversation, as data. Edit the words here; main.js,
// talk.js and phone.js run them. Every name is invented and every message is mild: no slurs, nothing about who
// someone is, and nothing asks the player about their own life (James, 2026-11-16, Year 9 Anti-Bullying Week).
//
// A conversation is a list of lines: { say, code?, choices?: [{ t, ok, why, act }], act? }.
//   ok: false choices are not taken: the player sees `why` and chooses again (it counts as a slip for the stars).
//   act(S) changes the mission state S when the line is reached or the choice is taken.
import { flagged, verdict } from './filter.js';

export const PEOPLE = {
  niran: { name: 'Niran', colour: 1, x: 3.5, y: 2.5, where: 'the Computing Room' },
  leo: { name: 'Leo', colour: 9, x: 7.5, y: 1.6, where: 'the Computing Room' },
  mali: { name: 'Mali', colour: 5, x: 15.5, y: 2.5, where: 'the Library' },
  ava: { name: 'Ava', colour: 2, x: 20.5, y: 3.5, where: 'the Library' },
  krit: { name: 'Krit', colour: 4, x: 17.5, y: 6, where: 'the Corridor' },   // at the edge: the corridor is 2 tiles wide
  ploy: { name: 'Ploy', colour: 3, x: 3.5, y: 11.5, where: 'the Canteen' },
  ben: { name: 'Ben', colour: 0, x: 9.5, y: 10.2, where: 'the Canteen' },
  sam: { name: 'Sam', colour: 7, x: 21, y: 11, where: 'the Playground' },
  coun: { name: 'Counsellor', colour: 8, x: 15.5, y: 10.2, where: "the Counsellor's room" },
};

// The messages people ask you to test (Mission 1). unkind: what a person reading it would say.
export const MESSAGES = [
  { id: 'm0', from: 'niran', text: 'good luck in the match tomorrow!', unkind: false },
  { id: 'm1', from: 'ben', text: "you're such a loser, nobody picked you", unkind: true },
  { id: 'm2', from: 'ava', text: "we got knocked into the losers' bracket, still fun!", unkind: false },
  { id: 'm3', from: 'ploy', text: 'my laptop is so stupid slow today', unkind: false },
  { id: 'm4', from: 'krit', text: 'ur such a l0s3r', unkind: true },
  { id: 'm5', from: 'mali', text: 'nice drawing. said nobody ever.', unkind: true },
  { id: 'm6', from: 'sam', text: 'everyone come to the party, except Sam', unkind: true },
];
export const msgById = Object.fromEntries(MESSAGES.map((m) => [m.id, m]));
export const WHY = {
  right: (m) => (m.unkind ? 'The filter caught it, and it is unkind. Right.' : 'The filter let it through, and it is not unkind. Right.'),
  'false-alarm': (m) => 'Flagged, but it is not unkind: ' + hiddenWord(m.text) + ' That is a false alarm.',
  missed: (m) => 'Not flagged, but it is unkind. None of the blocked words is in it' + (/[0-9]/.test(m.text) ? ', because numbers replace letters.' : '.') + ' That is a miss.',
};
function hiddenWord(t) {
  const u = t.toUpperCase();
  const w = ['LOSER', 'UGLY', 'STUPID', 'WEIRDO'].find((x) => u.includes(x));
  return '"' + w + '" is inside it, but nobody is being insulted.';
}

// The class chat for Missions 3 and 4 (what the phone shows).
export const CHAT = {
  upstander: { title: 'Year 9 class chat', lines: [
    ['Ben', 'lol look at what Sam wore today'],
    ['Krit', 'who even invited Sam to this chat'],
    ['Ava', 'haha'],
    ['Ben', 'Sam is so weird'],
    ['Krit', 'everyone add a laughing face if you agree'],
  ] },
  challenge: { title: 'Squad (class game chat)', lines: [
    ['Krit', "don't add Leo to the squad, he's rubbish"],
    ['Ben', 'yeah leave him out'],
    ['Krit', 'I made a funny picture of him, sending it round later'],
  ] },
};

// ---------------------------------------------------------------- the missions
const give = (id) => (S) => { S.got[id] = true; };
const say = (t, more) => Object.assign({ say: t }, more || {});

export const MISSIONS = [
  {
    id: 'filter', title: 'The Filter', mins: 15, phone: 'messages',
    intro: 'Niran wrote a filter to stop unkind messages in the class chat. Test it.',
    fresh: () => ({ met: false, got: {}, tested: {}, fixed: false, finished: false }),
    steps(S) {
      const got = Object.keys(S.got).length, tested = Object.keys(S.tested).length;
      return [
        { text: 'Talk to <b>Niran</b> in the Computing Room.', done: S.met, who: 'niran' },
        { text: 'Collect the messages people want tested: Ben, Ava, Ploy, Krit, Mali and Sam (' + got + ' of 7).', done: got === 7, who: MESSAGES.map((m) => m.from).find((p) => !S.got[MESSAGES.find((m) => m.from === p).id]) },
        { text: 'Test every message on your phone (<b>P</b>): run the filter, then say if it was right (' + tested + ' of 7).', done: tested === 7, phone: true },
        { text: 'Go back to <b>Niran</b> and tell him what you found.', done: S.finished, who: 'niran' },
      ];
    },
    done: (S) => S.finished,
    talk: {
      niran(S) {
        if (!S.met) return [
          say("Hi! I made a filter for the class chat. If a message has a blocked word in it, it gets flagged and hidden."),
          say('Here is my code. CONTAINS is TRUE if the word is somewhere inside the message.', { code: true }),
          say('Can you test it? Ask people for messages they got this week, and run each one through the filter on your phone.', {
            choices: [
              { t: 'Sure. What counts as a good test?', ok: true },
              { t: 'Filters always work, no need to test it.', ok: false, why: 'Every program needs testing. Bugs and edge cases only show up when you try real data.' },
            ] }),
          say("Messages people actually got. Here's one from my friend to start you off.", { act: (S) => { S.met = true; give('m0')(S); } }),
        ];
        if (Object.keys(S.tested).length < 7) return [say('Have you tested all seven yet? Open your phone with P.')];
        if (S.finished) return [say('Thanks for testing. Code helps, but people still have to look out for each other.')];
        return [
          say('So, how did it do?', { choices: [
            { t: 'It flagged two messages that were not unkind, and missed three that were.', ok: true },
            { t: 'It was perfect.', ok: false, why: 'Look at your results again: there were false alarms and misses.' },
          ] }),
          say('I could add "L0S3R" to the blocked list. Then would "ur such a LOOOSER" be flagged?', { choices: [
            { t: 'No. LOOOSER is spelled differently again.', ok: true, act: (S) => { S.fixed = true; } },
            { t: 'Yes, every spelling would be caught now.', ok: false, why: '"LOOOSER" does not contain "LOSER" or "L0S3R". People can always invent a new spelling.' },
          ] }),
          say('So what does my filter really check?', { choices: [
            { t: 'Only the letters in a message, not what it means.', ok: true },
            { t: 'Whether a message is kind.', ok: false, why: 'It only looks for blocked words inside the text. "except Sam" has no blocked word, but it leaves Sam out.' },
          ] }),
          say('Then what still has to happen?', { choices: [
            { t: 'People notice what the code misses, and report it.', ok: true, act: (S) => { S.finished = true; } },
            { t: 'Nothing, the filter is enough.', ok: false, why: 'Three unkind messages got through. Someone has to notice them.' },
          ] }),
          say('Agreed. A computer checks words. People understand meaning.'),
        ];
      },
      ben: (S) => S.got.m1 ? null : [say('Someone posted this under my photo. Test it?', { act: give('m1') })],
      ava: (S) => S.got.m2 ? null : [say('My friend sent this after our match. Does the filter like it?', { act: give('m2') })],
      ploy: (S) => S.got.m3 ? null : [say('I sent this to my brother. Would it get flagged?', { act: give('m3') })],
      krit: (S) => S.got.m4 ? null : [say('Someone sent me this. Try it in the filter.', { act: give('m4') })],
      mali: (S) => S.got.m5 ? null : [say('This was under the art I posted. Test it?', { act: give('m5') })],
      sam: (S) => S.got.m6 ? null : [say('This was in the class chat. I saw it.', { act: give('m6') })],
    },
  },
  {
    id: 'spread', title: 'One Screenshot', mins: 12, phone: 'spread',
    intro: 'Krit posted a screenshot of Sam. Find out how far one post can go.',
    fresh: () => ({ krit1: false, q4: false, q8: false, krit2: false, sam: false }),
    steps(S) {
      return [
        { text: 'Talk to <b>Krit</b> in the Corridor.', done: S.krit1, who: 'krit' },
        { text: 'On your phone (<b>P</b>), watch it spread. How many people have it after step 4?', done: S.q4, phone: true },
        { text: 'How many after step 8?', done: S.q8, phone: true },
        { text: 'Talk to <b>Krit</b> again.', done: S.krit2, who: 'krit' },
        { text: 'Talk to <b>Sam</b> on the Playground.', done: S.sam, who: 'sam' },
      ];
    },
    done: (S) => S.sam,
    talk: {
      krit(S) {
        if (!S.krit1) return [
          say("Look, I posted that old photo of Sam pulling a face. It's only funny."),
          say('Want me to send it to you?', { choices: [
            { t: "No. It isn't fair on Sam. Who did you send it to?", ok: true },
            { t: 'Yes, send it.', ok: false, why: 'Every person who forwards it makes it spread further, and Sam has no say in it.' },
          ] }),
          say('Just two people. They probably sent it on to two more each... Check your phone.', { act: (S) => { S.krit1 = true; } }),
        ];
        if (!S.q8) return [say('Have you seen how far it has gone? Check your phone.')];
        if (!S.krit2) return [
          say('OK, I deleted my post. Problem solved.', { choices: [
            { t: 'The copies are still on everyone else\'s phones.', ok: true },
            { t: 'Great, so it has gone.', ok: false, why: 'Deleting the first post does not delete the copies. Hundreds of people may still have it.' },
          ] }),
          say('So what should I do now?', { choices: [
            { t: 'Ask the people you sent it to to delete it, and say sorry to Sam.', ok: true, act: (S) => { S.krit2 = true; } },
            { t: 'Nothing. It was just a joke.', ok: false, why: 'It is not a joke if Sam is hurt by it. Krit can still help stop it spreading.' },
          ] }),
          say("Fine. I'll message them now, and talk to Sam."),
        ];
        return [say("I've asked everyone to delete it.")];
      },
      sam(S) {
        if (!S.krit2) return [say('Hi.')];
        if (S.sam) return [say('Thanks for checking on me.')];
        return [
          say("Everyone's seen that photo of me.", { choices: [
            { t: "That wasn't fair. Are you OK? Krit is asking people to delete it.", ok: true, act: (S) => { S.sam = true; } },
            { t: "Just ignore it, it's only a photo.", ok: false, why: 'It matters to Sam. Telling someone to ignore it can make them feel nobody cares.' },
            { t: 'Why do people always pick on you?', ok: false, why: 'This can make Sam feel it is their fault. It is not.' },
          ] }),
          say("Thanks. That helps."),
        ];
      },
    },
  },
  {
    id: 'upstander', title: 'Be an Upstander', mins: 15, phone: 'chat',
    intro: 'The class chat is piling on Sam. Do the right things, in the right order.',
    fresh: () => ({ read: false, saved: false, reported: false, blocked: false, sam: false, mali: false, told: false }),
    steps(S) {
      return [
        { text: 'Open your phone (<b>P</b>) and read the class chat.', done: S.read, phone: true },
        { text: 'Do not reply. <b>Save the evidence</b> first (a screenshot kept for an adult, not shared).', done: S.saved, phone: true },
        { text: '<b>Report</b> the messages in the app.', done: S.reported, phone: true },
        { text: 'Talk to <b>Sam</b> on the Playground.', done: S.sam, who: 'sam' },
        { text: 'Talk to <b>Mali</b> in the Library.', done: S.mali, who: 'mali' },
        { text: '<b>Tell an adult</b>: go to the Counsellor.', done: S.told, who: 'coun' },
      ];
    },
    done: (S) => S.saved && S.reported && S.sam && S.mali && S.told,
    talk: {
      sam(S) {
        if (S.sam) return [say('Thanks for coming to find me.')];
        return [
          say('Have you seen the class chat?', { choices: [
            { t: "I have. It's not OK, and it's not your fault. I've saved it and I'm telling an adult.", ok: true, act: (S) => { S.sam = true; } },
            { t: "It's just banter, don't take it so seriously.", ok: false, why: 'It is only banter if everyone is laughing. Sam is not.' },
            { t: 'You should change what you wear.', ok: false, why: 'This blames Sam. The people being unkind are the problem.' },
          ] }),
          say("Thanks. I didn't think anyone would notice."),
        ];
      },
      mali(S) {
        if (S.mali) return [say("You're right. I'll stop reacting to it.")];
        return [
          say("Did you see the chat? It's just a laugh, everyone does it.", { choices: [
            { t: "If Sam isn't laughing, it isn't a laugh. Don't add to it.", ok: true, act: (S) => { S.mali = true; } },
            { t: 'Yeah, true.', ok: false, why: 'Agreeing makes the pile-on feel normal. Bystanders can change what happens next.' },
            { t: 'Not my business.', ok: false, why: 'Staying silent can look like agreeing. A small word from a bystander can stop it.' },
          ] }),
        ];
      },
      coun(S) {
        if (S.told) return [say('Thank you. I will look after it from here.')];
        if (!S.saved) return [say('Hello. Is something wrong?'), say('(Save the evidence on your phone first, so you can show what happened.)')];
        return [
          say('Hello. Is something wrong?', { choices: [
            { t: 'People are piling on Sam in the class chat. I saved the messages so you can see them.', ok: true, act: (S) => { S.told = true; } },
            { t: 'Nothing. Never mind.', ok: false, why: 'Telling a trusted adult is how it actually stops. You will not get in trouble for telling.' },
          ] }),
          say('Thank you for telling me, and for saving the messages. You did the right thing.'),
        ];
      },
    },
  },
  {
    id: 'challenge', title: 'Challenge: The Squad Chat', mins: 10, phone: 'chat', noHelp: true,
    intro: 'Leo is new, and the game squad chat is shutting him out. No hints this time.',
    fresh: () => ({ read: false, saved: false, reported: false, blocked: false, leo: false, krit: false, told: false }),
    steps(S) {
      return [{ text: 'Help Leo: deal with the chat, support Leo, stop the picture spreading and tell an adult.', done: S.saved && S.leo && S.krit && S.told }];
    },
    done: (S) => S.saved && S.leo && S.krit && S.told,
    talk: {
      leo(S) {
        if (S.leo) return [say('Thanks. Do you want to play at lunch?')];
        return [
          say("I'm new. Everyone's in a squad except me.", { choices: [
            { t: "That's not fair. Come and play with us. I'm telling a teacher about the chat.", ok: true, act: (S) => { S.leo = true; } },
            { t: 'Maybe practise more and they will add you.', ok: false, why: 'Leaving Leo out is the problem, not how good he is at the game.' },
            { t: 'Just play on your own.', ok: false, why: 'Leaving someone out on purpose is bullying too. Leo needs someone on his side.' },
          ] }),
        ];
      },
      krit(S) {
        if (S.krit) return [say("OK, I won't send it.")];
        return [
          say('I made a funny picture of Leo. Help me send it round?', { choices: [
            { t: "No. Don't send it. Making fun of someone new isn't funny.", ok: true, act: (S) => { S.krit = true; } },
            { t: 'Send it to me first.', ok: false, why: 'Every forward spreads it further, and copies cannot be taken back.' },
          ] }),
        ];
      },
      coun(S) {
        if (S.told) return [say('Thank you. I will talk to the squad.')];
        return [
          say('Hello. What is it?', { choices: [
            { t: "Leo's being left out of the squad chat on purpose. I saved the messages.", ok: true, act: (S) => { if (S.saved) S.told = true; },
              check: (S) => S.saved, notYet: 'Save the evidence on your phone first, so you can show what happened.' },
            { t: 'Nothing.', ok: false, why: 'Telling a trusted adult is how it stops.' },
          ] }),
        ];
      },
    },
  },
];

export const LESSONS = [{ id: 'abw', title: 'Anti-Bullying Week (Year 9)', missions: ['filter', 'spread', 'upstander'], ext: ['challenge'] }];

// Small talk when someone has nothing for the current mission.
export const IDLE = {
  niran: 'Coding club is on Thursday.', leo: 'Hi.', mali: 'Shh, this is the library.', ava: 'Hi!', krit: 'Hey.',
  ploy: 'The noodles are good today.', ben: 'Did you do the homework?', sam: 'Hi.', coun: 'My door is always open.',
};

// Phone actions in the chat missions. ok: false actions show why and count as a slip.
export const CHAT_ACTIONS = [
  { id: 'reply', label: 'Reply in the chat', ok: false, why: 'Replying feeds the pile-on or starts an argument, and it can make things worse for the person being targeted. Do not reply.' },
  { id: 'forward', label: 'Forward the messages to friends', ok: false, why: 'Forwarding spreads them further. Evidence is for a trusted adult, not for sharing.' },
  { id: 'save', label: 'Save the evidence (screenshot, keep it private)', ok: true },
  { id: 'report', label: 'Report the messages in the app', ok: true },
  { id: 'block', label: 'Block the senders', ok: true, needs: 'saved', why: 'Save the evidence first: blocking can hide the messages, and then you cannot show an adult.' },
];

// Self-checks a builder or test can run: every message's filter result and verdict.
export function checkStory() {
  const out = MESSAGES.map((m) => ({ id: m.id, flagged: flagged(m.text), verdict: verdict(flagged(m.text), m.unkind) }));
  return out;
}
