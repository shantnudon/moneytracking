"use client";

import NotificationBell from "./NotificationBell";

export default function TopBar() {
  return (
    <header className="h-16 flex items-center justify-end px-4 md:px-8 bg-background border-b border-black">
      <div className="flex items-center gap-4 md:gap-8 h-full">
        <NotificationBell />
        {/* TODO: Show the username and user avatar in here */}
        <div className="flex items-center gap-2 md:gap-3 pl-4 md:pl-8 border-l border-black h-full group cursor-pointer">
          {/* <span className="hidden sm:block text-xs font-black uppercase tracking-widest group-hover:italic">
            User Photo
          </span> */}
          <div className="w-8 h-8 border border-black flex items-center justify-center font-black text-xs group-hover:bg-black group-hover:text-white transition-all">
            DON
          </div>
        </div>
      </div>
    </header>
  );
}
