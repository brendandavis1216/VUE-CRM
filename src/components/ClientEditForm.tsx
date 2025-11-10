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
import { formatPhoneNumber } from "@/lib/utils"; // Import the utility function

const formSchema = z.object({
  fraternity: z.string().min(2, { message: "Fraternity name must be at least 2 characters." }),
  school: z.string().min(2, { message: "School name must be at least 2 characters." }),
  mainContactName: z.string().min(2, { message: "Main contact name must be at least 2 characters." }),
  phoneNumber: z.string().regex(/^\d{10}$/, { message: "Phone number must be 10 digits." }), // Updated validation
  instagramHandle: z.string().optional().or(z.literal("")), // Optional, allow empty string
});

type ClientFormValues = z.infer<typeof formSchema>;

interface ClientEditFormProps {
  client: Client;
  onSubmit: (values: Omit<ClientFormValues, 'averageEventSize'>) => void;
  onClose: () => void;
}

export const ClientEditForm: React.FC<ClientEditFormProps> = ({ client, onSubmit, onClose }) => {
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fraternity: client.fraternity,
      school: client.school,
      mainContactName: client.mainContactName,
      phoneNumber: client.phoneNumber.replace(/\D/g, ''), // Ensure default value is raw 10 digits
      instagramHandle: client.instagramHandle,
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
                <Input {...field} className="bg-input text-foreground border-border" />
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
                <Input {...field} className="bg-input text-foreground border-border" />
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
                <Input {...field} className="bg-input text-foreground border-border" />
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
                <Input
                  {...field}
                  value={formatPhoneNumber(field.value)} // Display formatted value
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/\D/g, ''); // Remove non-digits
                    if (rawValue.length <= 10) { // Allow typing up to 10 digits
                      field.onChange(rawValue); // Update form state with raw digits
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
          name="instagramHandle"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="block font-semibold text-black dark:text-white mb-1">Instagram Handle</FormLabel>
              <FormControl>
                <Input {...field} className="bg-input text-foreground border-border" />
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