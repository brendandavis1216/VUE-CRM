"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { CalendarPlus, CheckCircle2 } from "lucide-react"; // Import CheckCircle2 icon
import { useAppContext } from "@/context/AppContext";
import { useSession } from "@/components/SessionContextProvider";
import { toast } from "sonner";

interface GoogleCalendarConnectButtonProps {
  onConnectSuccess?: () => void;
}

export const GoogleCalendarConnectButton: React.FC<GoogleCalendarConnectButtonProps> = ({ onConnectSuccess }) => {
  const { initiateGoogleCalendarAuth, isGoogleCalendarConnected } = useAppContext(); // Use isGoogleCalendarConnected
  const { session, isLoading } = useSession();

  // The isConnected logic now directly uses the state from AppContext
  const isConnected = isGoogleCalendarConnected;

  const handleConnect = async () => {
    if (!session) {
      toast.error("You need to be logged in to connect Google Calendar.");
      return;
    }
    try {
      await initiateGoogleCalendarAuth();
      onConnectSuccess?.();
    } catch (error) {
      console.error("Failed to initiate Google Calendar connection:", error);
    }
  };

  if (isLoading) {
    return null; // Or a loading spinner
  }

  if (isConnected) {
    return (
      <div className="flex items-center text-green-500">
        <CheckCircle2 className="mr-2 h-5 w-5" />
        <span className="text-sm font-medium">Google Calendar Connected</span>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={handleConnect}
      disabled={!session} // Disable if not logged in
      className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
    >
      <CalendarPlus className="mr-2 h-4 w-4" /> Connect Google Calendar
    </Button>
  );
};