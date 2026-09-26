// The main menu and starting a quiz.
// ===================== INIT =====================
function goHome() {
  document.getElementById('app-header').style.display = 'none';
  document.getElementById('app-main').style.display = 'none';
  document.getElementById('main-menu').style.display = 'flex';
  clearCircuit();
  state.score = 0;
  state.streak = 0;
  state.numInputs = 2;
}

function startQuiz() {
  document.getElementById('main-menu').style.display = 'none';
  document.getElementById('app-header').style.display = '';
  document.getElementById('app-main').style.display = '';
  init();
}

let initedOnce = false;

function init() {
  buildPalette();
  buildIONodes();
  loadQuestion();
  setZoom(1);

  if (!initedOnce) {
    initedOnce = true;
    initZoomControl();

    // Redraw wires on window resize
    window.addEventListener('resize', () => {
      buildIONodes();
      drawWires();
    });
  }
}
