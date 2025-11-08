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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; // Import Popover components
import { Calendar } from "@/components/ui/calendar"; // Import Calendar component
import { CalendarIcon } from "lucide-react"; // Import CalendarIcon
import { format } from "date-fns"; // Import format for date display
import { cn, formatPhoneNumber } from "@/lib/utils"; // Import cn and formatPhoneNumber
import { Lead, LeadStatus } from "@/types/app";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }).optional().or(z.literal("")),
  phone_number: z.string().regex(/^\d{10}$/, { message: "Phone number must be 10 digits." }).optional().or(z.literal("")),
  school: z.string().optional().or(z.literal("")),
  fraternity: z.string().optional().or(z.literal("")),
  instagram_handle: z.string().optional().or(z.literal("")), // New field
  status: z.enum(["General", "Interested", "Not Interested"]),
  notes: z.string().optional().or(z.literal("")),
  election_date: z.date().optional().nullable(), // New field, optional date
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
      email: lead.email || "",
      phone_number: lead.phone_number?.replace(/\D/g, '') || "",
      school: lead.school || "",
      fraternity: lead.fraternity || "",
      instagram_handle: lead.instagram_handle || "", // Set default
      status: lead.status,
      notes: lead.notes || "",
      election_date: lead.election_date ? new Date(lead.election_date) : null, // Parse date string
    },
  });

  function handleSubmit(values: LeadFormValues) {
    onSubmit(lead.id, {
      name: values.name,
      email: values.email || undefined,
      phone_number: values.phone_number || undefined,
      school: values.school || undefined,
      fraternity: values.fraternity || undefined,
      instagram_handle: values.instagram_handle || undefined, // Pass new field
      status: values.status,
      notes: values.notes || undefined,
      election_date: values.election_date ? format(values.election_date, 'yyyy-MM-dd') : undefined, // Format date back to string
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} className="bg-input text-foreground border-border" />
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
                  value={formatPhoneNumber(field.value)}
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
                <Input {...field} className="bg-input text-foreground border-border" />
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
                <Input {...field} className="bg-input text-foreground border-border" />
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
                <Input {...field} className="bg-input text-foreground border-border" />
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            <FormItem className="flex flex-col">
              <FormLabel className="text-white">Election Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal bg-input text-foreground border-border",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover text-popover-foreground border-border" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value || undefined}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
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
                <Textarea {...field} className="bg-input text-foreground border-border" />
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