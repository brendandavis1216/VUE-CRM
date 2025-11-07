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
import { Event, Inquiry, EventStatus } from "@/types/app";

// Define a union type for items that can appear on the calendar
type CalendarItem = Inquiry | Event;

// Helper function to determine the color for a calendar item based on new logic
const getCalendarItemColor = (item: CalendarItem): string => {
  if ('inquiryDate' in item) { // It's an Inquiry
    return "bg-red-500"; // Red: Inquired
  } else { // It's an Event
    const finalPaymentTask = item.tasks.find(task => task.name === "Final Payment Received");

    if (finalPaymentTask?.completed) {
      return "bg-green-500"; // Green: Event Paid
    }
    if (item.status === "Completed") {
      return "bg-blue-500"; // Blue: Event Completed
    }
    if (item.status === "Cancelled") {
      return "bg-red-500"; // Red: Event Cancelled
    }
    // Default for Pending/Confirmed events that are not yet paid
    return "bg-yellow-500"; // Yellow: Event in Progress
  }
};

// Helper function to get the title for the tooltip
const getCalendarItemTitle = (item: CalendarItem): string => {
  if ('inquiryDate' in item) {
    return `Inquiry: ${item.fraternity} - ${item.school}`;
  } else {
    const finalPaymentTask = item.tasks.find(task => task.name === "Final Payment Received");
    if (finalPaymentTask?.completed) {
      return `Event: ${item.eventName} - ${item.fraternity} (Paid)`;
    }
    if (item.status === "Completed") {
      return `Event: ${item.eventName} - ${item.fraternity} (Completed)`;
    }
    if (item.status === "Cancelled") {
      return `Event: ${item.eventName} - ${item.fraternity} (Cancelled)`;
    }
    return `Event: ${item.eventName} - ${item.fraternity} (In Progress)`;
  }
};

// Priority for day cell background color (higher index = higher priority for display)
const COLOR_PRIORITY: Record<string, number> = {
  "bg-red-500": 4,    // Inquiries, Cancelled Events
  "bg-green-500": 3,  // Event Paid
  "bg-blue-500": 2,   // Event Completed
  "bg-yellow-500": 1, // Event in Progress
  "bg-gray-500": 0,   // Fallback
};

// Legend colors for display
const LEGEND_COLORS = {
  "Inquiry / Event (Cancelled)": "bg-red-500",
  "Event (In Progress)": "bg-yellow-500",
  "Event (Paid)": "bg-green-500",
  "Event (Completed)": "bg-blue-500",
};


// Custom DayContent component to render event titles and client names
const EventDayContent: React.FC<DayContentProps> = (props) => {
  const { date, activeModifiers } = props;
  const { events, inquiries } = useAppContext();

  const isOutside = activeModifiers?.outside;

  const allDayItems: CalendarItem[] = [
    ...inquiries.filter(inq => isSameDay(inq.inquiryDate, date)),
    ...events.filter(event => isSameDay(event.eventDate, date)),
  ].sort((a, b) => {
    const dateA = 'inquiryDate' in a ? a.inquiryDate : a.eventDate;
    const dateB = 'inquiryDate' in b ? b.inquiryDate : b.eventDate;
    return dateA.getTime() - dateB.getTime();
  });

  const maxDotsToShow = 3;

  return (
    <div className="flex flex-col h-full w-full p-1 overflow-hidden">
      <div className={cn("text-xs font-medium", isOutside ? "text-muted-foreground opacity-50" : "text-white")}>
        {format(date, 'd')}
      </div>
      <div className="flex-grow flex flex-wrap gap-1 mt-1 justify-center">
        {allDayItems.slice(0, maxDotsToShow).map((item, index) => (
          <div
            key={item.id + index}
            className={cn("h-2 w-2 rounded-full", getCalendarItemColor(item))}
            title={getCalendarItemTitle(item)}
          />
        ))}
        {allDayItems.length > maxDotsToShow && (
          <div className="text-xs text-muted-foreground mt-0.5">
            +{allDayItems.length - maxDotsToShow}
          </div>
        )}
      </div>
    </div>
  );
};

const CalendarPage = () => {
  const { events, inquiries } = useAppContext();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Combine all calendar items for processing
  const allCalendarItems: CalendarItem[] = useMemo(() => {
    return [
      ...inquiries.map(inq => ({ ...inq, date: inq.inquiryDate })),
      ...events.map(event => ({ ...event, date: event.eventDate })),
    ];
  }, [events, inquiries]);

  // Calculate modifiers for DayPicker to color cells based on item status/type
  const eventModifiers = useMemo(() => {
    const modifiers: { [key: string]: Date[] } = {};
    const dayColorMap = new Map<string, { color: string, priority: number }>();

    allCalendarItems.forEach(item => {
      const dayKey = format('inquiryDate' in item ? item.inquiryDate : item.eventDate, 'yyyy-MM-dd');
      const itemColor = getCalendarItemColor(item);
      const itemPriority = COLOR_PRIORITY[itemColor] || 0;

      const existingDayInfo = dayColorMap.get(dayKey);

      if (!existingDayInfo || itemPriority > existingDayInfo.priority) {
        dayColorMap.set(dayKey, { color: itemColor, priority: itemPriority });
      }
    });

    dayColorMap.forEach((info, dayKey) => {
      const date = new Date(dayKey);
      const modifierName = info.color.replace('bg-', 'event-'); // e.g., 'event-red-500'
      if (!modifiers[modifierName]) {
        modifiers[modifierName] = [];
      }
      modifiers[modifierName].push(date);
    });

    return modifiers;
  }, [allCalendarItems]);

  const eventsForSelectedDate = useMemo(() => {
    return selectedDate
      ? allCalendarItems.filter(item =>
          isSameDay('inquiryDate' in item ? item.inquiryDate : item.eventDate, selectedDate)
        ).sort((a, b) => {
          const dateA = 'inquiryDate' in a ? a.inquiryDate : a.eventDate;
          const dateB = 'inquiryDate' in b ? b.inquiryDate : b.eventDate;
          return dateA.getTime() - dateB.getTime();
        })
      : [];
  }, [allCalendarItems, selectedDate]);

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
            modifiers={eventModifiers}
            modifierClassNames={Object.fromEntries(
              Object.values(LEGEND_COLORS).map(colorClass => [
                colorClass.replace('bg-', 'event-'), colorClass
              ])
            )}
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
              cell: "h-24 text-center text-sm p-1 relative flex-1 [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-range-start)]:rounded-l-md [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: cn(
                "h-full w-full p-1 font-normal aria-selected:opacity-100 rounded-md relative",
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
              Day: EventDayContent,
            }}
          />
        </CardContent>
      </Card>

      {/* Status Legend */}
      <Card className="bg-card text-card-foreground border-border p-4 mt-4">
        <CardTitle className="text-lg font-bold mb-2 text-white">Status Legend</CardTitle>
        <div className="flex flex-wrap gap-4">
          {Object.entries(LEGEND_COLORS).map(([statusText, colorClass]) => (
            <div key={statusText} className="flex items-center gap-2">
              <div className={cn("h-3 w-3 rounded-full", colorClass)}></div>
              <span className="text-sm text-white">{statusText}</span>
            </div>
          ))}
        </div>
      </Card>

      <h2 className="text-2xl font-bold text-white mt-6 mb-3 text-center">
        {selectedDate ? `Items on ${format(selectedDate, "PPP")}` : "Select a date to see items"}
      </h2>
      {eventsForSelectedDate.length === 0 ? (
        <p className="text-center text-muted-foreground">No items scheduled for this date.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {eventsForSelectedDate.map((item) => (
            <Card key={item.id} className="bg-card text-card-foreground border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">
                  {'inquiryDate' in item ? `Inquiry: ${item.fraternity} - ${item.school}` : `Event: ${item.eventName}`}
                </CardTitle>
                <Badge className={cn("text-xs", getCalendarItemColor(item))}>
                  {'inquiryDate' in item ? "Inquiry" : item.status}
                </Badge>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                {'inquiryDate' in item ? (
                  <>
                    <p><strong>Fraternity:</strong> {item.fraternity}</p>
                    <p><strong>School:</strong> {item.school}</p>
                    <p><strong>Contact:</strong> {item.mainContact} ({item.phoneNumber})</p>
                    <p><strong>Address:</strong> {item.addressOfEvent}</p>
                    <p><strong>Time:</strong> {format(item.inquiryDate, "p")}</p>
                    <p><strong>Budget:</strong> ${item.budget.toLocaleString()}</p>
                    {item.stageBuild !== "None" && <p><strong>Stage Build:</strong> {item.stageBuild}</p>}
                  </>
                ) : (
                  <>
                    <p><strong>Fraternity:</strong> {item.fraternity}</p>
                    <p><strong>School:</strong> {item.school}</p>
                    <p><strong>Address:</strong> {item.addressOfEvent}</p>
                    <p><strong>Time:</strong> {format(item.eventDate, "p")}</p>
                    <p><strong>Budget:</strong> ${item.budget.toLocaleString()}</p>
                    {item.stageBuild !== "None" && <p><strong>Stage Build:</strong> {item.stageBuild}</p>}
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CalendarPage;