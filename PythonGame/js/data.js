// Where the level, stage exam and GCSE question files live: content/ in this
// app, fetched with the page's bcv so a new build refreshes them.
var NUM_LEVELS = 52;
var NUM_EXAMS = 7;
var NUM_GCSE_EXAMS = 10; // increment as you add them
const CONTENT_V = encodeURIComponent(new URLSearchParams(location.search).get('bcv') || '');

const LEVEL_URLS = Object.fromEntries(
    Array.from({ length: NUM_LEVELS }, (_, i) => [i + 1, `content/level-${i + 1}.json?v=${CONTENT_V}`])
);

const EXAM_URLS = Object.fromEntries(
    Array.from({ length: NUM_EXAMS }, (_, i) => [i + 1, `content/exam-${i + 1}.json?v=${CONTENT_V}`])
);

const GCSE_EXAM_URLS = Object.fromEntries(
    Array.from({ length: NUM_GCSE_EXAMS }, (_, i) => [i + 1, `content/gcse-${i + 1}.json?v=${CONTENT_V}`])
);
