"use client";

import { authClient } from "@/lib/auth-client";
import { useState } from "react";

export function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Attempting to auth with:', email);
      const result = isSignUp
        ? await authClient.signUp.email({
            email,
            password,
            name,
          })
        : await authClient.signIn.email({
            email,
            password,
          });

      console.log('Auth result:', result);

      if (result?.error) {
        console.error('Authentication failed:', result.error);
        alert("Authentication failed: " + result.error.message);
      } else {
        console.log('Auth successful, redirecting...');
        // Redirect or handle success
        window.location.href = "/";
      }
    } catch (error) {
      console.error('Auth error:', error);
      alert("An error occurred: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <div>
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
        )}
        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Processing..." : isSignUp ? "Sign Up" : "Sign In"}
        </button>
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full text-blue-500 hover:text-blue-600"
        >
          {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
        </button>
      </form>
    </div>
  );
}