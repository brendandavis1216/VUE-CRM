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
  const { initiateGoogleCalendarAuth, googleCalendarEvents } = useAppContext();
  const { session, isLoading } = useSession();

  // Determine if Google Calendar is considered "connected"
  // For simplicity, we'll consider it connected if we have successfully fetched any Google Calendar events.
  const isConnected = googleCalendarEvents.length > 0;

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

  return (
    <Button
      variant="outline"
      onClick={handleConnect}
      disabled={!session || isConnected} // Disable if not logged in or already connected
      className={isConnected ? "bg-green-600 text-white hover:bg-green-700" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}
    >
      {isConnected ? (
        <>
          <CheckCircle2 className="mr-2 h-4 w-4" /> Google Calendar Connected
        </>
      ) : (
        <>
          <CalendarPlus className="mr-2 h-4 w-4" /> Connect Google Calendar
        </>
      )}
    </Button>
  );
};