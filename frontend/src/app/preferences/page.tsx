"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

type Prefs = {
  age_min?: number;
  age_max?: number;
  values_weight: number;
  lifestyle_weight: number;
  interests_weight: number;
  max_distance_km?: number;
  region?: string;
};

export default function PreferencesPage() {
  const [prefs, setPrefs] = useState<Prefs>({
    values_weight: 0.4,
    lifestyle_weight: 0.3,
    interests_weight: 0.3,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    if (!userId) {
      router.push("/login");
      return;
    }

    api<Prefs>(`/preferences/${userId}`)
      .then(setPrefs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const userId = localStorage.getItem("user_id");
    if (!userId) return;

    setSaving(true);
    try {
      await api("/preferences", {
        method: "POST",
        body: JSON.stringify({ user_id: userId, ...prefs }),
      });
      router.push("/matches");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="p-8">Loading…</p>;

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded-lg">
      <h1 className="text-2xl font-semibold mb-6">Preferences</h1>
      <form onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Min age</label>
            <input
              type="number"
              className="w-full border p-2 rounded"
              value={prefs.age_min ?? ""}
              onChange={(e) => setPrefs({ ...prefs, age_min: e.target.value ? +e.target.value : undefined })}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Max age</label>
            <input
              type="number"
              className="w-full border p-2 rounded"
              value={prefs.age_max ?? ""}
              onChange={(e) => setPrefs({ ...prefs, age_max: e.target.value ? +e.target.value : undefined })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">Region (optional)</label>
          <input
            className="w-full border p-2 rounded"
            placeholder="e.g. Northeast"
            value={prefs.region ?? ""}
            onChange={(e) => setPrefs({ ...prefs, region: e.target.value || undefined })}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Max distance (km)</label>
          <input
            type="number"
            className="w-full border p-2 rounded"
            value={prefs.max_distance_km ?? ""}
            onChange={(e) => setPrefs({ ...prefs, max_distance_km: e.target.value ? +e.target.value : undefined })}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm">Weights (should roughly sum to 1)</label>
          <div>
            <span className="text-sm">Values: {prefs.values_weight.toFixed(2)}</span>
            <input
              type="range" min="0" max="1" step="0.05"
              className="w-full"
              value={prefs.values_weight}
              onChange={(e) => setPrefs({ ...prefs, values_weight: +e.target.value })}
            />
          </div>
          <div>
            <span className="text-sm">Lifestyle: {prefs.lifestyle_weight.toFixed(2)}</span>
            <input
              type="range" min="0" max="1" step="0.05"
              className="w-full"
              value={prefs.lifestyle_weight}
              onChange={(e) => setPrefs({ ...prefs, lifestyle_weight: +e.target.value })}
            />
          </div>
          <div>
            <span className="text-sm">Interests: {prefs.interests_weight.toFixed(2)}</span>
            <input
              type="range" min="0" max="1" step="0.05"
              className="w-full"
              value={prefs.interests_weight}
              onChange={(e) => setPrefs({ ...prefs, interests_weight: +e.target.value })}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-black text-white p-2 rounded disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save preferences"}
        </button>
      </form>
    </div>
  );
}
