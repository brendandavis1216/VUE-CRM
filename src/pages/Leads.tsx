"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, Pencil, Trash2, ChevronDown, PlusCircle } from "lucide-react";
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
} from "@/components/ui/accordion";
import { LeadFilterSort } from "@/components/LeadFilterSort";
import { InquiryForm } from "@/components/InquiryForm";
import { Separator } from "@/components/ui/separator";

type SortBy = 'none' | 'name' | 'school' | 'fraternity' | 'status';
type SortOrder = 'asc' | 'desc';

// Helper functions for localStorage
const loadFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const storedValue = localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

const saveToLocalStorage = <T>(key: string, value: T) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

const LeadsPage = () => {
  const { leads, fetchLeads, updateLead, deleteAllLeads, deleteLead, addInquiry } = useAppContext();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteIndividualDialogOpen, setIsDeleteIndividualDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);

  // State for starting inquiry from a lead
  const [isStartInquiryDialogOpen, setIsStartInquiryDialogOpen] = useState(false);
  const [leadForInquiry, setLeadForInquiry] = useState<Lead | null>(null);

  // State for filtering and sorting, initialized from localStorage
  const [filterSchool, setFilterSchool] = useState<string>(() => loadFromLocalStorage('leadsFilterSchool', ''));
  const [filterFraternity, setFilterFraternity] = useState<string>(() => loadFromLocalStorage('leadsFilterFraternity', ''));
  const [sortBy, setSortBy] = useState<SortBy>(() => loadFromLocalStorage('leadsSortBy', 'none'));
  const [sortOrder, setSortOrder] = useState<SortOrder>(() => loadFromLocalStorage('leadsSortOrder', 'asc'));

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleFilterSortChange = (
    newFilterSchool: string,
    newFilterFraternity: string,
    newSortBy: SortBy,
    newSortOrder: SortOrder
  ) => {
    setFilterSchool(newFilterSchool);
    setFilterFraternity(newFilterFraternity);
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);

    // Save to localStorage
    saveToLocalStorage('leadsFilterSchool', newFilterSchool);
    saveToLocalStorage('leadsFilterFraternity', newFilterFraternity);
    saveToLocalStorage('leadsSortBy', newSortBy);
    saveToLocalStorage('leadsSortOrder', newSortOrder);
  };

  const filteredAndSortedLeads = useMemo(() => {
    let currentLeads = [...leads];

    // Apply filters
    if (filterSchool) {
      currentLeads = currentLeads.filter(lead =>
        lead.school?.toLowerCase().includes(filterSchool.toLowerCase())
      );
    }
    if (filterFraternity) {
      currentLeads = currentLeads.filter(lead =>
        lead.fraternity?.toLowerCase().includes(filterFraternity.toLowerCase())
      );
    }

    // Apply sorting
    if (sortBy !== 'none') {
      currentLeads.sort((a, b) => {
        let valA: any;
        let valB: any;

        switch (sortBy) {
          case 'name':
            valA = a.name.toLowerCase();
            valB = b.name.toLowerCase();
            break;
          case 'school':
            valA = a.school?.toLowerCase() || '';
            valB = b.school?.toLowerCase() || '';
            break;
          case 'fraternity':
            valA = a.fraternity?.toLowerCase() || '';
            valB = b.fraternity?.toLowerCase() || '';
            break;
          case 'status':
            valA = a.status.toLowerCase();
            valB = b.status.toLowerCase();
            break;
          default:
            return 0;
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return currentLeads;
  }, [leads, filterSchool, filterFraternity, sortBy, sortOrder]);

  const groupedLeadsByStatus = useMemo(() => {
    const groups: { [key in LeadStatus]: Lead[] } = {
      'Interested': [],
      'General': [],
      'Not Interested': [],
    };

    const validStatuses: LeadStatus[] = ['Interested', 'General', 'Not Interested'];

    filteredAndSortedLeads.forEach(lead => {
      const status: LeadStatus = validStatuses.includes(lead.status)
        ? lead.status
        : 'General';
      groups[status].push(lead);
    });

    return groups;
  }, [filteredAndSortedLeads]);

  const groupedLeadsBySchool = useMemo(() => {
    if (sortBy !== 'school') return {};

    const groups: { [schoolName: string]: Lead[] } = {};
    filteredAndSortedLeads.forEach(lead => {
      const schoolName = lead.school || 'No School Specified';
      if (!groups[schoolName]) {
        groups[schoolName] = [];
      }
      groups[schoolName].push(lead);
    });
    return groups;
  }, [filteredAndSortedLeads, sortBy]);

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

  const handleConfirmDeleteIndividualLead = async () => {
    if (leadToDelete) {
      await deleteLead(leadToDelete.id);
      setIsDeleteIndividualDialogOpen(false);
      setLeadToDelete(null);
    }
  };

  const handleStartInquiryClick = (lead: Lead) => {
    setLeadForInquiry(lead);
    setIsStartInquiryDialogOpen(true);
  };

  const handleInquirySubmit = (newInquiryData: Parameters<typeof addInquiry>[0]) => {
    if (leadForInquiry) {
      addInquiry(newInquiryData);
    } else {
      addInquiry(newInquiryData);
    }
    setIsStartInquiryDialogOpen(false);
    setLeadForInquiry(null);
  };

  const renderLeadCards = (leadsList: Lead[]) => (
    <Accordion type="single" collapsible className="w-full">
      {leadsList.map((lead) => (
        <Card key={lead.id} className="mb-4 bg-card text-card-foreground border-border">
          <AccordionItem value={lead.id} className="border-none">
            <AccordionTrigger className="flex items-center justify-between p-4 hover:no-underline group [&>svg]:hidden">
              <CardTitle className="text-lg font-medium text-card-foreground">{lead.name}</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-primary flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditClick(lead);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Edit Lead</span>
                </Button>
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </div>
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
                variant="outline"
                size="sm"
                className="mt-4 w-full bg-secondary text-secondary-foreground hover:bg-secondary/80"
                onClick={() => handleStartInquiryClick(lead)}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Start Inquiry
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="mt-2 w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
  );

  const renderLeadSection = (status: LeadStatus, title: string, leadsList: Lead[]) => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      {leadsList.length === 0 ? (
        <p className="text-muted-foreground">No leads in this category.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {renderLeadCards(leadsList)}
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
          <LeadFilterSort
            onFilterSortChange={handleFilterSortChange}
            currentFilterSchool={filterSchool}
            currentFilterFraternity={filterFraternity}
            currentSortBy={sortBy}
            currentSortOrder={sortOrder}
          />
        </div>
      </div>

      {filteredAndSortedLeads.length === 0 && (filterSchool || filterFraternity || sortBy !== 'none') ? (
        <p className="text-center text-muted-foreground mt-8">No leads match your current filters.</p>
      ) : (
        <>
          {sortBy === 'school' ? (
            <div className="space-y-8">
              {Object.entries(groupedLeadsBySchool).map(([schoolName, schoolLeads]) => (
                <div key={schoolName} className="space-y-4">
                  <h2 className="text-2xl font-bold mb-2" style={{ color: 'hsl(0, 100%, 50%)' }}>{schoolName}</h2>
                  <Separator className="my-4 bg-border" />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {renderLeadCards(schoolLeads)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {renderLeadSection('Interested', 'Interested', groupedLeadsByStatus.Interested)}
              {renderLeadSection('General', 'General', groupedLeadsByStatus.General)}
              {renderLeadSection('Not Interested', 'Not Interested', groupedLeadsByStatus['Not Interested'])}
            </>
          )}
        </>
      )}

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

      {leadForInquiry && (
        <Dialog open={isStartInquiryDialogOpen} onOpenChange={setIsStartInquiryDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
            <DialogHeader>
              <DialogTitle className="text-white">Start New Inquiry for {leadForInquiry.name}</DialogTitle>
            </DialogHeader>
            <InquiryForm
              onSubmit={handleInquirySubmit}
              onClose={() => setIsStartInquiryDialogOpen(false)}
              defaultValues={{
                school: leadForInquiry.school || "",
                fraternity: leadForInquiry.fraternity || "",
                mainContact: leadForInquiry.name,
                phoneNumber: leadForInquiry.phone_number || "",
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default LeadsPage;