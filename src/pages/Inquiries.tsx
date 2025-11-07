"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle, Search } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { InquiryForm } from "@/components/InquiryForm";
import { useAppContext } from "@/context/AppContext";
import { Inquiry } from "@/types/app"; // Import Inquiry type

const InquiriesPage = () => {
  const { inquiries, addInquiry, updateInquiryTask } = useAppContext();
  const [isAddInquiryDialogOpen, setIsAddInquiryDialogOpen] = useState(false); // For the main "Add Inquiry" button
  const [searchTerm, setSearchTerm] = useState("");

  // State for adding inquiry from an existing inquiry card
  const [isAddInquiryFromCardDialogOpen, setIsAddInquiryFromCardDialogOpen] = useState(false);
  const [inquiryForNewInquiry, setInquiryForNewInquiry] = useState<Inquiry | null>(null);

  const handleMainFormSubmit = (newInquiryData: Parameters<typeof addInquiry>[0]) => {
    addInquiry(newInquiryData);
    setIsAddInquiryDialogOpen(false);
  };

  const handleAddInquiryFromCardClick = (inquiry: Inquiry) => {
    setInquiryForNewInquiry(inquiry);
    setIsAddInquiryFromCardDialogOpen(true);
  };

  const handleAddInquiryFromCardSubmit = (newInquiryData: Parameters<typeof addInquiry>[0]) => {
    if (inquiryForNewInquiry) {
      // Link the new inquiry to the client of the original inquiry
      addInquiry(newInquiryData, inquiryForNewInquiry.clientId);
    } else {
      addInquiry(newInquiryData); // Fallback, though should not happen if button is clicked on an existing inquiry
    }
    setIsAddInquiryFromCardDialogOpen(false);
    setInquiryForNewInquiry(null);
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
        inquiry.addressOfEvent.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [inquiries, searchTerm]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-white">Inquiries</h1>
        <div className="flex gap-2 items-center">
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
          {filteredInquiries.map((inquiry) => (
            <Card key={inquiry.id} className="bg-card text-card-foreground border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">{inquiry.fraternity} - {inquiry.school}</CardTitle>
                <div className="flex items-center gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent any parent click handlers
                          handleAddInquiryFromCardClick(inquiry);
                        }}
                      >
                        <PlusCircle className="h-4 w-4" />
                        <span className="sr-only">Add Inquiry based on {inquiry.fraternity}</span>
                      </Button>
                    </DialogTrigger>
                    {isAddInquiryFromCardDialogOpen && inquiryForNewInquiry?.id === inquiry.id && (
                      <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                        <DialogHeader>
                          <DialogTitle className="text-white">Add New Inquiry (Based on {inquiryForNewInquiry.fraternity})</DialogTitle>
                        </DialogHeader>
                        <InquiryForm
                          onSubmit={handleAddInquiryFromCardSubmit}
                          onClose={() => setIsAddInquiryFromCardDialogOpen(false)}
                          defaultValues={{
                            school: inquiryForNewInquiry.school,
                            fraternity: inquiryForNewInquiry.fraternity,
                            mainContact: inquiryForNewInquiry.mainContact,
                            phoneNumber: inquiryForNewInquiry.phoneNumber,
                            addressOfEvent: inquiryForNewInquiry.addressOfEvent,
                            capacity: inquiryForNewInquiry.capacity,
                            budget: inquiryForNewInquiry.budget,
                            stageBuild: inquiryForNewInquiry.stageBuild,
                            power: inquiryForNewInquiry.power,
                            gates: inquiryForNewInquiry.gates,
                            security: inquiryForNewInquiry.security,
                          }}
                        />
                      </DialogContent>
                    )}
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{inquiry.mainContact} ({inquiry.phoneNumber})</p>
                <p className="text-sm"><strong>Event Address:</strong> {inquiry.addressOfEvent}</p>
                <p className="text-sm"><strong>Capacity:</strong> {inquiry.capacity}</p>
                <p className="text-sm"><strong>Budget:</strong> ${inquiry.budget.toLocaleString()}</p>
                <div className="flex flex-wrap gap-2 text-sm">
                  {inquiry.stageBuild !== "None" && <Badge variant="secondary">{inquiry.stageBuild}</Badge>}
                  {inquiry.power !== "None" && <Badge variant="secondary">{inquiry.power}</Badge>}
                  {inquiry.gates && <Badge variant="secondary">Gates</Badge>}
                  {inquiry.security && <Badge variant="secondary">Security</Badge>}
                </div>

                <div className="space-y-2 mt-4">
                  <h3 className="font-semibold text-white">Progress: {Math.round(inquiry.progress)}%</h3>
                  <Progress value={inquiry.progress} className="w-full" />
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default InquiriesPage;