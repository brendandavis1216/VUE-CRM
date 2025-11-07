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
  school: string;
  fraternity: string;
  mainContact: string;
  phoneNumber: string;
  addressOfEvent: string;
  capacity: number;
  budget: number;
  stageBuild: boolean;
  power: boolean;
  gates: boolean;
  security: boolean;
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
  tasks: EventTask[];
  progress: number; // 0-100
}