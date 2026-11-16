// The school for Upstander Lab 3D: five rooms off one corridor, a little furniture, and the people (blobs from
// Network Builder 3D's blob.js) standing where story.js puts them. Positions are in tiles; tile i spans i - 0.5 to
// i + 0.5, as in the other labs (blob.js draws x at x * 100 + 50).
import * as THREE from 'three';
import { createBlob } from '../blob.js';
import { tape } from '../devices.js';
import { PEOPLE } from './story.js';

const T = 100;
export const MAP = {
  w: 24, h: 14,
  rows: [
    '########################',
    '#.........#............#',
    '#.........#............#',
    '#.........#............#',
    '#.........#............#',
    '####.#######....########',
    '#......................#',
    '#......................#',
    '####.########.######.###',
    '#...........#.....#....#',
    '#...........#.....#....#',
    '#...........#.....#....#',
    '#...........#.....#....#',
    '########################',
  ],
  regions: [
    { name: 'Computing Room', x0: 1, x1: 9, y0: 1, y1: 4, index: 0 },
    { name: 'Library', x0: 11, x1: 22, y0: 1, y1: 4, index: 2 },
    { name: 'Corridor', x0: 1, x1: 22, y0: 5, y1: 7, index: 1 },
    { name: 'Canteen', x0: 1, x1: 11, y0: 8, y1: 12, index: 1 },
    { name: 'Counsellor', x0: 13, x1: 17, y0: 8, y1: 12, index: 0 },
    { name: 'Playground', x0: 19, x1: 22, y0: 8, y1: 12, index: 2 },
  ],
};
// Furniture: [x, y, w, d, height, colour, kind]; each fills whole tiles for walking.
const PROPS = [
  [1, 1, 2, 1, 46, 0x8a6d4b, 'desk'], [5, 1, 2, 1, 46, 0x8a6d4b, 'desk'],
  [12, 1, 3, 1, 150, 0x6b4f3a, 'shelf'], [17, 1, 3, 1, 150, 0x6b4f3a, 'shelf'],
  [6, 10, 2, 2, 44, 0xb08d57, 'table'],
  [17, 9, 1, 1, 46, 0x8a6d4b, 'desk'],
  [20, 12, 2, 1, 30, 0x5b7a3a, 'bench'],
];
// Signs over the doors, readable while walking.
const SIGNS = [['COMPUTING', 4, 5], ['LIBRARY', 13.5, 5], ['CANTEEN', 4, 8], ['COUNSELLOR', 13, 8], ['PLAYGROUND', 20, 8]];

export function buildWorld(view) {
  view.setRoom(MAP);
  const group = new THREE.Group(); view.scene.add(group);
  const blocked = new Set();
  const mat = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 });
  for (const [x, y, w, d, h, c, kind] of PROPS) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w * T - 14, h, d * T - 14), mat(c));
    m.position.set(x * T + w * T / 2, h / 2, y * T + d * T / 2); group.add(m);
    if (kind === 'desk') {   // a monitor on each desk
      for (let k = 0; k < w; k++) {
        const s = new THREE.Mesh(new THREE.BoxGeometry(46, 32, 6), mat(0x1f2937));
        s.position.set(x * T + k * T + T / 2, h + 24, y * T + 22); group.add(s);
      }
    }
    for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) blocked.add((x + i) + ',' + (y + j));
  }
  for (const [t, x, y] of SIGNS) { const s = tape(t, { bg: '#1f2937' }); s.position.set(x * T + T / 2, 120, y * T + T / 2); group.add(s); }

  const solidAt = (tx, ty) => tx < 0 || ty < 0 || tx >= MAP.w || ty >= MAP.h || MAP.rows[ty][tx] === '#' || blocked.has(tx + ',' + ty);
  const people = {};
  for (const [id, p] of Object.entries(PEOPLE)) {
    const b = createBlob(p.colour, p.name);
    view.scene.add(b.group);
    const mark = tape('!', { bg: '#3e8ef7', size: 0.05 }); mark.position.y = 205; mark.visible = false; b.group.add(mark);
    people[id] = { id, name: p.name, where: p.where, x: p.x, y: p.y, face: 0, blob: b, mark, home: { x: p.x, y: p.y } };
  }
  // Free for a body at (x, y): no wall or furniture under its four corners, and not inside a person.
  const R = 0.28;
  function free(x, y, ignore) {
    for (const [dx, dy] of [[-R, -R], [R, -R], [-R, R], [R, R]]) if (solidAt(Math.round(x + dx), Math.round(y + dy))) return false;
    for (const p of Object.values(people)) if (p !== ignore && p.shown !== false && Math.hypot(p.x - x, p.y - y) < 0.62) return false;
    return true;
  }
  return { MAP, solidAt, free, people };
}
