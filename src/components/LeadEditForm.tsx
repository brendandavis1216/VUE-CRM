"use client";

import React from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, formatPhoneNumber } from "@/lib/utils"; // Import cn and formatPhoneNumber
import { Lead, LeadStatus } from "@/types/app";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  phone_number: z.string().nullable(), // Changed to nullable
  school: z.string().nullable(), // Changed to nullable
  fraternity: z.string().nullable(), // Changed to nullable
  instagram_handle: z.string().nullable(), // Changed to nullable
  status: z.enum(["General", "Interested", "Not Interested"]),
  notes: z.string().nullable(), // Changed to nullable
  election_date: z.string().nullable(), // Changed to nullable
});

type LeadFormValues = z.infer<typeof formSchema>;

interface LeadEditFormProps {
  lead: Lead;
  onSubmit: (leadId: string, values: Partial<Omit<Lead, 'id' | 'user_id' | 'created_at'>>) => void;
  onClose: () => void;
}

export const LeadEditForm: React.FC<LeadEditFormProps> = ({ lead, onSubmit, onClose }) => {
  const form = useForm<LeadFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: lead.name,
      phone_number: lead.phone_number || null, // Use null for default
      school: lead.school || null,
      fraternity: lead.fraternity || null,
      instagram_handle: lead.instagram_handle || null,
      status: lead.status,
      notes: lead.notes || null,
      election_date: lead.election_date || null,
    },
  });

  function handleSubmit(values: LeadFormValues) {
    // Explicitly convert empty strings to null for nullable fields
    onSubmit(lead.id, {
      name: values.name,
      phone_number: values.phone_number === "" ? null : values.phone_number,
      school: values.school === "" ? null : values.school,
      fraternity: values.fraternity === "" ? null : values.fraternity,
      instagram_handle: values.instagram_handle === "" ? null : values.instagram_handle,
      status: values.status,
      notes: values.notes === "" ? null : values.notes,
      election_date: values.election_date === "" ? null : values.election_date,
    });
    onClose();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Name</FormLabel>
              <FormControl>
                <Input {...field} className="bg-input text-foreground border-border" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Phone Number</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={formatPhoneNumber(field.value || "")} // Ensure value is string for formatting
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/\D/g, '');
                    if (rawValue.length <= 10) {
                      field.onChange(rawValue);
                    }
                  }}
                  className="bg-input text-foreground border-border"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="school"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">School</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ""} className="bg-input text-foreground border-border" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="fraternity"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Fraternity</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ""} className="bg-input text-foreground border-border" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="instagram_handle"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Instagram Handle</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ""} className="bg-input text-foreground border-border" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                <FormControl>
                  <SelectTrigger className="bg-input text-foreground border-border">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-popover text-popover-foreground border-border">
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Interested">Interested</SelectItem>
                  <SelectItem value="Not Interested">Not Interested</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="election_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Election Date</FormLabel>
              <FormControl>
                <Input placeholder="e.g., November 2024" {...field} value={field.value || ""} className="bg-input text-foreground border-border" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Notes</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value || ""} className="bg-input text-foreground border-border" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Save Changes</Button>
      </form>
    </Form>
  );
};