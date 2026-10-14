"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";

export default function ResetPage() {
  const [handle, setHandle] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState<"request" | "confirm">("request");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function requestReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const res = await api<{ token: string }>("/reset/request", {
        method: "POST",
        body: JSON.stringify({ handle }),
      });
      setToken(res.token);
      setStep("confirm");
      setMessage("Token generated (dev only). Enter it below with your new password.");
    } catch (err: any) {
      setError(err.message || "Failed to request reset");
    }
  }

  async function confirmReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api("/reset/confirm", {
        method: "POST",
        body: JSON.stringify({ handle, token, new_password: newPassword }),
      });
      setMessage("Password updated. You can now log in.");
    } catch (err: any) {
      setError(err.message || "Reset failed");
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded-lg">
      <h1 className="text-2xl font-semibold mb-6">Reset password</h1>

      {step === "request" ? (
        <form onSubmit={requestReset} className="space-y-4">
          <input
            className="w-full border p-2 rounded"
            placeholder="Handle"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            required
          />
          <button className="w-full bg-black text-white p-2 rounded" type="submit">
            Request reset
          </button>
        </form>
      ) : (
        <form onSubmit={confirmReset} className="space-y-4">
          <input
            className="w-full border p-2 rounded"
            placeholder="Reset token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />
          <input
            className="w-full border p-2 rounded"
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
          />
          <button className="w-full bg-black text-white p-2 rounded" type="submit">
            Set new password
          </button>
        </form>
      )}

      {message && <p className="text-green-600 text-sm mt-4">{message}</p>}
      {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

      <p className="text-sm text-center mt-4">
        <Link href="/login" className="underline">Back to login</Link>
      </p>
    </div>
  );
}
