"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Login from "@/components/auth/Login";
import Signup from "@/components/auth/Signup";
import { showSuccessToast, showErrorToast } from "@/utils/alert";
import { postLoginAction, postSignupAction } from "@/actions/authActions";
import { useUserStore } from "@/store/useUserStore";

export default function Page() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const setUser = useUserStore((state) => state.setUser);

  const handleLoginSubmit = async (data) => {
    try {
      const res = await postLoginAction(data);
      if (res.success) {
        if (res.user?.theme) {
          localStorage.setItem("theme", res.user.theme);
        }
        setUser(res.user);
        showSuccessToast("SESSION AUTHORIZED");
        router.push("/dashboard");
        router.refresh();
      } else {
        showErrorToast(
          res.error || "INVALID CREDENTIALS",
          "AUTHENTICATION FAILED",
        );
      }
    } catch (error) {
      showErrorToast("UNABLE TO CONNECT TO SERVER", "SYSTEM ERROR");
      console.log(error);
    }
  };

  const handleSignupSubmit = async (data) => {
    try {
      const res = await postSignupAction(data);
      if (res.success) {
        console.log("[Signup Debug] User data received:", res.user);
        if (res.user?.theme) {
          localStorage.setItem("theme", res.user.theme);
        }
        setUser(res.user);

        await new Promise((resolve) => setTimeout(resolve, 100));

        showSuccessToast("REGISTRATION COMPLETE & LOGGED IN");
        router.push("/dashboard");
      } else {
        showErrorToast(
          res.error || "COULD NOT CREATE ACCOUNT",
          "REGISTRATION FAILED",
        );
      }
    } catch (error) {
      showErrorToast("UNABLE TO CONNECT TO SERVER", "SYSTEM ERROR");
      console.log(error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground font-sans p-6">
      <div className="flex flex-col items-center gap-12 w-full max-w-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-foreground text-background flex items-center justify-center font-black italic text-2xl">
            M
          </div>
          <h1 className="text-xs font-black tracking-normal uppercase italic text-foreground">
            Money-Tracker
          </h1>
        </div>

        <div className="grid grid-cols-2 w-full border border-foreground overflow-hidden">
          <button
            onClick={() => setIsSignUp(false)}
            className={`py-4 text-xs font-black uppercase tracking-widest transition-all
              ${
                !isSignUp
                  ? "bg-foreground text-background"
                  : "bg-background text-foreground hover:bg-muted/10"
              }`}
          >
            Authenticate
          </button>
          <button
            onClick={() => setIsSignUp(true)}
            className={`py-4 text-xs font-black uppercase tracking-widest transition-all
              ${
                isSignUp
                  ? "bg-foreground text-background"
                  : "bg-background text-foreground hover:bg-muted/10"
              }`}
          >
            Register
          </button>
        </div>

        <div className="relative w-full transition-all duration-500">
          <div
            className={`transition-all duration-500 ${
              !isSignUp
                ? "opacity-100 translate-y-0 relative z-10"
                : "opacity-0 translate-y-8 absolute inset-0 pointer-events-none z-0"
            }`}
          >
            <Login onLogin={handleLoginSubmit} />
          </div>

          <div
            className={`transition-all duration-500 ${
              isSignUp
                ? "opacity-100 translate-y-0 relative z-10"
                : "opacity-0 translate-y-8 absolute inset-0 pointer-events-none z-0"
            }`}
          >
            <Signup onSignup={handleSignupSubmit} />
          </div>
        </div>

        {/* TODO : need to make an API or something that will get the version from the github and compare and show if there is an update pending or not*/}
        <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest">
          Github Version v0.1
        </p>
      </div>
    </div>
  );
}
