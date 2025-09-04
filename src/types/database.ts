export interface Database {
  public: {
    Tables: {
      couple_profiles: {
        Row: {
          id: string;
          user_id: string;
          partner_id?: string;
          partner_name?: string;
          partner_email?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          partner_id?: string;
          partner_name?: string;
          partner_email?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          partner_id?: string;
          partner_name?: string;
          partner_email?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          planner_id: string;
          event_type: string;
          event_date?: string;
          location?: string;
          guest_count?: string;
          event_style?: string;
          budget_range?: string;
          planning_stage?: string;
          ceremony_venue?: string;
          reception_venue?: string;
          ceremony_time?: string;
          reception_time?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          planner_id: string;
          event_type: string;
          event_date?: string;
          location?: string;
          guest_count?: string;
          event_style?: string;
          budget_range?: string;
          planning_stage?: string;
          ceremony_venue?: string;
          reception_venue?: string;
          ceremony_time?: string;
          reception_time?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          planner_id?: string;
          event_type?: string;
          event_date?: string;
          location?: string;
          guest_count?: string;
          event_style?: string;
          budget_range?: string;
          planning_stage?: string;
          ceremony_venue?: string;
          reception_venue?: string;
          ceremony_time?: string;
          reception_time?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name?: string;
          user_type: string;
          avatar_url?: string;
          location_preference?: string;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name?: string;
          user_type: string;
          avatar_url?: string;
          location_preference?: string;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          user_type?: string;
          avatar_url?: string;
          location_preference?: string;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      vendor_bookings: {
        Row: {
          id: string;
          vendor_id: string;
          inquiry_id: string;
          service_id?: string;
          client_name: string;
          client_email: string;
          client_phone?: string;
          event_type: string;
          event_date: string;
          start_time?: string;
          end_time?: string;
          guest_count?: number;
          location?: string;
          budget_amount?: number;
          notes?: string;
          status: "confirmed" | "completed" | "cancelled" | "rescheduled";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          inquiry_id: string;
          service_id?: string;
          client_name: string;
          client_email: string;
          client_phone?: string;
          event_type: string;
          event_date: string;
          start_time?: string;
          end_time?: string;
          guest_count?: number;
          location?: string;
          budget_amount?: number;
          notes?: string;
          status?: "confirmed" | "completed" | "cancelled" | "rescheduled";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          vendor_id?: string;
          inquiry_id?: string;
          service_id?: string;
          client_name?: string;
          client_email?: string;
          client_phone?: string;
          event_type?: string;
          event_date?: string;
          start_time?: string;
          end_time?: string;
          guest_count?: number;
          location?: string;
          budget_amount?: number;
          notes?: string;
          status?: "confirmed" | "completed" | "cancelled" | "rescheduled";
          created_at?: string;
          updated_at?: string;
        };
      };
      vendor_inquiries: {
        Row: {
          id: string;
          vendor_id: string;
          service_id?: string;
          client_name: string;
          client_email: string;
          client_phone?: string;
          event_type: string;
          event_date?: string;
          guest_count?: number;
          location?: string;
          budget_range?: string;
          message: string;
          status: string;
          priority: string;
          source: string;
          created_at: string;
          updated_at: string;
          responded_at?: string;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          service_id?: string;
          client_name: string;
          client_email: string;
          client_phone?: string;
          event_type: string;
          event_date?: string;
          guest_count?: number;
          location?: string;
          budget_range?: string;
          message: string;
          status?: string;
          priority?: string;
          source?: string;
          created_at?: string;
          updated_at?: string;
          responded_at?: string;
        };
        Update: {
          id?: string;
          vendor_id?: string;
          service_id?: string;
          client_name?: string;
          client_email?: string;
          client_phone?: string;
          event_type?: string;
          event_date?: string;
          guest_count?: number;
          location?: string;
          budget_range?: string;
          message?: string;
          status?: string;
          priority?: string;
          source?: string;
          created_at?: string;
          updated_at?: string;
          responded_at?: string;
        };
      };
      vendor_profiles: {
        Row: {
          id: string;
          user_id: string;
          business_name: string;
          description?: string;
          logo_url?: string;
          verified: boolean;
          profile_views: number;
          created_at: string;
          updated_at: string;
          business_category: string;
          event_types: string[];
          external_calendar_url?: string;
          privacy_settings?: any;
        };
        Insert: {
          id?: string;
          user_id: string;
          business_name: string;
          description?: string;
          logo_url?: string;
          verified?: boolean;
          profile_views?: number;
          created_at?: string;
          updated_at?: string;
          business_category: string;
          event_types?: string[];
          external_calendar_url?: string;
          privacy_settings?: any;
        };
        Update: {
          id?: string;
          user_id?: string;
          business_name?: string;
          description?: string;
          logo_url?: string;
          verified?: boolean;
          profile_views?: number;
          created_at?: string;
          updated_at?: string;
          business_category?: string;
          event_types?: string[];
          external_calendar_url?: string;
          privacy_settings?: any;
        };
      };
      vendor_availability: {
        Row: {
          id: string;
          vendor_id: string;
          date: string;
          is_available: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          date: string;
          is_available?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          vendor_id?: string;
          date?: string;
          is_available?: boolean;
          created_at?: string;
        };
      };
      service_categories: {
        Row: {
          id: string;
          name: string;
          icon?: string;
          description?: string;
          created_at: string;
          category: string;
          event_types: string[];
        };
        Insert: {
          id?: string;
          name: string;
          icon?: string;
          description?: string;
          created_at?: string;
          category: string;
          event_types?: string[];
        };
        Update: {
          id?: string;
          name?: string;
          icon?: string;
          description?: string;
          created_at?: string;
          category?: string;
          event_types?: string[];
        };
      };
      vendor_contacts: {
        Row: {
          id: string;
          vendor_id: string;
          contact_type: string;
          contact_value: string;
          is_primary: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          contact_type: string;
          contact_value: string;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          vendor_id?: string;
          contact_type?: string;
          contact_value?: string;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      vendor_locations: {
        Row: {
          id: string;
          vendor_id: string;
          location: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          location: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          vendor_id?: string;
          location?: string;
          created_at?: string;
        };
      };
      guests: {
        Row: {
          id: string;
          event_id: string;
          name: string;
          email?: string;
          phone?: string;
          rsvp_status: string;
          dietary_restrictions?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          name: string;
          email?: string;
          phone?: string;
          rsvp_status?: string;
          dietary_restrictions?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          name?: string;
          email?: string;
          phone?: string;
          rsvp_status?: string;
          dietary_restrictions?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      checklist_items: {
        Row: {
          id: string;
          event_id: string;
          title: string;
          description?: string;
          due_date?: string;
          completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          title: string;
          description?: string;
          due_date?: string;
          completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          title?: string;
          description?: string;
          due_date?: string;
          completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      budget_items: {
        Row: {
          id: string;
          event_id: string;
          category: string;
          name: string;
          estimated_cost?: number;
          actual_cost?: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          category: string;
          name: string;
          estimated_cost?: number;
          actual_cost?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          category?: string;
          name?: string;
          estimated_cost?: number;
          actual_cost?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      vendor_analytics: {
        Row: {
          id: string;
          vendor_id: string;
          date: string;
          profile_views: number;
          inquiry_views: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          date: string;
          profile_views?: number;
          inquiry_views?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          vendor_id?: string;
          date?: string;
          profile_views?: number;
          inquiry_views?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      vendor_gallery: {
        Row: {
          id: string;
          vendor_id: string;
          image_url: string;
          caption?: string;
          display_order: number;
          is_featured: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          image_url: string;
          caption?: string;
          display_order?: number;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          vendor_id?: string;
          image_url?: string;
          caption?: string;
          display_order?: number;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      vendor_services: {
        Row: {
          id: string;
          vendor_id: string;
          category_id: string;
          name: string;
          description?: string;
          pricing_model?: string;
          created_at: string;
          updated_at: string;
          event_types: string[];
          is_active: boolean;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          category_id: string;
          name: string;
          description?: string;
          pricing_model?: string;
          created_at?: string;
          updated_at?: string;
          event_types?: string[];
          is_active?: boolean;
        };
        Update: {
          id?: string;
          vendor_id?: string;
          category_id?: string;
          name?: string;
          description?: string;
          pricing_model?: string;
          created_at?: string;
          updated_at?: string;
          event_types?: string[];
          is_active?: boolean;
        };
      };
    };
  };
}
