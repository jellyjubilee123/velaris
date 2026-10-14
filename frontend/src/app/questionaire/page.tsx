"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

const PERSONALITY_QUESTIONS = [
  { key: "openness", text: "I enjoy trying new ideas and experiences" },
{ key: "conscientiousness", text: "I like having a clear plan and finishing what I start" },
{ key: "extraversion", text: "I feel energized by spending time with other people" },
{ key: "agreeableness", text: "I prefer harmony and cooperation over winning arguments" },
{ key: "neuroticism", text: "I often feel anxious or easily stressed" },
{ key: "directness", text: "I prefer people to be direct even if it’s uncomfortable" },
{ key: "social_energy", text: "I need a lot of alone time to recharge" },
{ key: "planning", text: "I like spontaneous plans more than scheduled ones" },
{ key: "honesty_style", text: "I value radical honesty over protecting feelings" },
{ key: "conflict", text: "I prefer to address problems immediately rather than cool off" },
{ key: "curiosity", text: "I frequently look up things just to understand how they work" },
{ key: "routine", text: "I feel more comfortable with a consistent daily routine" },
{ key: "empathy", text: "I can usually tell how someone else is feeling" },
{ key: "risk", text: "I am willing to take risks for something I want" },
{ key: "detail", text: "I notice small details that others miss" },
{ key: "group", text: "I prefer working in a group over working alone" },
{ key: "tradition", text: "I value traditional ways of doing things" },
{ key: "adaptability", text: "I adapt quickly when plans change" },
{ key: "ambition", text: "I set high personal goals for myself" },
{ key: "patience", text: "I stay calm when things take longer than expected" },
];

const COGNITIVE_QUESTIONS = [
  { q: "If all Bloops are Razzies and all Razzies are Lazzies, are all Bloops definitely Lazzies?", options: ["Yes", "No", "Not enough info"], answer: 0 },
{ q: "What comes next: 2, 6, 12, 20, 30, ?", options: ["40", "42", "36", "48"], answer: 1 },
{ q: "Which does not belong: apple, banana, carrot, grape", options: ["apple", "banana", "carrot", "grape"], answer: 2 },
{ q: "A bat and ball cost $1.10. The bat costs $1 more than the ball. How much is the ball?", options: ["$0.10", "$0.05", "$0.15", "$1.00"], answer: 1 },
{ q: "5 machines make 5 widgets in 5 minutes. How long for 100 machines to make 100 widgets?", options: ["5 min", "100 min", "20 min", "1 min"], answer: 0 },
{ q: "If you rearrange the letters 'CIFAIPC', you get the name of a(n):", options: ["City", "Animal", "Ocean", "Country"], answer: 3 },
{ q: "Which number is the odd one out: 8, 27, 64, 100, 125", options: ["8", "27", "64", "100"], answer: 3 },
{ q: "Mary is 16. Her brother is twice as old as she was when he was her age. How old is the brother?", options: ["24", "32", "20", "28"], answer: 1 },
{ q: "What is the next letter: O, T, T, F, F, S, S, ?", options: ["E", "N", "T", "O"], answer: 0 },
{ q: "If 3 cats catch 3 mice in 3 minutes, how many cats catch 100 mice in 100 minutes?", options: ["3", "100", "33", "1"], answer: 0 },
{ q: "Which word is the odd one out: quick, fast, rapid, slow", options: ["quick", "fast", "rapid", "slow"], answer: 3 },
{ q: "A man builds a house with all four sides facing south. A bear walks by. What color is the bear?", options: ["Brown", "Black", "White", "Grey"], answer: 2 },
{ q: "What is 15% of 200?", options: ["20", "25", "30", "35"], answer: 2 },
{ q: "If you have 3 apples and you take away 2, how many do you have?", options: ["1", "2", "3", "0"], answer: 1 },
{ q: "Which number completes the series: 1, 1, 2, 3, 5, 8, ?", options: ["11", "12", "13", "15"], answer: 2 },
{ q: "A clock shows 3:15. What is the angle between the hour and minute hands?", options: ["0°", "7.5°", "15°", "22.5°"], answer: 1 },
{ q: "If all Zips are Zaps and some Zaps are Zops, then:", options: ["All Zips are Zops", "Some Zips are Zops", "No Zips are Zops", "None of the above"], answer: 3 },
{ q: "What comes next: 1, 4, 9, 16, 25, ?", options: ["30", "36", "49", "64"], answer: 1 },
{ q: "Which is heavier: a pound of feathers or a pound of gold?", options: ["Feathers", "Gold", "Same", "Depends"], answer: 2 },
{ q: "How many months have 28 days?", options: ["1", "2", "6", "12"], answer: 3 },
{ q: "What is the next number: 3, 6, 11, 18, 27, ?", options: ["36", "38", "40", "42"], answer: 1 },
{ q: "If a plane crashes on the border of the US and Canada, where do they bury the survivors?", options: ["US", "Canada", "Neither", "Both"], answer: 2 },
{ q: "Which figure comes next in the sequence: square, circle, triangle, square, circle, ?", options: ["Triangle", "Square", "Circle", "Pentagon"], answer: 0 },
{ q: "A farmer has 17 sheep. All but 9 die. How many are left?", options: ["8", "9", "17", "0"], answer: 1 },
{ q: "What is 25% of 80?", options: ["15", "20", "25", "30"], answer: 1 },
{ q: "If you divide 30 by half and add 10, what do you get?", options: ["25", "40", "70", "15"], answer: 2 },
{ q: "Which word does not belong: dog, cat, bird, fish, tree", options: ["dog", "cat", "bird", "tree"], answer: 3 },
{ q: "What comes next: A, C, F, J, O, ?", options: ["T", "U", "V", "S"], answer: 1 },
{ q: "If 2 + 3 = 10, 7 + 2 = 63, 6 + 5 = 66, then 8 + 4 = ?", options: ["80", "96", "88", "72"], answer: 1 },
{ q: "How many times can you subtract 5 from 25?", options: ["5", "1", "4", "Infinite"], answer: 1 },
{ q: "Which number is missing: 2, 3, 5, 7, 11, ?, 17", options: ["12", "13", "14", "15"], answer: 1 },
{ q: "A is the father of B. B is the sister of C. C is the mother of D. How is A related to D?", options: ["Father", "Grandfather", "Uncle", "Brother"], answer: 1 },
{ q: "What is the next in the series: 7, 10, 8, 11, 9, 12, ?", options: ["7", "10", "13", "15"], answer: 1 },
{ q: "If a train travels 60 miles in 1 hour, how far in 2.5 hours?", options: ["120", "150", "180", "200"], answer: 1 },
{ q: "Which is the odd one out: 121, 144, 169, 196, 225, 256", options: ["121", "144", "196", "225"], answer: 2 },
{ q: "What comes next: 1, 3, 6, 10, 15, ?", options: ["18", "20", "21", "25"], answer: 2 },
{ q: "If all roses are flowers and some flowers fade quickly, then:", options: ["All roses fade quickly", "Some roses fade quickly", "No roses fade quickly", "Cannot be determined"], answer: 3 },
{ q: "What is 12 × 12?", options: ["124", "132", "144", "156"], answer: 2 },
{ q: "A clock is 10 minutes slow. What time is it if it shows 3:00?", options: ["2:50", "3:10", "3:00", "2:40"], answer: 1 },
{ q: "Which number completes: 4, 9, 16, 25, 36, ?", options: ["42", "49", "64", "81"], answer: 1 },
{ q: "If you have 4 pencils and you take away 3, how many do you have?", options: ["1", "3", "4", "7"], answer: 1 },
{ q: "What is the next letter: B, D, G, K, P, ?", options: ["T", "U", "V", "W"], answer: 2 },
{ q: "A man looks at a photo and says 'Brothers and sisters I have none, but that man's father is my father's son.' Who is in the photo?", options: ["His son", "His father", "Himself", "His brother"], answer: 0 },
{ q: "What is 20% of 150?", options: ["25", "30", "35", "40"], answer: 1 },
{ q: "Which does not belong: square, circle, triangle, rectangle, sphere", options: ["square", "circle", "triangle", "sphere"], answer: 3 },
{ q: "If 5 workers build a wall in 10 days, how long for 10 workers?", options: ["5 days", "10 days", "20 days", "2 days"], answer: 0 },
{ q: "What comes next: 2, 4, 8, 16, 32, ?", options: ["48", "64", "56", "40"], answer: 1 },
{ q: "How many sides does a hexagon have?", options: ["5", "6", "7", "8"], answer: 1 },
{ q: "If today is Wednesday, what day was it 10 days ago?", options: ["Saturday", "Sunday", "Monday", "Friday"], answer: 1 },
{ q: "Which number is the odd one out: 2, 3, 5, 7, 9, 11", options: ["2", "3", "9", "11"], answer: 2 },
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
    {/* Anatomical sex */}
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

    {/* Personality */}
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
          ? "bg-black text-white border-black"
          : "border-pink-200 hover:bg-pink-50"
        }`}
        >
        {n}
        </button>
      ))}
      </div>
      </div>
    ))}
    </section>

    {/* Cognitive */}
    <section className="bg-white border border-pink-100 rounded-2xl p-6">
    <h2 className="text-2xl font-bold text-pink-500 mb-2">Cognitive reasoning</h2>
    <p className="text-sm text-gray-500 mb-6">
    50 questions used for matching bands, not a clinical IQ test.
    </p>
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

    {/* Values, lifestyle, interests */}
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
    </div>
    </div>
  );
}
