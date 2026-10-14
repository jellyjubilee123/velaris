"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";

type Match = {
    id: string;
    user_a: string;
    user_b: string;
    score: number;
    status: string;
    kestrel_code?: string | null;
    other_handle?: string;
};

export default function MatchesPage() {
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const id = localStorage.getItem("user_id");
        setUserId(id);
        if (!id) return;

        api<Match[]>(`/matches/${id}`)
        .then(setMatches)
        .catch(console.error)
        .finally(() => setLoading(false));
    }, []);

    async function optIn(matchId: string) {
        if (!userId) return;
        try {
            await api("/opt-in", {
                method: "POST",
                body: JSON.stringify({ user_id: userId, match_id: matchId }),
            });
            // refresh
            const updated = await api<Match[]>(`/matches/${userId}`);
            setMatches(updated);
        } catch (e) {
            console.error(e);
        }
    }

    if (loading) return <p className="p-8">Loading matches…</p>;

    return (
        <div className="max-w-2xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Your Matches</h1>
        <Link href="/preferences" className="text-sm underline">Preferences</Link>
        </div>

        <div className="space-y-4">
        {matches.length === 0 && <p className="text-gray-500">No matches yet.</p>}

        {matches.map((m) => {
            const isMutual = m.status === "mutual";
            const canOptIn = m.status === "suggested";

            return (
                <div key={m.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                <div>
                <p className="font-medium">
                {m.other_handle || "Someone"}
                </p>
                <p className="text-sm text-gray-500">
                Score: {m.score.toFixed(2)} · {m.status}
                </p>
                </div>
                {canOptIn && (
                    <button
                    onClick={() => optIn(m.id)}
                    className="bg-black text-white text-sm px-3 py-1 rounded"
                    >
                    Opt in
                    </button>
                )}
                </div>

                {isMutual && m.kestrel_code && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                    <p className="text-sm font-medium text-green-800">
                    Kestrel code
                    </p>
                    <p className="font-mono text-lg text-green-700">
                    {m.kestrel_code}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                    Share this code in Kestrel to start an anonymous chat. Expires in 24h.
                    </p>
                    </div>
                )}
                </div>
            );
        })}
        </div>
        </div>
    );
}
