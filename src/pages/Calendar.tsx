"use client";

import React, { useState, useMemo } from "react";
import { format, isSameDay } from "date-fns";
import { Calendar as CalendarIcon, CalendarDays } from "lucide-react";
import { DayPicker, DayContentProps } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppContext } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Event, EventStatus } from "@/types/app";

// Define color mapping for event statuses
const STATUS_COLORS: Record<EventStatus, string> = {
  Pending: "bg-yellow-500",
  Confirmed: "bg-green-500",
  Completed: "bg-blue-500",
  Cancelled: "bg-red-500",
};

// Custom DayContent component to render dots for events
const EventDayContent: React.FC<DayContentProps> = (props) => {
  const { date, displayMonth, children } = props;
  const { events } = useAppContext();

  const dayEvents = events.filter((event) =>
    isSameDay(event.eventDate, date)
  );

  // Get unique statuses for events on this day
  const uniqueStatuses = Array.from(new Set(dayEvents.map((event) => event.status)));

  return (
    <div className="relative h-full w-full"> {/* Removed flex centering from parent */}
      <span className="absolute top-1 left-1 text-white text-xs font-medium">{children}</span> {/* Position day number top-left */}
      {uniqueStatuses.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-0.5">
          {uniqueStatuses.map((status, index) => (
            <div
              key={index}
              className={cn("h-1.5 w-1.5 rounded-full", STATUS_COLORS[status])}
              title={status}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CalendarPage = () => {
  const { events } = useAppContext();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const eventsForSelectedDate = useMemo(() => {
    return selectedDate
      ? events.filter(event =>
          isSameDay(event.eventDate, selectedDate)
        ).sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime()) // Sort events by time
      : [];
  }, [events, selectedDate]);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-3xl font-bold text-white text-center mb-4">Event Calendar</h1>

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
              caption_label: "text-sm font-medium text-white", // Month and year
              nav: "space-x-1 flex items-center",
              nav_button: cn(
                "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
              ),
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "rounded-md w-9 font-normal text-[0.8rem] text-white", // Day of week headers
              row: "flex w-full mt-2",
              cell: "h-12 w-9 text-center text-sm p-1 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-range-start)]:rounded-l-md [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: cn(
                "h-9 w-9 p-1 font-normal aria-selected:opacity-100 rounded-md",
                "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
              ),
              day_range_end: "day-range-end",
              day_selected:
                "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground",
              day_outside: "text-muted-foreground opacity-50", // Days from other months
              day_disabled: "text-muted-foreground opacity-50",
              day_range_middle:
                "aria-selected:bg-accent aria-selected:text-accent-foreground",
              day_hidden: "invisible",
            }}
            components={{
              IconLeft: ({ ...props }) => <CalendarIcon className="h-4 w-4" />,
              IconRight: ({ ...props }) => <CalendarIcon className="h-4 w-4" />,
              Day: EventDayContent, // Use custom DayContent component
            }}
          />
        </CardContent>
      </Card>

      {/* Status Legend */}
      <Card className="bg-card text-card-foreground border-border p-4 mt-4">
        <CardTitle className="text-lg font-bold mb-2 text-white">Status Legend</CardTitle>
        <div className="flex flex-wrap gap-4">
          {Object.entries(STATUS_COLORS).map(([status, colorClass]) => (
            <div key={status} className="flex items-center gap-2">
              <div className={cn("h-3 w-3 rounded-full", colorClass)}></div>
              <span className="text-sm text-white">{status}</span>
            </div>
          ))}
        </div>
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
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">{event.eventName}</CardTitle>
                <Badge className={cn("text-xs", STATUS_COLORS[event.status])}>
                  {event.status}
                </Badge>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p><strong>Fraternity:</strong> {event.fraternity}</p>
                <p><strong>School:</strong> {event.school}</p>
                <p><strong>Address:</strong> {event.addressOfEvent}</p>
                <p><strong>Time:</strong> {format(event.eventDate, "p")}</p>
                <p><strong>Budget:</strong> ${event.budget.toLocaleString()}</p>
                {event.stageBuild !== "None" && <p><strong>Stage Build:</strong> {event.stageBuild}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CalendarPage;