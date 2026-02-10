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
    <div className="w-full h-full flex flex-col justify-center p-10 bg-card border border-foreground transition-colors">
      <div className="mb-10">
        <h2 className="text-3xl text-foreground font-black uppercase tracking-tighter italic">
          Register
        </h2>
        <p className="text-xs font-bold text-foreground/70 uppercase tracking-widest mt-2">
          Create an account
        </p>
      </div>

      <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
        {/* Full Name Field */}
        <div className="space-y-1">
          <label className="text-xs font-black uppercase tracking-widest text-foreground/70">
            Full Name
          </label>
          <input
            className="w-full border-b border-foreground/20 py-2 text-sm font-black focus:border-foreground outline-none transition-all uppercase placeholder:text-foreground/30 bg-transparent text-foreground"
            name="name"
            placeholder="E.G. TONY MONTANA"
            autoComplete="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        {/* Email Field */}
        <div className="space-y-1">
          <label className="text-xs font-black uppercase tracking-widest text-foreground/70">
            Email
          </label>
          <input
            className="w-full border-b border-foreground/20 py-2 text-sm font-black focus:border-foreground outline-none transition-all uppercase placeholder:text-foreground/30 bg-transparent text-foreground"
            name="email"
            placeholder="tonymontana@scarface.com"
            autoComplete="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {/* Password Field */}
        <div className="space-y-1">
          <label className="text-xs font-black uppercase tracking-widest text-foreground/70">
            Password
          </label>
          <input
            className="w-full border-b border-foreground/20 py-2 text-sm font-black focus:border-foreground outline-none transition-all uppercase placeholder:text-foreground/30 bg-transparent text-foreground"
            name="password"
            autoComplete="new-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {/* Password Strength Meter */}
        <div className="flex gap-1 h-1 w-full">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-full flex-1 transition-all duration-500 ${
                i <= strengthCount ? "bg-foreground" : "bg-foreground/10"
              }`}
            />
          ))}
        </div>

        {/* Requirements List */}
        <div className="space-y-2 mt-2">
          {requirements.map((req, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-3 text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                req.met ? "text-foreground" : "text-foreground/30"
              }`}
            >
              <div
                className={`w-3 h-3 border border-foreground flex items-center justify-center transition-all ${
                  req.met
                    ? "bg-foreground text-background"
                    : "bg-transparent text-transparent"
                }`}
              >
                <Check size={8} strokeWidth={4} />
              </div>
              <span>{req.label}</span>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isFormValid}
          className={`mt-4 w-full py-4 text-xs font-black uppercase tracking-widest transition-all duration-300
            ${
              isFormValid
                ? "bg-foreground text-background hover:opacity-90 cursor-pointer shadow-lg active:scale-[0.98]"
                : "bg-foreground/10 text-foreground/30 cursor-not-allowed"
            }`}
        >
          {isFormValid
            ? "Initialize Account"
            : name.length < 2
              ? "Enter Full Name"
              : !email.includes("@") || !email.includes(".")
                ? "Invalid Email Address"
                : "Criteria Pending"}
        </button>
      </form>
    </div>
  );
};

export default Signup;
