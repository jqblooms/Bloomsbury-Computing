// Where the level, stage exam and GCSE question files live.
var NUM_LEVELS = 52;
var NUM_EXAMS = 7;
var NUM_GCSE_EXAMS = 10; // increment as you add them
const BASE = "https://raw.githubusercontent.com/jquinney-hue/pythongamejsons/refs/heads/main/";

const LEVEL_URLS = Object.fromEntries(
    Array.from({ length: NUM_LEVELS }, (_, i) => [i + 1, `${BASE}testlevel${i + 1}.json`])
);

const EXAM_URLS = Object.fromEntries(
    Array.from({ length: NUM_EXAMS }, (_, i) => [i + 1, `${BASE}stage${i + 1}exam.json`])
);

const GCSE_EXAM_URLS = Object.fromEntries(
    Array.from({ length: NUM_GCSE_EXAMS }, (_, i) => [i + 1, `${BASE}gcseexam${i + 1}.json`])
);
