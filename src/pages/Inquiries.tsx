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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"; // Import Accordion components

const InquiriesPage = () => {
  const { inquiries, addInquiry, updateInquiryTask } = useAppContext();
  const [isAddInquiryDialogOpen, setIsAddInquiryDialogOpen] = useState(false); // For the main "Add Inquiry" button
  const [searchTerm, setSearchTerm] = useState("");

  const handleMainFormSubmit = (newInquiryData: Parameters<typeof addInquiry>[0]) => {
    addInquiry(newInquiryData);
    setIsAddInquiryDialogOpen(false);
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
          <Accordion type="single" collapsible className="w-full">
            {filteredInquiries.map((inquiry) => (
              <Card key={inquiry.id} className="mb-4 bg-card text-card-foreground border-border">
                <AccordionItem value={inquiry.id} className="border-none">
                  <AccordionTrigger className="flex flex-row items-center justify-between space-y-0 p-4 hover:no-underline group">
                    <div className="flex items-center gap-3 flex-grow">
                      <CardTitle className="text-lg font-medium text-card-foreground flex-shrink-0">
                        {inquiry.fraternity} - {inquiry.school}
                      </CardTitle>
                      <div className="flex items-center gap-2 flex-grow justify-end"> {/* Added flex items-center and gap-2 */}
                        <span className="text-sm font-medium text-white">{Math.round(inquiry.progress)}%</span> {/* Percentage text */}
                        <Progress value={inquiry.progress} className="w-1/2 h-2" />
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 pt-0 text-sm text-card-foreground">
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
                      <h3 className="font-semibold text-white">Tasks:</h3> {/* Changed to "Tasks:" for clarity */}
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
                  </AccordionContent>
                </AccordionItem>
              </Card>
            ))}
          </Accordion>
        </div>
      )}
    </div>
  );
};

export default InquiriesPage;