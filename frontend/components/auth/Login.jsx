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
    <div className="w-full h-full flex flex-col justify-center p-10 bg-white border border-black transition-all">
      <div className="mb-10">
        <h2 className="text-3xl dark:text-background font-black uppercase tracking-tighter italic">
          Authenticate
        </h2>
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-2">
          Access your financial ledger on the go
        </p>
      </div>

      <form className="flex flex-col gap-8 dark:text-background" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label className="text-xs font-black uppercase tracking-widest text-zinc-400">
            Email
          </label>
          <input
            className="w-full border-b border-black/20 py-2 text-sm font-black focus:border-black outline-none transition-all uppercase placeholder-zinc-200"
            name="email"
            placeholder="tonymontana@scarface.com"
            autoComplete="email"
            type="email"
            required
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-400">
              Password
            </label>
            {/* TODO : Make the recovery button workin as in the backend needs some changes and the frontend too.. maybe need to make a page like forgot-password/[id]/page.jsx. where the id would be the recovery token sent by the backend. but if the user doesnt have SMTP then? we can log that URL in the logs maybe.. but then the user should have added the website frontend URL in the .env file. */}
            {/* <button
              type="button"
              className="text-xs] font-black border-b border-black/10 hover:border-black transition-all uppercase tracking-tighter text-zinc-400 hover:text-black"
            >
              Recovery
            </button>*/}
          </div>
          <input
            className="w-full border-b border-black/20 py-2 text-sm font-black focus:border-black outline-none transition-all placeholder-zinc-200"
            name="password"
            placeholder="••••••••"
            autoComplete="current-password"
            type="password"
            required
          />
        </div>

        {/* TODO : Make the session persistent as in when the token is gonna expire a refresh token is received from the backend */}
        {/* <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="remember"
            className="w-4 h-4 border border-black rounded-none appearance-none checked:bg-black checked:border-black transition-all cursor-pointer relative checked:after:content-['✓'] checked:after:text-white checked:after:text-xs checked:after:absolute checked:after:left-0.5 checked:after:top-[-1px]"
          />
          <label
            htmlFor="remember"
            className="text-xs font-black uppercase tracking-widest text-zinc-400"
          >
            Persistent Session
          </label>
        </div>*/}

        <button
          type="submit"
          className="mt-4 w-full py-4 bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition-all active:scale-[0.98]"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
