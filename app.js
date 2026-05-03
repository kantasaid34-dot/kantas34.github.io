// Calcul Réels — logique du jeu (100% offline)
const $ = (id) => document.getElementById(id);

const state = {
  level: 1,
  a: 0,
  b: 0,
  op: '+',
  result: 0,
  score: 0,
  streak: 0,
  total: 0,
};

function stepForLevel(level){
  if(level === 3) return 0.01;
  return 0.1;
}

function rangeForLevel(level){
  if(level === 1) return [-10, 10];
  if(level === 2) return [-20, 20];
  return [-100, 100];
}

function randFloatStep(minV, maxV, step){
  const imin = Math.round(minV / step);
  const imax = Math.round(maxV / step);
  const r = Math.floor(Math.random() * (imax - imin + 1)) + imin;
  return r * step;
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

function fmt(v, decimals=2){
  const s = v.toFixed(decimals);
  return s.replace(/\.?0+$/,'');
}

function opSymbol(op){
  if(op === '*') return '×';
  if(op === '/') return '÷';
  return op;
}

function nearlyEqual(user, correct){
  const absTol = 0.01;
  const relTol = 0.005; // 0.5%
  const diff = Math.abs(user - correct);
  const scale = Math.max(1, Math.abs(correct));
  return diff <= Math.max(absTol, relTol * scale);
}

function loadStats(){
  try{
    const raw = localStorage.getItem('calculreels_stats');
    if(!raw) return;
    const obj = JSON.parse(raw);
    state.score = obj.score ?? 0;
    state.streak = obj.streak ?? 0;
    state.total = obj.total ?? 0;
  }catch(e){}
}

function saveStats(){
  localStorage.setItem('calculreels_stats', JSON.stringify({
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

function newProblem(){
  state.level = currentLevel();
  setPill();

  const [minV, maxV] = rangeForLevel(state.level);
  const step = stepForLevel(state.level);

  state.op = pickOp();
  state.a = randFloatStep(minV, maxV, step);
  state.b = randFloatStep(minV, maxV, step);

  if(state.op === '/'){
    while(Math.abs(state.b) < step){
      state.b = randFloatStep(minV, maxV, step);
    }
  }

  state.result = compute(state.a, state.b, state.op);

  const dec = (state.level === 3) ? 2 : 1;
  $('expr').textContent = `${fmt(state.a, dec)} ${opSymbol(state.op)} ${fmt(state.b, dec)} = ?`;
  $('hint').textContent = 'Saisis une réponse puis “Vérifier”.';
  $('answer').value = '';
  $('answer').focus();
  $('result').innerHTML = '<span class="muted">Nouveau calcul généré ✅</span>';
}

function toggleSign(){
  const el = $('answer');
  let v = el.value.trim();
  if(!v){
    el.value = '-';
    el.focus();
    return;
  }
  // Si déjà négatif, on enlève le '-'
  if(v.startsWith('-')){
    v = v.slice(1);
  } else {
    v = '-' + v;
  }
  el.value = v;
  el.focus();
  // Place le curseur en fin
  try { el.setSelectionRange(el.value.length, el.value.length); } catch(e) {}
}

function sanitizeInput(){
  // Autorise uniquement: chiffres, un seul signe '-' au début, '.' ou ','
  const el = $('answer');
  let v = el.value;
  // supprime caractères interdits
  v = v.replace(/[^0-9.,-]/g, '');
  // ne garder qu'un '-' et uniquement au début
  v = v.replace(/(?!^)-/g, '');
  // si plusieurs '-' en début -> un seul
  v = v.replace(/^-{2,}/g, '-');
  el.value = v;
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

  const ok = nearlyEqual(user, state.result);
  const correct = fmt(state.result, 4);
  const userFmt = fmt(user, 4);

  if(ok){
    state.score += 1;
    state.streak += 1;
    $('result').innerHTML = `<div><span class="ok">✅ Bon</span><div class="small">Résultat : ${correct}</div></div>`;
  } else {
    state.streak = 0;
    $('result').innerHTML = `<div><span class="bad">❌ Faux</span><div class="small">Ta réponse : ${userFmt} • Correct : ${correct}</div></div>`;
  }

  saveStats();
  renderStats();
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

// Events
$('newBtn').addEventListener('click', newProblem);
$('checkBtn').addEventListener('click', check);
$('resetBtn').addEventListener('click', resetStats);
$('signBtn').addEventListener('click', toggleSign);
$('answer').addEventListener('input', sanitizeInput);
$('answer').addEventListener('keydown', (e)=>{
  if(e.key === 'Enter') check();
  // Permet de taper '-' même si clavier ne l'affiche pas : certains claviers le génèrent via touche dédiée
});

document.querySelectorAll('input[name="level"]').forEach(r => {
  r.addEventListener('change', () => {
    state.level = currentLevel();
    setPill();
    $('hint').textContent = 'Appuie sur “Nouveau calcul”.';
  });
});
