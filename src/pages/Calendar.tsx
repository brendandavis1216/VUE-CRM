"use client";

import React, { useState, useMemo } from "react";
import { format, isSameDay } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
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

// Custom DayContent component to render event titles and client names
const EventDayContent: React.FC<DayContentProps> = (props) => {
  const { date, children } = props; // children is the day number element
  const { events } = useAppContext();

  const dayEvents = events.filter((event) =>
    isSameDay(event.eventDate, date)
  ).sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime()); // Sort by time

  const maxEventsToShow = 2; // Limit events shown directly in cell

  return (
    <div className="flex flex-col h-full w-full p-1 overflow-hidden">
      {/* Render the day number (children) directly at the top */}
      <div className="text-white text-xs font-medium">{children}</div>
      <div className="flex-grow space-y-0.5 overflow-hidden mt-1"> {/* Added mt-1 for spacing */}
        {dayEvents.slice(0, maxEventsToShow).map((event) => (
          <div key={event.id} className="text-xs truncate text-white leading-tight">
            <span className="font-semibold">{event.eventName}</span> - {event.fraternity}
          </div>
        ))}
        {dayEvents.length > maxEventsToShow && (
          <div className="text-xs text-muted-foreground mt-0.5">
            +{dayEvents.length - maxEventsToShow} more
          </div>
        )}
      </div>
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
              month: "space-y-4 flex-1",
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
              head_cell: "rounded-md font-normal text-[0.8rem] text-white flex-1",
              row: "flex w-full mt-2",
              // The 'cell' is the container for each day, ensuring it has enough height and is relative
              cell: "h-24 text-center text-sm p-1 relative flex-1 [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-range-start)]:rounded-l-md [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              // The 'day' is the actual clickable button for the day, also needs relative for children positioning
              day: cn(
                "h-full w-full p-1 font-normal aria-selected:opacity-100 rounded-md text-white relative", // Keep relative here for potential future absolute children
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