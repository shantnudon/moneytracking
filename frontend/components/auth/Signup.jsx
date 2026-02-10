"use client";

import React, { useState, useEffect } from "react";
import { Check } from "lucide-react";

const Signup = ({ onSignup }) => {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [validations, setValidations] = useState({
    length: false,
    case: false,
    number: false,
    special: false,
  });

  const strengthCount = Object.values(validations).filter(Boolean).length;
  const allConditionsMet = Object.values(validations).every(Boolean);
  const isFormValid =
    name.length >= 2 &&
    email.includes("@") &&
    email.includes(".") &&
    allConditionsMet;

  useEffect(() => {
    setValidations({
      length: password.length >= 8,
      case: /[a-z]/.test(password) && /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    });
  }, [password]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    onSignup(data);
  };

  const requirements = [
    { label: "8 Character Minimum", met: validations.length },
    { label: "Upper & Lower Case Value", met: validations.case },
    { label: "Numeric Value", met: validations.number },
    { label: "Symbolic Value", met: validations.special },
  ];

  return (
    <div className="w-full h-full flex flex-col justify-center p-10 bg-white border border-black transition-all">
      <div className="mb-10">
        <h2 className="text-3xl dark:text-background font-black uppercase tracking-tighter italic">
          Register
        </h2>
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-2">
          Create an account
        </p>
      </div>

      <form className="flex flex-col gap-6 dark:text-background " onSubmit={handleSubmit}>
        <div className="space-y-1 ">
          <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ">
            Full Name
          </label>
          <input
            className="w-full border-b border-black/20 py-2 text-sm font-black focus:border-black outline-none transition-all uppercase placeholder-zinc-200 "
            name="name"
            placeholder="E.G. TONY MONTANA"
            autoComplete="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-black uppercase tracking-widest text-zinc-400">
            Password
          </label>
          <input
            className="w-full border-b border-black/20 py-2 text-sm font-black focus:border-black outline-none transition-all placeholder-zinc-200"
            name="password"
            autoComplete="new-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="flex gap-1 h-0.5 w-full bg-zinc-100">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-full flex-1 transition-all duration-500 ${
                i <= strengthCount ? "bg-black" : "bg-transparent"
              }`}
            />
          ))}
        </div>

        <div className="space-y-2 mt-2">
          {requirements.map((req, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-3 text-xs] font-black uppercase tracking-widest transition-all duration-300 ${
                req.met ? "text-black" : "text-zinc-300"
              }`}
            >
              <div
                className={`w-3 h-3 border border-black flex items-center justify-center transition-all ${
                  req.met
                    ? "bg-black text-white"
                    : "bg-transparent text-transparent"
                }`}
              >
                <Check size={8} />
              </div>
              <span>{req.label}</span>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={!isFormValid}
          className={`mt-4 w-full py-4 text-xs font-black uppercase tracking-widest transition-all duration-300
            ${
              isFormValid
                ? "bg-black text-white hover:bg-zinc-800 cursor-pointer shadow-xl"
                : "bg-zinc-100 text-zinc-300 cursor-not-allowed"
            }`}
        >
          {/* {allConditionsMet ? "Initialize Account" : "Criteria Pending"} */}
          {isFormValid
            ? "Initialize Account"
            : name.length < 2
              ? "Enter Full Name"
              : !email.includes("@") || !email.includes(".")
                ? "Invalid Email Address"
                : "Password Doesnt Meet the Criteria"}
        </button>
      </form>
    </div>
  );
};

export default Signup;
