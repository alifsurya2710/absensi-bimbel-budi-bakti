"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Calculator } from "lucide-react";

interface MathCaptchaProps {
  onValidate: (isValid: boolean) => void;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function MathCaptcha({
  onValidate,
  value,
  onChange,
  disabled = false,
}: MathCaptchaProps) {
  const getRandomQuestion = () => {
    const n1 = Math.floor(Math.random() * 15) + 5;
    const n2 = Math.floor(Math.random() * 10) + 1;
    const isPlus = Math.random() > 0.4;
    if (isPlus) {
      return { n1, n2, op: "+" as const };
    }
    const larger = Math.max(n1, n2);
    const smaller = Math.min(n1, n2);
    return { n1: larger, n2: smaller, op: "-" as const };
  };

  // Nilai statis awal yang konsisten antara SSR server dan client
  const [question, setQuestion] = useState<{ n1: number; n2: number; op: "+" | "-" }>({
    n1: 7,
    n2: 5,
    op: "+",
  });

  // Begitu komponen ter-mount di browser klien, otomatis acak soal baru (tanpa menyebabkan hydration mismatch)
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuestion(getRandomQuestion());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const generateCaptcha = () => {
    setQuestion(getRandomQuestion());
    onChange("");
  };

  const correctAnswer = question.op === "+" ? question.n1 + question.n2 : question.n1 - question.n2;

  const handleInputChange = (inputVal: string) => {
    onChange(inputVal);
    const parsed = parseInt(inputVal.trim(), 10);
    onValidate(!isNaN(parsed) && parsed === correctAnswer);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Verifikasi Keamanan (Captcha)
        </label>
        <button
          type="button"
          onClick={generateCaptcha}
          disabled={disabled}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-800 disabled:opacity-50 transition"
          title="Ganti Soal Matematika"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Ganti Soal</span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        {/* Tampilan Soal Matematika */}
        <div className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-emerald-50 to-slate-100 border border-emerald-200/80 rounded-xl font-mono text-sm font-extrabold text-emerald-900 select-none shadow-2xs">
          <Calculator className="w-4 h-4 text-emerald-500 shrink-0 mr-1" />
          <span>{question.n1}</span>
          <span className="text-rose-600 font-bold">{question.op}</span>
          <span>{question.n2}</span>
          <span>=</span>
          <span className="text-emerald-400">?</span>
        </div>

        {/* Input Jawaban */}
        <div className="flex-1">
          <input
            type="number"
            required
            disabled={disabled}
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Jawaban angka..."
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition disabled:bg-slate-100 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );
}

