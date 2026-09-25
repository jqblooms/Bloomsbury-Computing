import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';

const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const source = fs.readFileSync('PacketLab/index.html', 'utf8');
const fixture = path.join(os.tmpdir(), 'packet-lab-interaction-check.html');
const testScript = `<script>
(function () {
  var result = [];
  function check(condition, label) { result.push((condition ? 'PASS ' : 'FAIL ') + label); }
  if (location.search.indexOf('routes') !== -1) {
    document.getElementById('send').click();
    var packet = function (number) { return document.querySelector('#arrival button[data-packet="' + number + '"]'); };
    check(!!packet(1) && !!packet(2) && !!packet(3), 'three packets delivered');
    packet(2).click(); packet(1).click(); packet(3).click();
    document.getElementById('check-route').click();
    check(document.getElementById('feedback').textContent.indexOf('out of order') !== -1, 'wrong order rejected');
    document.getElementById('reset-route').click();
    packet(1).click(); packet(2).click(); packet(3).click();
    document.getElementById('check-route').click();
    check(document.getElementById('feedback').textContent.indexOf('Correct') !== -1, 'right order accepted');
    check(document.getElementById('send').textContent === 'Next delivery', 'next round unlocked');
  } else {
    var correct = ['Header', 'Header', 'Header', 'Payload', 'Trailer'];
    correct.forEach(function (answer, i) { document.getElementById('choice-' + i).value = answer; });
    document.getElementById('check-parts').click();
    check(document.getElementById('feedback').textContent.indexOf('5/5') !== -1, 'complete packet accepted');
    document.getElementById('choice-0').value = 'Payload';
    document.getElementById('check-parts').click();
    check(document.getElementById('feedback').textContent.indexOf('4/5') !== -1, 'incorrect field rejected');
  }
  var marker = document.createElement('pre');
  marker.id = 'test-result';
  marker.textContent = result.join('|');
  document.body.appendChild(marker);
})();
</script>`;
fs.writeFileSync(fixture, source.replace('</body>', testScript + '</body>'));
for (const mode of ['parts', 'routes']) {
  const url = pathToFileURL(fixture).href + '?activity=' + mode;
  const run = spawnSync(chrome, ['--headless', '--disable-gpu', '--dump-dom', url], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  const result = run.stdout.match(/<pre id="test-result">([^<]+)<\/pre>/);
  assert.ok(result, `No browser result for ${mode}`);
  assert.ok(!result[1].includes('FAIL'), result[1]);
  console.log(`${mode}: ${result[1]}`);
}
