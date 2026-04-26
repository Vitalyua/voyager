// voyager-data.ts — seed data shared across Voyager screens

export const IATA: Record<string, string> = {
    HKG: 'Hong Kong', FRA: 'Frankfurt', JFK: 'New York JFK',
    AMS: 'Amsterdam', DXB: 'Dubai', LHR: 'London Heathrow',
    SIN: 'Singapore', LAX: 'Los Angeles', CDG: 'Paris CDG',
};

export interface CargoMeta {
    label: string;
    dot: string;
    range: [number, number];
}

export const CARGO: Record<string, CargoMeta> = {
    pharma: {label: 'Pharma', dot: 'pharma', range: [2, 8]},
    perish: {label: 'Perishable', dot: 'perish', range: [0, 4]},
    live: {label: 'Live animal', dot: 'live', range: [12, 22]},
    dg: {label: 'Dangerous goods', dot: 'dg', range: [-5, 35]},
    general: {label: 'General', dot: 'general', range: [-5, 35]},
};

export const STATUS: Record<string, string> = {
    all: 'All',
    NFD: 'Delivered',
    DLV: 'Delivered',
    RCS: 'Received',
    DEP: 'Departed',
    ARR: 'Arrived',
    AWD: 'Awaiting delivery',
    RCF: 'Received from flight',
    MAN: 'Manifest submitted',
    FOH: 'Freight on hand',
};

export const STATUS_TYPE: Record<string, string> = {
    NFD: 'delivered',
    DLV: 'delivered',
    RCS: 'delivered',
    DEP: 'delivered',
    AWD: 'delivered',
    RCF: 'delivered',
    ARR: 'delivered',
    MAN: 'in_transit',
    FOH: 'in_transit',
    SAC: 'in_transit',
    BKD: 'booked',
};


export interface DistressedAWB {
    awb: string;
    route: string[];
    cargo: string;
    cargoNote: string;
    reason: string;
    stuck: string;
    status: string;
    flaggedAt: string;
}
// --- Raw API types ---

export interface OneRecordRef {
    '@id': string;
}

export interface OneRecordTyped {
    '@type': string[];
    '@id': string;
    code: string;
}

export interface LocationCode {
    '@type': string[];           // ["CodeListElement"]
    '@id': string;               // "...iata-three-letter-codes#HKG"
    code: string;
}

export interface EventLocation {
    '@type': string[];           // ["Location"]
    '@id': string;               // "internal:uuid"
    locationCodes: LocationCode[];
}

export interface LogisticsEvent {
    '@type': string[];
    '@id': string;
    eventFor: OneRecordRef;
    eventTimeType: OneRecordTyped; // @id: "Actual" | "Scheduled" | ...
    eventDate: string;             // ISO 8601
    eventLocation: EventLocation;
    eventCode: OneRecordTyped;     // @id: "...StatusCode#NFD"
}

export interface ShipmentRow {
    id: number;
    created: string;
    logistic_object_id: string;
    logistic_object_type: string;
    waybill_prefix: string;
    waybill_number: string;
    pieces: number;
    last_event: LogisticsEvent;
    departureLocation: LocationCode[];
    arrivalLocation: LocationCode[];
    flight: {
        legs: Legs[];
    };
    totalGrossWeight: number;
    commodity: string;
}

export interface Legs {
    from: string;
    to: string;
    departure: string;
    arrival: string;
    flight: string;
    aircraft: string;
}

export interface ShipmentListResponse {
    count: number;
    items: ShipmentRow[];
}

export interface EventItem {
    t: string;
    code: string;
    awb: string;
    apt: string;
    status: string;
    delta: string;
}
export const AWB_DETAIL = {
    awb: '020-66451287',
    route: ['HKG', 'FRA', 'JFK'],
    cargo: 'pharma',
    pcs: 12, kg: '320',
    status: 'crit',
    eta: '15:50 JFK +1',
    timeline: [
        {code: 'BKD', exp: '09:00', act: '08:52', status: 'ok'},
        {code: 'RCS', exp: '13:30', act: '13:51', status: 'warn', delta: '+21'},
        {code: 'FOH', exp: '14:00', act: '14:02', status: 'ok'},
        {code: 'MAN', exp: '14:30', act: '14:28', status: 'ok'},
        {code: 'DEP', exp: '15:15', act: null, status: 'pending'},
        {code: 'ARR', exp: '22:45', act: null, status: 'pending'},
        {code: 'RCF', exp: '23:30', act: null, status: 'pending'},
        {code: 'DLV', exp: '\u2014', act: null, status: 'pending'},
    ],
    exceptions: [
        {
            reason: 'Temperature \u2014 predicted breach',
            comment: 'Line crosses corridor at FRA GH (ext 34\u00b0C, 47 min).',
            who: 'voyager \u00b7 predicted',
            when: '14:07',
            photo: false
        },
        {
            reason: 'Missing document \u2014 AWD',
            comment: "Shipper's declaration box 7 left blank, requesting reupload.",
            who: 'Emma L \u00b7 HKG-OPS',
            when: '13:40',
            photo: true
        },
    ],
    parties: [
        {name: 'FreshGoods Pharma', role: 'Shipper', ch: 'Email + WhatsApp', sel: true},
        {name: 'Acme Logistics', role: 'Freight forwarder', ch: 'Email', sel: true},
        {name: 'Lufthansa Cargo', role: 'Airline', ch: 'CHAMP EDI', sel: true},
        {name: 'John Doe', role: 'Driver \u00b7 HKG GH', ch: 'WhatsApp', sel: false},
        {name: 'MedReceive JFK', role: 'Consignee', ch: 'Email', sel: true},
    ],
};

export interface ShipmentDetails {
    id: number;
    totalGrossWeight: string;
    created: string;
    logistic_object_id: string;
    logistic_object_type: string;
    waybill_prefix: string;
    waybill_number: string;
    commodity: string;
    pieces: number;
    departureLocation: LocationCode[];
    arrivalLocation: LocationCode[];
    flight: {
        legs: Legs[];
    };
    awb_events: AwbEvent[];
    last_event: LogisticsEvent;
    notified_contacts: NotifyContacts[];
}

export interface NotifyContacts{
    id: number;
    notified_at: string | null;
    name: string;
    role: string | null;
    channel: string | null;
    email: string | null;
    phone: string | null;
    notification_id: number | null;
}

export interface NotifiedContactPayload {
    notification_id: number;
    name: string;
    role: string | null;
    channel: string | null;
    email: string | null;
    phone: string | null;
}

export interface AwbEvent {
    leg: number;
    code: string;
    name: string;
    estimated_time: string;
    actual_time: string | null;
    is_late: boolean;
    delta: string | null;
}
