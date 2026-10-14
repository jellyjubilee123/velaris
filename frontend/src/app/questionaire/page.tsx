"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

const PERSONALITY_QUESTIONS = [
  { key: "openness", text: "I enjoy trying new ideas and experiences" },
{ key: "conscientiousness", text: "I like having a clear plan and finishing what I start" },
{ key: "extraversion", text: "I feel energized by spending time with other people" },
{ key: "agreeableness", text: "I prefer harmony and cooperation over winning arguments" },
{ key: "neuroticism", text: "I often feel anxious or easily stressed" },
];

const COGNITIVE_QUESTIONS = [
  { q: "What comes next: 2, 6, 12, 20, 30, ?", options: ["40", "42", "36", "48"], answer: 1 },
{ q: "A bat and ball cost $1.10. The bat costs $1 more than the ball. How much is the ball?", options: ["$0.10", "$0.05", "$0.15", "$1.00"], answer: 1 },
{ q: "Which does not belong: apple, banana, carrot, grape", options: ["apple", "banana", "carrot", "grape"], answer: 2 },
{ q: "What is 15% of 200?", options: ["20", "25", "30", "35"], answer: 2 },
{ q: "If you have 3 apples and you take away 2, how many do you have?", options: ["1", "2", "3", "0"], answer: 1 },
];

export default function QuestionnairePage() {
  const [sex, setSex] = useState("");
  const [sexPref, setSexPref] = useState<string[]>([]);
  const [personality, setPersonality] = useState<Record<string, number>>({});
  const [values, setValues] = useState("");
  const [lifestyle, setLifestyle] = useState("");
  const [interests, setInterests] = useState("");
  const [cognitiveAnswers, setCognitiveAnswers] = useState<number[]>(Array(COGNITIVE_QUESTIONS.length).fill(-1));
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function toggleSexPref(v: string) {
    setSexPref((prev) => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  }

  function setPersonalityScore(key: string, score: number) {
    setPersonality((prev) => ({ ...prev, [key]: score }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const userId = localStorage.getItem("user_id");
    if (!userId) return;

    setLoading(true);
    try {
      await api("/profile/answer", {
        method: "POST",
        body: JSON.stringify({ user_id: userId, question_key: "sex", answer: sex }),
      });
      await api("/profile/answer", {
        method: "POST",
        body: JSON.stringify({ user_id: userId, question_key: "sex_pref", answer: sexPref }),
      });

      await api("/profile/answer", {
        method: "POST",
        body: JSON.stringify({ user_id: userId, question_key: "personality", answer: personality }),
      });

      const toArray = (s: string) => s.split(",").map(x => x.trim()).filter(Boolean);
      await api("/profile/answer", {
        method: "POST",
        body: JSON.stringify({ user_id: userId, question_key: "values", answer: toArray(values) }),
      });
      await api("/profile/answer", {
        method: "POST",
        body: JSON.stringify({ user_id: userId, question_key: "lifestyle", answer: toArray(lifestyle) }),
      });

      for (const tag of toArray(interests)) {
        await api("/interests", {
          method: "POST",
          body: JSON.stringify({ user_id: userId, tag }),
        });
      }

      let correct = 0;
      cognitiveAnswers.forEach((ans, i) => {
        if (ans === COGNITIVE_QUESTIONS[i].answer) correct++;
      });
        const score = Math.round((correct / COGNITIVE_QUESTIONS.length) * 100);
        const band = score >= 60 ? "higher" : "average";

        await api("/profile/answer", {
          method: "POST",
          body: JSON.stringify({ user_id: userId, question_key: "cognitive_score", answer: score }),
        });
        await api("/profile/answer", {
          method: "POST",
          body: JSON.stringify({ user_id: userId, question_key: "cognitive_band", answer: band }),
        });

        router.push("/matches");
    } catch (err) {
      console.error(err);
      alert("Save failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white py-8 px-4">
    <div className="max-w-2xl mx-auto">
    <h1 className="text-4xl font-extrabold text-pink-500 text-center mb-8">
    Your Profile
    </h1>
    <form onSubmit={submit} className="space-y-12">
    <section className="bg-white border border-pink-100 rounded-2xl p-6">
    <h2 className="text-2xl font-bold text-pink-500 mb-4">Anatomical sex</h2>
    <select
    className="w-full border border-pink-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-pink-400"
    value={sex}
    onChange={(e) => setSex(e.target.value)}
    required
    >
    <option value="">Select</option>
    <option value="male">Male</option>
    <option value="female">Female</option>
    <option value="other">Other</option>
    </select>
    <div className="mt-4">
    <p className="text-sm font-semibold text-pink-500 mb-2">Interested in</p>
    <div className="flex flex-wrap gap-4">
    {["male", "female", "other"].map((s) => (
      <label key={s} className="flex items-center gap-2 text-sm">
      <input
      type="checkbox"
      checked={sexPref.includes(s)}
      onChange={() => toggleSexPref(s)}
      className="accent-pink-500"
      />
      {s}
      </label>
    ))}
    </div>
    </div>
    </section>

    <section className="bg-white border border-pink-100 rounded-2xl p-6">
    <h2 className="text-2xl font-bold text-pink-500 mb-6">
    Personality <span className="text-base font-normal text-gray-600">(1 = strongly disagree, 5 = strongly agree)</span>
    </h2>
    {PERSONALITY_QUESTIONS.map((q) => (
      <div key={q.key} className="mb-6">
      <p className="text-sm mb-2">{q.text}</p>
      <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
        key={n}
        type="button"
        onClick={() => setPersonalityScore(q.key, n)}
        className={`w-10 h-10 rounded-full border text-sm font-semibold transition ${
          personality[q.key] === n
          ? "bg-pink-500 text-white border-pink-500 shadow-md scale-105"
          : "border-pink-200 text-gray-700 hover:bg-pink-50"
        }`}
        >
        {n}
        </button>
      ))}
      </div>
      </div>
    ))}
    </section>

    <section className="bg-white border border-pink-100 rounded-2xl p-6">
    <h2 className="text-2xl font-bold text-pink-500 mb-2">Cognitive reasoning</h2>
    <p className="text-sm text-gray-500 mb-6">5 quick questions for matching.</p>
    {COGNITIVE_QUESTIONS.map((cq, i) => (
      <div key={i} className="mb-6 pb-4 border-b border-pink-50">
      <p className="text-sm mb-3">
      <span className="font-semibold text-pink-500">{i + 1}.</span> {cq.q}
      </p>
      <div className="space-y-2">
      {cq.options.map((opt, oi) => (
        <label key={oi} className="flex items-center gap-2 text-sm cursor-pointer">
        <input
        type="radio"
        name={`cog-${i}`}
        checked={cognitiveAnswers[i] === oi}
        onChange={() => {
          const next = [...cognitiveAnswers];
          next[i] = oi;
          setCognitiveAnswers(next);
        }}
        className="accent-pink-500"
        />
        {opt}
        </label>
      ))}
      </div>
      </div>
    ))}
    </section>

    <section className="bg-white border border-pink-100 rounded-2xl p-6">
    <h2 className="text-2xl font-bold text-pink-500 mb-4">Values, lifestyle & interests</h2>
    <input
    className="w-full border border-pink-200 rounded-lg p-3 mb-3 focus:outline-none focus:ring-2 focus:ring-pink-400"
    placeholder="Values (comma separated)"
    value={values}
    onChange={(e) => setValues(e.target.value)}
    />
    <input
    className="w-full border border-pink-200 rounded-lg p-3 mb-3 focus:outline-none focus:ring-2 focus:ring-pink-400"
    placeholder="Lifestyle (comma separated)"
    value={lifestyle}
    onChange={(e) => setLifestyle(e.target.value)}
    />
    <input
    className="w-full border border-pink-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-pink-400"
    placeholder="Interests (comma separated)"
    value={interests}
    onChange={(e) => setInterests(e.target.value)}
    />
    </section>

    <button
    type="submit"
    disabled={loading}
    className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3 rounded-full transition disabled:opacity-50"
    >
    {loading ? "Saving…" : "Save & continue"}
    </button>
    </form>

    <div className="text-center mt-6">
    <Link
    href="/matches"
    className="inline-block bg-black text-white font-bold py-3 px-8 rounded-full"
    >
    Go to Matches / Chat
    </Link>
    </div>
    </div>
    </div>
  );
}
