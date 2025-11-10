"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DialogFooter } from "@/components/ui/dialog";
import { useAppContext } from "@/context/AppContext";
import { toast } from "sonner";

const formSchema = z.object({
  recipientName: z.string().min(2, { message: "Recipient name must be at least 2 characters." }),
  recipientEmail: z.string().email({ message: "Please enter a valid email address." }),
  templateId: z.string().min(1, { message: "DocuSign Template ID is required." }), // NEW: Template ID field
  documentName: z.string().min(1, { message: "Document name is required." }),
  subject: z.string().min(1, { message: "Email subject is required." }),
  emailBlurb: z.string().optional(),
});

type SendContractFormValues = z.infer<typeof formSchema>;

interface SendContractFormProps {
  defaultRecipientName: string;
  defaultRecipientEmail: string; // NEW: Default recipient email
  defaultFraternity: string;
  defaultSchool: string;
  defaultAddress: string; // NEW: Default address for template fields
  defaultBudget: number; // NEW: Default budget for template fields
  defaultEventDate: string; // NEW: Default event date for template fields
  onClose: () => void;
}

export const SendContractForm: React.FC<SendContractFormProps> = ({
  defaultRecipientName,
  defaultRecipientEmail,
  defaultFraternity,
  defaultSchool,
  defaultAddress,
  defaultBudget,
  defaultEventDate, // Destructure new prop
  onClose,
}) => {
  const { sendDocuSignDocument } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SendContractFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipientName: defaultRecipientName,
      recipientEmail: defaultRecipientEmail, // Autopopulate email
      templateId: "", // User will need to input this or it can be hardcoded later
      documentName: `${defaultFraternity} - ${defaultSchool} Contract`,
      subject: `Contract for ${defaultFraternity} at ${defaultSchool}`,
      emailBlurb: `Dear ${defaultRecipientName},\n\nPlease find attached the contract for your review and signature.`,
    },
  });

  const onSubmit = async (values: SendContractFormValues) => {
    setIsLoading(true);
    try {
      // Prepare template field values
      const templateFieldValues: Record<string, string> = {
        "Fraternity": defaultFraternity,
        "School": defaultSchool,
        "SchoolFraternity": `${defaultSchool} - ${defaultFraternity}`, // Combined field
        "MainContactName": defaultRecipientName,
        "MainContactEmail": values.recipientEmail,
        "EventAddress": defaultAddress,
        "Budget": defaultBudget.toLocaleString(),
        "EventDate": defaultEventDate, // NEW: Add event date
        // Add more fields here as needed, matching your DocuSign template tab labels
      };

      await sendDocuSignDocument(
        values.recipientName,
        values.recipientEmail,
        values.templateId, // Pass templateId
        templateFieldValues, // Pass templateFieldValues
        values.documentName,
        values.subject,
        values.emailBlurb || ""
      );
      onClose();
    } catch (error) {
      console.error("Error sending contract:", error);
      toast.error("Failed to send contract.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="recipientName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Recipient Name</FormLabel>
              <FormControl>
                <Input {...field} className="bg-input text-foreground border-border" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="recipientEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Recipient Email</FormLabel>
              <FormControl>
                <Input {...field} type="email" className="bg-input text-foreground border-border" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="templateId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">DocuSign Template ID</FormLabel>
              <FormControl>
                <Input placeholder="Enter your DocuSign Template ID" {...field} className="bg-input text-foreground border-border" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="documentName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Document Name</FormLabel>
              <FormControl>
                <Input {...field} className="bg-input text-foreground border-border" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Email Subject</FormLabel>
              <FormControl>
                <Input {...field} className="bg-input text-foreground border-border" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="emailBlurb"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Email Blurb (Optional)</FormLabel>
              <FormControl>
                <Textarea {...field} className="bg-input text-foreground border-border" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="submit" disabled={isLoading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            {isLoading ? "Sending..." : "Send Contract"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};