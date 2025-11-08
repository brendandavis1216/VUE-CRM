"use client";

import React from "react";
import { NavLink } from "react-router-dom";
import { Users, ClipboardList, LayoutDashboard, BriefcaseBusiness, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

export const MobileNav = () => {
  const navItems = [
    { name: "Clients", icon: Users, path: "/clients" },
    { name: "Inquiries", icon: BriefcaseBusiness, path: "/inquiries" },
    { name: "Events", icon: ClipboardList, path: "/events" },
    { name: "Calendar", icon: CalendarDays, path: "/calendar" },
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
                "flex flex-col items-center justify-center text-xs font-medium transition-colors p-2 rounded-md", // Base styles: padding and rounded corners
                "text-muted-foreground hover:text-primary", // Default color (white) and hover effect (dark blue/gray)
                isActive && "text-primary-foreground ring-2 ring-offset-2 ring-offset-background ring-primary" // Active state: white text and outline
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