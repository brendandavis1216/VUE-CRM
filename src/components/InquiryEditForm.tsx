"use client";

import React, { useState, useEffect } from "react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Inquiry } from "@/types/app";
import { formatPhoneNumber, cn } from "@/lib/utils";

const formSchema = z.object({
  school: z.string().min(2, { message: "School name must be at least 2 characters." }),
  fraternity: z.string().min(2, { message: "Fraternity name must be at least 2 characters." }),
  mainContact: z.string().min(2, { message: "Main contact name must be at least 2 characters." }),
  phoneNumber: z.string().regex(/^\d{10}$/, { message: "Phone number must be 10 digits." }),
  email: z.string().email({ message: "Please enter a valid email address." }), // NEW: Email field
  addressOfEvent: z.string().min(5, { message: "Address must be at least 5 characters." }),
  capacity: z.coerce.number().min(1, { message: "Capacity must be at least 1." }),
  budget: z.coerce.number().min(0, { message: "Budget cannot be negative." }),
  inquiryDate: z.date({ required_error: "An inquiry date is required." }), // Added date field
  inquiryTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Time must be in HH:MM format." }), // Added time field
  stageBuild: z.enum(["None", "Base Stage", "Totem Stage", "SL 100", "SL 75", "SL260", "Custom Rig"]),
  power: z.enum(["None", "Gas Generators", "20kW Diesel", "36kW", "Provided"]),
  gates: z.boolean().default(false),
  security: z.boolean().default(false),
  co2Tanks: z.coerce.number().min(0, { message: "CO2 Tanks cannot be negative." }).default(0), // Added CO2 Tanks
  cdjs: z.coerce.number().min(0, { message: "CDJs cannot be negative." }).default(0), // Added CDJs
  audio: z.enum(["QSC Rig", "4 Arrays 2 Subs", "8 Arrays 4 Subs", "Custom"]).default("QSC Rig"), // Added Audio
});

type InquiryFormValues = z.infer<typeof formSchema>;

interface InquiryEditFormProps {
  inquiry: Inquiry;
  onSubmit: (inquiryId: string, values: InquiryFormValues) => void;
  onClose: () => void;
}

export const InquiryEditForm: React.FC<InquiryEditFormProps> = ({ inquiry, onSubmit, onClose }) => {
  const form = useForm<InquiryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      school: inquiry.school,
      fraternity: inquiry.fraternity,
      mainContact: inquiry.mainContact,
      phoneNumber: inquiry.phoneNumber.replace(/\D/g, ''),
      email: inquiry.email, // NEW: Set default email
      addressOfEvent: inquiry.addressOfEvent,
      capacity: inquiry.capacity,
      budget: inquiry.budget,
      inquiryDate: inquiry.inquiryDate, // Set default value from inquiry
      inquiryTime: inquiry.inquiryTime, // Set default value from inquiry
      stageBuild: inquiry.stageBuild,
      power: inquiry.power,
      gates: inquiry.gates,
      security: inquiry.security,
      co2Tanks: inquiry.co2Tanks, // Set default value from inquiry
      cdjs: inquiry.cdjs, // Set default value from inquiry
      audio: inquiry.audio, // Set default value from inquiry
    },
  });

  const powerValue = form.watch('power');
  const [isPowerProvidedChecked, setIsPowerProvidedChecked] = useState(inquiry.power === "Provided");

  // Effect to update form's power value when checkbox is toggled
  useEffect(() => {
    if (isPowerProvidedChecked && powerValue !== "Provided") {
      form.setValue('power', 'Provided', { shouldValidate: true });
    } else if (!isPowerProvidedChecked && powerValue === "Provided") {
      form.setValue('power', 'None', { shouldValidate: true }); // Revert to 'None' if unchecked from 'Provided'
    }
  }, [isPowerProvidedChecked, powerValue, form]);

  // Effect to update checkbox state if powerValue is changed by other means (e.g., defaultValues)
  useEffect(() => {
    setIsPowerProvidedChecked(powerValue === "Provided");
  }, [powerValue]);

  function handleSubmit(values: InquiryFormValues) {
    onSubmit(inquiry.id, values);
    onClose();
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
          name="mainContact"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="block font-semibold text-black dark:text-white mb-1">Main Contact</FormLabel>
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="block font-semibold text-black dark:text-white mb-1">Email</FormLabel>
              <FormControl>
                <Input {...field} className="bg-input text-foreground border-border" />
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
                <Textarea {...field} className="bg-input text-foreground border-border" />
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
                <Input type="number" {...field} className="bg-input text-foreground border-border" />
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
                <Input type="number" {...field} className="bg-input text-foreground border-border" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="inquiryDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="block font-semibold text-black dark:text-white mb-1">Inquiry Date</FormLabel>
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
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date("1900-01-01")}
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
            name="inquiryTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="block font-semibold text-black dark:text-white mb-1">Inquiry Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} className="bg-input text-foreground border-border" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
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
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isPowerProvidedChecked} // Disable if checkbox is checked
                >
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
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-border p-4">
            <FormControl>
              <Checkbox
                checked={isPowerProvidedChecked}
                onCheckedChange={setIsPowerProvidedChecked}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel className="block font-semibold text-black dark:text-white">Power Provided</FormLabel>
            </div>
          </FormItem>
          <FormField
            control={form.control}
            name="co2Tanks"
            render={({ field }) => (
              <FormItem className="flex flex-col space-y-1 rounded-md border border-border p-4">
                <FormLabel className="block font-semibold text-black dark:text-white">CO2 Tanks</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 4" {...field} className="bg-input text-foreground border-border" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cdjs"
            render={({ field }) => (
              <FormItem className="flex flex-col space-y-1 rounded-md border border-border p-4">
                <FormLabel className="block font-semibold text-black dark:text-white">CDJs</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 3" {...field} className="bg-input text-foreground border-border" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="audio"
            render={({ field }) => (
              <FormItem className="flex flex-col space-y-1 rounded-md border border-border p-4">
                <FormLabel className="block font-semibold text-black dark:text-white">Audio</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-input text-foreground border-border">
                      <SelectValue placeholder="Select audio setup" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-popover text-popover-foreground border-border">
                    <SelectItem value="QSC Rig">QSC Rig</SelectItem>
                    <SelectItem value="4 Arrays 2 Subs">4 Arrays 2 Subs</SelectItem>
                    <SelectItem value="8 Arrays 4 Subs">8 Arrays 4 Subs</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
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
                  <FormLabel className="block font-semibold text-black dark:text-white">Gates Provided</FormLabel>
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
                  <FormLabel className="block font-semibold text-black dark:text-white">Security Provided</FormLabel>
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