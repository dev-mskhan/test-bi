
export interface BusinessFormPayload {
  businessName: string;
  businessType: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string;
  country?: string;
  website?: string;
  employeeCount?: string;
  annualRevenue?: string;
  description?: string;
  services?: string;
  webhook_url: string; 
}

export interface MainServerPayload {
  data: {
    businessName: string;
    businessType: string;
    ownerName: string;
    email: string;
    phone: string;
    city: string;
    country: string;
    website: string | null;
    employeeCount: number | null;
    annualRevenue: string | null;
    description: string | null;
    services: string[];
  };
}