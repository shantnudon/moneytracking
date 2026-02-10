"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
}) {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  };

  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div
        ref={modalRef}
        className={`bg-white border border-black p-4 sm:p-6 md:p-8 w-full ${sizeClasses[size]} animate-in zoom-in-95 duration-200 shadow-2xl my-8 max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex justify-between items-center mb-4 sm:mb-6 md:mb-8">
          <h2 className="text-lg sm:text-xl font-black uppercase tracking-tighter italic">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="hover:rotate-90 transition-transform shrink-0 ml-4"
            type="button"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
