"use client";

import React from "react";
import { Outlet } from "react-router-dom";
import { MobileNav } from "./MobileNav";

export const MobileLayout = () => {
  return (
    <div className="dark min-h-screen bg-background text-foreground flex flex-col">
      <div className="flex-grow overflow-y-auto pb-16"> {/* pb-16 to account for fixed bottom nav */}
        <Outlet />
      </div>
      <MobileNav />
    </div>
  );
};