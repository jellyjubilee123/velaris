"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [handle, setHandle] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const data = await api<{ user_id: string; handle: string; token: string }>(
        "/login",
        {
          method: "POST",
          body: JSON.stringify({ handle, password }),
        }
      );
      localStorage.setItem("token", data.token);
      localStorage.setItem("user_id", data.user_id);
      router.push("/questionaire");
    } catch (err: any) {
      setError(err.message || "Login failed");
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-white px-4">
    <div className="w-full max-w-md bg-white border border-pink-100 rounded-2xl shadow-sm p-8">
    <h1 className="text-4xl font-extrabold text-pink-500 text-center mb-6">
    Welcome back
    </h1>
    <form onSubmit={handleLogin} className="space-y-5">
    <div>
    <label className="block text-sm font-semibold text-pink-500 mb-1">
    Handle
    </label>
    <input
    className="w-full border border-pink-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-pink-400"
    placeholder="Your handle"
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
    placeholder="Password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    required
    />
    </div>
    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
    <button
    className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3 rounded-full transition"
    type="submit"
    >
    Log In
    </button>
    </form>
    <p className="text-sm text-center mt-6 text-gray-600">
    Don’t have an account?{" "}
    <Link href="/register" className="text-pink-500 font-semibold hover:underline">
    Register
    </Link>
    </p>
    </div>
    </div>
  );
}
