// Tailwind (play CDN) settings shared by the arcade games built with it:
// Binary, Boolean, Flowchart, Pseudocode and Storage Blitz, and File Forge.
// Load it straight after the Tailwind script, with shared/bc-theme.css:
//
//   <script src="https://cdn.tailwindcss.com"></script>
//   <script src="../shared/bc-tailwind.js?v=20260927"></script>
//
// The games are written with Tailwind's colour names (bg-slate-800,
// text-cyan-400, bg-red-600 ...). Rather than rewrite every class, this
// re-points those names at the site's palette:
//   slate  -> the site's neutrals, so slate-900 is the page background
//             (--bg), slate-800 a card (--surface), slate-700 a border
//             (--line) and slate-400 muted text (--muted);
//   hues   -> Google's palette, which is where the site's blue, green, red
//             and amber come from, with related Tailwind names grouped
//             (sky with blue, emerald and lime with green, violet and
//             indigo with purple, rose and fuchsia with pink, amber with
//             yellow);
//   fonts  -> sans is the site's body font, mono the site's code font.
(function () {
  if (typeof tailwind === 'undefined') return;
  var neutral = {
    50: '#f8f9fa', 100: '#f1f3f4', 200: '#e8eaed', 300: '#c9cdd4', 400: '#9aa0a6', 500: '#80868b',
    600: '#3b424e', 700: '#2b3039', 800: '#171a20', 900: '#0f1115', 950: '#0a0b0e'
  };
  var blue = {
    50: '#e8f0fe', 100: '#d2e3fc', 200: '#aecbfa', 300: '#8ab4f8', 400: '#669df6', 500: '#4285f4',
    600: '#1a73e8', 700: '#1967d2', 800: '#185abc', 900: '#174ea6', 950: '#0b2a5e'
  };
  var red = {
    50: '#fce8e6', 100: '#fad2cf', 200: '#f6aea9', 300: '#f28b82', 400: '#ee675c', 500: '#ea4335',
    600: '#d93025', 700: '#c5221f', 800: '#b31412', 900: '#a50e0e', 950: '#5c0707'
  };
  var green = {
    50: '#e6f4ea', 100: '#ceead6', 200: '#a8dab5', 300: '#81c995', 400: '#5bb974', 500: '#34a853',
    600: '#1e8e3e', 700: '#188038', 800: '#137333', 900: '#0d652d', 950: '#07381a'
  };
  var yellow = {
    50: '#fef7e0', 100: '#feefc3', 200: '#fde293', 300: '#fdd663', 400: '#fcc934', 500: '#fbbc04',
    600: '#f9ab00', 700: '#f29900', 800: '#ea8600', 900: '#e37400', 950: '#7a3e00'
  };
  var orange = {
    50: '#feefe3', 100: '#fedfc8', 200: '#fdc69c', 300: '#fcad70', 400: '#fa903e', 500: '#fa7b17',
    600: '#e8710a', 700: '#d56e0c', 800: '#c26401', 900: '#b06000', 950: '#5e3300'
  };
  var purple = {
    50: '#f3e8fd', 100: '#e9d2fd', 200: '#d7aefb', 300: '#c58af9', 400: '#af5cf7', 500: '#a142f4',
    600: '#9334e6', 700: '#8430ce', 800: '#7627bb', 900: '#681da8', 950: '#3a1060'
  };
  var pink = {
    50: '#fde7f3', 100: '#fdcfe8', 200: '#fba9d6', 300: '#ff8bcb', 400: '#ff63b8', 500: '#f439a0',
    600: '#e52592', 700: '#d01884', 800: '#b80672', 900: '#9c166b', 950: '#56083b'
  };
  var cyan = {
    50: '#e4f7fb', 100: '#cbf0f8', 200: '#a1e4f2', 300: '#78d9ec', 400: '#4ecde6', 500: '#24c1e0',
    600: '#12b5cb', 700: '#129eaf', 800: '#098591', 900: '#007b83', 950: '#00434a'
  };
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          slate: neutral, gray: neutral, zinc: neutral, neutral: neutral, stone: neutral,
          blue: blue, sky: blue,
          red: red,
          green: green, emerald: green, lime: green,
          yellow: yellow, amber: yellow,
          orange: orange,
          purple: purple, violet: purple, indigo: purple,
          pink: pink, rose: pink, fuchsia: pink,
          cyan: cyan, teal: cyan
        },
        fontFamily: {
          sans: ['Roboto', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
          display: ['Figtree', 'Roboto', 'system-ui', 'sans-serif'],
          mono: ['ui-monospace', '"SFMono-Regular"', 'Menlo', 'Consolas', 'monospace']
        }
      }
    }
  };
})();
