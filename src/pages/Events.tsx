"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAppContext } from "@/context/AppContext";
import { Search, Pencil, Trash2 } from "lucide-react"; // Import Trash2 icon
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EventEditForm } from "@/components/EventEditForm";
import { Event } from "@/types/app";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "react-router-dom"; // Import useSearchParams
import { useSession } from "@/components/SessionContextProvider"; // Import useSession
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"; // Import AlertDialog components

const EventsPage = () => {
  const { events, updateEventTask, updateEvent, deleteEvent, googleCalendarEvents } = useAppContext(); // Added deleteEvent
  const { session } = useSession(); // Get session to check if user is logged in
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditEventDialogOpen, setIsEditEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [searchParams] = useSearchParams(); // Initialize useSearchParams
  const [activeAccordionItem, setActiveAccordionItem] = useState<string | undefined>(undefined); // State to control accordion
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming"); // State to control active tab

  // State for deleting event
  const [isDeleteEventDialogOpen, setIsDeleteEventDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);

  useEffect(() => {
    const eventIdFromUrl = searchParams.get('eventId');
    if (eventIdFromUrl) {
      setActiveAccordionItem(eventIdFromUrl);
      const eventToOpen = events.find(event => event.id === eventIdFromUrl);
      if (eventToOpen) {
        const now = new Date();
        if (eventToOpen.eventDate < now) {
          setActiveTab("past");
        } else {
          setActiveTab("upcoming");
        }
        // Optionally, scroll to the item if it's not in view
        const element = document.getElementById(`event-${eventIdFromUrl}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    } else {
      setActiveAccordionItem(undefined); // Reset if no ID in URL
    }
  }, [searchParams, events]); // Depend on events to ensure eventToOpen is found

  const handleEditClick = (event: Event) => {
    setSelectedEvent(event);
    setIsEditEventDialogOpen(true);
  };

  const handleDeleteClick = (event: Event) => {
    setEventToDelete(event);
    setIsDeleteEventDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (eventToDelete) {
      deleteEvent(eventToDelete.id);
      setIsDeleteEventDialogOpen(false);
      setEventToDelete(null);
    }
  };

  const handleEventUpdate = (eventId: string, updatedValues: Omit<Event, 'id' | 'tasks' | 'progress' | 'clientId' | 'fraternity' | 'school'>) => {
    updateEvent(eventId, updatedValues);
    setIsEditEventDialogOpen(false);
    setSelectedEvent(null);
  };

  const { upcomingEvents, pastEvents } = useMemo(() => {
    let currentEvents = [...events];
    const now = new Date();

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

    // Sort events by eventDate
    currentEvents.sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime());

    const upcoming = currentEvents.filter(event => event.eventDate >= now);
    const past = currentEvents.filter(event => event.eventDate < now);

    return { upcomingEvents: upcoming, pastEvents: past };
  }, [events, searchTerm]);

  const renderEventList = (eventList: Event[], noEventsMessage: string) => {
    if (eventList.length === 0) {
      return <p className="text-center text-muted-foreground mt-8">{noEventsMessage}</p>;
    }
    return (
      <div className="grid grid-cols-1 gap-4">
        <Accordion
          type="single"
          collapsible
          className="w-full"
          value={activeAccordionItem} // Control the active item
          onValueChange={setActiveAccordionItem} // Update state when user interacts
        >
          {eventList.map((event) => {
            const finalPaymentTask = event.tasks.find(task => task.name === "Paid(Full)");
            // Check if this app event already exists in Google Calendar events
            const isAddedToGoogleCalendar = googleCalendarEvents.some(gEvent => 
              gEvent.summary === (event.eventName || `${event.fraternity} - ${event.school}`) &&
              new Date(gEvent.start.dateTime || gEvent.start.date!).getTime() === event.eventDate.getTime()
            );

            return (
              <Card key={event.id} id={`event-${event.id}`} className="mb-4 bg-card text-card-foreground border-border">
                <AccordionItem value={event.id} className="border-none">
                  <AccordionTrigger className="flex flex-row items-center justify-between space-y-0 p-4 hover:no-underline group">
                    <CardTitle className="text-lg font-medium flex-shrink-0">{event.eventName}</CardTitle>
                    <div className="flex items-center gap-2 flex-grow justify-end">
                      {finalPaymentTask && (
                        <div className="flex items-center space-x-2 mr-2" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            id={`final-payment-${event.id}`}
                            checked={finalPaymentTask.completed}
                            onCheckedChange={() => updateEventTask(event.id, finalPaymentTask.id)}
                          />
                          <Label
                            htmlFor={`final-payment-${event.id}`}
                            className={cn(
                              "text-xs font-medium",
                              finalPaymentTask.completed ? "line-through text-muted-foreground" : "text-white"
                            )}
                          >
                            Paid(Full)
                          </Label>
                        </div>
                      )}
                      <span className="text-sm font-medium text-white">{Math.round(event.progress)}%</span>
                      <Progress value={event.progress} className="w-24 h-2" />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent accordion from toggling
                          handleEditClick(event);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit Event</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent accordion from toggling
                          handleDeleteClick(event);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete Event</span>
                      </Button>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 pt-0 text-sm text-card-foreground space-y-3">
                    {event.stageBuild !== "None" && <p><strong>Stage Build:</strong> {event.stageBuild}</p>}
                    <p><strong>Date:</strong> {event.eventDate.toLocaleDateString()}</p>
                    <p><strong>Address:</strong> {event.addressOfEvent}</p>
                    <p><strong>Capacity:</strong> {event.capacity}</p>
                    <p><strong>Budget:</strong> ${event.budget.toLocaleString()}</p>

                    <div className="space-y-2 mt-4">
                      <h3 className="font-semibold text-white">Tasks:</h3>
                      <div className="grid grid-cols-1 gap-2 mt-2">
                        {event.tasks
                          .filter(task => task.name !== "Paid(Full)") // Filter out Paid(Full) task
                          .map((task) => (
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
                  </AccordionContent>
                </AccordionItem>
              </Card>
            );
          })}
        </Accordion>
      </div>
    );
  };

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

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "upcoming" | "past")} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-secondary text-secondary-foreground">
          <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
          <TabsTrigger value="past">Past Events</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">
          {renderEventList(upcomingEvents, searchTerm ? "No upcoming events match your search." : "No upcoming events yet. Completed inquiries will appear here!")}
        </TabsContent>
        <TabsContent value="past">
          {renderEventList(pastEvents, searchTerm ? "No past events match your search." : "No past events to display.")}
        </TabsContent>
      </Tabs>

      {selectedEvent && (
        <Dialog open={isEditEventDialogOpen} onOpenChange={setIsEditEventDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Event: {selectedEvent.eventName}</DialogTitle>
            </DialogHeader>
            <EventEditForm
              event={selectedEvent}
              onSubmit={handleEventUpdate}
              onClose={() => setIsEditEventDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {eventToDelete && (
        <AlertDialog open={isDeleteEventDialogOpen} onOpenChange={setIsDeleteEventDialogOpen}>
          <AlertDialogContent className="bg-card text-card-foreground border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Are you sure you want to delete the event "{eventToDelete.eventName}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-secondary text-secondary-foreground hover:bg-secondary/80">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default EventsPage;