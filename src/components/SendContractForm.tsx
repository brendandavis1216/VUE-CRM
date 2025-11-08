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
import { Client } from "@/types/app";
import { toast } from "sonner";

const formSchema = z.object({
  recipientName: z.string().min(2, { message: "Recipient name must be at least 2 characters." }),
  recipientEmail: z.string().email({ message: "Please enter a valid email address." }),
  documentFile: z.any()
    .refine((file) => file instanceof File, "A document file is required.")
    .refine((file) => file?.size <= 5 * 1024 * 1024, `Max file size is 5MB.`) // 5MB limit
    .refine((file) => file?.type === "application/pdf", "Only PDF files are allowed."),
  documentName: z.string().min(1, { message: "Document name is required." }),
  subject: z.string().min(1, { message: "Email subject is required." }),
  emailBlurb: z.string().optional(),
});

type SendContractFormValues = z.infer<typeof formSchema>;

interface SendContractFormProps {
  client: Client;
  onClose: () => void;
}

export const SendContractForm: React.FC<SendContractFormProps> = ({ client, onClose }) => {
  const { sendDocuSignDocument } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SendContractFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipientName: client.mainContactName,
      recipientEmail: "", // Email is not stored on client, user must input
      documentName: `${client.fraternity} - ${client.school} Contract`,
      subject: `Contract for ${client.fraternity} at ${client.school}`,
      emailBlurb: `Dear ${client.mainContactName},\n\nPlease find attached the contract for your review and signature.`,
    },
  });

  const onSubmit = async (values: SendContractFormValues) => {
    setIsLoading(true);
    try {
      const file = values.documentFile;
      const reader = new FileReader();

      reader.onload = async (event) => {
        const base64String = event.target?.result?.toString().split(',')[1]; // Get base64 part
        if (base64String) {
          await sendDocuSignDocument(
            values.recipientName,
            values.recipientEmail,
            base64String,
            values.documentName,
            values.subject,
            values.emailBlurb || ""
          );
          onClose();
        } else {
          toast.error("Failed to read document file.");
        }
        setIsLoading(false);
      };

      reader.onerror = () => {
        toast.error("Error reading file.");
        setIsLoading(false);
      };

      reader.readAsDataURL(file);

    } catch (error) {
      console.error("Error sending contract:", error);
      toast.error("Failed to send contract.");
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
          name="documentFile"
          render={({ field: { value, onChange, ...fieldProps } }) => (
            <FormItem>
              <FormLabel className="text-white">Contract Document (PDF)</FormLabel>
              <FormControl>
                <Input
                  {...fieldProps}
                  type="file"
                  accept=".pdf"
                  onChange={(event) => onChange(event.target.files && event.target.files[0])}
                  className="bg-input text-foreground border-border file:text-primary file:bg-primary-foreground"
                />
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