"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from "react";
import { Client, Inquiry, Event, InquiryTask, EventTask, Lead, LeadStatus, GoogleCalendarEvent, DocuSignToken } from "@/types/app";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/SessionContextProvider";
import { addHours } from "date-fns"; // Import addHours

interface AppContextType {
  clients: Client[];
  inquiries: Inquiry[];
  events: Event[];
  leads: Lead[]; // Added leads
  googleCalendarEvents: GoogleCalendarEvent[]; // Added Google Calendar events
  isDocuSignConnected: boolean; // New: DocuSign connection status
  isGoogleCalendarConnected: boolean; // NEW: Google Calendar connection status
  addInquiry: (newInquiry: Omit<Inquiry, 'id' | 'tasks' | 'progress' | 'clientId'>, existingClientId?: string) => Promise<void>; // Changed to return Promise<void>
  updateInquiryTask: (inquiryId: string, taskId: string) => Promise<void>; // Changed to return Promise<void>
  updateEventTask: (eventId: string, taskId: string) => Promise<void>; // Changed to return Promise<void>
  updateClient: (clientId: string, updatedClientData: Omit<Client, 'id' | 'numberOfEvents' | 'clientScore' | 'averageEventSize'>) => Promise<void>; // Changed to return Promise<void>
  addClient: (newClientData: Omit<Client, 'id' | 'numberOfEvents' | 'clientScore' | 'averageEventSize'>) => Promise<void>; // Changed to return Promise<void>
  updateInquiry: (inquiryId: string, updatedInquiryData: Omit<Inquiry, 'id' | 'tasks' | 'progress' | 'clientId'>) => Promise<void>; // Changed to return Promise<void>
  updateEvent: (eventId: string, updatedEventData: Omit<Event, 'id' | 'tasks' | 'progress' | 'clientId' | 'fraternity' | 'school'>) => Promise<void>; // Changed to return Promise<void>
  deleteEvent: (eventId: string) => Promise<void>; // NEW: Function to delete an event
  fetchLeads: () => Promise<void>; // Function to fetch leads
  addLeads: (newLeads: Omit<Lead, 'id' | 'user_id' | 'created_at' | 'updated_at'>[]) => Promise<void>; // Function to add multiple leads
  updateLead: (leadId: string, updatedLeadData: Partial<Omit<Lead, 'id' | 'user_id' | 'created_at'>>) => Promise<void>; // Function to update a lead
  deleteAllLeads: () => Promise<void>; // New: Function to delete all leads
  deleteLead: (leadId: string) => Promise<void>; // New: Function to delete a single lead
  deleteInquiry: (inquiryId: string) => Promise<void>; // NEW: Function to delete an inquiry
  initiateGoogleCalendarAuth: () => Promise<void>; // Function to initiate Google Calendar auth
  fetchGoogleCalendarEvents: ({ timeMin, timeMax }: { timeMin?: string; timeMax?: string }) => Promise<void>; // Function to fetch Google Calendar events
  createGoogleCalendarEvent: (event: Event) => Promise<void>; // New: Function to create Google Calendar event
  initiateDocuSignAuth: () => Promise<void>; // New: Function to initiate DocuSign auth
  sendDocuSignDocument: (
    recipientName: string,
    recipientEmail: string,
    templateId: string, // Changed from documentBase64
    templateFieldValues: Record<string, string>, // New: for template fields
    documentName: string,
    subject: string,
    emailBlurb: string
  ) => Promise<void>; // New: Function to send DocuSign document
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper function to calculate client score
const calculateClientScore = (numberOfEvents: number, averageEventSize: number): number => {
  return (numberOfEvents * averageEventSize) / 1000;
};

// Helper to parse Supabase data to app types
const parseClientFromSupabase = (data: any): Client => ({
  id: data.id,
  fraternity: data.fraternity,
  school: data.school,
  mainContactName: data.main_contact_name,
  phoneNumber: data.phone_number,
  instagramHandle: data.instagram_handle,
  averageEventSize: data.average_event_size,
  numberOfEvents: data.number_of_events,
  clientScore: data.client_score,
});

const parseInquiryFromSupabase = (data: any): Inquiry => ({
  id: data.id,
  clientId: data.client_id,
  school: data.school,
  fraternity: data.fraternity,
  mainContact: data.main_contact,
  phoneNumber: data.phone_number,
  email: data.email,
  addressOfEvent: data.address_of_event,
  capacity: data.capacity,
  budget: data.budget,
  inquiryDate: new Date(data.inquiry_date),
  inquiryTime: data.inquiry_time,
  stageBuild: data.stage_build,
  power: data.power,
  gates: data.gates,
  security: data.security,
  co2Tanks: data.co2_tanks,
  cdjs: data.cdjs,
  audio: data.audio,
  tasks: data.tasks, // tasks are already JSONB, so they should parse correctly
  progress: data.progress,
});

const parseEventFromSupabase = (data: any): Event => ({
  id: data.id,
  clientId: data.client_id,
  fraternity: data.fraternity,
  school: data.school,
  eventName: data.event_name,
  eventDate: new Date(data.event_date),
  addressOfEvent: data.address_of_event,
  capacity: data.capacity,
  budget: data.budget,
  stageBuild: data.stage_build,
  status: data.status,
  tasks: data.tasks,
  progress: data.progress,
});


export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useSession(); // Get user from session context
  const [clients, setClients] = useState<Client[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]); // State for leads
  const [googleCalendarEvents, setGoogleCalendarEvents] = useState<GoogleCalendarEvent[]>([]); // State for Google Calendar events
  const [isDocuSignConnected, setIsDocuSignConnected] = useState(false); // New: DocuSign connection status
  const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] = useState(false); // NEW: Google Calendar connection status

  // --- Fetch Clients from Supabase ---
  const fetchClients = useCallback(async () => {
    if (!user) {
      setClients([]);
      return;
    }
    const { data, error } = await supabase
      .from('clients')
      .select('*');

    if (error) {
      console.error("Error fetching clients:", error);
      toast.error("Failed to fetch clients.");
    } else {
      setClients(data.map(parseClientFromSupabase));
    }
  }, [user]);

  // --- Fetch Inquiries from Supabase ---
  const fetchInquiries = useCallback(async () => {
    if (!user) {
      setInquiries([]);
      return;
    }
    const { data, error } = await supabase
      .from('inquiries')
      .select('*');

    if (error) {
      console.error("Error fetching inquiries:", error);
      toast.error("Failed to fetch inquiries.");
    } else {
      setInquiries(data.map(parseInquiryFromSupabase));
    }
  }, [user]);

  // --- Fetch Events from Supabase ---
  const fetchEvents = useCallback(async () => {
    if (!user) {
      setEvents([]);
      return;
    }
    const { data, error } = await supabase
      .from('events')
      .select('*');

    if (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to fetch events.");
    } else {
      setEvents(data.map(parseEventFromSupabase));
    }
  }, [user]);

  // Fetch data on component mount and when user changes
  useEffect(() => {
    if (user) {
      fetchClients();
      fetchInquiries();
      fetchEvents();
    } else {
      setClients([]);
      setInquiries([]);
      setEvents([]);
    }
  }, [user, fetchClients, fetchInquiries, fetchEvents]);

  // --- Leads Management Functions ---
  const fetchLeads = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error("Error fetching leads:", error);
      toast.error("Failed to fetch leads.");
    } else {
      setLeads(data as Lead[]);
    }
  }, [user]); // Dependency array for useCallback

  // Fetch leads when component mounts or user changes
  useEffect(() => {
    if (user) {
      fetchLeads();
    } else {
      setLeads([]); // Clear leads if no user is logged in
    }
  }, [user, fetchLeads]); // Added fetchLeads to dependencies

  const calculateProgress = (tasks: InquiryTask[] | EventTask[]) => {
    if (tasks.length === 0) return 0;
    const completedTasks = tasks.filter(task => task.completed).length;
    return (completedTasks / tasks.length) * 100;
  };

  const addInquiry = async (newInquiryData: Omit<Inquiry, 'id' | 'tasks' | 'progress' | 'clientId'>, existingClientId?: string) => {
    if (!user) {
      toast.error("You must be logged in to add inquiries.");
      return;
    }

    let targetClientId: string | null = existingClientId || null;
    let clientToUpdate: Client | undefined;

    // If no client found by ID, or no ID was provided, try to find by fraternity and school
    if (!targetClientId) {
      clientToUpdate = clients.find(
        c => c.fraternity.toLowerCase() === newInquiryData.fraternity.toLowerCase() &&
             c.school.toLowerCase() === newInquiryData.school.toLowerCase()
      );

      if (clientToUpdate) {
        targetClientId = clientToUpdate.id;
        // Update existing client's contact info with new inquiry's contact
        const { error: updateClientError } = await supabase
          .from('clients')
          .update({
            main_contact_name: newInquiryData.mainContact,
            phone_number: newInquiryData.phoneNumber,
            updated_at: new Date().toISOString(),
          })
          .eq('id', targetClientId);

        if (updateClientError) {
          console.error("Error updating client contact from inquiry:", updateClientError);
          toast.error("Failed to update client contact.");
        } else {
          toast.info(`Client "${clientToUpdate.fraternity} - ${clientToUpdate.school}" contact updated from inquiry.`);
          fetchClients(); // Re-fetch clients to update local state
        }
      } else {
        // If still no client found, create a new one
        const initialAverageEventSize = newInquiryData.budget; // First event's budget
        const initialNumberOfEvents = 0; // New client starts with 0 events from this inquiry's perspective

        const newClientDataForDb = {
          fraternity: newInquiryData.fraternity,
          school: newInquiryData.school,
          main_contact_name: newInquiryData.mainContact,
          phone_number: newInquiryData.phoneNumber,
          instagram_handle: "N/A", // Placeholder, as not available in inquiry form
          average_event_size: initialAverageEventSize,
          number_of_events: initialNumberOfEvents,
          client_score: calculateClientScore(initialNumberOfEvents, initialAverageEventSize),
        };

        const { data: newClientResponse, error: newClientError } = await supabase
          .from('clients')
          .insert(newClientDataForDb)
          .select()
          .single();

        if (newClientError) {
          console.error("Error creating new client from inquiry:", newClientError);
          toast.error("Failed to create new client.");
          return;
        }
        targetClientId = newClientResponse.id;
        toast.success(`New client "${newClientResponse.fraternity} - ${newClientResponse.school}" added from inquiry!`);
        fetchClients(); // Re-fetch clients to update local state
      }
    }

    const defaultTasks: InquiryTask[] = [
      { id: "task-render-" + Date.now(), name: "Rendering", completed: false },
      { id: "task-contract-" + (Date.now() + 1), name: "Contract", completed: false },
      { id: "task-deposit-" + (Date.now() + 2), name: "Deposit", completed: false },
    ];

    const inquiryToInsert = {
      client_id: targetClientId,
      school: newInquiryData.school,
      fraternity: newInquiryData.fraternity,
      main_contact: newInquiryData.mainContact,
      phone_number: newInquiryData.phoneNumber,
      email: newInquiryData.email,
      address_of_event: newInquiryData.addressOfEvent,
      capacity: newInquiryData.capacity,
      budget: newInquiryData.budget,
      inquiry_date: newInquiryData.inquiryDate.toISOString(),
      inquiry_time: newInquiryData.inquiryTime,
      stage_build: newInquiryData.stageBuild,
      power: newInquiryData.power,
      gates: newInquiryData.gates,
      security: newInquiryData.security,
      co2_tanks: newInquiryData.co2Tanks,
      cdjs: newInquiryData.cdjs,
      audio: newInquiryData.audio,
      tasks: defaultTasks,
      progress: 0,
    };

    const { error: insertInquiryError } = await supabase
      .from('inquiries')
      .insert(inquiryToInsert);

    if (insertInquiryError) {
      console.error("Error adding inquiry:", insertInquiryError);
      toast.error("Failed to add inquiry.");
    } else {
      toast.success("New inquiry added!");
      fetchInquiries(); // Re-fetch inquiries to update local state
    }
  };

  const updateInquiry = async (inquiryId: string, updatedInquiryData: Omit<Inquiry, 'id' | 'tasks' | 'progress' | 'clientId'>) => {
    if (!user) {
      toast.error("You must be logged in to update inquiries.");
      return;
    }

    const inquiryToUpdate = {
      school: updatedInquiryData.school,
      fraternity: updatedInquiryData.fraternity,
      main_contact: updatedInquiryData.mainContact,
      phone_number: updatedInquiryData.phoneNumber,
      email: updatedInquiryData.email,
      address_of_event: updatedInquiryData.addressOfEvent,
      capacity: updatedInquiryData.capacity,
      budget: updatedInquiryData.budget,
      inquiry_date: updatedInquiryData.inquiryDate.toISOString(),
      inquiry_time: updatedInquiryData.inquiryTime,
      stage_build: updatedInquiryData.stageBuild,
      power: updatedInquiryData.power,
      gates: updatedInquiryData.gates,
      security: updatedInquiryData.security,
      co2_tanks: updatedInquiryData.co2Tanks,
      cdjs: updatedInquiryData.cdjs,
      audio: updatedInquiryData.audio,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('inquiries')
      .update(inquiryToUpdate)
      .eq('id', inquiryId);

    if (error) {
      console.error("Error updating inquiry:", error);
      toast.error("Failed to update inquiry.");
    } else {
      toast.success("Inquiry updated successfully!");
      fetchInquiries(); // Re-fetch inquiries to update local state
    }
  };

  const deleteInquiry = async (inquiryId: string) => {
    if (!user) {
      toast.error("You must be logged in to delete inquiries.");
      return;
    }

    const { error } = await supabase
      .from('inquiries')
      .delete()
      .eq('id', inquiryId);

    if (error) {
      console.error("Error deleting inquiry:", error);
      toast.error("Failed to delete inquiry.");
    } else {
      toast.success("Inquiry deleted successfully!");
      fetchInquiries(); // Re-fetch inquiries to update local state
    }
  };

  const updateInquiryTask = async (inquiryId: string, taskId: string) => {
    if (!user) {
      toast.error("You must be logged in to update inquiry tasks.");
      return;
    }

    const inquiry = inquiries.find(inq => inq.id === inquiryId);
    if (!inquiry) {
      toast.error("Inquiry not found.");
      return;
    }

    const updatedTasks = inquiry.tasks.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    const newProgress = calculateProgress(updatedTasks);

    if (newProgress === 100) {
      toast.success(`Inquiry "${inquiry.fraternity}" completed! Moving to Events.`);
      
      const newEventTasks: EventTask[] = [];
      
      // Power: If power is NOT provided by the client (i.e., not "Provided" and not "None"), add a task for sourcing it.
      if (inquiry.power !== "None" && inquiry.power !== "Provided") {
          newEventTasks.push({ id: `event-task-power-${Date.now()}`, name: `Source ${inquiry.power}`, completed: false });
      }

      // Gates: If gates are NOT provided by the client, add a task for sourcing them.
      if (!inquiry.gates) {
          newEventTasks.push({ id: `event-task-gates-${Date.now()}`, name: "Source Gates", completed: false });
      }

      // Security: If security is NOT provided by the client, add a task for sourcing it.
      if (!inquiry.security) {
          newEventTasks.push({ id: `event-task-security-${Date.now()}`, name: "Source Security", completed: false });
      }

      // CO2 Tanks: If CO2 tanks are needed (quantity > 0), add a task for sourcing them.
      if (inquiry.co2Tanks > 0) {
          newEventTasks.push({ id: `event-task-co2-${Date.now()}`, name: `Source ${inquiry.co2Tanks} CO2 Tanks`, completed: false });
      }

      // CDJs: If CDJs are needed (quantity > 2), add a task for sourcing them.
      if (inquiry.cdjs > 2) {
          newEventTasks.push({ id: `event-task-cdjs-${Date.now()}`, name: `Source ${inquiry.cdjs} CDJs`, completed: false });
      }

      // Audio: If audio is not "QSC Rig", add a task for sourcing it.
      if (inquiry.audio !== "QSC Rig") {
          newEventTasks.push({ id: `event-task-audio-${Date.now()}`, name: `Source ${inquiry.audio} Audio`, completed: false });
      }

      // Add a default task if no specific ones are generated (e.g., if everything is provided)
      if (newEventTasks.length === 0) {
          newEventTasks.push({ id: `event-task-default-${Date.now()}`, name: "Event Logistics", completed: false });
      }

      // Add the "Paid(Full)" task
      newEventTasks.push({ id: `event-task-final-payment-${Date.now() + 3}`, name: "Paid(Full)", completed: false });


      // Combine inquiry date and time to create the eventDate
      const [hours, minutes] = inquiry.inquiryTime.split(':').map(Number);
      const eventDateTime = new Date(inquiry.inquiryDate);
      eventDateTime.setHours(hours, minutes, 0, 0);

      const newEventDataForDb = {
          client_id: inquiry.clientId, // Link to client using the stored clientId
          fraternity: inquiry.fraternity,
          school: inquiry.school,
          event_name: `${inquiry.fraternity} - ${inquiry.school}`, // Default event name without "Event"
          event_date: eventDateTime.toISOString(), // Use the combined date and time
          address_of_event: inquiry.addressOfEvent,
          capacity: inquiry.capacity,
          budget: inquiry.budget,
          stage_build: inquiry.stageBuild, // Transfer stageBuild directly to event
          status: "Pending", // Default status for new events
          tasks: newEventTasks,
          progress: 0,
      };

      const { data: newEventResponse, error: newEventError } = await supabase
        .from('events')
        .insert(newEventDataForDb)
        .select()
        .single();

      if (newEventError) {
        console.error("Error creating new event from inquiry:", newEventError);
        toast.error("Failed to create new event.");
        return;
      }

      // Logic to update client based on completed inquiry
      const existingClient = clients.find(c => c.id === inquiry.clientId);
      if (existingClient) {
          const updatedNumberOfEvents = existingClient.numberOfEvents + 1;
          const updatedAverageEventSize = (existingClient.averageEventSize * existingClient.numberOfEvents + inquiry.budget) / updatedNumberOfEvents;
          const updatedClientScore = calculateClientScore(updatedNumberOfEvents, updatedAverageEventSize);

          const { error: updateClientError } = await supabase
            .from('clients')
            .update({
              number_of_events: updatedNumberOfEvents,
              average_event_size: updatedAverageEventSize,
              client_score: updatedClientScore,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingClient.id);

          if (updateClientError) {
            console.error("Error updating client after inquiry completion:", updateClientError);
            toast.error("Failed to update client details.");
          } else {
            fetchClients(); // Re-fetch clients to update local state
          }
      } else {
          console.error(`Client with ID ${inquiry.clientId} not found when completing inquiry ${inquiry.id}. This should not happen if client is added on inquiry creation.`);
      }
      
      // Delete the completed inquiry from Supabase
      const { error: deleteInquiryError } = await supabase
        .from('inquiries')
        .delete()
        .eq('id', inquiryId);

      if (deleteInquiryError) {
        console.error("Error deleting completed inquiry:", deleteInquiryError);
        toast.error("Failed to delete completed inquiry.");
      } else {
        fetchInquiries(); // Re-fetch inquiries to update local state
        fetchEvents(); // Re-fetch events to update local state
      }
      
      // Automatically add to Google Calendar if user is logged in
      if (user && isGoogleCalendarConnected) { // Check isGoogleCalendarConnected
        createGoogleCalendarEvent(parseEventFromSupabase(newEventResponse)); // Pass the newly created event
      } else if (user && !isGoogleCalendarConnected) {
        toast.info("Google Calendar not connected. Event not added automatically.");
      } else {
        toast.info("Log in to automatically add events to Google Calendar.");
      }

    } else {
      // If inquiry is not 100% complete, just update its tasks and progress
      const { error: updateError } = await supabase
        .from('inquiries')
        .update({
          tasks: updatedTasks,
          progress: newProgress,
          updated_at: new Date().toISOString(),
        })
        .eq('id', inquiryId);

      if (updateError) {
        console.error("Error updating inquiry tasks:", updateError);
        toast.error("Failed to update inquiry tasks.");
      } else {
        fetchInquiries(); // Re-fetch inquiries to update local state
      }
    }
  };

  const updateEvent = async (eventId: string, updatedEventData: Omit<Event, 'id' | 'tasks' | 'progress' | 'clientId' | 'fraternity' | 'school'>) => {
    if (!user) {
      toast.error("You must be logged in to update events.");
      return;
    }

    const eventToUpdate = {
      event_name: updatedEventData.eventName,
      event_date: updatedEventData.eventDate.toISOString(),
      address_of_event: updatedEventData.addressOfEvent,
      capacity: updatedEventData.capacity,
      budget: updatedEventData.budget,
      stage_build: updatedEventData.stageBuild,
      status: updatedEventData.status,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('events')
      .update(eventToUpdate)
      .eq('id', eventId);

    if (error) {
      console.error("Error updating event:", error);
      toast.error("Failed to update event.");
    } else {
      toast.success("Event updated successfully!");
      fetchEvents(); // Re-fetch events to update local state
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!user) {
      toast.error("You must be logged in to delete events.");
      return;
    }

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event.");
    } else {
      toast.success("Event deleted successfully!");
      fetchEvents(); // Re-fetch events to update local state
    }
  };

  const updateEventTask = async (eventId: string, taskId: string) => {
    if (!user) {
      toast.error("You must be logged in to update event tasks.");
      return;
    }

    const event = events.find(e => e.id === eventId);
    if (!event) {
      toast.error("Event not found.");
      return;
    }

    const updatedTasks = event.tasks.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    const newProgress = calculateProgress(updatedTasks);

    const { error } = await supabase
      .from('events')
      .update({
        tasks: updatedTasks,
        progress: newProgress,
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId);

    if (error) {
      console.error("Error updating event tasks:", error);
      toast.error("Failed to update event tasks.");
    } else {
      fetchEvents(); // Re-fetch events to update local state
    }
  };

  const updateClient = async (clientId: string, updatedClientData: Omit<Client, 'id' | 'numberOfEvents' | 'clientScore' | 'averageEventSize'>) => {
    if (!user) {
      toast.error("You must be logged in to update clients.");
      return;
    }

    const existingClient = clients.find(c => c.id === clientId);
    if (!existingClient) {
      toast.error("Client not found.");
      return;
    }

    // Recalculate clientScore based on potentially updated averageEventSize (though averageEventSize is now derived)
    const updatedClientScore = calculateClientScore(existingClient.numberOfEvents, existingClient.averageEventSize);

    const clientToUpdate = {
      fraternity: updatedClientData.fraternity,
      school: updatedClientData.school,
      main_contact_name: updatedClientData.mainContactName,
      phone_number: updatedClientData.phoneNumber,
      instagram_handle: updatedClientData.instagramHandle,
      client_score: updatedClientScore, // Update score
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('clients')
      .update(clientToUpdate)
      .eq('id', clientId);

    if (error) {
      console.error("Error updating client:", error);
      toast.error("Failed to update client.");
    } else {
      toast.success("Client updated successfully!");
      fetchClients(); // Re-fetch clients to update local state
    }
  };

  const addClient = async (newClientData: Omit<Client, 'id' | 'numberOfEvents' | 'clientScore' | 'averageEventSize'>) => {
    if (!user) {
      toast.error("You must be logged in to add clients.");
      return;
    }

    const existingClient = clients.find(
      c => c.fraternity.toLowerCase() === newClientData.fraternity.toLowerCase() &&
           c.school.toLowerCase() === newClientData.school.toLowerCase()
    );

    if (existingClient) {
      // Update existing client's contact details
      const { error: updateError } = await supabase
        .from('clients')
        .update({
          main_contact_name: newClientData.mainContactName,
          phone_number: newClientData.phoneNumber,
          instagram_handle: newClientData.instagramHandle,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingClient.id);

      if (updateError) {
        console.error("Error updating existing client:", updateError);
        toast.error("Failed to update existing client.");
      } else {
        toast.success(`Client "${newClientData.fraternity} - ${newClientData.school}" contact updated!`);
        fetchClients(); // Re-fetch clients to update local state
      }
    } else {
      // Create a new client
      const numberOfEvents = 0; // New clients start with 0 events
      const averageEventSize = 0; // New clients start with 0 average event size
      const clientScore = calculateClientScore(numberOfEvents, averageEventSize);

      const clientToInsert = {
        fraternity: newClientData.fraternity,
        school: newClientData.school,
        main_contact_name: newClientData.mainContactName,
        phone_number: newClientData.phoneNumber,
        instagram_handle: newClientData.instagramHandle,
        number_of_events: numberOfEvents,
        average_event_size: averageEventSize,
        client_score: clientScore,
      };

      const { error: insertError } = await supabase
        .from('clients')
        .insert(clientToInsert);

      if (insertError) {
        console.error("Error adding new client:", insertError);
        toast.error("Failed to add new client.");
      } else {
        toast.success("New client added successfully!");
        fetchClients(); // Re-fetch clients to update local state
      }
    }
  };

  // --- Leads Management Functions ---
  const addLeads = async (newLeadsData: Omit<Lead, 'id' | 'user_id' | 'created_at' | 'updated_at'>[]) => {
    if (!user) {
      toast.error("You must be logged in to add leads.");
      return;
    }

    const leadsWithUserId = newLeadsData.map(lead => ({
      name: lead.name,
      phone_number: lead.phone_number,
      school: lead.school,
      fraternity: lead.fraternity,
      instagram_handle: lead.instagram_handle,
      status: lead.status || 'General', // Ensure status defaults to 'General'
      notes: lead.notes,
      election_date: lead.election_date,
      user_id: user.id,
    }));

    const { data, error } = await supabase
      .from('leads')
      .insert(leadsWithUserId)
      .select();

    if (error) {
      console.error("Error adding leads:", error); // Log the full error object
      toast.error(`Failed to add leads: ${error.message}`); // Display specific error message
    } else {
      setLeads((prev) => [...prev, ...(data as Lead[])]);
      toast.success(`${data.length} leads added successfully!`);
    }
  };

  const updateLead = async (leadId: string, updatedLeadData: Partial<Omit<Lead, 'id' | 'user_id' | 'created_at'>>) => {
    if (!user) {
      toast.error("You must be logged in to update leads.");
      return;
    }

    const { data, error } = await supabase
      .from('leads')
      .update({ ...updatedLeadData, updated_at: new Date().toISOString() })
      .eq('id', leadId)
      .eq('user_id', user.id) // Ensure user can only update their own leads
      .select();

    if (error) {
      console.error("Error updating lead:", error);
      toast.error("Failed to update lead.");
    } else if (data && data.length > 0) {
      setLeads((prev) =>
        prev.map((lead) => (lead.id === leadId ? (data[0] as Lead) : lead))
      );
      toast.success("Lead updated successfully!");
    } else {
      toast.error("Lead not found or you don't have permission to update it.");
    }
  };

  const deleteLead = async (leadId: string) => {
    if (!user) {
      toast.error("You must be logged in to delete leads.");
      return;
    }

    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', leadId)
      .eq('user_id', user.id); // Ensure user can only delete their own leads

    if (error) {
      console.error("Error deleting lead:", error);
      toast.error("Failed to delete lead.");
    } else {
      setLeads((prev) => prev.filter((lead) => lead.id !== leadId));
      toast.success("Lead deleted successfully!");
    }
  };

  const deleteAllLeads = async () => {
    if (!user) {
      toast.error("You must be logged in to delete leads.");
      return;
    }

    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('user_id', user.id); // Ensure only current user's leads are deleted

    if (error) {
      console.error("Error deleting all leads:", error);
      toast.error("Failed to delete all leads.");
    } else {
      setLeads([]); // Clear local state
      toast.success("All leads deleted successfully!");
    }
  };
// --- Google Calendar Integration ---
const fetchGoogleCalendarConnectionStatus = useCallback(async () => {
  if (!user) {
    setIsGoogleCalendarConnected(false);
    return;
  }
  const { data, error } = await supabase
    .from('user_google_tokens')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 means "no rows found"
    console.error("Error fetching Google Calendar connection status:", error);
    setIsGoogleCalendarConnected(false);
  } else {
    setIsGoogleCalendarConnected(!!data);
  }
}, [user]);

useEffect(() => {
  fetchGoogleCalendarConnectionStatus();
}, [user, fetchGoogleCalendarConnectionStatus]);

const initiateGoogleCalendarAuth = useCallback(async () => {
  try {
    console.log("initiateGoogleCalendarAuth called.");

    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr || !sessionData?.session) {
      toast.error("Log in first.");
      console.error("No Supabase session.", sessionErr);
      return;
    }
    const accessToken = sessionData.session.access_token;
    const clientOrigin = window.location.origin;
    const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
    console.log("DEBUG: Value of functionsUrl from import.meta.env (Google Calendar):", functionsUrl); // Added debug log

    if (!functionsUrl) {
      console.error("VITE_SUPABASE_FUNCTIONS_URL is not defined in environment variables.");
      toast.error("Supabase Functions URL is not configured. Please check your .env file.");
      return;
    }

    const url = `${functionsUrl}/google-calendar/auth`;
    console.log("Client Origin:", clientOrigin);
    console.log("DEBUG: Attempting to fetch Google Calendar auth URL from:", url);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ clientOrigin }),
    });

    console.log("Response status from auth endpoint:", res.status);
    if (!res.ok) {
      const txt = await res.text();
      console.error("Auth endpoint error body:", txt);
      toast.error("Failed to start Google auth. Check console.");
      return;
    }

    const { authorizeUrl } = await res.json();
    console.log("Received authorizeUrl:", authorizeUrl);

    // Full page navigation (not fetch)
    window.location.href = authorizeUrl;
  } catch (e) {
    console.error("initiateGoogleCalendarAuth error:", e);
    toast.error("Failed to connect Google Calendar: " + String(e));
  }
}, [user]);

const fetchGoogleCalendarEvents = useCallback(async ({ timeMin, timeMax }: { timeMin?: string; timeMax?: string }) => {
  if (!user || !isGoogleCalendarConnected) { // Only fetch if connected
    setGoogleCalendarEvents([]); // Clear events if not logged in or not connected
    return;
  }

  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) {
    console.warn("Not authenticated, cannot fetch Google Calendar events.");
    setGoogleCalendarEvents([]);
    return;
  }

  const jwt = data.session.access_token;
  const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
  if (!functionsUrl) {
    console.error("VITE_SUPABASE_FUNCTIONS_URL is not defined in environment variables.");
    toast.error("Supabase Functions URL is not configured. Please check your .env file.");
    return;
  }
  const url = new URL(`${functionsUrl}/google-calendar/events`);
  if (timeMin) url.searchParams.set('timeMin', timeMin);
  if (timeMax) url.searchParams.set('timeMax', timeMax);

  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${jwt}` },
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(`Failed to fetch Google events: ${errorData.error || res.statusText}`);
    }

    const events: GoogleCalendarEvent[] = await res.json();
    setGoogleCalendarEvents(events || []);
  } catch (e) {
    console.error("Error fetching Google Calendar events:", e);
    toast.error(`Failed to fetch Google Calendar events: ${e instanceof Error ? e.message : String(e)}`);
    setGoogleCalendarEvents([]); // Clear events on error
  }
}, [user, isGoogleCalendarConnected]); // Dependency on isGoogleCalendarConnected

const createGoogleCalendarEvent = useCallback(async (event: Event) => {
  if (!user || !isGoogleCalendarConnected) { // Only create if connected
    toast.error("You need to be logged in and Google Calendar connected to create events.");
    return;
  }

  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) {
    toast.error("Not authenticated with Supabase. Please log in.");
    return;
  }

  const jwt = data.session.access_token;
  const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
  if (!functionsUrl) {
    console.error("VITE_SUPABASE_FUNCTIONS_URL is not defined in environment variables.");
    toast.error("Supabase Functions URL is not configured. Please check your .env file.");
    return;
  }

  const eventName = event.eventName || `${event.fraternity} - ${event.school}`;
  const startTime = event.eventDate;
  const endTime = addHours(event.eventDate, 2); // Assume 2-hour event for simplicity

  const googleEvent = {
    summary: eventName,
    location: event.addressOfEvent,
    description: `
      Fraternity: ${event.fraternity}
      School: ${event.school}
      Capacity: ${event.capacity}
      Budget: $${event.budget.toLocaleString()}
      Stage Build: ${event.stageBuild}
      Status: ${event.status}
      Tasks: ${event.tasks.map(task => `${task.name} (${task.completed ? 'Completed' : 'Pending'})`).join(', ')}
    `,
    start: {
      dateTime: startTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  };

  try {
    const res = await fetch(`${functionsUrl}/google-calendar/create-event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${jwt}`,
      },
      body: JSON.stringify(googleEvent),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(`Failed to create Google Calendar event: ${errorData.error || res.statusText}`);
    }

    toast.success(`Event "${eventName}" added to Google Calendar!`);
    // Optionally, re-fetch Google Calendar events to update the local view
    fetchGoogleCalendarEvents({
      timeMin: startTime.toISOString(),
      timeMax: endTime.toISOString(),
    });
  } catch (e) {
    console.error("Error creating Google Calendar event:", e);
    toast.error(`Failed to add event to Google Calendar: ${e instanceof Error ? e.message : String(e)}`);
  }
}, [user, isGoogleCalendarConnected, fetchGoogleCalendarEvents]); // Dependency on isGoogleCalendarConnected and fetchGoogleCalendarEvents
// --- End Google Calendar Integration ---

// --- DocuSign Integration ---
const fetchDocuSignConnectionStatus = useCallback(async () => {
  if (!user) {
    setIsDocuSignConnected(false);
    return;
  }
  const { data, error } = await supabase
    .from('user_docusign_tokens')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 means "no rows found"
    console.error("Error fetching DocuSign connection status:", error);
    setIsDocuSignConnected(false);
  } else {
    setIsDocuSignConnected(!!data);
  }
}, [user]);

useEffect(() => {
  fetchDocuSignConnectionStatus();
}, [user, fetchDocuSignConnectionStatus]);

const initiateDocuSignAuth = useCallback(async () => {
  try {
    console.log("initiateDocuSignAuth called.");

    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr || !sessionData?.session) {
      toast.error("Log in first.");
      console.error("No Supabase session.", sessionErr);
      return;
    }
    const accessToken = sessionData.session.access_token;
    console.log("DEBUG (DocuSign Auth): Supabase Access Token:", accessToken ? "Present" : "Missing"); // Log accessToken
    const clientOrigin = window.location.origin;
    const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
    console.log("DEBUG: Value of functionsUrl from import.meta.env (DocuSign):", functionsUrl); // Added debug log

    if (!functionsUrl) {
      console.error("VITE_SUPABASE_FUNCTIONS_URL is not defined in environment variables.");
      toast.error("Supabase Functions URL is not configured. Please check your .env file.");
      return;
    }

    const url = `${functionsUrl}/docusign/auth`;
    console.log("DEBUG: Attempting to fetch DocuSign auth URL from:", url); // Added debug log
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ clientOrigin }),
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("DocuSign Auth endpoint error body:", txt);
      toast.error("Failed to start DocuSign auth. Check console.");
      return;
    }

    const { authorizeUrl } = await res.json();
    window.location.href = authorizeUrl;
  } catch (e) {
    console.error("initiateDocuSignAuth error:", e);
    toast.error("Failed to connect DocuSign: " + String(e));
  }
}, [user]);

const sendDocuSignDocument = useCallback(async (
  recipientName: string,
  recipientEmail: string,
  templateId: string, // Changed from documentBase64
  templateFieldValues: Record<string, string>, // New: for template fields
  documentName: string,
  subject: string,
  emailBlurb: string
) => {
  if (!user) {
    toast.error("You need to be logged in to send DocuSign documents.");
    return;
  }

  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) {
    toast.error("Not authenticated with Supabase. Please log in.");
    return;
  }

  const jwt = data.session.access_token;
  console.log("DEBUG (DocuSign Send): Supabase JWT:", jwt ? "Present" : "Missing"); // Log JWT
  const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
  if (!functionsUrl) {
    console.error("VITE_SUPABASE_FUNCTIONS_URL is not defined in environment variables.");
    toast.error("Supabase Functions URL is not configured. Please check your .env file.");
    return;
  }

  try {
    const res = await fetch(`${functionsUrl}/docusign/send-document`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        recipientName,
        recipientEmail,
        templateId, // Pass templateId
        templateFieldValues, // Pass templateFieldValues
        documentName,
        subject,
        emailBlurb,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(`Failed to send DocuSign document: ${errorData.error || res.statusText}`);
    }

    toast.success(`Document "${documentName}" sent via DocuSign!`);
  } catch (e) {
    console.error("Error sending DocuSign document:", e);
    toast.error(`Failed to send DocuSign document: ${e instanceof Error ? e.message : String(e)}`);
  }
}, [user]);
// --- End DocuSign Integration ---

  return (
    <AppContext.Provider
      value={{
        clients,
        inquiries,
        events,
        leads, // Provide leads
        googleCalendarEvents, // Provide Google Calendar events
        isDocuSignConnected, // Provide DocuSign connection status
        isGoogleCalendarConnected, // NEW: Provide Google Calendar connection status
        addInquiry,
        updateInquiryTask,
        updateEventTask,
        updateClient,
        addClient,
        updateInquiry,
        updateEvent,
        deleteEvent, // NEW: Provide deleteEvent
        fetchLeads, // Provide fetchLeads
        addLeads,   // Provide addLeads
        updateLead, // Provide updateLead
        deleteAllLeads, // Provide deleteAllLeads
        deleteLead, // Provide deleteLead
        deleteInquiry, // NEW: Provide deleteInquiry
        initiateGoogleCalendarAuth, // Provide initiateGoogleCalendarAuth
        fetchGoogleCalendarEvents, // Provide fetchGoogleCalendarEvents
        createGoogleCalendarEvent, // Provide createGoogleCalendarEvent
        initiateDocuSignAuth, // Provide initiateDocuSignAuth
        sendDocuSignDocument, // Provide sendDocuSignDocument
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};