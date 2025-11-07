"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input"; // Import Input component
import { cn } from "@/lib/utils";
import { useAppContext } from "@/context/AppContext";
import { CalendarDays, Search } from "lucide-react"; // Import Search icon

const EventsPage = () => {
  const { events, updateEventTask } = useAppContext();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredAndSortedEvents = useMemo(() => {
    let currentEvents = [...events];

    // Filter events based on search term
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      currentEvents = currentEvents.filter(
        (event) =>
          event.eventName.toLowerCase().includes(lowerCaseSearchTerm) ||
          event.fraternity.toLowerCase().includes(lowerCaseSearchTerm) ||
          event.school.toLowerCase().includes(lowerCaseSearchTerm) ||
          event.addressOfEvent.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }

    // Sort events by eventDate in ascending order (soonest first)
    currentEvents.sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime());

    return currentEvents;
  }, [events, searchTerm]);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-3xl font-bold text-white text-center">Events</h1>
      
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search events by name, fraternity, school, or address..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 bg-input text-foreground border-border"
        />
      </div>

      {filteredAndSortedEvents.length === 0 ? (
        <p className="text-center text-muted-foreground mt-8">
          {searchTerm ? "No events match your search." : "No events yet. Completed inquiries will appear here!"}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredAndSortedEvents.map((event) => (
            <Card key={event.id} className="bg-card text-card-foreground border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">{event.eventName}</CardTitle>
                <CalendarDays className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <p><strong>Fraternity:</strong> {event.fraternity}</p>
                <p><strong>School:</strong> {event.school}</p>
                <p><strong>Date:</strong> {event.eventDate.toLocaleDateString()}</p>
                <p><strong>Address:</strong> {event.addressOfEvent}</p>
                <p><strong>Capacity:</strong> {event.capacity}</p>
                <p><strong>Budget:</strong> ${event.budget.toLocaleString()}</p>

                <div className="space-y-2 mt-4">
                  <h3 className="font-semibold text-white">Progress: {Math.round(event.progress)}%</h3>
                  <Progress value={event.progress} className="w-full" />
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    {event.tasks.map((task) => (
                      <div key={task.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`event-task-${event.id}-${task.id}`}
                          checked={task.completed}
                          onCheckedChange={() => updateEventTask(event.id, task.id)}
                        />
                        <Label
                          htmlFor={`event-task-${event.id}-${task.id}`}
                          className={cn(task.completed ? "line-through text-muted-foreground" : "text-white")}
                        >
                          {task.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventsPage;