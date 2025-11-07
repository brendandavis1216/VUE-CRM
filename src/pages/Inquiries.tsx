"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { InquiryForm } from "@/components/InquiryForm";
import { useAppContext } from "@/context/AppContext";

const InquiriesPage = () => {
  const { inquiries, addInquiry, updateInquiryTask } = useAppContext();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleFormSubmit = (newInquiryData: Parameters<typeof addInquiry>[0]) => {
    addInquiry(newInquiryData);
    setIsFormOpen(false);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-white">Inquiries</h1>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Inquiry
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
            <DialogHeader>
              <DialogTitle className="text-white">Add New Inquiry</DialogTitle>
            </DialogHeader>
            <InquiryForm onSubmit={handleFormSubmit} />
          </DialogContent>
        </Dialog>
      </div>

      {inquiries.length === 0 ? (
        <p className="text-center text-muted-foreground mt-8">No inquiries yet. Click "Add Inquiry" to get started!</p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {inquiries.map((inquiry) => (
            <Card key={inquiry.id} className="bg-card text-card-foreground border-border">
              <CardHeader>
                <CardTitle className="text-lg font-medium">{inquiry.fraternity} - {inquiry.school}</CardTitle>
                <p className="text-sm text-muted-foreground">{inquiry.mainContact}</p>
              </CardHeader>
              <CardContent className="space-y-3">
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