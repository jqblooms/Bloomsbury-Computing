import fs from 'node:fs';
import assert from 'node:assert/strict';

function inlineScripts(path) {
  const html = fs.readFileSync(path, 'utf8');
  return [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(match => match[1]).filter(Boolean);
}
for (const path of ['PacketLab/index.html', 'Drills/index.html']) {
  const scripts = inlineScripts(path);
  assert.ok(scripts.length, `${path} has no inline script`);
  scripts.forEach(script => new Function(script));
}

const lesson = JSON.parse(fs.readFileSync('LessonData/y10-2-1-l1.json', 'utf8'));
assert.equal(lesson.id, 'y10-2-1-l1');
assert.equal(new Set(lesson.steps.map(step => step.id)).size, lesson.steps.length);
const activities = lesson.steps.filter(step => step.type === 'embedded-app').map(step => step.appId);
assert.deepEqual(activities, ['packet-lab-parts', 'packet-lab-routes', 'drill-y10-2-1-l1-packets']);
const content = lesson.steps.map(step => step.content || '').join('\n');
assert.ok(!/[\u2013\u2014]/.test(content), 'Student slides contain an en/em dash');

for (const checks of Object.values(lesson.validators)) {
  for (const check of checks) {
    const re = new RegExp(check.pattern.source, check.pattern.flags);
    assert.ok(check.feedback);
    assert.ok(!re.test('wrong answer'));
  }
}
const validAnswers = {
  y10_2_1_l1_do_now_2: ['lossless compression'],
  y10_2_1_l1_practice: ['Payload', 'packet number', 'router']
};
for (const [key, answers] of Object.entries(validAnswers)) {
  assert.equal(lesson.validators[key].length, answers.length);
  lesson.validators[key].forEach((check, i) => {
    assert.ok(new RegExp(check.pattern.source, check.pattern.flags).test(answers[i]), `${key} answer ${i + 1} rejected`);
  });
}

const drillsHtml = fs.readFileSync('Drills/index.html', 'utf8');
const drillStart = drillsHtml.indexOf('"y10-2-1-l1-packets": {');
const drillEnd = drillsHtml.indexOf('"examqs-y10-1-3": {', drillStart);
assert.ok(drillStart >= 0 && drillEnd > drillStart);
const drillBlock = drillsHtml.slice(drillStart, drillEnd);
assert.equal((drillBlock.match(/id: "pk-\d+"/g) || []).length, 20);
assert.ok(!/[\u2013\u2014]/.test(drillBlock), 'Student drill contains an en/em dash');
const drillData = new Function(`return ({${drillBlock}});`)();
const matcherStart = drillsHtml.indexOf('var TEXT_FILLER = ');
const matcherEnd = drillsHtml.indexOf('  // ---- progress reporting', matcherStart);
const matchAnswer = new Function(drillsHtml.slice(matcherStart, matcherEnd) + 'return matchAnswer;')();
const packetCards = drillData['y10-2-1-l1-packets'].cards;
assert.equal(packetCards.length, 20);
for (const card of packetCards) {
  for (const answer of card.answers) assert.ok(matchAnswer(card, answer), `${card.id} rejects own answer: ${answer}`);
  for (const distractor of card.distractors) assert.ok(!matchAnswer(card, distractor), `${card.id} accepts distractor: ${distractor}`);
}

const shellPath = 'C:/Users/Bloomsbury/Desktop/Apps Script/bloomsbury-computing-main/Index.html';
const shell = fs.readFileSync(shellPath, 'utf8');
inlineScripts(shellPath).forEach(script => new Function(script));
const navPrefix = 'var LESSON_YEAR_GROUPS = ';
const navStart = shell.indexOf(navPrefix) + navPrefix.length;
assert.ok(navStart > navPrefix.length);
const nav = JSON.parse(shell.slice(navStart, shell.indexOf(';', navStart)));
const navLesson = nav.find(group => group.id === 'year10').topics.find(topic => topic.id === lesson.id);
assert.deepEqual(navLesson.steps, lesson.steps.map(step => ({ id: step.id, label: step.label })));
for (const appId of activities) assert.ok(shell.includes(`id: '${appId}'`), `${appId} missing from shell`);
assert.ok(shell.includes("'drill:y10-2-1-l1-packets'"));

console.log('Y10 2.1 L1: scripts, JSON, validators, navigation, activities and 20 drill cards passed');
