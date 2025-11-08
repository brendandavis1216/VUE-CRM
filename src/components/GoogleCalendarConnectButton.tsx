"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { CalendarPlus } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { useSession } from "@/components/SessionContextProvider";
import { toast } from "sonner";

interface GoogleCalendarConnectButtonProps {
  onConnectSuccess?: () => void;
}

export const GoogleCalendarConnectButton: React.FC<GoogleCalendarConnectButtonProps> = ({ onConnectSuccess }) => {
  const { initiateGoogleCalendarAuth } = useAppContext();
  const { session, isLoading } = useSession();

  const handleConnect = async () => {
    if (!session) {
      toast.error("You need to be logged in to connect Google Calendar.");
      return;
    }
    try {
      await initiateGoogleCalendarAuth();
      onConnectSuccess?.();
    } catch (error) {
      // Error handling is already in AppContext, but can add more specific UI feedback here if needed
      console.error("Failed to initiate Google Calendar connection:", error);
    }
  };

  if (isLoading) {
    return null; // Or a loading spinner
  }

  return (
    <Button
      variant="outline"
      onClick={handleConnect}
      disabled={!session}
      className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
    >
      <CalendarPlus className="mr-2 h-4 w-4" /> Connect Google Calendar
    </Button>
  );
};