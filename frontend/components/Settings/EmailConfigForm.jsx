"use client";

import { useState, useEffect } from "react";
import {
  fetchEmailConfig,
  saveEmailConfigAction,
  testEmailConfigAction,
} from "@/actions/miscActions";
import {
  Plus,
  Trash2,
  Save,
  AlertTriangle,
  Mail,
  Server,
  Clock,
  ShieldCheck,
  TestTube,
  Edit,
  Brain,
  FileText,
  Key,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";

export default function EmailConfigForm() {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [hasExistingConfig, setHasExistingConfig] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [expandedSender, setExpandedSender] = useState(null);

  const [formData, setFormData] = useState({
    emailUser: "",
    emailPassword: "",
    host: "imap.gmail.com",
    port: 993,
    scanFrequency: 24,
    processingType: "REGEX",
    monitoredSenders: [],
  });

  const [newSender, setNewSender] = useState({ email: "", pdfPasswords: [] });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const response = await fetchEmailConfig();
    if (response.success && response.data) {
      setHasExistingConfig(true);
      setFormData((prev) => ({
        ...prev,
        ...response.data,
        monitoredSenders: response.data.monitoredSenders || [],
        emailPassword: "",
      }));
    } else {
      setIsEditMode(true);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const syncWhitelist = async (updatedSenders) => {
    setFormData((prev) => ({ ...prev, monitoredSenders: updatedSenders }));
    if (!isEditMode && hasExistingConfig) {
      try {
        await saveEmailConfigAction({
          ...formData,
          monitoredSenders: updatedSenders,
          emailPassword: "",
        });
      } catch (error) {
        setMessage({ type: "error", text: "SYNC FAILED: " + error.message });
      }
    }
  };

  const addSender = () => {
    if (
      newSender.email &&
      !formData.monitoredSenders.some((s) => s.email === newSender.email)
    ) {
      const updated = [...formData.monitoredSenders, { ...newSender }];
      syncWhitelist(updated);
      setNewSender({ email: "", pdfPasswords: [] });
    }
  };

  const removeSender = (emailToRemove) => {
    const updated = formData.monitoredSenders.filter(
      (s) => s.email !== emailToRemove,
    );
    syncWhitelist(updated);
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await testEmailConfigAction({
        emailUser: formData.emailUser,
        emailPassword: formData.emailPassword,
        host: formData.host,
        port: Number(formData.port),
      });
      setMessage({
        type: res.success ? "success" : "error",
        text: res.success ? "PROTOCOL LINK SUCCESSFUL" : res.error,
      });
    } finally {
      setTesting(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 5000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await saveEmailConfigAction({
        ...formData,
        port: Number(formData.port),
        scanFrequency: Number(formData.scanFrequency),
      });
      if (res.success) {
        setMessage({ type: "success", text: "CONFIGURATION COMMITTED" });
        setIsEditMode(false);
        setHasExistingConfig(true);
        loadConfig();
      }
    } finally {
      setLoading(false);
    }
  };

  const labelClass =
    "text-xs font-black uppercase tracking-widest text-zinc-400 mb-1 block";

  return (
    <div className="max-w-4xl space-y-16 animate-in fade-in duration-500 pb-20">
      <div className="border border-black p-6 flex gap-4 bg-zinc-50 rounded-none">
        <AlertTriangle className="text-black shrink-0" size={20} />
        <div className="space-y-1">
          <p className="text-xs font-black uppercase tracking-widest italic">
            Auth Protocol Notice
          </p>
          <p className="text-xs font-bold text-zinc-500 uppercase leading-relaxed">
            Gmail Integration requires{" "}
            <span className="text-black underline">App Passwords</span>.
            Standard account credentials will be rejected by the IMAP layer.
          </p>
        </div>
      </div>

      <section className="space-y-8">
        <div className="flex justify-between items-end border-b border-black pb-4">
          <div className="flex items-center gap-3">
            <Server size={20} className="text-black" />
            <h3 className="font-black uppercase tracking-widest text-sm text-black">
              Protocol Config
            </h3>
          </div>
          <div className="flex gap-6">
            {!isEditMode && hasExistingConfig && (
              <button
                onClick={handleTest}
                disabled={testing}
                className="text-xs font-black uppercase border-b border-black/20 hover:border-black transition-all"
              >
                {testing ? "Testing..." : "Test Link"}
              </button>
            )}
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className="text-xs font-black uppercase border-b border-black/20 hover:border-black transition-all"
            >
              {isEditMode ? "Abort" : "Modify"}
            </button>
          </div>
        </div>

        <div className="pt-4">
          {!isEditMode ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
              <SummaryItem label="Identity" value={formData.emailUser} />
              <SummaryItem
                label="Host"
                value={`${formData.host}:${formData.port}`}
              />
              <SummaryItem
                label="Interval"
                value={`${formData.scanFrequency} Hours`}
              />
              <SummaryItem label="Logic" value={formData.processingType} />
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-12 animate-in slide-in-from-top-2"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                <BlueprintInput
                  label="Email Address"
                  name="emailUser"
                  value={formData.emailUser}
                  onChange={handleChange}
                  type="email"
                />
                <BlueprintInput
                  label="App Password"
                  name="emailPassword"
                  value={formData.emailPassword}
                  onChange={handleChange}
                  type="password"
                  placeholder="••••••••"
                />
                <BlueprintInput
                  label="Host"
                  name="host"
                  value={formData.host}
                  onChange={handleChange}
                />
                <BlueprintInput
                  label="Port"
                  name="port"
                  value={formData.port}
                  onChange={handleChange}
                  type="number"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-1">
                  <label className={labelClass}>Sync Frequency</label>
                  <select
                    name="scanFrequency"
                    value={formData.scanFrequency}
                    onChange={handleChange}
                    className="w-full border-b border-black/20 py-2 text-sm font-black focus:border-black outline-none bg-transparent appearance-none uppercase rounded-none"
                  >
                    <option value="6">06 HOURS</option>
                    <option value="12">12 HOURS</option>
                    <option value="24">24 HOURS</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Processing Logic</label>
                  <select
                    name="processingType"
                    value={formData.processingType}
                    onChange={handleChange}
                    className="w-full border-b border-black/20 py-2 text-sm font-black focus:border-black outline-none bg-transparent appearance-none uppercase rounded-none"
                  >
                    <option value="REGEX">PATTERN (REGEX)</option>
                    <option value="AI">INTELLIGENT (AI)</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-4 bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition-all rounded-none"
              >
                {loading ? "Committing..." : "Save Configuration"}
              </button>
            </form>
          )}
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex items-center gap-3 border-b border-black pb-4">
          <ShieldCheck size={20} className="text-black" />
          <h3 className="font-black uppercase tracking-widest text-sm text-black">
            Senders Whitelist
          </h3>
        </div>

        <div className="space-y-8">
          <div className="flex gap-4">
            <input
              type="email"
              placeholder="SENDER@BANK.COM"
              value={newSender.email}
              onChange={(e) =>
                setNewSender({
                  ...newSender,
                  email: e.target.value.toUpperCase(),
                })
              }
              className="flex-1 border-b border-black/20 py-4 text-xs font-black uppercase focus:border-black outline-none transition-all placeholder-zinc-200 rounded-none bg-transparent"
            />
            <button
              onClick={addSender}
              className="px-6 py-4 border border-black text-xs font-black uppercase hover:bg-black hover:text-white transition-all rounded-none"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="divide-y divide-black/5 border-t border-black/5">
            {formData.monitoredSenders.length === 0 ? (
              <p className="py-12 text-center text-xs font-black uppercase tracking-widest text-zinc-300 italic">
                Whitelist Empty
              </p>
            ) : (
              formData.monitoredSenders.map((sender) => (
                <div key={sender.email} className="group transition-all">
                  <div className="flex items-center justify-between py-6">
                    <div className="flex items-center gap-6">
                      <div className="w-10 h-10 border border-black flex items-center justify-center text-xs font-black group-hover:bg-black group-hover:text-white transition-all">
                        {sender.email[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-black uppercase tracking-tighter italic text-black">
                          {sender.email}
                        </p>
                        <p className="text-xs] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                          {sender.pdfPasswords?.length || 0} Registered Keys
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <button
                        onClick={() =>
                          setExpandedSender(
                            expandedSender === sender.email
                              ? null
                              : sender.email,
                          )
                        }
                        className="p-2 hover:bg-zinc-100 transition-colors"
                      >
                        {expandedSender === sender.email ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </button>
                      <button
                        onClick={() => removeSender(sender.email)}
                        className="p-2 text-zinc-300 hover:text-black transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {expandedSender === sender.email && (
                    <div className="pb-8 pl-16 space-y-6 animate-in slide-in-from-top-2">
                      <div className="space-y-4">
                        <label className="text-xs font-black uppercase tracking-widest text-black">
                          Decryption Keys
                        </label>
                        <div className="flex flex-wrap gap-3">
                          {sender.pdfPasswords?.map((pwd) => (
                            <span
                              key={pwd}
                              className="inline-flex items-center gap-2 px-3 py-1.5 border border-black text-xs font-black uppercase text-black"
                            >
                              <Key size={12} /> {pwd}
                              <button
                                onClick={() =>
                                  removePdfPasswordFromSender(sender.email, pwd)
                                }
                                className="ml-2 hover:opacity-50"
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                          <input
                            type="text"
                            placeholder="ADD NEW KEY"
                            className="text-xs font-black uppercase border-b border-black/10 outline-none w-32 focus:border-black bg-transparent py-1"
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                addPdfPasswordToSender(
                                  sender.email,
                                  e.currentTarget.value.toUpperCase(),
                                );
                                e.currentTarget.value = "";
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {message.text && (
        <div className="fixed bottom-12 right-12 bg-black text-white px-8 py-4 border border-white flex items-center gap-4 animate-in slide-in-from-bottom-4 shadow-none z-100">
          <span className="text-xs font-black uppercase tracking-widest">
            {message.text}
          </span>
          <button
            onClick={() => setMessage({ text: "" })}
            className="hover:opacity-50 transition-opacity"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-black uppercase tracking-widest text-zinc-400">
        {label}
      </p>
      <p className="text-sm font-black uppercase tracking-tighter truncate text-black">
        {value || "NONE"}
      </p>
    </div>
  );
}

function BlueprintInput({ label, ...props }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-black uppercase tracking-widest text-zinc-400">
        {label}
      </label>
      <input
        {...props}
        className="w-full border-b border-black/20 py-2 text-sm font-black focus:border-black outline-none transition-all bg-transparent uppercase placeholder-zinc-200 rounded-none text-black"
      />
    </div>
  );
}
