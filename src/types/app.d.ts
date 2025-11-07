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
  name: string; // e.g., "Power Setup", "Gate Installation", "Security Briefing", "Stage Build"
  completed: boolean;
}

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
  tasks: EventTask[];
  progress: number; // 0-100
}