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

type Message = {
    body: string;
    sender: string;
    created_at: string;
};

function ChatBox({ code, userId }: { code: string; userId: string }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);

    useEffect(() => {
        let active = true;

        async function load() {
            try {
                const data = await api<Message[]>(`/chat/${code}`);
                if (active) setMessages(data);
            } catch (e) {
                console.error(e);
            }
        }

        load();
        const interval = setInterval(load, 3000);
        return () => {
            active = false;
            clearInterval(interval);
        };
    }, [code]);

    async function send(e: React.FormEvent) {
        e.preventDefault();
        if (!input.trim() || sending) return;
        setSending(true);
        try {
            await api(`/chat/${code}`, {
                method: "POST",
                body: JSON.stringify({ body: input }),
            });
            setInput("");
            // quick refresh
            const data = await api<Message[]>(`/chat/${code}`);
            setMessages(data);
        } catch (e) {
            console.error(e);
        } finally {
            setSending(false);
        }
    }

    return (
        <div className="mt-4 border border-pink-100 rounded-xl p-4 bg-pink-50/30">
        <p className="text-sm font-semibold text-pink-500 mb-2">Anonymous chat</p>
        <div className="h-48 overflow-y-auto mb-3 space-y-2 text-sm">
        {messages.length === 0 && (
            <p className="text-gray-400 text-center">No messages yet. Say hi!</p>
        )}
        {messages.map((msg, i) => (
            <div
            key={i}
            className={`flex ${msg.sender === userId ? "justify-end" : "justify-start"}`}
            >
            <span
            className={`inline-block px-3 py-1 rounded-2xl max-w-[80%] ${
                msg.sender === userId
                ? "bg-black text-white"
                : "bg-white border border-pink-200 text-gray-800"
            }`}
            >
            {msg.body}
            </span>
            </div>
        ))}
        </div>
        <form onSubmit={send} className="flex gap-2">
        <input
        className="flex-1 border border-pink-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
        placeholder="Type a message…"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={sending}
        />
        <button
        type="submit"
        disabled={sending || !input.trim()}
        className="bg-black text-white text-sm font-semibold px-4 py-2 rounded-full disabled:opacity-50"
        >
        Send
        </button>
        </form>
        <p className="text-xs text-gray-400 mt-2">Code expires in 24 hours</p>
        </div>
    );
}

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
            const updated = await api<Match[]>(`/matches/${userId}`);
            setMatches(updated);
        } catch (e) {
            console.error(e);
        }
    }

    if (loading) return <p className="p-8 text-center">Loading matches…</p>;

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white min-h-screen">
        <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-extrabold text-pink-500">Your Matches</h1>
        <Link href="/preferences" className="text-sm text-pink-500 hover:underline">
        Preferences
        </Link>
        </div>

        <div className="space-y-4">
        {matches.length === 0 && (
            <p className="text-gray-500 text-center py-12">No matches yet.</p>
        )}

        {matches.map((m) => {
            const isMutual = m.status === "mutual";
            const canOptIn = m.status === "suggested";

            return (
                <div key={m.id} className="border border-pink-100 rounded-2xl p-5 bg-white">
                <div className="flex justify-between items-start">
                <div>
                <p className="font-semibold text-lg">{m.other_handle || "Someone"}</p>
                <p className="text-sm text-gray-500">
                Score: {m.score.toFixed(2)} · {m.status}
                </p>
                </div>
                {canOptIn && (
                    <button
                    onClick={() => optIn(m.id)}
                    className="bg-black text-white text-sm font-semibold px-4 py-1.5 rounded-full"
                    >
                    Opt in
                    </button>
                )}
                </div>

                {isMutual && m.kestrel_code && userId && (
                    <>
                    <div className="mt-3 p-3 bg-pink-50 border border-pink-200 rounded-xl">
                    <p className="text-sm font-semibold text-pink-500">Kestrel code</p>
                    <p className="font-mono text-lg text-pink-600">{m.kestrel_code}</p>
                    <p className="text-xs text-gray-500 mt-1">Expires in 24 hours</p>
                    </div>
                    <ChatBox code={m.kestrel_code} userId={userId} />
                    </>
                )}
                </div>
            );
        })}
        </div>
        </div>
    );
}
