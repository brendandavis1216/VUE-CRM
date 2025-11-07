"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppContext } from "@/context/AppContext";
import { cn } from "@/lib/utils";

const CalendarPage = () => {
  const { events } = useAppContext();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const eventDays = events.map(event => event.eventDate);

  const modifiers = {
    event: eventDays,
  };

  const modifiersStyles = {
    event: {
      backgroundColor: 'hsl(var(--primary))',
      color: 'hsl(var(--primary-foreground))',
      borderRadius: '0.25rem',
    },
  };

  const eventsForSelectedDate = selectedDate
    ? events.filter(event =>
        event.eventDate.toDateString() === selectedDate.toDateString()
      )
    : [];

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-3xl font-bold text-white text-center mb-4">Calendar</h1>

      <Card className="bg-card text-card-foreground border-border p-0">
        <CardContent className="p-0">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            showOutsideDays
            className="p-3 w-full"
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-sm font-medium text-white",
              nav: "space-x-1 flex items-center",
              nav_button: cn(
                "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
              ),
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
              row: "flex w-full mt-2",
              cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-range-start)]:rounded-l-md [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: cn(
                "h-9 w-9 p-0 font-normal aria-selected:opacity-100 text-white",
                "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
              ),
              day_range_end: "day-range-end",
              day_selected:
                "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground",
              day_outside: "text-muted-foreground opacity-50",
              day_disabled: "text-muted-foreground opacity-50",
              day_range_middle:
                "aria-selected:bg-accent aria-selected:text-accent-foreground",
              day_hidden: "invisible",
              day_event: "day-event",
            }}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            components={{
              IconLeft: ({ ...props }) => <CalendarIcon className="h-4 w-4" />,
              IconRight: ({ ...props }) => <CalendarIcon className="h-4 w-4" />,
            }}
          />
        </CardContent>
      </Card>

      <h2 className="text-2xl font-bold text-white mt-6 mb-3 text-center">
        {selectedDate ? `Events on ${format(selectedDate, "PPP")}` : "Select a date to see events"}
      </h2>
      {eventsForSelectedDate.length === 0 ? (
        <p className="text-center text-muted-foreground">No events scheduled for this date.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {eventsForSelectedDate.map((event) => (
            <Card key={event.id} className="bg-card text-card-foreground border-border">
              <CardHeader>
                <CardTitle className="text-lg font-medium">{event.eventName}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p><strong>Fraternity:</strong> {event.fraternity}</p>
                <p><strong>School:</strong> {event.school}</p>
                <p><strong>Address:</strong> {event.addressOfEvent}</p>
                <p><strong>Budget:</strong> ${event.budget.toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CalendarPage;