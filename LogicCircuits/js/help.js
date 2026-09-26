// Help pages and the worked example stepper.
// ===================== HELP NAVIGATION =====================
function showMainMenu() {
  document.getElementById('help-menu').classList.remove('active');
  document.getElementById('help-gates').classList.remove('active');
  document.getElementById('main-menu').style.display = 'flex';
}
function showHelpMenu() {
  document.getElementById('main-menu').style.display = 'none';
  document.getElementById('help-gates').classList.remove('active');
  document.getElementById('help-connections').classList.remove('active');
  document.getElementById('help-expressions').classList.remove('active');
  document.getElementById('help-menu').classList.add('active');
}
function showHelpExpressions() {
  document.getElementById('help-menu').classList.remove('active');
  document.getElementById('help-expressions').classList.add('active');
  document.getElementById('help-expressions').scrollTop = 0;
  weInit();
}

// ===================== WORKED EXAMPLE STEPPER =====================

// SVG builder helpers
var NS = 'http://www.w3.org/2000/svg';
function svgEl(tag, attrs) {
  var el = document.createElementNS(NS, tag);
  Object.keys(attrs).forEach(function(k){ el.setAttribute(k, attrs[k]); });
  return el;
}
function svgGroup(id, children) {
  var g = svgEl('g', { id: id, class: 'we-el hidden' });
  children.forEach(function(c){ g.appendChild(c); });
  return g;
}
function svgBox(x, y, label) {
  var r = svgEl('rect', { x:x, y:y, width:32, height:22, rx:4, fill:'#1d2128', stroke:'#e8eaed', 'stroke-width':2 });
  var t = svgEl('text', { x:x+16, y:y+16, 'font-family':'Roboto, sans-serif', 'font-size':13, 'font-weight':'bold', fill:'#e8eaed', 'text-anchor':'middle', 'dominant-baseline':'middle' });
  t.textContent = label;
  return [r, t];
}
function svgLine(id, x1,y1,x2,y2) {
  var l = svgEl('line', { id:id, x1:x1, y1:y1, x2:x2, y2:y2, stroke:'#e8eaed', 'stroke-width':2, class:'we-el hidden' });
  return l;
}
function svgAND(id, x, y) {
  var p = svgEl('path', { d:'M'+x+' '+(y-18)+' L'+(x+24)+' '+(y-18)+' Q'+(x+48)+' '+(y-18)+' '+(x+48)+' '+y+' Q'+(x+48)+' '+(y+18)+' '+(x+24)+' '+(y+18)+' L'+x+' '+(y+18)+' Z', fill:'#1d2128', stroke:'#e8eaed', 'stroke-width':2.5 });
  return svgGroup(id, [p]);
}
function svgOR(id, x, y) {
  var p = svgEl('path', { d:'M'+x+' '+(y-18)+' Q'+(x+10)+' '+(y-18)+' '+(x+24)+' '+(y-18)+' Q'+(x+48)+' '+(y-18)+' '+(x+52)+' '+y+' Q'+(x+48)+' '+(y+18)+' '+(x+24)+' '+(y+18)+' Q'+(x+10)+' '+(y+18)+' '+x+' '+(y+18)+' Q'+(x+8)+' '+y+' '+x+' '+(y-18)+' Z', fill:'#1d2128', stroke:'#e8eaed', 'stroke-width':2.5 });
  return svgGroup(id, [p]);
}
function svgNOT(id, x, y) {
  var p = svgEl('path', { d:'M'+x+' '+(y-15)+' L'+(x+38)+' '+y+' L'+x+' '+(y+15)+' Z', fill:'#1d2128', stroke:'#e8eaed', 'stroke-width':2 });
  var c = svgEl('circle', { cx:x+42, cy:y, r:4, fill:'#1d2128', stroke:'#e8eaed', 'stroke-width':2 });
  return svgGroup(id, [p, c]);
}
function svgQBox(id, x, y) {
  var r = svgEl('rect', { x:x, y:y-12, width:36, height:24, rx:4, fill:'#1d2128', stroke:'#e8eaed', 'stroke-width':2 });
  var t = svgEl('text', { x:x+18, y:y+5, 'font-family':'Roboto, sans-serif', 'font-size':13, 'font-weight':'bold', fill:'#e8eaed', 'text-anchor':'middle' });
  t.textContent = 'Q';
  return svgGroup(id, [r, t]);
}

// Each example defines: title, expression HTML, svgBuilder fn, steps array
// Each step: { text, highlightSpanIds, highlightColor, showIds, newIds }
var WE_EXAMPLES = [
  {
    title: 'A AND B',
    exprHTML: 'Q = <span data-wid="a">A</span> <span data-wid="and">AND</span> <span data-wid="b">B</span>',
    buildSVG: function(svg) {
      svg.setAttribute('width','280'); svg.setAttribute('height','100'); svg.setAttribute('viewBox','0 0 280 100');
      // AND(100,50): in1=(100,40) in2=(100,60) out=(148,50)
      // boxA(4,18): out=(36,29)  boxB(4,60): out=(36,71)
      var boxA  = svgGroup('we-box-a', svgBox(4,18,'A'));
      var boxB  = svgGroup('we-box-b', svgBox(4,60,'B'));
      var wireA = svgLine('we-wire-a', 36,29, 100,40);
      var wireB = svgLine('we-wire-b', 36,71, 100,60);
      var gate  = svgAND('we-gate1',  100,50);
      var wireQ = svgLine('we-wire-q', 148,50, 220,50);
      var boxQ  = svgQBox('we-box-q', 220,50);
      [boxA,boxB,wireA,wireB,gate,wireQ,boxQ].forEach(function(e){ svg.appendChild(e); });
    },
    steps: [
      { text:'Read the expression: <strong>Q = A AND B</strong>. No brackets here: it\'s just two inputs going into one gate. Simple!', hi:['a','and','b'], hiColor:'#fdd663', show:[], newIds:[] },
      { text:'Place an AND gate on the canvas. Connect input <strong>A</strong> to its top input and <strong>B</strong> to its bottom input.', hi:['a','b'], hiColor:'#8ab4f8', show:['we-box-a','we-box-b','we-wire-a','we-wire-b','we-gate1'], newIds:['we-box-a','we-box-b','we-wire-a','we-wire-b','we-gate1'] },
      { text:'Connect the AND gate\'s output wire all the way to <strong>Q</strong>. Done! The AND gate outputs 1 only when both A and B are 1.', hi:['and'], hiColor:'#81c995', show:['we-box-a','we-box-b','we-wire-a','we-wire-b','we-gate1','we-wire-q','we-box-q'], newIds:['we-wire-q','we-box-q'] }
    ]
  },
  {
    title: '(A AND B) OR C',
    exprHTML: 'Q = <span data-wid="br1">(</span><span data-wid="a">A</span> <span data-wid="and">AND</span> <span data-wid="b">B</span><span data-wid="br2">)</span> <span data-wid="or">OR</span> <span data-wid="c">C</span>',
    buildSVG: function(svg) {
      svg.setAttribute('width','330'); svg.setAttribute('height','150'); svg.setAttribute('viewBox','0 0 330 150');
      // AND(95,50): in1=(95,40) in2=(95,60) out=(143,50)
      // OR(185,78): in1=(193,64) in2=(193,92) out=(237,78)
      // boxA(4,18): out=(36,29)  boxB(4,58): out=(36,69)  boxC(4,106): out=(36,117)
      var boxA  = svgGroup('we-box-a', svgBox(4,18,'A'));
      var boxB  = svgGroup('we-box-b', svgBox(4,58,'B'));
      var boxC  = svgGroup('we-box-c', svgBox(4,106,'C'));
      var wA    = svgLine('we-wire-a',  36,29,  95,40);
      var wB    = svgLine('we-wire-b',  36,69,  95,60);
      var gAND  = svgAND('we-gate1',    95,50);
      var wAO   = svgLine('we-wire-ao', 143,50, 193,64);
      var wC    = svgLine('we-wire-c',  36,117, 193,92);
      var gOR   = svgOR('we-gate2',     185,78);
      var wQ    = svgLine('we-wire-q',  237,78, 284,78);
      var boxQ  = svgQBox('we-box-q',   284,78);
      [boxA,boxB,boxC,wA,wB,gAND,wAO,wC,gOR,wQ,boxQ].forEach(function(e){ svg.appendChild(e); });
    },
    steps: [
      { text:'Read the expression: <strong>Q = (A AND B) OR C</strong>. Spot the brackets around <em>A AND B</em>: that tells us to build the AND gate first.', hi:['br1','a','and','b','br2'], hiColor:'#fdd663', show:[], newIds:[] },
      { text:'Place an AND gate. Connect <strong>A</strong> to its top input and <strong>B</strong> to its bottom input. This handles the part inside the brackets.', hi:['a','b'], hiColor:'#8ab4f8', show:['we-box-a','we-box-b','we-wire-a','we-wire-b','we-gate1'], newIds:['we-box-a','we-box-b','we-wire-a','we-wire-b','we-gate1'] },
      { text:'Now place an OR gate. Connect the AND gate\'s output wire into the OR gate\'s top input.', hi:['or'], hiColor:'#c58af9', show:['we-box-a','we-box-b','we-wire-a','we-wire-b','we-gate1','we-wire-ao','we-gate2'], newIds:['we-wire-ao','we-gate2'] },
      { text:'Connect input <strong>C</strong> into the OR gate\'s bottom input.', hi:['c'], hiColor:'#81c995', show:['we-box-a','we-box-b','we-box-c','we-wire-a','we-wire-b','we-wire-c','we-gate1','we-wire-ao','we-gate2'], newIds:['we-box-c','we-wire-c'] },
      { text:'Connect the OR gate\'s output to <strong>Q</strong>. Circuit complete! The signal flows from A and B through the AND gate, then together with C through the OR gate to reach Q.', hi:['or','c'], hiColor:'#81c995', show:['we-box-a','we-box-b','we-box-c','we-wire-a','we-wire-b','we-wire-c','we-gate1','we-wire-ao','we-gate2','we-wire-q','we-box-q'], newIds:['we-wire-q','we-box-q'] }
    ]
  },
  {
    title: 'NOT A',
    exprHTML: 'Q = <span data-wid="not">NOT</span> <span data-wid="a">A</span>',
    buildSVG: function(svg) {
      svg.setAttribute('width','260'); svg.setAttribute('height','80'); svg.setAttribute('viewBox','0 0 260 80');
      // NOT(90,40): in=(90,40) out=(136,40)
      // boxA(4,29): out=(36,40)  qbox(155,40): in=(155,40)
      var boxA  = svgGroup('we-box-a', svgBox(4,29,'A'));
      var wA    = svgLine('we-wire-a', 36,40, 90,40);
      var gNOT  = svgNOT('we-gate1',  90,40);
      var wQ    = svgLine('we-wire-q', 136,40, 155,40);
      var boxQ  = svgQBox('we-box-q', 155,40);
      [boxA,wA,gNOT,wQ,boxQ].forEach(function(e){ svg.appendChild(e); });
    },
    steps: [
      { text:'Read the expression: <strong>Q = NOT A</strong>. Just one gate, one input. NOT flips the signal: if A is 1, Q is 0, and if A is 0, Q is 1.', hi:['not','a'], hiColor:'#fdd663', show:[], newIds:[] },
      { text:'Place a NOT gate on the canvas. Connect input <strong>A</strong> to its single input. The little circle at the output is the symbol for "inverted".', hi:['a','not'], hiColor:'#f28b82', show:['we-box-a','we-wire-a','we-gate1'], newIds:['we-box-a','we-wire-a','we-gate1'] },
      { text:'Connect the NOT gate\'s output to <strong>Q</strong>. That\'s it: one gate, two wires, done!', hi:['not'], hiColor:'#81c995', show:['we-box-a','we-wire-a','we-gate1','we-wire-q','we-box-q'], newIds:['we-wire-q','we-box-q'] }
    ]
  },
  {
    title: 'A OR (NOT B)',
    exprHTML: 'Q = <span data-wid="a">A</span> <span data-wid="or">OR</span> <span data-wid="br1">(</span><span data-wid="not">NOT</span> <span data-wid="b">B</span><span data-wid="br2">)</span>',
    buildSVG: function(svg) {
      svg.setAttribute('width','320'); svg.setAttribute('height','120'); svg.setAttribute('viewBox','0 0 320 120');
      // NOT(85,84): in=(85,84) out=(131,84)
      // OR(168,50): in1=(176,36) in2=(176,64) out=(220,50)
      // boxA(4,14): out=(36,25)  boxB(4,73): out=(36,84)
      // qbox(238,50): in=(238,50)
      var boxA  = svgGroup('we-box-a', svgBox(4,14,'A'));
      var boxB  = svgGroup('we-box-b', svgBox(4,73,'B'));
      var wA    = svgLine('we-wire-a',  36,25,  176,36);
      var wB    = svgLine('we-wire-b',  36,84,  85,84);
      var gNOT  = svgNOT('we-gate1',   85,84);
      var wNO   = svgLine('we-wire-no', 131,84, 176,64);
      var gOR   = svgOR('we-gate2',    168,50);
      var wQ    = svgLine('we-wire-q',  220,50, 238,50);
      var boxQ  = svgQBox('we-box-q',  238,50);
      [boxA,boxB,wA,wB,gNOT,wNO,gOR,wQ,boxQ].forEach(function(e){ svg.appendChild(e); });
    },
    steps: [
      { text:'Read the expression: <strong>Q = A OR (NOT B)</strong>. The brackets are around <em>NOT B</em>, so build the NOT gate first before the OR gate.', hi:['br1','not','b','br2'], hiColor:'#fdd663', show:[], newIds:[] },
      { text:'Place a NOT gate. Connect input <strong>B</strong> to it. This creates the <em>NOT B</em> part: the inverted version of B.', hi:['not','b'], hiColor:'#f28b82', show:['we-box-b','we-wire-b','we-gate1'], newIds:['we-box-b','we-wire-b','we-gate1'] },
      { text:'Now place an OR gate. Connect the NOT gate\'s output into the OR gate\'s bottom input.', hi:['or'], hiColor:'#c58af9', show:['we-box-b','we-wire-b','we-gate1','we-wire-no','we-gate2'], newIds:['we-wire-no','we-gate2'] },
      { text:'Connect input <strong>A</strong> into the OR gate\'s top input.', hi:['a'], hiColor:'#8ab4f8', show:['we-box-a','we-box-b','we-wire-a','we-wire-b','we-gate1','we-wire-no','we-gate2'], newIds:['we-box-a','we-wire-a'] },
      { text:'Connect the OR gate\'s output to <strong>Q</strong>. Complete! The OR gate outputs 1 if A is 1, OR if B is 0 (because NOT B flips it).', hi:['or'], hiColor:'#81c995', show:['we-box-a','we-box-b','we-wire-a','we-wire-b','we-gate1','we-wire-no','we-gate2','we-wire-q','we-box-q'], newIds:['we-wire-q','we-box-q'] }
    ]
  },
  {
    title: '(A OR B) AND (NOT C)',
    exprHTML: 'Q = <span data-wid="br1">(</span><span data-wid="a">A</span> <span data-wid="or">OR</span> <span data-wid="b">B</span><span data-wid="br2">)</span> <span data-wid="and">AND</span> <span data-wid="br3">(</span><span data-wid="not">NOT</span> <span data-wid="c">C</span><span data-wid="br4">)</span>',
    buildSVG: function(svg) {
      svg.setAttribute('width','370'); svg.setAttribute('height','160'); svg.setAttribute('viewBox','0 0 370 160');
      // OR(82,38):  in1=(90,24) in2=(90,52) out=(134,38)
      // NOT(82,108): in=(82,108) out=(128,108)
      // AND(205,73): in1=(205,63) in2=(205,83) out=(253,73)
      // boxA(4,8):  out=(36,19)  boxB(4,52): out=(36,63)  boxC(4,97): out=(36,108)
      // qbox(270,73): in=(270,73)
      var boxA  = svgGroup('we-box-a', svgBox(4,8,'A'));
      var boxB  = svgGroup('we-box-b', svgBox(4,52,'B'));
      var boxC  = svgGroup('we-box-c', svgBox(4,97,'C'));
      var wA    = svgLine('we-wire-a',  36,19,  90,24);
      var wB    = svgLine('we-wire-b',  36,63,  90,52);
      var gOR   = svgOR('we-gate1',    82,38);
      var wOA   = svgLine('we-wire-oa', 134,38, 205,63);
      var wC    = svgLine('we-wire-c',  36,108, 82,108);
      var gNOT  = svgNOT('we-gate2',   82,108);
      var wNA   = svgLine('we-wire-na', 128,108, 205,83);
      var gAND  = svgAND('we-gate3',   205,73);
      var wQ    = svgLine('we-wire-q',  253,73, 270,73);
      var boxQ  = svgQBox('we-box-q',  270,73);
      [boxA,boxB,boxC,wA,wB,gOR,wOA,wC,gNOT,wNA,gAND,wQ,boxQ].forEach(function(e){ svg.appendChild(e); });
    },
    steps: [
      { text:'Read the expression: <strong>Q = (A OR B) AND (NOT C)</strong>. There are two bracketed parts: <em>(A OR B)</em> and <em>(NOT C)</em>. Build both of those before the AND gate.', hi:['br1','a','or','b','br2','br3','not','c','br4'], hiColor:'#fdd663', show:[], newIds:[] },
      { text:'Start with the first bracket: <em>(A OR B)</em>. Place an OR gate and connect <strong>A</strong> and <strong>B</strong> to its inputs.', hi:['a','or','b'], hiColor:'#c58af9', show:['we-box-a','we-box-b','we-wire-a','we-wire-b','we-gate1'], newIds:['we-box-a','we-box-b','we-wire-a','we-wire-b','we-gate1'] },
      { text:'Now build the second bracket: <em>(NOT C)</em>. Place a NOT gate and connect <strong>C</strong> to it.', hi:['not','c'], hiColor:'#f28b82', show:['we-box-a','we-box-b','we-box-c','we-wire-a','we-wire-b','we-gate1','we-wire-c','we-gate2'], newIds:['we-box-c','we-wire-c','we-gate2'] },
      { text:'Now place an AND gate. Connect the OR gate\'s output into its top input, and the NOT gate\'s output into its bottom input.', hi:['and'], hiColor:'#8ab4f8', show:['we-box-a','we-box-b','we-box-c','we-wire-a','we-wire-b','we-gate1','we-wire-c','we-gate2','we-wire-oa','we-wire-na','we-gate3'], newIds:['we-wire-oa','we-wire-na','we-gate3'] },
      { text:'Connect the AND gate\'s output to <strong>Q</strong>. Done! Both brackets had to be built first before they could feed into the AND gate.', hi:['and'], hiColor:'#81c995', show:['we-box-a','we-box-b','we-box-c','we-wire-a','we-wire-b','we-gate1','we-wire-c','we-gate2','we-wire-oa','we-wire-na','we-gate3','we-wire-q','we-box-q'], newIds:['we-wire-q','we-box-q'] }
    ]
  },
  {
    title: 'NOT (A AND B)',
    exprHTML: 'Q = <span data-wid="not">NOT</span> <span data-wid="br1">(</span><span data-wid="a">A</span> <span data-wid="and">AND</span> <span data-wid="b">B</span><span data-wid="br2">)</span>',
    buildSVG: function(svg) {
      svg.setAttribute('width','310'); svg.setAttribute('height','100'); svg.setAttribute('viewBox','0 0 310 100');
      // AND(88,50): in1=(88,40) in2=(88,60) out=(136,50)
      // NOT(165,50): in=(165,50) out=(211,50)
      // boxA(4,18): out=(36,29)  boxB(4,58): out=(36,69)
      // qbox(228,50): in=(228,50)
      var boxA  = svgGroup('we-box-a', svgBox(4,18,'A'));
      var boxB  = svgGroup('we-box-b', svgBox(4,58,'B'));
      var wA    = svgLine('we-wire-a',  36,29, 88,40);
      var wB    = svgLine('we-wire-b',  36,69, 88,60);
      var gAND  = svgAND('we-gate1',   88,50);
      var wAN   = svgLine('we-wire-an', 136,50, 165,50);
      var gNOT  = svgNOT('we-gate2',   165,50);
      var wQ    = svgLine('we-wire-q',  211,50, 228,50);
      var boxQ  = svgQBox('we-box-q',  228,50);
      [boxA,boxB,wA,wB,gAND,wAN,gNOT,wQ,boxQ].forEach(function(e){ svg.appendChild(e); });
    },
    steps: [
      { text:'Read the expression: <strong>Q = NOT (A AND B)</strong>. The brackets come first: build the AND gate before applying the NOT.', hi:['br1','a','and','b','br2'], hiColor:'#fdd663', show:[], newIds:[] },
      { text:'Place an AND gate. Connect <strong>A</strong> and <strong>B</strong> to its inputs. This builds the <em>(A AND B)</em> part inside the brackets.', hi:['a','and','b'], hiColor:'#8ab4f8', show:['we-box-a','we-box-b','we-wire-a','we-wire-b','we-gate1'], newIds:['we-box-a','we-box-b','we-wire-a','we-wire-b','we-gate1'] },
      { text:'Now place a NOT gate. Connect the AND gate\'s output wire into the NOT gate\'s input. The NOT gate will flip whatever the AND gate outputs.', hi:['not'], hiColor:'#f28b82', show:['we-box-a','we-box-b','we-wire-a','we-wire-b','we-gate1','we-wire-an','we-gate2'], newIds:['we-wire-an','we-gate2'] },
      { text:'Connect the NOT gate\'s output to <strong>Q</strong>. Complete! This circuit outputs 0 when both A and B are 1, and 1 in all other cases.', hi:['not'], hiColor:'#81c995', show:['we-box-a','we-box-b','we-wire-a','we-wire-b','we-gate1','we-wire-an','we-gate2','we-wire-q','we-box-q'], newIds:['we-wire-q','we-box-q'] }
    ]
  }
];

var weCurrentExample = 0;
var weCurrentStep = 0;

function weInit() {
  weCurrentExample = 0;
  weCurrentStep = 0;
  weBuildExampleButtons();
  weLoadExample(0);
}

function weBuildExampleButtons() {
  var container = document.getElementById('we-example-btns');
  if (!container) return;
  container.innerHTML = '';
  WE_EXAMPLES.forEach(function(ex, i) {
    var btn = document.createElement('button');
    btn.textContent = ex.title;
    btn.style.cssText = 'font-family:Roboto,sans-serif;font-size:0.82rem;font-weight:600;padding:7px 14px;border-radius:20px;cursor:pointer;transition:all 0.15s;border:2px solid #3b424e;background:#1d2128;color:#c9cdd4;';
    btn.onclick = function() { weLoadExample(i); };
    btn.id = 'we-ex-btn-' + i;
    container.appendChild(btn);
  });
}

function weLoadExample(idx) {
  weCurrentExample = idx;
  weCurrentStep = 0;

  // Update button styles
  WE_EXAMPLES.forEach(function(_, i) {
    var b = document.getElementById('we-ex-btn-' + i);
    if (!b) return;
    if (i === idx) {
      b.style.background = '#8ab4f8'; b.style.color = '#0b1a33'; b.style.borderColor = '#8ab4f8';
    } else {
      b.style.background = '#1d2128'; b.style.color = '#c9cdd4'; b.style.borderColor = '#3b424e';
    }
  });

  // Build expression HTML
  var exprEl = document.getElementById('we-expr');
  exprEl.innerHTML = WE_EXAMPLES[idx].exprHTML;

  // Build SVG
  var svg = document.getElementById('we-svg');
  svg.innerHTML = '';
  WE_EXAMPLES[idx].buildSVG(svg);

  weRenderStep();
}

function weStep(dir) {
  var ex = WE_EXAMPLES[weCurrentExample];
  weCurrentStep = Math.max(0, Math.min(ex.steps.length - 1, weCurrentStep + dir));
  weRenderStep();
}

function weRenderStep() {
  var ex = WE_EXAMPLES[weCurrentExample];
  var step = ex.steps[weCurrentStep];
  var total = ex.steps.length;

  // Step label + text
  document.getElementById('we-step-num').textContent = 'Step ' + (weCurrentStep+1) + ' of ' + total;
  document.getElementById('we-step-text').innerHTML = step.text;

  // Highlight expression spans
  var exprEl = document.getElementById('we-expr');
  exprEl.querySelectorAll('[data-wid]').forEach(function(el) {
    el.style.background = '';
    el.style.color = '#e8eaed';
    el.style.borderRadius = '';
    el.style.padding = '';
  });
  (step.hi || []).forEach(function(wid) {
    var el = exprEl.querySelector('[data-wid="' + wid + '"]');
    if (!el) return;
    el.style.background = step.hiColor;
    el.style.color = '#1d2128';
    el.style.borderRadius = '4px';
    el.style.padding = '2px 5px';
  });

  // Show/hide SVG elements
  var svg = document.getElementById('we-svg');
  svg.querySelectorAll('.we-el').forEach(function(el) {
    el.classList.remove('highlight-new');
    if (step.show.indexOf(el.id) !== -1) {
      el.classList.remove('hidden');
      el.classList.add('visible');
    } else {
      el.classList.add('hidden');
      el.classList.remove('visible');
    }
  });
  // Highlight newly added elements
  (step.newIds || []).forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.classList.add('highlight-new');
  });

  // Dots
  var dotsEl = document.getElementById('we-dots');
  dotsEl.innerHTML = '';
  ex.steps.forEach(function(_, i) {
    var d = document.createElement('div');
    d.style.cssText = 'width:10px;height:10px;border-radius:50%;background:' + (i === weCurrentStep ? '#8ab4f8' : '#3b424e') + ';transition:background 0.2s;';
    dotsEl.appendChild(d);
  });

  // Buttons
  document.getElementById('we-prev').disabled = weCurrentStep === 0;
  var isLast = weCurrentStep === total - 1;
  var nextBtn = document.getElementById('we-next');
  nextBtn.textContent = isLast ? 'Done' : 'Next';
  nextBtn.classList.toggle('is-done', isLast);
}
function showHelpConnections() {
  document.getElementById('help-menu').classList.remove('active');
  document.getElementById('help-gates').classList.remove('active');
  document.getElementById('help-connections').classList.add('active');
  document.getElementById('help-connections').scrollTop = 0;
}
function showHelpGates() {
  document.getElementById('help-menu').classList.remove('active');
  document.getElementById('help-gates').classList.add('active');
  document.getElementById('help-gates').scrollTop = 0;
}
