"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Client } from "@/types/app";

const formSchema = z.object({
  fraternity: z.string().min(2, { message: "Fraternity name must be at least 2 characters." }),
  school: z.string().min(2, { message: "School name must be at least 2 characters." }),
  mainContactName: z.string().min(2, { message: "Main contact name must be at least 2 characters." }),
  phoneNumber: z.string().regex(/^\d{3}-\d{3}-\d{4}$/, { message: "Phone number must be in XXX-XXX-XXXX format." }),
  instagramHandle: z.string().optional().or(z.literal("")), // Optional, allow empty string
});

type ClientFormValues = z.infer<typeof formSchema>;

interface ClientAddFormProps {
  onSubmit: (values: Omit<ClientFormValues, 'id' | 'numberOfEvents' | 'clientScore' | 'averageEventSize'>) => void;
  onClose: () => void;
}

export const ClientAddForm: React.FC<ClientAddFormProps> = ({ onSubmit, onClose }) => {
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fraternity: "",
      school: "",
      mainContactName: "",
      phoneNumber: "",
      instagramHandle: "",
    },
  });

  function handleSubmit(values: ClientFormValues) {
    onSubmit(values);
    onClose(); // Close dialog after submission
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="fraternity"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="block font-semibold text-black dark:text-white mb-1">Fraternity</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Alpha Beta Gamma" {...field} className="bg-input text-foreground border-border" />
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
              <FormLabel className="block font-semibold text-black dark:text-white mb-1">School</FormLabel>
              <FormControl>
                <Input placeholder="e.g., State University" {...field} className="bg-input text-foreground border-border" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="mainContactName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="block font-semibold text-black dark:text-white mb-1">Main Contact Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., John Doe" {...field} className="bg-input text-foreground border-border" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="block font-semibold text-black dark:text-white mb-1">Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 555-123-4567" {...field} className="bg-input text-foreground border-border" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="instagramHandle"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="block font-semibold text-black dark:text-white mb-1">Instagram Handle</FormLabel>
              <FormControl>
                <Input placeholder="e.g., @abg_stateu" {...field} className="bg-input text-foreground border-border" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Add Client</Button>
      </form>
    </Form>
  );
};