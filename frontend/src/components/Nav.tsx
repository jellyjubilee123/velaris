"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function Nav() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(!!localStorage.getItem("token"));
  }, []);

  if (!loggedIn) return null;

  return (
    <nav className="border-b p-4 flex gap-4 text-sm">
      <Link href="/matches" className="underline">Matches</Link>
      <Link href="/questionnaire" className="underline">Profile</Link>
      <Link href="/preferences" className="underline">Preferences</Link>
      <button
        className="ml-auto text-gray-500"
        onClick={() => {
          localStorage.clear();
          window.location.href = "/login";
        }}
      >
        Log out
      </button>
    </nav>
  );
}
