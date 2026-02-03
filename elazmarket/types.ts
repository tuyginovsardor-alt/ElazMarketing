
export type TransportType = 'Piyoda' | 'Velosiped' | 'Mashina';
export type WorkZone = 'Tuman Markazi' | 'Guliston shahri';
export type OrderStatus = 'pending' | 'confirmed' | 'delivering' | 'delivered' | 'cancelled';

export interface Profile {
  id: string;
  telegram_id?: number;
  full_name: string;
  email: string;
  role: 'courier' | 'admin';
  transport_type: TransportType;
  work_zones: WorkZone[];
  active_status: boolean;
  is_approved: boolean; // Admin tasdig'i uchun
  address?: string; // Turar joy manzili
  rating: number;
  balance: number;
  lat?: number;
  lng?: number;
  last_active?: string;
}

export interface Order {
  id: string;
  customer_name: string;
  address: string;
  district: WorkZone;
  items: string;
  delivery_cost: number;
  status: OrderStatus;
  courier_id?: string;
  lat: number;
  lng: number;
  created_at: string;
}

export interface AppConfig {
  BOT_TOKEN: string;
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
  ADMIN_IDS: number[];
}
