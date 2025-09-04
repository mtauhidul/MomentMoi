export type RSVPStatus = "pending" | "confirmed" | "declined" | "maybe";

export interface Guest {
  id: string;
  event_id: string;
  name: string;
  email: string;
  phone?: string;
  rsvp_status: RSVPStatus;
  rsvp_response_date?: string;
  dietary_restrictions?: string;
  plus_one_name?: string;
  plus_one_dietary_restrictions?: string;
  group_category?: string;
  notes?: string;
  invitation_sent: boolean;
  invitation_sent_date?: string;
  created_at: string;
  updated_at: string;
}

export interface GuestGroup {
  id: string;
  event_id: string;
  name: string;
  color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface GuestCommunication {
  id: string;
  guest_id: string;
  type: string;
  subject: string;
  content: string;
  sent_at: string;
  status: string;
  created_at: string;
}
