"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Pencil, ChevronDown, PlusCircle, FileSignature } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ClientEditForm } from "@/components/ClientEditForm";
import { ClientFilterSort } from "@/components/ClientFilterSort";
import { ClientAddForm } from "@/components/ClientAddForm";
import { InquiryForm } from "@/components/InquiryForm";
import { Client } from "@/types/app";
import { DocuSignConnectButton } from "@/components/DocuSignConnectButton"; // Import DocuSignConnectButton
import { SendContractForm } from "@/components/SendContractForm"; // Import SendContractForm
import { useSearchParams } from "react-router-dom"; // Import useSearchParams
import { toast } from "sonner";

type SortBy = 'none' | 'school' | 'averageEventSize' | 'numberOfEvents' | 'clientScore';
type SortOrder = 'asc' | 'desc';

const ClientsPage = () => {
  const { clients, updateClient, addClient, addInquiry, isDocuSignConnected } = useAppContext();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // State for adding inquiry from client card
  const [isAddInquiryDialogOpen, setIsAddInquiryDialogOpen] = useState(false);
  const [clientForNewInquiry, setClientForNewInquiry] = useState<Client | null>(null);

  // State for sending contract
  const [isSendContractDialogOpen, setIsSendContractDialogOpen] = useState(false);
  const [clientForContract, setClientForContract] = useState<Client | null>(null);

  // State for filtering and sorting
  const [filterSchool, setFilterSchool] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>('none');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const [searchParams, setSearchParams] = useSearchParams();

  // Handle DocuSign Auth Callback Success
  useEffect(() => {
    const docusignAuthSuccess = searchParams.get('docusign_auth_success');
    if (docusignAuthSuccess === 'true') {
      toast.success("DocuSign connected successfully!");
      // Remove the query parameter from the URL
      searchParams.delete('docusign_auth_success');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleEditClick = (client: Client) => {
    setSelectedClient(client);
    setIsEditDialogOpen(true);
  };

  const handleClientUpdate = (updatedValues: Omit<Client, 'id' | 'numberOfEvents' | 'clientScore' | 'averageEventSize'>) => {
    if (selectedClient) {
      updateClient(selectedClient.id, updatedValues);
    }
    setIsEditDialogOpen(false);
    setSelectedClient(null);
  };

  const handleAddClientSubmit = (newClientData: Omit<Client, 'id' | 'numberOfEvents' | 'clientScore' | 'averageEventSize'>) => {
    addClient(newClientData);
    setIsAddClientDialogOpen(false);
  };

  const handleAddInquiryClick = (client: Client) => {
    setClientForNewInquiry(client);
    setIsAddInquiryDialogOpen(true);
  };

  const handleAddInquirySubmit = (newInquiryData: Parameters<typeof addInquiry>[0]) => {
    if (clientForNewInquiry) {
      addInquiry(newInquiryData, clientForNewInquiry.id);
    } else {
      addInquiry(newInquiryData); // Fallback if clientForNewInquiry is somehow null
    }
    setIsAddInquiryDialogOpen(false);
    setClientForNewInquiry(null);
  };

  const handleSendContractClick = (client: Client) => {
    if (!isDocuSignConnected) {
      toast.error("Please connect your DocuSign account first.");
      return;
    }
    if (!client.phoneNumber) {
      toast.error("Client must have a phone number on file to send contracts.");
      return;
    }
    setClientForContract(client);
    setIsSendContractDialogOpen(true);
  };

  const handleFilterSortChange = (
    newFilterSchool: string,
    newSortBy: SortBy,
    newSortOrder: SortOrder
  ) => {
    setFilterSchool(newFilterSchool);
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  // Memoize filtered and sorted clients, then group them by school
  const groupedClients = useMemo(() => {
    let currentClients = [...clients];

    // Apply filter by school
    if (filterSchool) {
      currentClients = currentClients.filter(client =>
        client.school.toLowerCase().includes(filterSchool.toLowerCase())
      );
    }

    // Apply global sort before grouping
    if (sortBy !== 'none') {
      currentClients.sort((a, b) => {
        let valA: any;
        let valB: any;

        switch (sortBy) {
          case 'school':
            valA = a.school.toLowerCase();
            valB = b.school.toLowerCase();
            break;
          case 'averageEventSize':
            valA = a.averageEventSize;
            valB = b.averageEventSize;
            break;
          case 'numberOfEvents':
            valA = a.numberOfEvents;
            valB = b.numberOfEvents;
            break;
          case 'clientScore':
            valA = a.clientScore;
            valB = b.clientScore;
            break;
          default:
            return 0;
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Group clients by school
    const groups: { [schoolName: string]: Client[] } = {};
    currentClients.forEach(client => {
      if (!groups[client.school]) {
        groups[client.school] = [];
      }
      groups[client.school].push(client);
    });

    // Convert to an array of { schoolName, clients } for easier rendering
    return Object.entries(groups).map(([schoolName, clients]) => ({
      schoolName,
      clients,
    }));
  }, [clients, filterSchool, sortBy, sortOrder]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-white">Clients</h1>
        <div className="flex gap-2">
          <DocuSignConnectButton /> {/* DocuSign Connect Button */}
          <Dialog open={isAddClientDialogOpen} onOpenChange={setIsAddClientDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Client
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
              <DialogHeader>
                <DialogTitle className="text-white">Add New Client</DialogTitle>
              </DialogHeader>
              <ClientAddForm onSubmit={handleAddClientSubmit} onClose={() => setIsAddClientDialogOpen(false)} />
            </DialogContent>
          </Dialog>
          <ClientFilterSort onFilterSortChange={handleFilterSortChange} />
        </div>
      </div>
      {groupedClients.length === 0 ? (
        <p className="text-center text-muted-foreground mt-8">No clients match your current filters.</p>
      ) : (
        <div className="space-y-8">
          {groupedClients.map(({ schoolName, clients: schoolClients }) => (
            <div key={schoolName} className="space-y-4">
              <h2 className="text-2xl font-bold text-white mb-2">{schoolName}</h2>
              <Accordion type="single" collapsible className="w-full">
                {schoolClients.map((client) => (
                  <Card key={client.id} className="mb-4 bg-card text-card-foreground border-border">
                    <AccordionItem value={client.id} className="border-none">
                      <AccordionTrigger className="flex flex-row items-center justify-between space-y-0 p-4 hover:no-underline group">
                        <CardTitle className="text-lg font-medium text-card-foreground">{client.fraternity}</CardTitle>
                        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                      </AccordionTrigger>
                      <AccordionContent className="p-4 pt-0 text-sm text-card-foreground space-y-2">
                        <p><strong>Contact:</strong> {client.mainContactName} ({client.phoneNumber})</p>
                        <p>
                          <strong>Instagram:</strong>{" "}
                          {client.instagramHandle && client.instagramHandle !== "N/A" ? (
                            <a
                              href={`https://www.instagram.com/${client.instagramHandle.replace(/^@/, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:underline"
                            >
                              {client.instagramHandle}
                            </a>
                          ) : (
                            "N/A"
                          )}
                        </p>
                        <p>
                          <strong>Avg. Event Size:</strong>{" "}
                          {client.numberOfEvents > 0 ? `$${client.averageEventSize.toLocaleString()}` : "N/A"}
                        </p>
                        <p><strong># Events:</strong> {client.numberOfEvents}</p>
                        <p><strong>Client Score:</strong> {client.clientScore}</p>
                        <div className="flex gap-2 mt-4">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/80"
                                onClick={() => handleAddInquiryClick(client)}
                              >
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Inquiry
                              </Button>
                            </DialogTrigger>
                            {isAddInquiryDialogOpen && clientForNewInquiry?.id === client.id && (
                              <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                                <DialogHeader>
                                  <DialogTitle className="text-white">Add New Inquiry for {clientForNewInquiry.fraternity}</DialogTitle>
                                </DialogHeader>
                                <InquiryForm
                                  onSubmit={handleAddInquirySubmit}
                                  onClose={() => setIsAddInquiryDialogOpen(false)}
                                  defaultValues={{
                                    school: clientForNewInquiry.school,
                                    fraternity: clientForNewInquiry.fraternity,
                                    mainContact: clientForNewInquiry.mainContactName,
                                    phoneNumber: clientForNewInquiry.phoneNumber,
                                  }}
                                />
                              </DialogContent>
                            )}
                          </Dialog>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/80"
                            onClick={() => handleEditClick(client)}
                          >
                            <Pencil className="mr-2 h-4 w-4" /> Edit Client
                          </Button>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 mt-2"
                          onClick={() => handleSendContractClick(client)}
                          disabled={!isDocuSignConnected || !client.phoneNumber}
                        >
                          <FileSignature className="mr-2 h-4 w-4" /> Send Contract
                        </Button>
                      </AccordionContent>
                    </AccordionItem>
                  </Card>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      )}

      {selectedClient && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Client: {selectedClient.fraternity}</DialogTitle>
            </DialogHeader>
            <ClientEditForm
              client={selectedClient}
              onSubmit={handleClientUpdate}
              onClose={() => setIsEditDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {clientForContract && (
        <Dialog open={isSendContractDialogOpen} onOpenChange={setIsSendContractDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
            <DialogHeader>
              <DialogTitle className="text-white">Send Contract to {clientForContract.mainContactName}</DialogTitle>
            </DialogHeader>
            <SendContractForm
              client={clientForContract}
              onClose={() => setIsSendContractDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ClientsPage;