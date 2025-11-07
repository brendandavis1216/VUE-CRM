"use client";

import React, { useState, useMemo } from "react";
import { Pencil, ChevronDown, PlusCircle } from "lucide-react";
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
import { Client } from "@/types/app";

type SortBy = 'none' | 'school' | 'averageEventSize' | 'numberOfEvents' | 'clientScore';
type SortOrder = 'asc' | 'desc';

const ClientsPage = () => {
  const { clients, updateClient, addClient } = useAppContext();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // State for filtering and sorting
  const [filterSchool, setFilterSchool] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>('none');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

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

  const handleAddClientSubmit = (newClientData: Omit<Client, 'id' | 'numberOfEvents' | 'clientScore'>) => {
    addClient(newClientData);
    setIsAddDialogOpen(false);
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

  // Memoize filtered and sorted clients to prevent unnecessary re-renders
  const filteredAndSortedClients = useMemo(() => {
    let currentClients = [...clients];

    // Apply filter by school
    if (filterSchool) {
      currentClients = currentClients.filter(client =>
        client.school.toLowerCase().includes(filterSchool.toLowerCase())
      );
    }

    // Apply sort
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

    return currentClients;
  }, [clients, filterSchool, sortBy, sortOrder]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-white">Clients</h1>
        <div className="flex gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Client
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
              <DialogHeader>
                <DialogTitle className="text-white">Add New Client</DialogTitle>
              </DialogHeader>
              <ClientAddForm onSubmit={handleAddClientSubmit} onClose={() => setIsAddDialogOpen(false)} />
            </DialogContent>
          </Dialog>
          <ClientFilterSort onFilterSortChange={handleFilterSortChange} />
        </div>
      </div>
      {filteredAndSortedClients.length === 0 ? (
        <p className="text-center text-muted-foreground mt-8">No clients match your current filters.</p>
      ) : (
        <Accordion type="single" collapsible className="w-full">
          {filteredAndSortedClients.map((client) => (
            <Card key={client.id} className="mb-4 bg-card text-card-foreground border-border">
              <AccordionItem value={client.id} className="border-none">
                <AccordionTrigger className="flex flex-row items-center justify-between space-y-0 p-4 hover:no-underline [&>svg]:hidden group">
                  <CardTitle className="text-lg font-medium text-card-foreground">{client.school} - {client.fraternity}</CardTitle>
                  <div className="flex items-center gap-2">
                    <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0 text-sm text-card-foreground">
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