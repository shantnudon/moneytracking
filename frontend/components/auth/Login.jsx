"use client";

import React from "react";

const Login = ({ onLogin }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    onLogin(data);
  };

  return (
    <div className="w-full h-full flex flex-col justify-center p-10 bg-card border border-border transition-colors">
      <div className="mb-10">
        <h2 className="text-3xl text-foreground font-black uppercase tracking-tighter italic">
          Authenticate
        </h2>
        <p className="text-xs font-bold text-muted uppercase tracking-widest mt-2">
          Access your financial ledger on the go
        </p>
      </div>

      <form className="flex flex-col gap-8" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label className="text-xs font-black uppercase tracking-widest text-muted">
            Email
          </label>
          <input
            className="w-full border-b border-border py-2 text-sm font-black focus:border-foreground outline-none transition-all uppercase placeholder:text-muted/40 text-foreground bg-transparent"
            name="email"
            placeholder="tonymontana@scarface.com"
            autoComplete="email"
            type="email"
            required
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-xs font-black uppercase tracking-widest text-muted">
              Password
            </label>
          </div>
          <input
            className="w-full border-b border-border py-2 text-sm font-black focus:border-foreground outline-none transition-all uppercase placeholder:text-muted/40 text-foreground bg-transparent"
            name="password"
            placeholder="••••••••"
            autoComplete="current-password"
            type="password"
            required
          />
        </div>

        <button
          type="submit"
          className="mt-4 w-full py-4 bg-foreground text-background text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all active:scale-[0.98] cursor-pointer"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
