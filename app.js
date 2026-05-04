// Calcul — entiers relatifs (opérandes) → résultat réel arrondi au dixième
const $ = (id) => document.getElementById(id);

const state = {
  level: 1,
  a: 0,
  b: 0,
  op: '+',
  exact: 0,
  result: 0, // arrondi au dixième
  score: 0,
  streak: 0,
  total: 0,
};

function rangeForLevel(level){
  if(level === 1) return [-10, 10];
  if(level === 2) return [-20, 20];
  return [-100, 100];
}

function randInt(minV, maxV){
  return Math.floor(Math.random() * (maxV - minV + 1)) + minV;
}

function pickOp(){
  const ops = ['+','-','*','/'];
  return ops[Math.floor(Math.random()*ops.length)];
}

function compute(a,b,op){
  if(op === '+') return a + b;
  if(op === '-') return a - b;
  if(op === '*') return a * b;
  return a / b;
}

function opSymbol(op){
  if(op === '*') return '×';
  if(op === '/') return '÷';
  return op;
}

function round1(x){
  return Math.round(x * 10) / 10; // au dixième
}

function fmt1(x){
  const s = x.toFixed(1);
  return s.replace(/\.0$/,'');
}

function loadStats(){
  try{
    const raw = localStorage.getItem('calcul_entiers_auto_stats');
    if(!raw) return;
    const obj = JSON.parse(raw);
    state.score = obj.score ?? 0;
    state.streak = obj.streak ?? 0;
    state.total = obj.total ?? 0;
  }catch(e){}
}

function saveStats(){
  localStorage.setItem('calcul_entiers_auto_stats', JSON.stringify({
    score: state.score,
    streak: state.streak,
    total: state.total,
  }));
}

function renderStats(){
  $('score').textContent = state.score;
  $('streak').textContent = state.streak;
  $('total').textContent = state.total;
}

function setPill(){
  $('pill').textContent = `Niveau ${state.level}`;
}

function currentLevel(){
  const r = document.querySelector('input[name="level"]:checked');
  return r ? parseInt(r.value,10) : 1;
}

function newProblem(opts = {silent:false}){
  state.level = currentLevel();
  setPill();

  const [minV, maxV] = rangeForLevel(state.level);

  state.op = pickOp();
  state.a = randInt(minV, maxV);
  state.b = randInt(minV, maxV);

  if(state.op === '/'){
    while(state.b === 0){
      state.b = randInt(minV, maxV);
    }
  }

  state.exact = compute(state.a, state.b, state.op);
  state.result = round1(state.exact);

  $('expr').textContent = `${state.a} ${opSymbol(state.op)} ${state.b} = ?`;
  $('hint').textContent = 'Résultat arrondi au dixième (1 décimale).';
  $('answer').value = '';
  $('answer').focus();

  if(!opts.silent){
    $('result').innerHTML = '<span class="muted">Nouveau calcul ✅</span>';
  }
}

function toggleSign(){
  const el = $('answer');
  let v = el.value.trim();
  if(!v){
    el.value = '-';
    el.focus();
    return;
  }
  if(v.startsWith('-')) v = v.slice(1);
  else v = '-' + v;
  el.value = v;
  el.focus();
  try { el.setSelectionRange(el.value.length, el.value.length); } catch(e) {}
}

function sanitizeInput(){
  const el = $('answer');
  let v = el.value;
  v = v.replace(/[^0-9.,-]/g, '');
  v = v.replace(/(?!^)-/g, '');
  v = v.replace(/^-{2,}/g, '-');
  el.value = v;
}

function showFeedback(ok, userRounded){
  if(ok){
    $('result').innerHTML = `<div><span class="ok">✅ Bon</span><div class="small">Résultat : ${fmt1(state.result)}</div></div>`;
  } else {
    $('result').innerHTML = `<div><span class="bad">❌ Faux</span><div class="small">Ta réponse (arrondie) : ${fmt1(userRounded)} • Correct : ${fmt1(state.result)}</div></div>`;
  }
}

function check(){
  const raw = $('answer').value.trim();
  if(!raw || raw === '-'){
    $('result').innerHTML = '<span class="bad">❌ Entre une réponse.</span>';
    return;
  }
  const user = parseFloat(raw.replace(',', '.'));
  if(Number.isNaN(user)){
    $('result').innerHTML = '<span class="bad">❌ Nombre invalide.</span>';
    return;
  }

  state.total += 1;

  const userRounded = round1(user);
  const ok = (userRounded === state.result);

  if(ok){
    state.score += 1;
    state.streak += 1;
  } else {
    state.streak = 0;
  }

  saveStats();
  renderStats();

  // Affiche le feedback brièvement, puis propose automatiquement un nouveau calcul
  showFeedback(ok, userRounded);

  setTimeout(() => {
    newProblem({silent:true});
    $('result').innerHTML = '<span class="muted">Nouveau calcul ✅</span>';
  }, 900);
}

function resetStats(){
  state.score = 0;
  state.streak = 0;
  state.total = 0;
  saveStats();
  renderStats();
  $('result').innerHTML = '<span class="muted">Score réinitialisé.</span>';
}

// Init
loadStats();
renderStats();
setPill();

// Proposer un premier calcul dès l'ouverture
window.addEventListener('load', () => {
  newProblem({silent:true});
  $('result').innerHTML = '<span class="muted">Tape ta réponse puis “Vérifier”.</span>';
});

// Events
$('newBtn').addEventListener('click', () => newProblem());
$('checkBtn').addEventListener('click', check);
$('resetBtn').addEventListener('click', resetStats);
$('signBtn').addEventListener('click', toggleSign);
$('answer').addEventListener('input', sanitizeInput);
$('answer').addEventListener('keydown', (e)=>{ if(e.key === 'Enter') check(); });

document.querySelectorAll('input[name="level"]').forEach(r => {
  r.addEventListener('change', () => {
    state.level = currentLevel();
    setPill();
    // On génère immédiatement un nouveau calcul quand on change de niveau
    newProblem({silent:true});
    $('result').innerHTML = '<span class="muted">Niveau changé : nouveau calcul ✅</span>';
  });
});
