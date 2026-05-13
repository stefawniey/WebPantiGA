export interface User {
  id: number | string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  status?: 'active' | 'suspended';
  created_at?: string;
  last_login?: string;
  total_donations?: number;
  donation_count?: number;
  supported_orphanages?: string[];
}

export interface Orphanage {
  id: number;
  name: string;
  description: string;
  location: string;
  image_url: string;
  target_money: number;
  current_money: number;
  urgent_needs: string;
  is_urgent?: boolean;
  created_at: string;
}

export interface Donation {
  id: number;
  user_id: number;
  orphanage_id: number;
  type: 'money' | 'goods';
  amount?: number;
  goods_detail?: string;
  method: string;
  status: 'pending' | 'verified' | 'completed';
  receipt_url?: string;
  created_at: string;
  orphanage_name?: string;
  user_name?: string;
}
