// ====== 简单示例题库（之后可以替换成你的 PDF 解析结果）======
let questions = [
  { cn: "司机不找零", en: "the driver doesn't give change" },
  { cn: "我为家人准备早餐", en: "i made breakfast for my family" },
  { cn: "她决定归还搅拌机", en: "she decided to return the blender" }
];

// 当前模式：click / drag / fill / input / listen
let mode = "click";
let index = 0;
let userAnswer = "";
let correctAnswer = "";
let stats = JSON.parse(localStorage.getItem("sentence_stats_v1") || "[]");

if (stats.length !== questions.length) {
  stats = questions.map(() => ({ total: 0, correct: 0 }));
}

// 初始化
const cnTextEl = document.getElementById("cnText");
const answerBoxEl = document.getElementById("answerBox");
const modeAreaEl = document.getElementById("modeArea");
const feedbackEl = document.getElementById("feedback");
const progressBarEl = document.getElementById("progressBar");
const statsEl = document.getElementById("stats");

document.getElementById("btnSubmit").onclick = checkAnswer;
document.getElementById("btnNext").onclick = nextQuestion;
document.getElementById("btnSpeak").onclick = speak;
document.querySelectorAll(".mode-tab").forEach(tab => {
  tab.onclick = () => {
    document.querySelectorAll(".mode-tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    mode = tab.getAttribute("data-mode");
    loadQuestion();
  };
});

loadQuestion();

// ====== 题目渲染 ======
function loadQuestion() {
  const q = questions[index];
  correctAnswer = q.en.trim();
  userAnswer = "";
  cnTextEl.textContent = q.cn;
  answerBoxEl.textContent = "";
  feedbackEl.textContent = "";

  if (mode === "click") renderClickMode();
  else if (mode === "drag") renderDragMode();
  else if (mode === "fill") renderFillMode();
  else if (mode === "input") renderInputMode(false);
  else if (mode === "listen") renderInputMode(true);

  updateProgress();
  renderStats();
}

function shuffle(arr) {
  return arr
    .map(v => ({ v, r: Math.random() }))
    .sort((a, b) => a.r - b.r)
    .map(x => x.v);
}

// ====== 模式：点击拼句 ======
function renderClickMode() {
  modeAreaEl.innerHTML = "";
  let words = shuffle(correctAnswer.split(" "));
  words.forEach(w => {
    const btn = document.createElement("button");
    btn.className = "word-btn";
    btn.textContent = w;
    btn.onclick = () => {
      if (btn.classList.contains("used")) return;
      btn.classList.add("used");
      userAnswer += (userAnswer ? " " : "") + w;
      answerBoxEl.textContent = userAnswer;
    };
    modeAreaEl.appendChild(btn);
  });
}

// ====== 模式：拖拽拼句（简单模拟版：点击切换 ↑ / ↓ 顺序）=====
function renderDragMode() {
  modeAreaEl.innerHTML = "";
  let words = shuffle(correctAnswer.split(" "));

  words.forEach((w, i) => {
    const btn = document.createElement("button");
    btn.className = "word-btn";
    btn.textContent = w;
    btn.dataset.index = i;
    btn.onclick = () => {
      // 简单实现：点击时把它放到最后
      modeAreaEl.appendChild(btn);
      collectDragAnswer();
    };
    modeAreaEl.appendChild(btn);
  });

  collectDragAnswer();
}

function collectDragAnswer() {
  const wordBtns = modeAreaEl.querySelectorAll(".word-btn");
  const arr = [];
  wordBtns.forEach(b => arr.push(b.textContent));
  userAnswer = arr.join(" ");
  answerBoxEl.textContent = userAnswer;
}

// ====== 模式：填空 ======
let fillHiddenWord = "";

function renderFillMode() {
  modeAreaEl.innerHTML = "";
  const words = correctAnswer.split(" ");
  const hideIndex = Math.floor(Math.random() * words.length);
  fillHiddenWord = words[hideIndex];

  const line = words
    .map((w, i) => (i === hideIndex ? "____" : w))
    .join(" ");

  const lineDiv = document.createElement("div");
  lineDiv.style.fontSize = "20px";
  lineDiv.style.marginBottom = "12px";
  lineDiv.textContent = line;

  const input = document.createElement("input");
  input.className = "answer-input";
  input.placeholder = "请输入缺失的单词";
  input.id = "fillInput";

  modeAreaEl.appendChild(lineDiv);
  modeAreaEl.appendChild(input);
}

// ====== 模式：整句输入 / 听写 ======
function renderInputMode(isListen) {
  modeAreaEl.innerHTML = "";
  const input = document.createElement("input");
  input.className = "answer-input";
  input.id = "manualInput";
  input.placeholder = isListen ? "听完后在这里输入整句英文" : "请输入完整英文句子";
  modeAreaEl.appendChild(input);

  if (isListen) {
    // 听写模式自动播放
    speak();
  }
}

// ====== 提交答案 ======
function checkAnswer() {
  if (mode === "fill") {
    const val = document.getElementById("fillInput").value.trim();
    userAnswer = val;
    const ok = normalize(val) === normalize(fillHiddenWord);
    recordResult(ok);
    feedbackEl.style.color = ok ? "green" : "red";
    feedbackEl.textContent = ok
      ? "✅ 正确！"
      : `❌ 不太对，正确答案是：${fillHiddenWord}`;
    return;
  }

  if (mode === "input" || mode === "listen") {
    userAnswer = (document.getElementById("manualInput").value || "").trim();
  }

  const ok = normalize(userAnswer) === normalize(correctAnswer);
  recordResult(ok);

  feedbackEl.style.color = ok ? "green" : "red";
  feedbackEl.textContent = ok
    ? "✅ 正确！"
    : `❌ 错误，正确答案是：${correctAnswer}`;
}

function normalize(str) {
  return str
    .toLowerCase()
    .replace(/[\.\,\!\?\;\:]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ====== 下一题 ======
function nextQuestion() {
  index++;
  if (index >= questions.length) index = 0;
  loadQuestion();
}

// ====== TTS 朗读 ======
function speak() {
  if (!("speechSynthesis" in window)) {
    alert("当前浏览器不支持语音朗读");
    return;
  }
  const u = new SpeechSynthesisUtterance(correctAnswer);
  u.lang = "en-US";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

// ====== 进度条 & 统计 ======
function updateProgress() {
  const pct = (index / questions.length) * 100;
  progressBarEl.style.width = pct + "%";
}

function recordResult(ok) {
  stats[index].total++;
  if (ok) stats[index].correct++;
  localStorage.setItem("sentence_stats_v1", JSON.stringify(stats));
  renderStats();
}

function renderStats() {
  const s = stats[index];
  const rate =
    s.total === 0 ? "-" : ((s.correct / s.total) * 100).toFixed(0) + "%";
  statsEl.textContent = `当前句子：已练习 ${s.total} 次，正确率 ${rate}`;
}
