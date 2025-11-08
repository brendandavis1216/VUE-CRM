interface Client {
  id: string;
  fraternity: string;
  school: string;
  mainContactName: string;
  phoneNumber: string;
  instagramHandle: string;
  averageEventSize: number; // in dollars
  numberOfEvents: number;
  clientScore: number; // placeholder
}

interface InquiryTask {
  id: string;
  name: 'Rendering' | 'Contract' | 'Deposit';
  completed: boolean;
}

interface Inquiry {
  id: string;
  clientId: string; // Link to the client created from this inquiry
  school: string;
  fraternity: string;
  mainContact: string;
  phoneNumber: string; // Added phone number to inquiry
  addressOfEvent: string;
  capacity: number;
  budget: number;
  inquiryDate: Date; // Added inquiry date
  inquiryTime: string; // Added inquiry time (e.g., "18:00")
  stageBuild: "None" | "Base Stage" | "Totem Stage" | "SL 100" | "SL 75" | "SL260" | "Custom Rig";
  power: "None" | "Gas Generators" | "20kW Diesel" | "36kW" | "Provided";
  gates: boolean;
  security: boolean;
  co2Tanks: number; // Added CO2 Tanks
  cdjs: number; // Added CDJs
  audio: "QSC Rig" | "4 Arrays 2 Subs" | "8 Arrays 4 Subs" | "Custom"; // Added Audio
  tasks: InquiryTask[];
  progress: number; // 0-100
}

interface EventTask {
  id: string;
  name: string | 'Paid(Full)'; // Updated to 'Paid(Full)'
  completed: boolean;
}

type EventStatus = "Pending" | "Confirmed" | "Completed" | "Cancelled"; // Re-added EventStatus type

interface Event {
  id: string;
  clientId: string; // Link to client
  fraternity: string;
  school: string;
  eventName: string; // Maybe derive from inquiry or add explicitly
  eventDate: Date; // For calendar
  addressOfEvent: string;
  capacity: number;
  budget: number;
  stageBuild: "None" | "Base Stage" | "Totem Stage" | "SL 100" | "SL 75" | "SL260" | "Custom Rig"; // Added stageBuild
  status: EventStatus; // Using the re-added EventStatus type
  tasks: EventTask[];
  progress: number; // 0-100
}

type LeadStatus = 'General' | 'Interested' | 'Not Interested';

interface Lead {
  id: string;
  user_id: string; // Supabase user ID
  name: string;
  phone_number?: string;
  school?: string;
  fraternity?: string;
  instagram_handle?: string; // New: Instagram handle
  status: LeadStatus;
  notes?: string;
  election_date?: string; // Changed to string
  created_at: string;
  updated_at: string;
}