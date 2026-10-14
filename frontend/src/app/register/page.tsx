"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
    const [handle, setHandle] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleRegister(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setMessage("");
        setLoading(true);

        try {
            await api("/register", {
                method: "POST",
                body: JSON.stringify({ handle, password }),
            });

            setMessage("Account created. Redirecting to login...");
            setTimeout(() => router.push("/login"), 800);
        } catch (err: any) {
            setError(err.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-md mx-auto mt-20 p-6 border rounded-lg shadow-sm">
        <h1 className="text-2xl font-semibold mb-6">Create Velaris Account</h1>
        <form onSubmit={handleRegister} className="space-y-4">
        <div>
        <label className="block text-sm mb-1">Handle</label>
        <input
        className="w-full border p-2 rounded"
        placeholder="Choose a handle"
        value={handle}
        onChange={(e) => setHandle(e.target.value)}
        required
        />
        </div>
        <div>
        <label className="block text-sm mb-1">Password</label>
        <input
        className="w-full border p-2 rounded"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={6}
        />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {message && <p className="text-green-600 text-sm">{message}</p>}
        <button
        className="w-full bg-black text-white p-2 rounded disabled:opacity-50"
        type="submit"
        disabled={loading}
        >
        {loading ? "Creating..." : "Register"}
        </button>
        </form>
        <p className="text-sm text-center mt-4">
        Already have an account?{" "}
        <Link href="/login" className="underline">
        Log in
        </Link>
        </p>
        </div>
    );
}
