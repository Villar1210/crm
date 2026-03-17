export type ProfileSkin = 'MA' | 'RD' | 'SF' | 'PD' | 'TOT';

export type CrmSettings = {
    baseUrl: string;
    token?: string;
    appUrl?: string;
};

export type CrmActivityType = 'call' | 'message' | 'task' | 'followup';

export type CrmIntegration = 'bulk' | 'agenda' | 'broadcast' | 'automations';

export interface CrmActivity {
    id: string;
    type: CrmActivityType;
    title: string;
    createdAt: string;
    completed?: boolean;
}

export interface ContactMaster {
    // Section A: Identification
    id: string; // phone number is the ID
    name: string;
    phone: string;
    avatarUrl?: string; // from real WA
    email: string;
    cpf?: string;
    birthDate?: string;

    // Section B: Address
    cep?: string;
    address?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;

    // Section C: Real Estate Preferences
    interestType: 'buy' | 'rent' | 'invest';
    propertyType: 'house' | 'apartment' | 'commercial' | 'land';
    bedrooms?: [number, number]; // min, max
    priceRange?: [number, number];
    areaRange?: [number, number];
    preferredNeighborhoods: string[];

    // Section D: Qualificacao
    origin?: string;
    temperature: 'hot' | 'warm' | 'cold';
    score: number; // 0-100

    // Section E: Management
    status: 'new' | 'open' | 'won' | 'lost';
    tags: string[];
    notes: string[]; // Simple string array for now
    activities?: CrmActivity[];
    deals?: string[];
    properties?: string[];
    funnelStage?: string;
    autoStatus?: boolean;
    integrations?: CrmIntegration[];

    // Meta
    skin: ProfileSkin;
    lastInteraction: string;
    crmId?: string;
    crmUpdatedAt?: string;
}

export interface BulkCampaign {
    id: string;
    name: string;
    status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused';
    createdAt: string;
    scheduledFor?: string;

    // Content
    type: 'message' | 'property' | 'campaign';
    contentBody: string; // The message text

    // Stats
    totalContacts: number;
    sentCount: number;
    failedCount: number;
}
