"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileSignature } from "lucide-react"; // Removed CheckCircle2 as it's no longer needed
import { useAppContext } from "@/context/AppContext";
import { useSession } from "@/components/SessionContextProvider";
import { toast } from "sonner";
import { useSearchParams, useNavigate } from "react-router-dom";

interface DocuSignConnectButtonProps {
  onConnectSuccess?: () => void;
}

export const DocuSignConnectButton: React.FC<DocuSignConnectButtonProps> = ({ onConnectSuccess }) => {
  const { initiateDocuSignAuth, isDocuSignConnected } = useAppContext();
  const { session, isLoading } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Handle DocuSign Auth Callback Success
  useEffect(() => {
    const docusignAuthSuccess = searchParams.get('docusign_auth_success');
    if (docusignAuthSuccess === 'true') {
      toast.success("DocuSign connected successfully!");
      // Remove the query parameter from the URL
      searchParams.delete('docusign_auth_success');
      setSearchParams(searchParams, { replace: true });
      onConnectSuccess?.();
    }
  }, [searchParams, setSearchParams, onConnectSuccess]);

  const handleConnect = async () => {
    if (!session) {
      toast.error("You need to be logged in to connect DocuSign.");
      return;
    }
    try {
      await initiateDocuSignAuth();
    } catch (error) {
      console.error("Failed to initiate DocuSign connection:", error);
    }
  };

  if (isLoading) {
    return null; // Or a loading spinner
  }

  // Only render the button if DocuSign is NOT connected
  if (isDocuSignConnected) {
    return null;
  }

  return (
    <Button
      variant="outline"
      onClick={handleConnect}
      disabled={!session} // Only disable if not logged in
      className="bg-secondary text-secondary-foreground hover:bg-secondary/80" // Always use the "connect" styling
    >
      <FileSignature className="mr-2 h-4 w-4" /> Connect DocuSign
    </Button>
  );
};