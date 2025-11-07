"use client";

import React, { createContext, useState, useContext, ReactNode } from "react";
import { Client, Inquiry, Event, InquiryTask, EventTask } from "@/types/app";
import { toast } from "sonner";

interface AppContextType {
  clients: Client[];
  inquiries: Inquiry[];
  events: Event[];
  addInquiry: (newInquiry: Omit<Inquiry, 'id' | 'tasks' | 'progress' | 'clientId'>, existingClientId?: string) => void;
  updateInquiryTask: (inquiryId: string, taskId: string) => void;
  updateEventTask: (eventId: string, taskId: string) => void;
  updateClient: (clientId: string, updatedClientData: Omit<Client, 'id' | 'numberOfEvents' | 'clientScore'>) => void;
  addClient: (newClientData: Omit<Client, 'id' | 'numberOfEvents' | 'clientScore'>) => void;
  updateInquiry: (inquiryId: string, updatedInquiryData: Omit<Inquiry, 'id' | 'tasks' | 'progress' | 'clientId'>) => void; // New function
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper function to calculate client score
const calculateClientScore = (numberOfEvents: number, averageEventSize: number): number => {
  return (numberOfEvents * averageEventSize) / 1000;
};

const initialClients: Client[] = [
  {
    id: "1",
    fraternity: "Alpha Beta Gamma",
    school: "State University",
    mainContactName: "John Doe",
    phoneNumber: "5551234567", // Raw 10 digits
    instagramHandle: "@abg_stateu",
    averageEventSize: 15000,
    numberOfEvents: 3,
    clientScore: calculateClientScore(3, 15000), // Calculated score
  },
  {
    id: "2",
    fraternity: "Delta Epsilon Zeta",
    school: "City College",
    mainContactName: "Jane Smith",
    phoneNumber: "5559876543", // Raw 10 digits
    instagramHandle: "@dez_citycollege",
    averageEventSize: 10000,
    numberOfEvents: 5,
    clientScore: calculateClientScore(5, 10000), // Calculated score
  },
  // Client for initial inquiry
  {
    id: "client-from-inq1", // This ID will be linked to inq1
    fraternity: "Gamma Delta Epsilon",
    school: "University of West",
    mainContactName: "Chris Evans",
    phoneNumber: "5551112222", // Raw 10 digits
    instagramHandle: "N/A",
    averageEventSize: 8000, // Initial budget from inquiry
    numberOfEvents: 0, // Starts at 0 events
    clientScore: calculateClientScore(0, 8000),
  }
];

const initialInquiries: Inquiry[] = [
  {
    id: "inq1",
    clientId: "client-from-inq1", // Link to the client above
    school: "University of West",
    fraternity: "Gamma Delta Epsilon",
    mainContact: "Chris Evans",
    phoneNumber: "5551112222", // Raw 10 digits
    addressOfEvent: "123 Party Lane",
    capacity: 500,
    budget: 8000,
    stageBuild: "Base Stage",
    power: "None",
    gates: true,
    security: false,
    co2Tanks: 0,
    cdjs: 0, // Added CDJs to initial inquiry
    audio: "QSC Rig", // Added Audio to initial inquiry
    tasks: [
      { id: "task1", name: "Rendering", completed: false },
      { id: "task2", name: "Contract", completed: false },
      { id: "task3", name: "Deposit", completed: false },
    ],
    progress: 0,
  },
];

const initialEvents: Event[] = [];

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [inquiries, setInquiries] = useState<Inquiry[]>(initialInquiries);
  const [events, setEvents] = useState<Event[]>(initialEvents);

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
      const initialAverageEventSize = newInquiryData.budget;
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

            const newEvent: Event = {
                id: `event-${Date.now()}`,
                clientId: inq.clientId, // Link to client using the stored clientId
                fraternity: inq.fraternity,
                school: inq.school,
                eventName: `${inq.fraternity} - ${inq.school} Event`, // Default event name
                eventDate: new Date(), // Placeholder, could be added to form later
                addressOfEvent: inq.addressOfEvent,
                capacity: inq.capacity,
                budget: inq.budget,
                stageBuild: inq.stageBuild, // Transfer stageBuild directly to event
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

  const updateClient = (clientId: string, updatedClientData: Omit<Client, 'id' | 'numberOfEvents' | 'clientScore'>) => {
    setClients((prevClients) =>
      prevClients.map((client) => {
        if (client.id === clientId) {
          const updatedClient = { ...client, ...updatedClientData };
          // Recalculate clientScore based on potentially updated averageEventSize
          updatedClient.clientScore = calculateClientScore(updatedClient.numberOfEvents, updatedClient.averageEventSize);
          return updatedClient;
        }
        return client;
      })
    );
    toast.success("Client updated successfully!");
  };

  const addClient = (newClientData: Omit<Client, 'id' | 'numberOfEvents' | 'clientScore'>) => {
    const numberOfEvents = 0; // New clients start with 0 events
    const averageEventSize = newClientData.averageEventSize;
    const clientScore = calculateClientScore(numberOfEvents, averageEventSize);

    const newClient: Client = {
      ...newClientData,
      id: `client-${Date.now()}`,
      numberOfEvents: numberOfEvents,
      clientScore: clientScore,
    };
    setClients((prev) => [...prev, newClient]);
    toast.success("New client added successfully!");
  };

  return (
    <AppContext.Provider
      value={{
        clients,
        inquiries,
        events,
        addInquiry,
        updateInquiryTask,
        updateEventTask,
        updateClient,
        addClient,
        updateInquiry, // Provide the new function
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