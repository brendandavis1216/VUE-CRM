"use client";

import React, { createContext, useState, useContext, ReactNode } from "react";
import { Client, Inquiry, Event, InquiryTask, EventTask } from "@/types/app";
import { toast } from "sonner";

interface AppContextType {
  clients: Client[];
  inquiries: Inquiry[];
  events: Event[];
  addInquiry: (newInquiry: Omit<Inquiry, 'id' | 'tasks' | 'progress'>) => void;
  updateInquiryTask: (inquiryId: string, taskId: string) => void;
  updateEventTask: (eventId: string, taskId: string) => void;
  updateClient: (clientId: string, updatedClientData: Omit<Client, 'id' | 'numberOfEvents' | 'clientScore'>) => void;
  addClient: (newClientData: Omit<Client, 'id' | 'numberOfEvents' | 'clientScore'>) => void;
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
    phoneNumber: "555-123-4567",
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
    phoneNumber: "555-987-6543",
    instagramHandle: "@dez_citycollege",
    averageEventSize: 10000,
    numberOfEvents: 5,
    clientScore: calculateClientScore(5, 10000), // Calculated score
  },
];

const initialInquiries: Inquiry[] = [
  {
    id: "inq1",
    school: "University of West",
    fraternity: "Gamma Delta Epsilon",
    mainContact: "Chris Evans",
    addressOfEvent: "123 Party Lane",
    capacity: 500,
    budget: 8000,
    stageBuild: "Base Stage",
    power: false,
    gates: true,
    security: false,
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

  const addInquiry = (newInquiryData: Omit<Inquiry, 'id' | 'tasks' | 'progress'>) => {
    const defaultTasks: InquiryTask[] = [
      { id: "task-render-" + Date.now(), name: "Rendering", completed: false },
      { id: "task-contract-" + (Date.now() + 1), name: "Contract", completed: false },
      { id: "task-deposit-" + (Date.now() + 2), name: "Deposit", completed: false },
    ];

    const inquiryWithTasks: Inquiry = {
      ...newInquiryData,
      id: `inq-${Date.now()}`,
      tasks: defaultTasks,
      progress: 0,
    };

    setInquiries((prev) => [...prev, inquiryWithTasks]);
    toast.success("New inquiry added!");
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
            if (inq.stageBuild !== "None") newEventTasks.push({ id: `event-task-stage-${Date.now()}`, name: `${inq.stageBuild} Build`, completed: false });
            if (inq.power) newEventTasks.push({ id: `event-task-power-${Date.now()}`, name: "Power Setup", completed: false });
            if (inq.gates) newEventTasks.push({ id: `event-task-gates-${Date.now()}`, name: "Gate Installation", completed: false });
            if (inq.security) newEventTasks.push({ id: `event-task-security-${Date.now()}`, name: "Security Briefing", completed: false });
            // Add a default task if no specific ones are generated
            if (newEventTasks.length === 0) {
                newEventTasks.push({ id: `event-task-default-${Date.now()}`, name: "Event Logistics", completed: false });
            }

            const newEvent: Event = {
                id: `event-${Date.now()}`,
                clientId: inq.id, // Link to client
                fraternity: inq.fraternity,
                school: inq.school,
                eventName: `${inq.fraternity} - ${inq.school} Event`, // Default event name
                eventDate: new Date(), // Placeholder, could be added to form later
                addressOfEvent: inq.addressOfEvent,
                capacity: inq.capacity,
                budget: inq.budget,
                tasks: newEventTasks,
                progress: 0,
            };

            // Logic to add or update client based on completed inquiry
            setClients((prev) => {
                const existingClient = prev.find(c => c.id === inq.id); // Check if client already exists by inquiry ID
                if (existingClient) {
                    const updatedClient = {
                        ...existingClient,
                        numberOfEvents: existingClient.numberOfEvents + 1,
                        averageEventSize: (existingClient.averageEventSize * existingClient.numberOfEvents + inq.budget) / (existingClient.numberOfEvents + 1)
                    };
                    updatedClient.clientScore = calculateClientScore(updatedClient.numberOfEvents, updatedClient.averageEventSize);
                    return prev.map(c => c.id === existingClient.id ? updatedClient : c);
                } else {
                    const newClient: Client = {
                        id: inq.id, // Use inquiry ID as client ID for simplicity
                        fraternity: inq.fraternity,
                        school: inq.school,
                        mainContactName: inq.mainContact,
                        phoneNumber: "N/A", // Placeholder as phone number is removed from inquiry
                        instagramHandle: "N/A", // Placeholder
                        averageEventSize: inq.budget, // Use budget as initial avg event size
                        numberOfEvents: 1, // First event from this inquiry
                        clientScore: calculateClientScore(1, inq.budget), // Calculate score
                    };
                    return [...prev, newClient];
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