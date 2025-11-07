"use client";

import React from "react";
import { Users } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Keeping Card for consistent styling

const ClientsPage = () => {
  const { clients } = useAppContext();

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
                <AccordionTrigger className="flex flex-row items-center justify-between space-y-0 p-4 hover:no-underline">
                  <CardTitle className="text-lg font-medium text-card-foreground">{client.fraternity} - {client.school}</CardTitle>
                  <Users className="h-5 w-5 text-muted-foreground" />
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0 text-sm text-card-foreground">
                  <p><strong>Contact:</strong> {client.mainContactName} ({client.phoneNumber})</p>
                  <p><strong>Instagram:</strong> {client.instagramHandle}</p>
                  <p><strong>Avg. Event Size:</strong> ${client.averageEventSize.toLocaleString()}</p>
                  <p><strong># Events:</strong> {client.numberOfEvents}</p>
                  <p><strong>Client Score:</strong> {client.clientScore} (placeholder)</p>
                </AccordionContent>
              </AccordionItem>
            </Card>
          ))}
        </Accordion>
      )}
    </div>
  );
};

export default ClientsPage;