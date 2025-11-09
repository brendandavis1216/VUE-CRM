"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle, Search, Pencil, FileSignature } from "lucide-react"; // Import Pencil and FileSignature icon
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { InquiryForm } from "@/components/InquiryForm";
import { InquiryEditForm } from "@/components/InquiryEditForm"; // Import InquiryEditForm
import { useAppContext } from "@/context/AppContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Inquiry } from "@/types/app"; // Import Inquiry type
import { format } from "date-fns";
import { useSearchParams } from "react-router-dom"; // Import useSearchParams
import { DocuSignConnectButton } from "@/components/DocuSignConnectButton"; // Import DocuSignConnectButton
import { SendContractForm } from "@/components/SendContractForm"; // Import SendContractForm
import { toast } from "sonner";

const InquiriesPage = () => {
  const { inquiries, addInquiry, updateInquiryTask, updateInquiry, isDocuSignConnected } = useAppContext();
  const [isAddInquiryDialogOpen, setIsAddInquiryDialogOpen] = useState(false);
  const [isEditInquiryDialogOpen, setIsEditInquiryDialogOpen] = useState(false); // State for edit dialog
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null); // State for selected inquiry to edit
  const [searchTerm, setSearchTerm] = useState("");
  const [searchParams, setSearchParams] = useSearchParams(); // Initialize useSearchParams
  const [activeAccordionItem, setActiveAccordionItem] = useState<string | undefined>(undefined); // State to control accordion

  // State for sending contract
  const [isSendContractDialogOpen, setIsSendContractDialogOpen] = useState(false);
  const [inquiryForContract, setInquiryForContract] = useState<Inquiry | null>(null);

  useEffect(() => {
    const inquiryIdFromUrl = searchParams.get('inquiryId');
    if (inquiryIdFromUrl) {
      setActiveAccordionItem(inquiryIdFromUrl);
      // Optionally, scroll to the item if it's not in view
      const element = document.getElementById(`inquiry-${inquiryIdFromUrl}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setActiveAccordionItem(undefined); // Reset if no ID in URL
    }
  }, [searchParams]);

  // Handle DocuSign Auth Callback Success (if redirected here)
  useEffect(() => {
    const docusignAuthSuccess = searchParams.get('docusign_auth_success');
    if (docusignAuthSuccess === 'true') {
      toast.success("DocuSign connected successfully!");
      // Remove the query parameter from the URL
      searchParams.delete('docusign_auth_success');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleMainFormSubmit = (newInquiryData: Parameters<typeof addInquiry>[0]) => {
    addInquiry(newInquiryData);
    setIsAddInquiryDialogOpen(false);
  };

  const handleEditClick = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setIsEditInquiryDialogOpen(true);
  };

  const handleInquiryUpdate = (inquiryId: string, updatedValues: Omit<Inquiry, 'id' | 'tasks' | 'progress' | 'clientId'>) => {
    updateInquiry(inquiryId, updatedValues);
    setIsEditInquiryDialogOpen(false);
    setSelectedInquiry(null);
  };

  const handleSendContractClick = (inquiry: Inquiry) => {
    if (!isDocuSignConnected) {
      toast.error("Please connect your DocuSign account first.");
      return;
    }
    if (!inquiry.email) { // Changed from phoneNumber to email
      toast.error("Inquiry must have an email on file to send contracts.");
      return;
    }
    setInquiryForContract(inquiry);
    setIsSendContractDialogOpen(true);
  };

  const filteredInquiries = useMemo(() => {
    if (!searchTerm) {
      return inquiries;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return inquiries.filter(
      (inquiry) =>
        inquiry.school.toLowerCase().includes(lowerCaseSearchTerm) ||
        inquiry.fraternity.toLowerCase().includes(lowerCaseSearchTerm) ||
        inquiry.mainContact.toLowerCase().includes(lowerCaseSearchTerm) ||
        inquiry.addressOfEvent.toLowerCase().includes(lowerCaseSearchTerm) ||
        inquiry.email.toLowerCase().includes(lowerCaseSearchTerm) || // Search by email
        format(inquiry.inquiryDate, "PPP").toLowerCase().includes(lowerCaseSearchTerm) || // Search by formatted date
        inquiry.inquiryTime.toLowerCase().includes(lowerCaseSearchTerm) // Search by time
    );
  }, [inquiries, searchTerm]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-white">Inquiries</h1>
        <div className="flex gap-2 items-center">
          <DocuSignConnectButton /> {/* DocuSign Connect Button */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search inquiries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-input text-foreground border-border w-40 sm:w-auto"
            />
          </div>
          <Dialog open={isAddInquiryDialogOpen} onOpenChange={setIsAddInquiryDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Inquiry
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
              <DialogHeader>
                <DialogTitle className="text-white">Add New Inquiry</DialogTitle>
              </DialogHeader>
              <InquiryForm onSubmit={handleMainFormSubmit} onClose={() => setIsAddInquiryDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {filteredInquiries.length === 0 ? (
        <p className="text-center text-muted-foreground mt-8">
          {searchTerm ? "No inquiries match your search." : "No inquiries yet. Click 'Add Inquiry' to get started!"}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <Accordion
            type="single"
            collapsible
            className="w-full"
            value={activeAccordionItem} // Control the active item
            onValueChange={setActiveAccordionItem} // Update state when user interacts
          >
            {filteredInquiries.map((inquiry) => (
              <Card key={inquiry.id} id={`inquiry-${inquiry.id}`} className="mb-4 bg-card text-card-foreground border-border">
                <AccordionItem value={inquiry.id} className="border-none">
                  <AccordionTrigger className="flex flex-row items-center justify-between space-y-0 p-4 hover:no-underline group">
                    <div className="flex items-center gap-3 flex-grow">
                      <CardTitle className="text-lg font-medium text-card-foreground flex-shrink-0">
                        {inquiry.fraternity} - {inquiry.school}
                      </CardTitle>
                      <div className="flex items-center gap-2 flex-grow justify-end">
                        <span className="text-sm font-medium text-white">{Math.round(inquiry.progress)}%</span>
                        <Progress value={inquiry.progress} className="w-24 h-2" />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent accordion from toggling
                            handleEditClick(inquiry);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit Inquiry</span>
                        </Button>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 pt-0 text-sm text-card-foreground">
                    <p className="text-sm text-muted-foreground">{inquiry.mainContact} ({inquiry.phoneNumber})</p>
                    <p className="text-sm"><strong>Email:</strong> {inquiry.email}</p> {/* Display email */}
                    <p className="text-sm"><strong>Date:</strong> {format(inquiry.inquiryDate, "PPP")}</p>
                    <p className="text-sm"><strong>Time:</strong> {inquiry.inquiryTime}</p>
                    <p className="text-sm"><strong>Event Address:</strong> {inquiry.addressOfEvent}</p>
                    <p className="text-sm"><strong>Capacity:</strong> {inquiry.capacity}</p>
                    <p className="text-sm"><strong>Budget:</strong> ${inquiry.budget.toLocaleString()}</p>
                    <div className="flex flex-wrap gap-2 text-sm">
                      {inquiry.stageBuild !== "None" && <Badge variant="secondary">{inquiry.stageBuild}</Badge>}
                      {inquiry.power !== "None" && <Badge variant="secondary">{inquiry.power}</Badge>}
                      {inquiry.gates && <Badge variant="secondary">Gates Provided</Badge>}
                      {inquiry.security && <Badge variant="secondary">Security Provided</Badge>}
                      {inquiry.co2Tanks > 0 && <Badge variant="secondary">{inquiry.co2Tanks} CO2 Tanks</Badge>} {/* Display CO2 Tanks */}
                      {inquiry.cdjs > 0 && <Badge variant="secondary">{inquiry.cdjs} CDJs</Badge>}
                      {inquiry.audio !== "QSC Rig" && <Badge variant="secondary">{inquiry.audio} Audio</Badge>}
                    </div>

                    <div className="space-y-2 mt-4">
                      <h3 className="font-semibold text-white">Tasks:</h3>
                      <div className="grid grid-cols-1 gap-2 mt-2">
                        {inquiry.tasks.map((task) => (
                          <div key={task.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`task-${inquiry.id}-${task.id}`}
                              checked={task.completed}
                              onCheckedChange={() => updateInquiryTask(inquiry.id, task.id)}
                            />
                            <Label
                              htmlFor={`task-${inquiry.id}-${task.id}`}
                              className={cn(task.completed ? "line-through text-muted-foreground" : "text-white")}
                            >
                              {task.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 mt-4"
                      onClick={() => handleSendContractClick(inquiry)}
                      disabled={!isDocuSignConnected || !inquiry.email}
                    >
                      <FileSignature className="mr-2 h-4 w-4" /> Send Contract
                    </Button>
                  </AccordionContent>
                </AccordionItem>
              </Card>
            ))}
          </Accordion>
        </div>
      )}

      {selectedInquiry && (
        <Dialog open={isEditInquiryDialogOpen} onOpenChange={setIsEditInquiryDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Inquiry: {selectedInquiry.fraternity} - {selectedInquiry.school}</DialogTitle>
            </DialogHeader>
            <InquiryEditForm
              inquiry={selectedInquiry}
              onSubmit={handleInquiryUpdate}
              onClose={() => setIsEditInquiryDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {inquiryForContract && (
        <Dialog open={isSendContractDialogOpen} onOpenChange={setIsSendContractDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
            <DialogHeader>
              <DialogTitle className="text-white">Send Contract to {inquiryForContract.mainContact}</DialogTitle>
            </DialogHeader>
            <SendContractForm
              defaultRecipientName={inquiryForContract.mainContact}
              defaultRecipientEmail={inquiryForContract.email} // Pass inquiry email
              defaultFraternity={inquiryForContract.fraternity}
              defaultSchool={inquiryForContract.school}
              defaultAddress={inquiryForContract.addressOfEvent} // Pass inquiry address
              defaultBudget={inquiryForContract.budget} // Pass inquiry budget
              onClose={() => setIsSendContractDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default InquiriesPage;