// app/page.jsx
"use client";

import { useEffect, useMemo, useState } from "react";

const MODES = [
  { id: "click", label: "点击拼句" },
  { id: "drag", label: "拖拽拼句（占位）" },
  { id: "gap", label: "填空" },
  { id: "input", label: "整句输入" },
  { id: "dictation", label: "听写" }
];

const SENTENCES = [
  {
    id: "driver-no-change",
    cn: "司机不找零。",
    en: "The driver doesn't give change.",
    words: ["The", "driver", "doesn't", "give", "change", "."]
  },
  {
    id: "busy-morning",
    cn: "今天早上我很忙。",
    en: "I was very busy this morning.",
    words: ["I", "was", "very", "busy", "this", "morning", "."]
  }
];

const STORAGE_KEY = "sentence-practice-stats-v1";

function normalize(str) {
  return str
    .toLowerCase()
    .replace(/[^\w\s']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export default function HomePage() {
  const [mode, setMode] = useState("click");
  const [index, setIndex] = useState(0);

  const [clickWords, setClickWords] = useState([]);
  const [gapAnswer, setGapAnswer] = useState("");
  const [inputAnswer, setInputAnswer] = useState("");
  const [message, setMessage] = useState("");

  const [stats, setStats] = useState({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setStats(JSON.parse(raw));
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  }, [stats]);

  const current = SENTENCES[index];

  const shuffledWords = useMemo(() => {
    const arr = [...current.words];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [current.id]);

  useEffect(() => {
    setClickWords([]);
    setGapAnswer("");
    setInputAnswer("");
    setMessage("");
  }, [mode, current.id]);

  const sentenceStats = stats[current.id] ?? { times: 0, correct: 0 };
  const accuracy =
    sentenceStats.times === 0
      ? "-"
      : Math.round((sentenceStats.correct / sentenceStats.times) * 100) + "%";

  function updateStats(ok) {
    setStats(prev => {
      const old = prev[current.id] ?? { times: 0, correct: 0 };
      return {
        ...prev,
        [current.id]: {
          times: old.times + 1,
          correct: old.correct + (ok ? 1 : 0)
        }
      };
    });
  }

  function handleClickWord(word) {
    setClickWords(prev => [...prev, word]);
  }

  function handleSubmit() {
    let ok = false;

    if (mode === "click" || mode === "drag") {
      const user = clickWords.join(" ");
      ok = normalize(user) === normalize(current.en);
    } else if (mode === "gap") {
      const answer = normalize(gapAnswer);
      const correctGap = normalize(
        current.words[current.words.length - 2] || ""
      );
      ok = answer === correctGap;
    } else if (mode === "input" || mode === "dictation") {
      ok = normalize(inputAnswer) === normalize(current.en);
    }

    updateStats(ok);
    setMessage(ok ? "✅ 正确！" : "❌ 再试一次～");
  }

  function handleNext() {
    setIndex(i => (i + 1) % SENTENCES.length);
  }

  function handleSpeak() {
    if (typeof window === "undefined") return;
    const u = new SpeechSynthesisUtterance(current.en);
    u.lang = "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  function renderBody() {
    if (mode === "click" || mode === "drag") {
      return (
        <>
          <div className="section-title">请点击单词拼出完整英文句子：</div>
          <div className="tokens-row">
            {shuffledWords.map((w, i) => (
              <button
                key={i}
                className="token"
                onClick={() => handleClickWord(w)}
              >
                {w}
              </button>
            ))}
          </div>
          <div className="answer-area">
            {clickWords.length === 0 ? (
              <span className="placeholder">点击上面的单词开始拼句…</span>
            ) : (
              clickWords.join(" ")
            )}
          </div>
        </>
      );
    }

    if (mode === "gap") {
      const words = current.words;
      const before = words.slice(0, -2).join(" ");
      const after = words[words.length - 1] || "";
      return (
        <>
          <div className="section-title">请填写缺失的单词：</div>
          <div className="gap-sentence">
            {before}{" "}
            <input
              className="input"
              value={gapAnswer}
              onChange={e => setGapAnswer(e.target.value)}
            />{" "}
            {after}
          </div>
        </>
      );
    }

    return (
      <>
        <div className="section-title">
          {mode === "input" ? "请完整输入英文句子：" : "听写：点击朗读后输入你听到的句子"}
        </div>
        <textarea
          className="textarea"
          rows={2}
          value={inputAnswer}
          onChange={e => setInputAnswer(e.target.value)}
        />
      </>
    );
  }

  return (
    <main className="page">
      <div className="panel">
        <h1 className="title">句子练习系统</h1>
        <p className="subtitle">点击拼句 · 填空 · 整句输入 · 听写</p>

        <div className="modes">
          {MODES.map(m => (
            <button
              key={m.id}
              className={`mode-btn ${mode === m.id ? "active" : ""}`}
              onClick={() => setMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="sentence-cn">{current.cn}</div>

        {renderBody()}

        <div className="actions">
          <button className="primary" onClick={handleSubmit}>
            提交
          </button>
          <button onClick={handleNext}>下一题</button>
          <button onClick={handleSpeak}>🔊 朗读</button>
        </div>

        <div className="status-row">
          <span>
            当前句子：已练习 {sentenceStats.times} 次，正确率 {accuracy}
          </span>
          {message && <span className="message">{message}</span>}
        </div>

        <div className="hint">
          提示：点击上方标签可以切换练习模式；所有数据保存在本地浏览器。
        </div>
      </div>
    </main>
  );
}
