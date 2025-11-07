"use client";

import React, { useState } from "react";
import { Pencil, ChevronDown } from "lucide-react"; // Removed Users import
import { useAppContext } from "@/context/AppContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClientEditForm } from "@/components/ClientEditForm";

const ClientsPage = () => {
  const { clients, updateClient } = useAppContext();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const handleEditClick = (client: Client) => {
    setSelectedClient(client);
    setIsEditDialogOpen(true);
  };

  const handleClientUpdate = (updatedValues: Omit<Client, 'id' | 'numberOfEvents' | 'clientScore'>) => {
    if (selectedClient) {
      updateClient(selectedClient.id, updatedValues);
    }
    setIsEditDialogOpen(false);
    setSelectedClient(null);
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-3xl font-bold text-white text-center">Clients</h1>
      {clients.length === 0 ? (
        <p className="text-center text-muted-foreground mt-8">No clients yet. Inquiries will become clients here!</p>
      ) : (
        <Accordion type="single" collapsible className="w-full">
          {clients.map((client) => (
            <Card key={client.id} className="mb-4 bg-card text-card-foreground border-border">
              <AccordionItem value={client.id} className="border-none">
                <AccordionTrigger className="flex flex-row items-center justify-between space-y-0 p-4 hover:no-underline [&>svg]:hidden group">
                  <CardTitle className="text-lg font-medium text-card-foreground">{client.fraternity} - {client.school}</CardTitle>
                  <div className="flex items-center gap-2">
                    {/* Removed Users icon */}
                    <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0 text-sm text-card-foreground">
                  <p><strong>Contact:</strong> {client.mainContactName} ({client.phoneNumber})</p>
                  <p><strong>Instagram:</strong> {client.instagramHandle}</p>
                  <p><strong>Avg. Event Size:</strong> ${client.averageEventSize.toLocaleString()}</p>
                  <p><strong># Events:</strong> {client.numberOfEvents}</p>
                  <p><strong>Client Score:</strong> {client.clientScore} (placeholder)</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 w-full bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    onClick={() => handleEditClick(client)}
                  >
                    <Pencil className="mr-2 h-4 w-4" /> Edit Client
                  </Button>
                </AccordionContent>
              </AccordionItem>
            </Card>
          ))}
        </Accordion>
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
    </div>
  );
};

export default ClientsPage;