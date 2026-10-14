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
        <div className="min-h-[80vh] flex items-center justify-center bg-white px-4">
        <div className="w-full max-w-md bg-white border border-pink-100 rounded-2xl shadow-sm p-8">
        <h1 className="text-4xl font-extrabold text-pink-500 text-center mb-6">
        Create Account
        </h1>
        <form onSubmit={handleRegister} className="space-y-5">
        <div>
        <label className="block text-sm font-semibold text-pink-500 mb-1">
        Handle
        </label>
        <input
        className="w-full border border-pink-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-pink-400"
        placeholder="Choose a handle"
        value={handle}
        onChange={(e) => setHandle(e.target.value)}
        required
        />
        </div>
        <div>
        <label className="block text-sm font-semibold text-pink-500 mb-1">
        Password
        </label>
        <input
        className="w-full border border-pink-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-pink-400"
        type="password"
        placeholder="Password (min 6 characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={6}
        />
        </div>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        {message && <p className="text-green-600 text-sm text-center">{message}</p>}
        <button
        className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3 rounded-full transition disabled:opacity-50"
        type="submit"
        disabled={loading}
        >
        {loading ? "Creating..." : "Register"}
        </button>
        </form>
        <p className="text-sm text-center mt-6 text-gray-600">
        Already have an account?{" "}
        <Link href="/login" className="text-pink-500 font-semibold hover:underline">
        Log in
        </Link>
        </p>
        </div>
        </div>
    );
}
