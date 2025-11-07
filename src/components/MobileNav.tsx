"use client";

import React from "react";
import { NavLink } from "react-router-dom";
import { Users, ClipboardList, LayoutDashboard, BriefcaseBusiness, CalendarDays } from "lucide-react"; // Import CalendarDays
import { cn } from "@/lib/utils";

export const MobileNav = () => {
  const navItems = [
    { name: "Clients", icon: Users, path: "/clients" },
    { name: "Inquiries", icon: BriefcaseBusiness, path: "/inquiries" },
    { name: "Events", icon: ClipboardList, path: "/events" },
    { name: "Calendar", icon: CalendarDays, path: "/calendar" }, // Add Calendar item
    { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50">
      <div className="flex justify-around h-16 items-center">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center text-xs font-medium text-muted-foreground transition-colors hover:text-primary",
                isActive && "text-primary"
              )
            }
          >
            <item.icon className="h-5 w-5 mb-1" />
            {item.name}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};