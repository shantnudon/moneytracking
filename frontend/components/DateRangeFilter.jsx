"use client";

import React from "react";

const DateRangeFilter = ({ onRangeChange, currentRange }) => {
  const ranges = [
    { label: "7D", value: 7 },
    { label: "30D", value: 30 },
    { label: "90D", value: 90 },
    { label: "1Y", value: 365 },
    { label: "All", value: "all" },
  ];

  return (
    <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
      {ranges.map((range) => (
        <button
          key={range.value}
          onClick={() => onRangeChange(range.value)}
          className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
            currentRange === range.value
              ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
};

export default DateRangeFilter;
