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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formSchema = z.object({
  school: z.string().min(2, { message: "School name must be at least 2 characters." }),
  fraternity: z.string().min(2, { message: "Fraternity name must be at least 2 characters." }),
  mainContact: z.string().min(2, { message: "Main contact name must be at least 2 characters." }),
  phoneNumber: z.string().regex(/^\d{3}-\d{3}-\d{4}$/, { message: "Phone number must be in XXX-XXX-XXXX format." }), // Added phone number validation
  addressOfEvent: z.string().min(5, { message: "Address must be at least 5 characters." }),
  capacity: z.coerce.number().min(1, { message: "Capacity must be at least 1." }),
  budget: z.coerce.number().min(0, { message: "Budget cannot be negative." }),
  stageBuild: z.enum(["None", "Base Stage", "Totem Stage", "SL 100", "SL 75", "SL260", "Custom Rig"]),
  power: z.enum(["None", "Gas Generators", "20kW Diesel", "36kW", "Provided"]),
  gates: z.boolean().default(false),
  security: z.boolean().default(false),
});

type InquiryFormValues = z.infer<typeof formSchema>;

interface InquiryFormProps {
  onSubmit: (values: Omit<InquiryFormValues, 'id' | 'tasks' | 'progress'>) => void;
  onClose?: () => void; // Added onClose prop
  defaultValues?: Partial<InquiryFormValues>; // Added defaultValues prop
}

export const InquiryForm: React.FC<InquiryFormProps> = ({ onSubmit, onClose, defaultValues }) => {
  const form = useForm<InquiryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      school: defaultValues?.school || "",
      fraternity: defaultValues?.fraternity || "",
      mainContact: defaultValues?.mainContact || "",
      phoneNumber: defaultValues?.phoneNumber || "", // Default value for phone number
      addressOfEvent: "",
      capacity: 0,
      budget: 0,
      stageBuild: "None",
      power: "None",
      gates: false,
      security: false,
    },
  });

  function handleSubmit(values: InquiryFormValues) {
    onSubmit(values);
    form.reset();
    onClose?.(); // Close dialog after submission
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
          name="mainContact"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="block font-semibold text-black dark:text-white mb-1">Main Contact</FormLabel>
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
          name="addressOfEvent"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="block font-semibold text-black dark:text-white mb-1">Address of Event</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., 123 Main St, Anytown, USA" {...field} className="bg-input text-foreground border-border" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="capacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="block font-semibold text-black dark:text-white mb-1">Capacity</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 500" {...field} className="bg-input text-foreground border-border" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="budget"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="block font-semibold text-black dark:text-white mb-1">Budget ($)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 10000" {...field} className="bg-input text-foreground border-border" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="stageBuild"
            render={({ field }) => (
              <FormItem className="flex flex-col space-y-1 rounded-md border border-border p-4">
                <FormLabel className="block font-semibold text-black dark:text-white">Stage Build</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-input text-foreground border-border">
                      <SelectValue placeholder="Select stage type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-popover text-popover-foreground border-border">
                    <SelectItem value="None">None</SelectItem>
                    <SelectItem value="Base Stage">Base Stage</SelectItem>
                    <SelectItem value="Totem Stage">Totem Stage</SelectItem>
                    <SelectItem value="SL 100">SL 100</SelectItem>
                    <SelectItem value="SL 75">SL 75</SelectItem>
                    <SelectItem value="SL260">SL260</SelectItem>
                    <SelectItem value="Custom Rig">Custom Rig</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="power"
            render={({ field }) => (
              <FormItem className="flex flex-col space-y-1 rounded-md border border-border p-4">
                <FormLabel className="block font-semibold text-black dark:text-white">Power</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-input text-foreground border-border">
                      <SelectValue placeholder="Select power type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-popover text-popover-foreground border-border">
                    <SelectItem value="None">None</SelectItem>
                    <SelectItem value="Gas Generators">Gas Generators</SelectItem>
                    <SelectItem value="20kW Diesel">20kW Diesel</SelectItem>
                    <SelectItem value="36kW">36kW</SelectItem>
                    <SelectItem value="Provided">Provided</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="gates"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="block font-semibold text-black dark:text-white">Gates</FormLabel>
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="security"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="block font-semibold text-black dark:text-white">Security</FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Add Inquiry</Button>
      </form>
    </Form>
  );
};