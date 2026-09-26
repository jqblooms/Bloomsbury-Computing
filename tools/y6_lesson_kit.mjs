// Shared helpers for the Year 6 Scratch lesson builders (tools/build_y6_scratch.mjs).
// Each helper adds one step in the shapes the shell's step renderers expect
// (see the shell's docs/lessons.md).
import fs from 'node:fs';

export const regex = (source, flags = 'i') => ({ __regex: true, source, flags });
export const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// A number answer, allowing "x: 70", "x = 70" or just "70", and either minus sign.
export function numberAnswer(n, label) {
  const lead = label ? String.raw`(${label}\s*[:=]?\s*)?` : '';
  const body = n < 0 ? String.raw`[-−]\s*` + Math.abs(n) : String(n);
  return String.raw`^\s*` + lead + body + String.raw`\s*$`;
}

export function lesson(topicId, prefix, label) {
  const steps = [];
  const validators = {};
  const add = step => steps.push(step);
  const heading = (title, lead = '') => `<h2 class="lesson-h2">${title}</h2>${lead ? `<p class="lesson-lead">${lead}</p>` : ''}`;
  const blocks = text => `<div class="scratchblocks-card"><pre class="blocks">${esc(text)}</pre></div>`;
  const facts = items => `<ul class="lesson-facts">${items.map(i => `<li>${i}</li>`).join('')}</ul>`;

  function title(name, number, objectives) {
    add({ id: 'title', label: name,
      content: `<div class="lesson-title-slide"><p class="lesson-title-kicker">Year 6 Scratch</p><h2 class="lesson-h2">${name}</h2><p>Year 6, ${number}</p></div>` + facts(objectives) });
  }

  function slide(id, label, html) { add({ id, label, content: html }); }

  function choice(id, label, lead, items, script) {
    const container = `${prefix}-${id}`;
    const body = script
      ? `<div class="igame-two-col">${blocks(script)}<div id="${container}"></div></div>`
      : `<div id="${container}"></div>`;
    add({ id, label, type: 'multiple-choice', containerId: container, content: heading(label, lead) + body, items });
  }

  function short(id, label, lead, questions, checks, script) {
    const validatorId = `${prefix}-${id}`;
    const validatorKey = `${prefix.replace(/-/g, '_')}_${id.replace(/-/g, '_')}`;
    validators[validatorKey] = checks.map((check, i) => ({ suffix: String.fromCharCode(97 + i), pattern: regex(check.pattern), feedback: check.feedback }));
    const responses = questions.map((question, i) => {
      const suffix = String.fromCharCode(97 + i);
      return `<div class="lesson-do-now-response"><label for="${validatorId}-${suffix}">${question}</label><input id="${validatorId}-${suffix}" class="pseudocode-output-input lesson-exam-answer" data-answer-kind="short" data-answer-id="${id}-${suffix}" aria-label="${label}, part ${suffix}" autocomplete="off"></div>`;
    }).join('');
    const marks = questions.length;
    const card = `<div class="lesson-exam-card"><div class="lesson-do-now-responses">${responses}</div><div class="lesson-do-now-actions"><button type="button" class="donow-btn" id="${validatorId}-check">Check answers</button><strong>Total: ${marks} mark${marks === 1 ? '' : 's'}</strong></div><div id="${validatorId}-feedback" class="pseudocode-feedback" role="status" aria-live="polite"></div></div>`;
    add({ id, label, type: 'short-answer-validation', validatorId, validatorKey,
      content: heading(label, lead) + (script ? `<div class="igame-two-col">${blocks(script)}${card}</div>` : card) });
  }

  function written(id, label, lead, items) {
    const container = `${prefix}-${id}`;
    add({ id, label, type: 'self-marked-response', containerId: container, content: heading(label, lead) + `<div id="${container}"></div>`, items });
  }

  // An independent activity: one Scratch Challenge, opened in the
  // Scratch Challenges app, which checks the project itself.
  function challenge(id, label, lead, challengeId, name, build) {
    const buttonId = `${prefix}-${id}-btn`;
    add({ id, label, type: 'app-link', buttonId, appId: 'scratchchallenges', appQuery: `challenge=${challengeId}`,
      content: heading(label, lead) +
        `<div class="igame-two-col"><div class="lesson-flow-task"><h3>Build it</h3>${facts(build)}</div>` +
        `<div class="lesson-app-link"><p>The panel beside TurboWarp lists the checks. Press <strong>Check my project</strong> as often as you like: it plays your game and tells you what it saw.</p>` +
        `<button type="button" class="donow-btn" id="${buttonId}">Open ${name}</button></div></div>` });
  }

  function plenary(drillId, name) {
    const container = `${prefix}-plenary`;
    add({ id: 'plenary', label: `Plenary: ${name}`, type: 'embedded-app', appId: `drill-${drillId}`, embedContainerId: container,
      content: heading(`Plenary: ${name}`, 'Answer a batch of five. Three right in a row masters a card, and your progress is saved for your teacher.') + `<div id="${container}"></div>` });
  }

  function save() {
    const data = { id: topicId, label, steps, validators, pseudocodeValidators: {} };
    fs.writeFileSync(`LessonData/${topicId}.json`, JSON.stringify(data, null, 2) + '\n');
    console.log(`Built ${topicId}: ${steps.length} steps, ${Object.keys(validators).length} validator groups`);
  }

  return { add, heading, blocks, facts, title, slide, choice, short, written, challenge, plenary, save };
}
