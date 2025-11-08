"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppContext } from "@/context/AppContext";
import { Lead, LeadStatus } from "@/types/app";
import { LeadCSVUpload } from "@/components/LeadCSVUpload";
import { LeadEditForm } from "@/components/LeadEditForm";
import { formatPhoneNumber } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"; // Import Accordion components

const LeadsPage = () => {
  const { leads, fetchLeads, updateLead, deleteAllLeads, deleteLead } = useAppContext();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);
  const [isDeleteIndividualDialogOpen, setIsDeleteIndividualDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const groupedLeads = useMemo(() => {
    const groups: { [key in LeadStatus]: Lead[] } = {
      'Interested': [],
      'General': [],
      'Not Interested': [],
    };

    const validStatuses: LeadStatus[] = ['Interested', 'General', 'Not Interested'];

    leads.forEach(lead => {
      const status: LeadStatus = validStatuses.includes(lead.status)
        ? lead.status
        : 'General';
      groups[status].push(lead);
    });

    return groups;
  }, [leads]);

  const handleEditClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsEditDialogOpen(true);
  };

  const handleLeadUpdate = async (leadId: string, updatedValues: Partial<Omit<Lead, 'id' | 'user_id' | 'created_at'>>) => {
    await updateLead(leadId, updatedValues);
    setIsEditDialogOpen(false);
    setSelectedLead(null);
  };

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    await updateLead(leadId, { status: newStatus });
  };

  const handleDeleteAllLeads = async () => {
    await deleteAllLeads();
    setIsDeleteAllDialogOpen(false);
  };

  const handleConfirmDeleteIndividualLead = async () => {
    if (leadToDelete) {
      await deleteLead(leadToDelete.id);
      setIsDeleteIndividualDialogOpen(false);
      setLeadToDelete(null);
    }
  };

  const renderLeadSection = (status: LeadStatus, title: string, leadsList: Lead[]) => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      {leadsList.length === 0 ? (
        <p className="text-muted-foreground">No leads in this category.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Accordion type="single" collapsible className="w-full">
            {leadsList.map((lead) => (
              <Card key={lead.id} className="mb-4 bg-card text-card-foreground border-border">
                <AccordionItem value={lead.id} className="border-none">
                  <AccordionTrigger className="flex flex-row items-center justify-between space-y-0 p-4 hover:no-underline group">
                    <CardTitle className="text-lg font-medium text-card-foreground">{lead.name}</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent accordion from toggling
                        handleEditClick(lead);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit Lead</span>
                    </Button>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 pt-0 text-sm text-card-foreground space-y-2">
                    {lead.school && <p><strong>School:</strong> {lead.school}</p>}
                    {lead.fraternity && <p><strong>Fraternity:</strong> {lead.fraternity}</p>}
                    {lead.phone_number && <p><strong>Phone:</strong> <a href={`tel:${lead.phone_number}`} className="text-blue-400 hover:underline">{formatPhoneNumber(lead.phone_number)}</a></p>}
                    {lead.instagram_handle && <p><strong>Instagram:</strong> <a href={`https://www.instagram.com/${lead.instagram_handle.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{lead.instagram_handle}</a></p>}
                    {lead.election_date && <p><strong>Election Date:</strong> {lead.election_date}</p>}
                    {lead.notes && <p><strong>Notes:</strong> {lead.notes}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <Label htmlFor={`status-${lead.id}`} className="text-white">Status:</Label>
                      <Select value={lead.status} onValueChange={(value: LeadStatus) => handleStatusChange(lead.id, value)}>
                        <SelectTrigger id={`status-${lead.id}`} className="w-[180px] bg-input text-foreground border-border">
                          <SelectValue placeholder="Change status" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover text-popover-foreground border-border">
                          <SelectItem value="General">General</SelectItem>
                          <SelectItem value="Interested">Interested</SelectItem>
                          <SelectItem value="Not Interested">Not Interested</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="mt-4 w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => {
                        setLeadToDelete(lead);
                        setIsDeleteIndividualDialogOpen(true);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete Lead
                    </Button>
                  </AccordionContent>
                </AccordionItem>
              </Card>
            ))}
          </Accordion>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-4 space-y-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-white">Leads</h1>
        <div className="flex gap-2">
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Upload className="mr-2 h-4 w-4" /> Upload CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-card text-card-foreground border-border">
              <DialogHeader>
                <DialogTitle className="text-white">Upload Leads from CSV</DialogTitle>
              </DialogHeader>
              <LeadCSVUpload onUploadSuccess={fetchLeads} onClose={() => setIsUploadDialogOpen(false)} />
            </DialogContent>
          </Dialog>

          <AlertDialog open={isDeleteAllDialogOpen} onOpenChange={setIsDeleteAllDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                <Trash2 className="mr-2 h-4 w-4" /> Delete All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card text-card-foreground border-border">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  This action cannot be undone. This will permanently delete all your leads from the database.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-secondary text-secondary-foreground hover:bg-secondary/80">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAllLeads}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete All Leads
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {renderLeadSection('Interested', 'Interested', groupedLeads.Interested)}
      {renderLeadSection('General', 'General', groupedLeads.General)}
      {renderLeadSection('Not Interested', 'Not Interested', groupedLeads['Not Interested'])}

      {selectedLead && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Lead: {selectedLead.name}</DialogTitle>
            </DialogHeader>
            <LeadEditForm
              lead={selectedLead}
              onSubmit={handleLeadUpdate}
              onClose={() => setIsEditDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {leadToDelete && (
        <AlertDialog open={isDeleteIndividualDialogOpen} onOpenChange={setIsDeleteIndividualDialogOpen}>
          <AlertDialogContent className="bg-card text-card-foreground border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Are you sure you want to delete the lead "{leadToDelete.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-secondary text-secondary-foreground hover:bg-secondary/80">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDeleteIndividualLead}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default LeadsPage;