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
      router.push("/questionaire");   // ← changed from /matches
    } catch (err: any) {
      setError(err.message || "Login failed");
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded">
    <h1 className="text-2xl mb-4">Velaris Login</h1>
    <form onSubmit={handleLogin} className="space-y-4">
    <input
    className="w-full border p-2"
    placeholder="Handle"
    value={handle}
    onChange={(e) => setHandle(e.target.value)}
    />
    <input
    className="w-full border p-2"
    type="password"
    placeholder="Password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    />
    {error && <p className="text-red-500">{error}</p>}
    <button className="w-full bg-black text-white p-2" type="submit">
    Login
    </button>
    </form>
    <p className="text-sm text-center mt-4">
    Don't have an account?{" "}
    <Link href="/register" className="underline">
    Register
    </Link>
    </p>
    </div>
  );
}
