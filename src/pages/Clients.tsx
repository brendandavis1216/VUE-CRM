"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { useAppContext } from "@/context/AppContext";

const ClientsPage = () => {
  const { clients } = useAppContext();

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-3xl font-bold text-white text-center">Clients</h1>
      {clients.length === 0 ? (
        <p className="text-center text-muted-foreground mt-8">No clients yet. Inquiries will become clients here!</p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {clients.map((client) => (
            <Card key={client.id} className="bg-card text-card-foreground border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">{client.fraternity} - {client.school}</CardTitle>
                <Users className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="text-sm">
                <p><strong>Contact:</strong> {client.mainContactName} ({client.phoneNumber})</p>
                <p><strong>Instagram:</strong> {client.instagramHandle}</p>
                <p><strong>Avg. Event Size:</strong> ${client.averageEventSize.toLocaleString()}</p>
                <p><strong># Events:</strong> {client.numberOfEvents}</p>
                <p><strong>Client Score:</strong> {client.clientScore} (placeholder)</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientsPage;