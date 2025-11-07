"use client";

import React, { useState, useMemo } from "react";
import { format, isSameDay, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, getMonth, getYear, setMonth, setYear, startOfMonth } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppContext } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Event, Inquiry } from "@/types/app";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom"; // Import useNavigate

// Define a union type for items that can appear on the calendar
type CalendarItem = Inquiry | Event;

// Helper function to determine the color for a calendar item based on new logic
const getCalendarItemColor = (item: CalendarItem): string => {
  if ('inquiryDate' in item) { // It's an Inquiry
    return "bg-red-500"; // Red: Inquired
  } else { // It's an Event
    const finalPaymentTask = item.tasks.find(task => task.name === "Paid(Full)");

    if (finalPaymentTask?.completed) {
      return "bg-green-500"; // Green: Event Paid
    }
    if (item.status === "Completed") {
      return "bg-blue-500"; // Blue: Event Completed
    }
    if (item.status === "Cancelled") {
      return "bg-gray-500"; // Gray: Event Cancelled (new color)
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
    const finalPaymentTask = item.tasks.find(task => task.name === "Paid(Full)");
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

// Legend colors for display
const LEGEND_COLORS = {
  "Inquiry": "bg-red-500",
  "Event (In Progress)": "bg-yellow-500",
  "Event (Paid)": "bg-green-500",
  "Event (Completed)": "bg-blue-500",
  "Event (Cancelled)": "bg-gray-500",
};

const CalendarPage = () => {
  const { events, inquiries } = useAppContext();
  const navigate = useNavigate(); // Initialize useNavigate
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
    startOfWeek(new Date(), { weekStartsOn: 1 }) // Start week on Monday
  );

  const allCalendarItems: CalendarItem[] = useMemo(() => {
    return [
      ...inquiries.map(inq => ({ ...inq, date: inq.inquiryDate })),
      ...events.map(event => ({ ...event, date: event.eventDate })),
    ];
  }, [events, inquiries]);

  const daysInWeek = useMemo(() => {
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: currentWeekStart, end: weekEnd });
  }, [currentWeekStart]);

  const groupedItemsByDay = useMemo(() => {
    const groups: { [key: string]: CalendarItem[] } = {};
    daysInWeek.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      groups[dayKey] = allCalendarItems
        .filter(item => isSameDay('inquiryDate' in item ? item.inquiryDate : item.eventDate, day))
        .sort((a, b) => {
          const dateA = 'inquiryDate' in a ? a.inquiryDate : a.eventDate;
          const dateB = 'inquiryDate' in b ? b.inquiryDate : b.eventDate;
          return dateA.getTime() - dateB.getTime();
        });
    });
    return groups;
  }, [allCalendarItems, daysInWeek]);

  const goToPreviousWeek = () => {
    setCurrentWeekStart((prev) => subWeeks(prev, 1));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart((prev) => addWeeks(prev, 1));
  };

  const handleMonthChange = (value: string) => {
    const newMonth = parseInt(value, 10);
    const currentYear = getYear(currentWeekStart);
    const newDate = startOfMonth(setMonth(new Date(currentYear, 0, 1), newMonth));
    setCurrentWeekStart(startOfWeek(newDate, { weekStartsOn: 1 }));
  };

  const handleYearChange = (value: string) => {
    const newYear = parseInt(value, 10);
    const currentMonth = getMonth(currentWeekStart);
    const newDate = startOfMonth(setYear(new Date(0, currentMonth, 1), newYear));
    setCurrentWeekStart(startOfWeek(newDate, { weekStartsOn: 1 }));
  };

  const handleItemClick = (item: CalendarItem) => {
    if ('inquiryDate' in item) {
      navigate(`/inquiries?inquiryId=${item.id}`);
    } else {
      navigate(`/events?eventId=${item.id}`);
    }
  };

  const currentMonth = getMonth(currentWeekStart);
  const currentYear = getYear(currentWeekStart);

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i.toString(),
    label: format(setMonth(new Date(), i), 'MMMM'),
  }));

  const years = Array.from({ length: 11 }, (_, i) => {
    const year = new Date().getFullYear() - 5 + i;
    return { value: year.toString(), label: year.toString() };
  });

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-3xl font-bold text-white text-center mb-4">Event Calendar</h1>

      {/* Month and Year Selectors */}
      <div className="flex justify-center gap-4 mb-4">
        <Select value={currentMonth.toString()} onValueChange={handleMonthChange}>
          <SelectTrigger className="w-[180px] bg-input text-foreground border-border">
            <SelectValue placeholder="Select Month" />
          </SelectTrigger>
          <SelectContent className="bg-popover text-popover-foreground border-border">
            {months.map((month) => (
              <SelectItem key={month.value} value={month.value}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={currentYear.toString()} onValueChange={handleYearChange}>
          <SelectTrigger className="w-[120px] bg-input text-foreground border-border">
            <SelectValue placeholder="Select Year" />
          </SelectTrigger>
          <SelectContent className="bg-popover text-popover-foreground border-border">
            {years.map((year) => (
              <SelectItem key={year.value} value={year.value}>
                {year.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Week Navigation */}
      <Card className="bg-card text-card-foreground border-border p-4 mb-4">
        <div className="flex justify-between items-center">
          <Button variant="outline" size="icon" onClick={goToPreviousWeek} className="bg-secondary text-secondary-foreground hover:bg-secondary/80">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold text-white">
            {format(currentWeekStart, "MMM d")} - {format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), "MMM d, yyyy")}
          </h2>
          <Button variant="outline" size="icon" onClick={goToNextWeek} className="bg-secondary text-secondary-foreground hover:bg-secondary/80">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Daily Event Lists */}
      <div className="space-y-6">
        {daysInWeek.map((day) => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const itemsOnDay = groupedItemsByDay[dayKey] || [];
          const isToday = isSameDay(day, new Date());

          return (
            <div key={dayKey} className="space-y-2">
              <h3 className={cn(
                "text-xl font-bold",
                isToday ? "text-primary" : "text-white"
              )}>
                {format(day, "EEEE, MMM d")} {isToday && "(Today)"}
              </h3>
              {itemsOnDay.length === 0 ? (
                <p className="text-muted-foreground text-sm">No items scheduled.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {itemsOnDay.map((item) => (
                    <Card
                      key={item.id}
                      className="bg-card text-card-foreground border-border cursor-pointer hover:bg-card/90 transition-colors"
                      onClick={() => handleItemClick(item)}
                    >
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3"> {/* Adjusted padding to p-3 */}
                        <CardTitle className="text-base font-medium"> {/* Reduced font size to text-base */}
                          {'inquiryDate' in item ? `Inquiry: ${item.fraternity} - ${item.school}` : `Event: ${item.eventName}`}
                        </CardTitle>
                        <Badge className={cn("text-xs", getCalendarItemColor(item))}>
                          {'inquiryDate' in item ? "Inquiry" : item.status}
                        </Badge>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

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
    </div>
  );
};

export default CalendarPage;