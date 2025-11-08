"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from "react";
import { Client, Inquiry, Event, InquiryTask, EventTask, Lead, LeadStatus, GoogleCalendarEvent } from "@/types/app";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/SessionContextProvider";

interface AppContextType {
  clients: Client[];
  inquiries: Inquiry[];
  events: Event[];
  leads: Lead[]; // Added leads
  googleCalendarEvents: GoogleCalendarEvent[]; // Added Google Calendar events
  addInquiry: (newInquiry: Omit<Inquiry, 'id' | 'tasks' | 'progress' | 'clientId'>, existingClientId?: string) => void;
  updateInquiryTask: (inquiryId: string, taskId: string) => void;
  updateEventTask: (eventId: string, taskId: string) => void;
  updateClient: (clientId: string, updatedClientData: Omit<Client, 'id' | 'numberOfEvents' | 'clientScore' | 'averageEventSize'>) => void;
  addClient: (newClientData: Omit<Client, 'id' | 'numberOfEvents' | 'clientScore' | 'averageEventSize'>) => void;
  updateInquiry: (inquiryId: string, updatedInquiryData: Omit<Inquiry, 'id' | 'tasks' | 'progress' | 'clientId'>) => void;
  updateEvent: (eventId: string, updatedEventData: Omit<Event, 'id' | 'tasks' | 'progress' | 'clientId' | 'fraternity' | 'school'>) => void;
  fetchLeads: () => Promise<void>; // Function to fetch leads
  addLeads: (newLeads: Omit<Lead, 'id' | 'user_id' | 'created_at' | 'updated_at'>[]) => Promise<void>; // Function to add multiple leads
  updateLead: (leadId: string, updatedLeadData: Partial<Omit<Lead, 'id' | 'user_id' | 'created_at'>>) => Promise<void>; // Function to update a lead
  deleteAllLeads: () => Promise<void>; // New: Function to delete all leads
  deleteLead: (leadId: string) => Promise<void>; // New: Function to delete a single lead
  initiateGoogleCalendarAuth: () => Promise<void>; // Function to initiate Google Calendar auth
  fetchGoogleCalendarEvents: ({ timeMin, timeMax }: { timeMin?: string; timeMax?: string }) => Promise<void>; // Function to fetch Google Calendar events
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper function to calculate client score
const calculateClientScore = (numberOfEvents: number, averageEventSize: number): number => {
  return (numberOfEvents * averageEventSize) / 1000;
};

// Helper to load state from localStorage
const loadStateFromLocalStorage = <T,>(key: string, initialValue: T): T => {
  if (typeof window === 'undefined') {
    return initialValue; // Return initial value if not in browser environment
  }
  try {
    const serializedState = localStorage.getItem(key);
    if (serializedState === null) {
      return initialValue;
    }
    const storedData = JSON.parse(serializedState);

    // Special handling for events and inquiries to parse Date objects
    if (key === "appEvents" && Array.isArray(storedData)) {
      return storedData.map(event => {
        let currentEvent = { ...event }; // Start with a shallow copy

        let date: Date;
        if (typeof currentEvent.eventDate === 'string') {
          date = new Date(currentEvent.eventDate);
        } else {
          date = new Date(); // Default if not a string
        }
        if (isNaN(date.getTime())) {
          console.warn(`Invalid eventDate found for event ID ${currentEvent.id || 'unknown'}. Defaulting to current date.`);
          currentEvent.eventDate = new Date();
        } else {
          currentEvent.eventDate = date;
        }

        // Filter out any old "Final Payment Received" tasks
        currentEvent.tasks = currentEvent.tasks.filter(task => task.name !== 'Paid(Full)'); // Changed from 'Final Payment Received' to 'Paid(Full)'

        // Ensure 'Paid(Full)' task exists for all events
        if (!currentEvent.tasks.some(task => task.name === 'Paid(Full)')) {
          const newTasks = [...currentEvent.tasks, { id: `event-task-final-payment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, name: "Paid(Full)", completed: false }];
          currentEvent.tasks = newTasks;
          // Recalculate progress after adding a task
          const completedTasks = currentEvent.tasks.filter(task => task.completed).length;
          currentEvent.progress = (completedTasks / currentEvent.tasks.length) * 100;
        }

        // Ensure status exists, default to "Pending" if not present
        if (!currentEvent.status) {
          currentEvent.status = "Pending";
        }

        return currentEvent; // Return the (potentially modified) shallow copy
      }) as T;
    }
    if (key === "appInquiries" && Array.isArray(storedData)) {
      return storedData.map(inquiry => {
        let date: Date;
        if (typeof inquiry.inquiryDate === 'string') {
          date = new Date(inquiry.inquiryDate);
        } else {
          date = new Date(); // Default if not a string
        }
        if (isNaN(date.getTime())) {
          console.warn(`Invalid inquiryDate found for inquiry ID ${inquiry.id || 'unknown'}. Defaulting to current date.`);
          return { ...inquiry, inquiryDate: new Date() };
        }
        return { ...inquiry, inquiryDate: date };
      }) as T;
    }
    return storedData;
  } catch (error) {
    console.error(`Error loading state for ${key} from localStorage:`, error);
    return initialValue;
  }
};

// Helper to save state to localStorage
const saveStateToLocalStorage = <T,>(key: string, state: T) => {
  if (typeof window === 'undefined') {
    return; // Do nothing if not in browser environment
  }
  try {
    let stateToStore = state;
    // Special handling for events and inquiries to stringify Date objects
    if (key === "appEvents" && Array.isArray(state)) {
      stateToStore = state.map(event => ({
        ...event,
        eventDate: event.eventDate.toISOString(),
      })) as T;
    }
    if (key === "appInquiries" && Array.isArray(state)) {
      stateToStore = state.map(inquiry => ({
        ...inquiry,
        inquiryDate: inquiry.inquiryDate.toISOString(),
      })) as T;
    }
    const serializedState = JSON.stringify(stateToStore);
    localStorage.setItem(key, serializedState);
  } catch (error) {
    console.error(`Error saving state for ${key} to localStorage:`, error);
  }
};

const initialClients: Client[] = [
  {
    id: "1",
    fraternity: "Alpha Beta Gamma",
    school: "State University",
    mainContactName: "John Doe",
    phoneNumber: "5551234567",
    instagramHandle: "@abg_stateu",
    averageEventSize: 15000,
    numberOfEvents: 3,
    clientScore: calculateClientScore(3, 15000),
  },
  {
    id: "2",
    fraternity: "Delta Epsilon Zeta",
    school: "City College",
    mainContactName: "Jane Smith",
    phoneNumber: "5559876543",
    instagramHandle: "@dez_citycollege",
    averageEventSize: 10000,
    numberOfEvents: 5,
    clientScore: calculateClientScore(5, 10000),
  },
  {
    id: "client-from-inq1",
    fraternity: "Gamma Delta Epsilon",
    school: "University of West",
    mainContactName: "Chris Evans",
    phoneNumber: "5551112222",
    instagramHandle: "N/A",
    averageEventSize: 8000,
    numberOfEvents: 0,
    clientScore: calculateClientScore(0, 8000),
  }
];

const initialInquiries: Inquiry[] = [
  {
    id: "inq1",
    clientId: "client-from-inq1",
    school: "University of West",
    fraternity: "Gamma Delta Epsilon",
    mainContact: "Chris Evans",
    phoneNumber: "5551112222",
    addressOfEvent: "123 Party Lane",
    capacity: 500,
    budget: 8000,
    inquiryDate: new Date("2024-10-26"), // Example date
    inquiryTime: "19:00", // Example time
    stageBuild: "Base Stage",
    power: "None",
    gates: true,
    security: false,
    co2Tanks: 0,
    cdjs: 0,
    audio: "QSC Rig",
    tasks: [
      { id: "task1", name: "Rendering", completed: false },
      { id: "task2", name: "Contract", completed: false },
      { id: "task3", name: "Deposit", completed: false },
    ],
    progress: 0,
  },
];

const initialEvents: Event[] = [];
const initialLeads: Lead[] = []; // Initial empty leads array

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useSession(); // Get user from session context
  const [clients, setClients] = useState<Client[]>(() =>
    loadStateFromLocalStorage("appClients", initialClients)
  );
  const [inquiries, setInquiries] = useState<Inquiry[]>(() =>
    loadStateFromLocalStorage("appInquiries", initialInquiries)
  );
  const [events, setEvents] = useState<Event[]>(() =>
    loadStateFromLocalStorage("appEvents", initialEvents)
  );
  const [leads, setLeads] = useState<Lead[]>(initialLeads); // State for leads
  const [googleCalendarEvents, setGoogleCalendarEvents] = useState<GoogleCalendarEvent[]>([]); // State for Google Calendar events

  // Use useEffect to save state whenever it changes
  useEffect(() => {
    saveStateToLocalStorage("appClients", clients);
  }, [clients]);

  useEffect(() => {
    saveStateToLocalStorage("appInquiries", inquiries);
  }, [inquiries]);

  useEffect(() => {
    saveStateToLocalStorage("appEvents", events);
  }, [events]);

  // Fetch leads when component mounts or user changes
  useEffect(() => {
    if (user) {
      fetchLeads();
    } else {
      setLeads([]); // Clear leads if no user is logged in
    }
  }, [user]);

  const calculateProgress = (tasks: InquiryTask[] | EventTask[]) => {
    if (tasks.length === 0) return 0;
    const completedTasks = tasks.filter(task => task.completed).length;
    return (completedTasks / tasks.length) * 100;
  };

  const addInquiry = (newInquiryData: Omit<Inquiry, 'id' | 'tasks' | 'progress' | 'clientId'>, existingClientId?: string) => {
    let targetClientId: string;
    let clientToUpdate: Client | undefined;

    if (existingClientId) {
      targetClientId = existingClientId;
      clientToUpdate = clients.find(c => c.id === existingClientId);
      if (!clientToUpdate) {
        console.error(`Existing client with ID ${existingClientId} not found. Creating a new client.`);
        targetClientId = `client-${Date.now()}-from-inq`; // Fallback to new ID
      }
    } else {
      targetClientId = `client-${Date.now()}-from-inq`;
    }

    const defaultTasks: InquiryTask[] = [
      { id: "task-render-" + Date.now(), name: "Rendering", completed: false },
      { id: "task-contract-" + (Date.now() + 1), name: "Contract", completed: false },
      { id: "task-deposit-" + (Date.now() + 2), name: "Deposit", completed: false },
    ];

    const inquiryWithTasks: Inquiry = {
      ...newInquiryData,
      id: `inq-${Date.now()}`,
      clientId: targetClientId, // Link to the client
      tasks: defaultTasks,
      progress: 0,
    };

    setInquiries((prev) => [...prev, inquiryWithTasks]);
    toast.success("New inquiry added!");

    // Handle client creation/update
    if (!clientToUpdate) { // If no existing client was found or existingClientId was not provided
      const initialAverageEventSize = newInquiryData.budget; // First event's budget
      const initialNumberOfEvents = 0; // New client starts with 0 events from this inquiry's perspective

      const newClient: Client = {
        id: targetClientId,
        fraternity: newInquiryData.fraternity,
        school: newInquiryData.school,
        mainContactName: newInquiryData.mainContact,
        phoneNumber: newInquiryData.phoneNumber,
        instagramHandle: "N/A", // Placeholder, as not available in inquiry form
        averageEventSize: initialAverageEventSize,
        numberOfEvents: initialNumberOfEvents,
        clientScore: calculateClientScore(initialNumberOfEvents, initialAverageEventSize),
      };
      setClients((prevClients) => [...prevClients, newClient]);
      toast.success(`New client "${newClient.fraternity} - ${newClient.school}" added from inquiry!`);
    } else {
      // If an existing client was found, we don't update its event count or average event size here.
      // Those updates happen when the inquiry is *completed* in `updateInquiryTask`.
      // We just ensure the inquiry is linked.
      toast.success(`Inquiry linked to existing client "${clientToUpdate.fraternity} - ${clientToUpdate.school}"!`);
    }
  };

  const updateInquiry = (inquiryId: string, updatedInquiryData: Omit<Inquiry, 'id' | 'tasks' | 'progress' | 'clientId'>) => {
    setInquiries((prevInquiries) =>
      prevInquiries.map((inq) => {
        if (inq.id === inquiryId) {
          // Preserve existing tasks and progress, only update other fields
          return { ...inq, ...updatedInquiryData };
        }
        return inq;
      })
    );
    toast.success("Inquiry updated successfully!");
  };

  const updateInquiryTask = (inquiryId: string, taskId: string) => {
    setInquiries((prevInquiries) =>
      prevInquiries.map((inq) => {
        if (inq.id === inquiryId) {
          const updatedTasks = inq.tasks.map((task) =>
            task.id === taskId ? { ...task, completed: !task.completed } : task
          );
          const newProgress = calculateProgress(updatedTasks);
          const updatedInquiry = { ...inq, tasks: updatedTasks, progress: newProgress };

          if (newProgress === 100) {
            toast.success(`Inquiry "${inq.fraternity}" completed! Moving to Events.`);
            
            const newEventTasks: EventTask[] = [];
            
            // Power: If power is NOT provided by the client (i.e., not "Provided" and not "None"), add a task for sourcing it.
            if (inq.power !== "None" && inq.power !== "Provided") {
                newEventTasks.push({ id: `event-task-power-${Date.now()}`, name: `Source ${inq.power}`, completed: false });
            }

            // Gates: If gates are NOT provided by the client, add a task for sourcing them.
            if (!inq.gates) {
                newEventTasks.push({ id: `event-task-gates-${Date.now()}`, name: "Source Gates", completed: false });
            }

            // Security: If security is NOT provided by the client, add a task for sourcing it.
            if (!inq.security) {
                newEventTasks.push({ id: `event-task-security-${Date.now()}`, name: "Source Security", completed: false });
            }

            // CO2 Tanks: If CO2 tanks are needed (quantity > 0), add a task for sourcing them.
            if (inq.co2Tanks > 0) {
                newEventTasks.push({ id: `event-task-co2-${Date.now()}`, name: `Source ${inq.co2Tanks} CO2 Tanks`, completed: false });
            }

            // CDJs: If CDJs are needed (quantity > 2), add a task for sourcing them.
            if (inq.cdjs > 2) {
                newEventTasks.push({ id: `event-task-cdjs-${Date.now()}`, name: `Source ${inq.cdjs} CDJs`, completed: false });
            }

            // Audio: If audio is not "QSC Rig", add a task for sourcing it.
            if (inq.audio !== "QSC Rig") {
                newEventTasks.push({ id: `event-task-audio-${Date.now()}`, name: `Source ${inq.audio} Audio`, completed: false });
            }

            // Add a default task if no specific ones are generated (e.g., if everything is provided)
            if (newEventTasks.length === 0) {
                newEventTasks.push({ id: `event-task-default-${Date.now()}`, name: "Event Logistics", completed: false });
            }

            // Add the "Paid(Full)" task
            newEventTasks.push({ id: `event-task-final-payment-${Date.now() + 3}`, name: "Paid(Full)", completed: false });


            // Combine inquiry date and time to create the eventDate
            const [hours, minutes] = inq.inquiryTime.split(':').map(Number);
            const eventDateTime = new Date(inq.inquiryDate);
            eventDateTime.setHours(hours, minutes, 0, 0);

            const newEvent: Event = {
                id: `event-${Date.now()}`,
                clientId: inq.clientId, // Link to client using the stored clientId
                fraternity: inq.fraternity,
                school: inq.school,
                eventName: `${inq.fraternity} - ${inq.school}`, // Default event name without "Event"
                eventDate: eventDateTime, // Use the combined date and time
                addressOfEvent: inq.addressOfEvent,
                capacity: inq.capacity,
                budget: inq.budget,
                stageBuild: inq.stageBuild, // Transfer stageBuild directly to event
                status: "Pending", // Default status for new events
                tasks: newEventTasks,
                progress: 0,
            };

            // Logic to update client based on completed inquiry
            setClients((prev) => {
                const existingClient = prev.find(c => c.id === inq.clientId); // Use inq.clientId to find the client
                if (existingClient) {
                    const updatedClient = {
                        ...existingClient,
                        numberOfEvents: existingClient.numberOfEvents + 1,
                        averageEventSize: (existingClient.averageEventSize * existingClient.numberOfEvents + inq.budget) / (existingClient.numberOfEvents + 1)
                    };
                    updatedClient.clientScore = calculateClientScore(updatedClient.numberOfEvents, updatedClient.averageEventSize);
                    return prev.map(c => c.id === existingClient.id ? updatedClient : c);
                } else {
                    console.error(`Client with ID ${inq.clientId} not found when completing inquiry ${inq.id}. This should not happen if client is added on inquiry creation.`);
                    return prev; // Return previous state if client not found (should ideally not occur)
                }
            });
            setEvents((prev) => [...prev, newEvent]);
            return null; // Remove inquiry from list
          }
          return updatedInquiry;
        }
        return inq;
      }).filter(Boolean) as Inquiry[]
    );
  };

  const updateEvent = (eventId: string, updatedEventData: Omit<Event, 'id' | 'tasks' | 'progress' | 'clientId' | 'fraternity' | 'school'>) => {
    setEvents((prevEvents) =>
      prevEvents.map((event) => {
        if (event.id === eventId) {
          // Preserve existing tasks, progress, clientId, fraternity, school
          return { ...event, ...updatedEventData };
        }
        return event;
      })
    );
    toast.success("Event updated successfully!");
  };

  const updateEventTask = (eventId: string, taskId: string) => {
    setEvents((prevEvents) =>
      prevEvents.map((event) => {
        if (event.id === eventId) {
          const updatedTasks = event.tasks.map((task) =>
            task.id === taskId ? { ...task, completed: !task.completed } : task
          );
          const newProgress = calculateProgress(updatedTasks);
          return { ...event, tasks: updatedTasks, progress: newProgress };
        }
        return event;
      })
    );
  };

  const updateClient = (clientId: string, updatedClientData: Omit<Client, 'id' | 'numberOfEvents' | 'clientScore' | 'averageEventSize'>) => {
    setClients((prevClients) =>
      prevClients.map((client) => {
        if (client.id === clientId) {
          const updatedClient = { ...client, ...updatedClientData };
          // Recalculate clientScore based on potentially updated averageEventSize (though averageEventSize is now derived)
          updatedClient.clientScore = calculateClientScore(updatedClient.numberOfEvents, updatedClient.averageEventSize);
          return updatedClient;
        }
        return client;
      })
    );
    toast.success("Client updated successfully!");
  };

  const addClient = (newClientData: Omit<Client, 'id' | 'numberOfEvents' | 'clientScore' | 'averageEventSize'>) => {
    const numberOfEvents = 0; // New clients start with 0 events
    const averageEventSize = 0; // New clients start with 0 average event size
    const clientScore = calculateClientScore(numberOfEvents, averageEventSize);

    const newClient: Client = {
      ...newClientData,
      id: `client-${Date.now()}`,
      numberOfEvents: numberOfEvents,
      averageEventSize: averageEventSize, // Initialize to 0
      clientScore: clientScore,
    };
    setClients((prev) => [...prev, newClient]);
    toast.success("New client added successfully!");
  };

  // --- Leads Management Functions ---
  const fetchLeads = async () => {
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
  };

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
    console.log("DEBUG: Value of functionsUrl from import.meta.env:", functionsUrl); // Added debug log

    if (!functionsUrl) {
      console.error("VITE_SUPABASE_FUNCTIONS_URL is not defined in environment variables.");
      toast.error("Supabase Functions URL is not configured. Please check your .env file.");
      return;
    }

    const url = `${functionsUrl}/google-calendar/auth`;
    console.log("Client Origin:", clientOrigin);
    console.log("Attempting to fetch Google Calendar auth URL from:", url);

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
  if (!user) {
    setGoogleCalendarEvents([]); // Clear events if not logged in
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
}, [user]);
// --- End Google Calendar Integration ---

  return (
    <AppContext.Provider
      value={{
        clients,
        inquiries,
        events,
        leads, // Provide leads
        googleCalendarEvents, // Provide Google Calendar events
        addInquiry,
        updateInquiryTask,
        updateEventTask,
        updateClient,
        addClient,
        updateInquiry,
        updateEvent,
        fetchLeads, // Provide fetchLeads
        addLeads,   // Provide addLeads
        updateLead, // Provide updateLead
        deleteAllLeads, // Provide deleteAllLeads
        deleteLead, // Provide deleteLead
        initiateGoogleCalendarAuth, // Provide initiateGoogleCalendarAuth
        fetchGoogleCalendarEvents, // Provide fetchGoogleCalendarEvents
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