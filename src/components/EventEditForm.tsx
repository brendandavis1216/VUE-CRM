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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Event } from "@/types/app";

const formSchema = z.object({
  eventName: z.string().min(2, { message: "Event name must be at least 2 characters." }),
  eventDate: z.date({ required_error: "An event date is required." }),
  addressOfEvent: z.string().min(5, { message: "Address must be at least 5 characters." }),
  capacity: z.coerce.number().min(1, { message: "Capacity must be at least 1." }),
  budget: z.coerce.number().min(0, { message: "Budget cannot be negative." }),
  stageBuild: z.enum(["None", "Base Stage", "Totem Stage", "SL 100", "SL 75", "SL260", "Custom Rig"]),
});

type EventFormValues = z.infer<typeof formSchema>;

interface EventEditFormProps {
  event: Event;
  onSubmit: (eventId: string, values: EventFormValues) => void;
  onClose: () => void;
}

export const EventEditForm: React.FC<EventEditFormProps> = ({ event, onSubmit, onClose }) => {
  const form = useForm<EventFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      eventName: event.eventName,
      eventDate: event.eventDate,
      addressOfEvent: event.addressOfEvent,
      capacity: event.capacity,
      budget: event.budget,
      stageBuild: event.stageBuild,
    },
  });

  function handleSubmit(values: EventFormValues) {
    onSubmit(event.id, values);
    onClose();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="eventName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="block font-semibold text-black dark:text-white mb-1">Event Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Spring Fling" {...field} className="bg-input text-foreground border-border" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="eventDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="block font-semibold text-black dark:text-white mb-1">Event Date</FormLabel>
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
        <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Save Changes</Button>
      </form>
    </Form>
  );
};