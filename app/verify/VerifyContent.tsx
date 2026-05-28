"use client";

import { useState } from "react";
import { verifyUser } from "@/services/auth";
import { useSearchParams, useRouter } from "next/navigation";

export default function VerifyContent() {

  const searchParams = useSearchParams();
  const router = useRouter();

  const email = searchParams.get("email") || "";

  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();

    try {

      await verifyUser(email, code);

      router.push("/login");

    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">

      <form
        onSubmit={handleVerify}
        className="bg-gray-900 p-8 rounded-xl w-full max-w-md"
      >

        <h1 className="text-3xl font-bold mb-6">
          Verify Email
        </h1>

        <input
          type="text"
          placeholder="Enter OTP Code"
          className="w-full p-3 mb-4 bg-gray-800 rounded"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        {error && (
          <p className="text-red-500 mb-4">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="w-full bg-purple-600 p-3 rounded"
        >
          Verify Account
        </button>

      </form>

    </div>
  );
}