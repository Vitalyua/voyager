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

export const SEED_DISTRESSED: DistressedAWB[] = [
    {
        awb: '180-42817733',
        route: ['HKG', 'FRA', 'JFK'],
        cargo: 'live',
        cargoNote: '2 horses \u00b7 1,840 kg',
        reason: 'Missing IATA LAR sanitary certificate',
        stuck: 'Stuck at HKG cold hold \u00b7 2h 18m',
        status: 'crit',
        flaggedAt: '14:02'
    },
    {
        awb: '020-66451287',
        route: ['HKG', 'FRA'],
        cargo: 'pharma',
        cargoNote: 'Insulin shipment \u00b7 320 kg',
        reason: 'Breach forecast: exterior 34\u00b0C at FRA GH',
        stuck: 'Predicted corridor exit in 47 min',
        status: 'crit',
        flaggedAt: '14:07'
    },
    {
        awb: '057-88120045',
        route: ['AMS', 'DXB', 'SIN'],
        cargo: 'perish',
        cargoNote: 'Fresh tuna \u00b7 14 pcs \u00b7 980 kg',
        reason: 'Door seal flagged open on ramp',
        stuck: 'AMS ramp \u00b7 38m',
        status: 'warn',
        flaggedAt: '13:48'
    },
    {
        awb: '176-31209876',
        route: ['DXB', 'LHR'],
        cargo: 'dg',
        cargoNote: 'Class 3 \u00b7 6 pcs \u00b7 420 kg',
        reason: "Shipper's declaration missing box 7",
        stuck: 'DXB ULD holding \u00b7 1h 04m',
        status: 'warn',
        flaggedAt: '13:22'
    },
    {
        awb: '180-55003311',
        route: ['HKG', 'LAX'],
        cargo: 'general',
        cargoNote: 'Electronics \u00b7 44 pcs \u00b7 2,110 kg',
        reason: 'Off-loaded due to weight rebalance',
        stuck: 'HKG transit \u00b7 2h 41m',
        status: 'warn',
        flaggedAt: '12:40'
    },
    {
        awb: '057-40019988',
        route: ['FRA', 'JFK'],
        cargo: 'perish',
        cargoNote: 'Cheese wheels \u00b7 8 pcs \u00b7 410 kg',
        reason: 'Temperature drift on tracker 0C4F',
        stuck: 'In flight LH400 \u00b7 2h to JFK',
        status: 'warn',
        flaggedAt: '12:15'
    },
];

export interface CargoIqAWB {
    awb: string;
    route: string[];
    cargo: string;
    milestone: string;
    delta: string;
    note: string;
    status: string;
}

export const SEED_CARGOIQ: CargoIqAWB[] = [
    {
        awb: '020-66451287',
        route: ['HKG', 'FRA', 'JFK'],
        cargo: 'pharma',
        milestone: 'RCS',
        delta: '+21 min',
        note: 'Received from shipper late at HKG',
        status: 'late'
    },
    {
        awb: '180-42817733',
        route: ['HKG', 'FRA'],
        cargo: 'live',
        milestone: 'FOH',
        delta: '+18 min',
        note: 'Freight on hand missed \u2014 grace period exceeded',
        status: 'late'
    },
    {
        awb: '057-88120045',
        route: ['AMS', 'DXB'],
        cargo: 'perish',
        milestone: 'DEP',
        delta: 'at risk \u22128 min',
        note: 'DEP forecast slipping \u2014 connecting bank tight',
        status: 'at_risk'
    },
    {
        awb: '176-31209876',
        route: ['DXB', 'LHR'],
        cargo: 'dg',
        milestone: 'AWD',
        delta: '+34 min',
        note: 'Awaiting documents \u2014 DGR check open',
        status: 'late'
    },
    {
        awb: '057-20118834',
        route: ['CDG', 'JFK'],
        cargo: 'general',
        milestone: 'RCF',
        delta: '+12 min',
        note: 'Received from flight after grace',
        status: 'late'
    },
    {
        awb: '180-99207711',
        route: ['HKG', 'SIN'],
        cargo: 'general',
        milestone: 'MAN',
        delta: 'at risk',
        note: 'Manifest submission slipping',
        status: 'at_risk'
    },
];

export interface ULDItem {
    id: string;
    type: string;
    route: string[];
    cargo: string;
    range: [number, number];
    current: number;
    spark: number[];
    next: string;
    status: string;
    forecast: string;
}

export const SEED_ULDS: ULDItem[] = [
    {
        id: 'AKE-12345-LH',
        type: 'AKE',
        route: ['HKG', 'FRA', 'JFK'],
        cargo: 'pharma',
        range: [2, 8],
        current: 7.2,
        spark: [3.8, 4.0, 4.4, 4.9, 5.3, 5.8, 6.1, 6.5, 6.9, 7.0, 7.1, 7.2],
        next: 'ARR FRA in 2h 14m',
        status: 'crit',
        forecast: 'Predicted breach at FRA ground handling in 47 min'
    },
    {
        id: 'RKN-40028-LH',
        type: 'RKN',
        route: ['HKG', 'FRA'],
        cargo: 'pharma',
        range: [2, 8],
        current: 5.8,
        spark: [4.1, 4.3, 4.8, 5.0, 5.2, 5.4, 5.5, 5.6, 5.7, 5.7, 5.8, 5.8],
        next: 'DEP HKG in 1h 02m',
        status: 'warn',
        forecast: 'Pre-cooling drift \u2014 monitor at loading'
    },
    {
        id: 'RAP-77104-EK',
        type: 'RAP',
        route: ['DXB', 'LHR'],
        cargo: 'perish',
        range: [0, 4],
        current: 2.1,
        spark: [1.9, 1.8, 2.0, 2.0, 2.1, 2.0, 2.0, 2.1, 2.1, 2.1, 2.1, 2.1],
        next: 'ARR LHR in 5h 44m',
        status: 'ok',
        forecast: 'Within corridor \u2014 no action'
    },
    {
        id: 'AKE-99812-CX',
        type: 'AKE',
        route: ['HKG', 'LAX'],
        cargo: 'live',
        range: [12, 22],
        current: 18.4,
        spark: [19.1, 18.9, 18.7, 18.5, 18.3, 18.2, 18.3, 18.4, 18.4, 18.4, 18.4, 18.4],
        next: 'DEP HKG delayed',
        status: 'crit',
        forecast: 'Ground hold 2h+ \u2014 welfare window at risk'
    },
    {
        id: 'PMC-30055-AF',
        type: 'PMC',
        route: ['CDG', 'JFK'],
        cargo: 'general',
        range: [-5, 35],
        current: 14.0,
        spark: [12, 12.5, 13, 13.5, 14, 14, 13.8, 13.9, 14, 14, 14, 14],
        next: 'ARR JFK in 1h 08m',
        status: 'ok',
        forecast: 'Nominal'
    },
    {
        id: 'RKN-50177-LH',
        type: 'RKN',
        route: ['FRA', 'JFK'],
        cargo: 'pharma',
        range: [2, 8],
        current: 6.8,
        spark: [5.1, 5.3, 5.6, 5.9, 6.1, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.8],
        next: 'In flight \u00b7 ARR JFK in 3h 22m',
        status: 'warn',
        forecast: 'Upper corridor \u2014 monitor'
    },
    {
        id: 'AAY-20033-SQ',
        type: 'AAY',
        route: ['SIN', 'FRA'],
        cargo: 'perish',
        range: [0, 4],
        current: 3.1,
        spark: [2.8, 2.9, 3.0, 3.1, 3.2, 3.1, 3.0, 3.1, 3.1, 3.1, 3.1, 3.1],
        next: 'DEP SIN in 3h 55m',
        status: 'ok',
        forecast: 'Within corridor'
    },
    {
        id: 'PMC-11020-BA',
        type: 'PMC',
        route: ['LHR', 'JFK'],
        cargo: 'dg',
        range: [-5, 35],
        current: 18.8,
        spark: [18, 18.3, 18.5, 18.6, 18.7, 18.8, 18.8, 18.8, 18.8, 18.8, 18.8, 18.8],
        next: 'DEP LHR in 48m',
        status: 'ok',
        forecast: 'Nominal'
    },
    {
        id: 'AKE-42299-EK',
        type: 'AKE',
        route: ['DXB', 'SIN'],
        cargo: 'perish',
        range: [0, 4],
        current: 3.9,
        spark: [3.0, 3.1, 3.3, 3.5, 3.6, 3.7, 3.8, 3.8, 3.9, 3.9, 3.9, 3.9],
        next: 'ARR SIN in 6h 02m',
        status: 'warn',
        forecast: 'Approaching upper bound \u2014 reduce ground time'
    },
];

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

export const SEED_EVENTS: EventItem[] = [
    {t: '14:32:08', code: 'RCS', awb: '020-30044512', apt: 'FRA', status: 'ok', delta: ''},
    {t: '14:31:42', code: 'DEP', awb: '180-33221100', apt: 'DXB', status: 'ok', delta: ''},
    {t: '14:30:19', code: 'FOH', awb: '020-66451287', apt: 'HKG', status: 'warn', delta: '+21 min'},
    {t: '14:28:55', code: 'MAN', awb: '180-99207711', apt: 'HKG', status: 'warn', delta: 'slipping'},
    {t: '14:27:02', code: 'AWD', awb: '176-31209876', apt: 'DXB', status: 'crit', delta: '+34 min'},
    {t: '14:25:41', code: 'RCF', awb: '057-50120001', apt: 'JFK', status: 'ok', delta: ''},
    {t: '14:24:19', code: 'DEP', awb: '057-40019988', apt: 'FRA', status: 'ok', delta: ''},
    {t: '14:22:08', code: 'FOH', awb: '180-42817733', apt: 'HKG', status: 'crit', delta: '+18 min'},
];

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

export const ULD_DETAIL = {
    id: 'AKE-12345-LH', cargo: 'pharma', range: [2, 8] as [number, number], status: 'crit',
    legs: [
        {from: 'HKG', to: 'FRA', depart: 0, arrive: 735, flight: 'LH796', risk: 'crit'},
        {from: 'FRA', to: 'JFK', depart: 880, arrive: 1375, flight: 'LH400', risk: 'warn'},
    ],
    ground: [{at: 'FRA', start: 735, end: 880, risk: 'crit', note: 'ext 34\u00b0C \u00b7 2h 25m'}],
    weather: {
        HKG: {icon: 'sun', t: 32, wind: 'SE 14 kt'},
        FRA: {icon: 'sun', t: 34, wind: '\u2014'},
        JFK: {icon: 'cloud', t: 18, wind: 'NW 8 kt'},
    } as Record<string, { icon: string; t: number; wind: string }>,
    alerts: [
        {sev: 'crit', t: '14:07', text: 'Predicted breach at FRA GH \u00b7 exterior 34\u00b0C, ETA +47 min'},
        {sev: 'warn', t: '14:02', text: 'Current reading 7.2\u00b0C trending upward (+0.3\u00b0C / 15m)'},
        {sev: 'info', t: '13:58', text: 'Pre-cooling completed at HKG (4.0\u00b0C)'},
        {sev: 'info', t: '13:22', text: 'Tracker 0C4F online \u00b7 SSE handshake ok'},
    ],
    stats: {exposure: '1h 12m', worst: '+1.8\u00b0C above max', avgGround: '28.4\u00b0C', trackerAge: '2s'},
};

export const ULD_TYPES = [
    {code: 'AKE', desc: 'Small container', cap: '4.3 m\u00b3', ins: '0.60'},
    {code: 'RKN', desc: 'Cool container', cap: '4.3 m\u00b3', ins: '0.85'},
    {code: 'RAP', desc: 'Cool pallet', cap: '10.8 m\u00b3', ins: '0.80'},
    {code: 'PMC', desc: 'Pallet', cap: '11.6 m\u00b3', ins: '0.50'},
    {code: 'AAY', desc: 'Large container', cap: '17.5 m\u00b3', ins: '0.70'},
];

export interface ClaimItem {
    id: string;
    awb: string;
    route: string[];
    cargo: string;
    reason: string;
    comment: string;
    photos: string[];
    checks: { label: string; on: boolean }[];
    by: string;
    role: string;
    via: string;
    when: string;
    sla: string;
    status: string;
    severity: string;
    parties: { name: string; role: string; ch: string; ack: string | null }[];
    showTemp: boolean;
    tempReading?: { now: number; min: number; max: number; range: [number, number]; stable: boolean };
    thread: { who: string; role: string; t: string; text: string; reply?: boolean }[];
}

export const SEED_CLAIMS: ClaimItem[] = [
    {
        id: 'EX-2026-04-25-0182',
        awb: '020-66451287',
        route: ['HKG', 'FRA', 'JFK'],
        cargo: 'pharma',
        reason: 'Damage',
        comment: 'Outer foam shell crushed on corner of carton 3/12. Inner gel packs intact, product seal not broken. Re-taped and labeled. Photos attached.',
        photos: ['damage close-up', 'carton stack'],
        checks: [{label: 'Outer packaging compromised', on: true}, {
            label: 'Inner packaging compromised',
            on: false
        }, {label: 'Product visibly damaged', on: false}, {label: 'Re-packed before forwarding', on: true}],
        by: 'Wing-Lok Tam',
        role: 'Warehouse \u00b7 HKG-CTH',
        via: 'iOS app',
        when: '14:11Z',
        sla: '00:18',
        status: 'open',
        severity: 'warn',
        parties: [{
            name: 'Acme Logistics',
            role: 'Forwarder',
            ch: 'Email + WhatsApp',
            ack: '14:13Z'
        }, {name: 'Lufthansa Cargo', role: 'Airline', ch: 'CHAMP EDI', ack: '14:14Z'}, {
            name: 'FreshGoods Pharma',
            role: 'Shipper',
            ch: 'Email',
            ack: null
        }],
        showTemp: true,
        tempReading: {now: 5.4, min: 4.1, max: 6.2, range: [2, 8], stable: true},
        thread: [
            {
                who: 'voyager',
                role: 'system',
                t: '14:11Z',
                text: 'Exception filed from /scan/020-66451287 \u00b7 2 photos uploaded to OneRecord LDR.'
            },
            {
                who: 'voyager',
                role: 'system',
                t: '14:11Z',
                text: 'Notified 3 parties \u00b7 ack pending from FreshGoods Pharma.'
            },
            {
                who: 'Acme Logistics',
                role: 'Forwarder',
                t: '14:13Z',
                reply: true,
                text: 'Acknowledged. Re-pack accepted as serviceable. Continuing to FRA.'
            },
            {who: 'Lufthansa Cargo', role: 'Airline', t: '14:14Z', reply: true, text: 'Logged on AWB record. No hold.'},
        ],
    },
    {
        id: 'EX-2026-04-25-0181',
        awb: '180-42817733',
        route: ['HKG', 'FRA'],
        cargo: 'live',
        reason: 'Missing doc',
        comment: 'IATA LAR sanitary certificate not in the document pouch. Original signed copy never received from shipper. Holding ULD pending paperwork.',
        photos: ['empty pouch'],
        checks: [{label: 'Document missing', on: true}, {
            label: 'Document illegible',
            on: false
        }, {label: 'Document expired', on: false}, {label: 'Required for export clearance', on: true}],
        by: 'Priya Subramanian',
        role: 'Cargo agent \u00b7 HKG-OPS',
        via: 'iOS app',
        when: '14:02Z',
        sla: '00:27',
        status: 'open',
        severity: 'crit',
        parties: [{
            name: 'Acme Logistics',
            role: 'Forwarder',
            ch: 'Email + WhatsApp',
            ack: '14:09Z'
        }, {name: 'Lufthansa Cargo', role: 'Airline', ch: 'CHAMP EDI', ack: '14:05Z'}],
        showTemp: false,
        thread: [
            {
                who: 'voyager',
                role: 'system',
                t: '14:02Z',
                text: 'Exception filed \u2014 IATA LAR sanitary certificate missing.'
            },
            {who: 'voyager', role: 'system', t: '14:02Z', text: 'Notified 2 parties \u00b7 Email + EDI.'},
            {
                who: 'Acme Logistics',
                role: 'Forwarder',
                t: '14:09Z',
                reply: true,
                text: 'Original at office. Courier dispatched, ETA 15:10. Will hand to GH desk on arrival.'
            },
            {
                who: 'Lufthansa Cargo',
                role: 'Airline',
                t: '14:05Z',
                reply: true,
                text: 'ULD on hold. Live animals welfare clock running \u2014 please expedite.'
            },
        ],
    },
    {
        id: 'EX-2026-04-25-0180',
        awb: '057-88120045',
        route: ['AMS', 'DXB', 'SIN'],
        cargo: 'perish',
        reason: 'Damage',
        comment: 'Two cartons crushed on bottom of pallet during transfer. Approx 60kg of cherries affected. Cartons removed from ULD; serviceable contents re-packed.',
        photos: ['crushed carton 1', 'crushed carton 2', 'repack'],
        checks: [{label: 'Outer packaging compromised', on: true}, {
            label: 'Inner packaging compromised',
            on: true
        }, {label: 'Product visibly damaged', on: true}, {label: 'Re-packed before forwarding', on: true}],
        by: 'Daan van der Meer',
        role: 'Loader \u00b7 AMS',
        via: 'iOS app',
        when: '13:48Z',
        sla: '00:42',
        status: 'investigating',
        severity: 'warn',
        parties: [{name: 'KLM Cargo', role: 'Airline', ch: 'CHAMP EDI', ack: '13:55Z'}, {
            name: 'FreshGoods Inc',
            role: 'Shipper',
            ch: 'Email',
            ack: '14:01Z'
        }],
        showTemp: true,
        tempReading: {now: 3.2, min: 2.8, max: 3.6, range: [0, 4], stable: true},
        thread: [
            {
                who: 'voyager',
                role: 'system',
                t: '13:48Z',
                text: 'Exception filed \u00b7 3 photos uploaded \u00b7 variance 60kg recorded against AWB.'
            },
            {
                who: 'KLM Cargo',
                role: 'Airline',
                t: '13:55Z',
                reply: true,
                text: 'Removed damaged cartons from ULD. Repack approved. Continuing to DXB.'
            },
            {
                who: 'FreshGoods Inc',
                role: 'Shipper',
                t: '14:01Z',
                reply: true,
                text: 'Insurance claim opened, ref FG-2026-0419. Photos sufficient evidence.'
            },
        ],
    },
    {
        id: 'EX-2026-04-25-0179',
        awb: '176-31209876',
        route: ['DXB', 'LHR'],
        cargo: 'dg',
        reason: 'Missing doc',
        comment: "Shipper's Declaration for Dangerous Goods \u2014 box 7 (technical name) left blank on Class 3 entry.",
        photos: ['SDD page 1'],
        checks: [{label: 'Document missing', on: false}, {
            label: 'Document illegible',
            on: false
        }, {label: 'Document incomplete', on: true}, {label: 'Required for export clearance', on: true}],
        by: 'Khalid Al-Mansoori',
        role: 'DGR check \u00b7 DXB',
        via: 'Web fallback',
        when: '13:22Z',
        sla: '01:08',
        status: 'investigating',
        severity: 'warn',
        parties: [{name: 'Emirates SkyCargo', role: 'Airline', ch: 'CHAMP EDI', ack: '13:51Z'}, {
            name: 'Acme Logistics',
            role: 'Forwarder',
            ch: 'Email',
            ack: '13:35Z'
        }],
        showTemp: false,
        thread: [
            {
                who: 'voyager',
                role: 'system',
                t: '13:22Z',
                text: 'Exception filed \u00b7 DGR box 7 incomplete on Class 3 SDD.'
            },
            {
                who: 'Acme Logistics',
                role: 'Forwarder',
                t: '13:35Z',
                reply: true,
                text: 'Re-filing now. Technical name: ETHANOL, n.o.s. UN1170 PG II. Corrected SDD inbound.'
            },
            {
                who: 'Emirates SkyCargo',
                role: 'Airline',
                t: '13:51Z',
                reply: true,
                text: 'ULD held in DG cage until corrected SDD received.'
            },
        ],
    },
    {
        id: 'EX-2026-04-25-0177',
        awb: '180-55003311',
        route: ['HKG', 'LAX'],
        cargo: 'general',
        reason: 'Wrong qty',
        comment: 'Manifest says 44 pcs, scanned 43 on FOH acceptance. One missing piece.',
        photos: [],
        checks: [{label: 'Quantity short', on: true}, {label: 'Quantity over', on: false}, {
            label: 'Weight variance',
            on: false
        }],
        by: 'Cheuk-Yan Wong',
        role: 'FOH agent \u00b7 HKG',
        via: 'iOS app',
        when: '11:40Z',
        sla: '02:50',
        status: 'resolved',
        severity: 'ok',
        parties: [{name: 'Acme Logistics', role: 'Forwarder', ch: 'Email', ack: '11:42Z'}],
        showTemp: false,
        thread: [
            {who: 'voyager', role: 'system', t: '11:40Z', text: 'Exception filed \u00b7 quantity mismatch (43/44).'},
            {
                who: 'Cheuk-Yan Wong',
                role: 'FOH agent',
                t: '12:08Z',
                reply: true,
                text: 'Found in zone B, mis-staged behind 020-77003344. Re-scanned, count now 44/44.'
            },
            {
                who: 'voyager',
                role: 'system',
                t: '12:08Z',
                text: 'Resolved by reporter \u00b7 variance closed \u00b7 AWB count synced.'
            },
        ],
    },
    {
        id: 'EX-2026-04-25-0176',
        awb: '020-30044512',
        route: ['FRA', 'JFK'],
        cargo: 'pharma',
        reason: 'Other',
        comment: 'Cold-chain seal #A4429 found broken on cooler lid during build-up. Re-sealed under supervision.',
        photos: ['broken seal', 'new seal A4533'],
        checks: [{label: 'Tamper evidence', on: true}, {
            label: 'Witnessed re-seal',
            on: true
        }, {label: 'Supervisor signed off', on: true}],
        by: 'Hannah Becker',
        role: 'Warehouse \u00b7 FRA-CCC',
        via: 'iOS app',
        when: '10:55Z',
        sla: '03:35',
        status: 'resolved',
        severity: 'ok',
        parties: [{
            name: 'Lufthansa Cargo',
            role: 'Airline',
            ch: 'CHAMP EDI',
            ack: '11:00Z'
        }, {name: 'FreshGoods Pharma', role: 'Shipper', ch: 'Email', ack: '11:08Z'}],
        showTemp: true,
        tempReading: {now: 5.1, min: 4.6, max: 5.8, range: [2, 8], stable: true},
        thread: [
            {
                who: 'voyager',
                role: 'system',
                t: '10:55Z',
                text: 'Exception filed \u00b7 cold-chain seal broken \u00b7 2 photos.'
            },
            {
                who: 'Lufthansa Cargo',
                role: 'Airline',
                t: '11:00Z',
                reply: true,
                text: 'Witnessed re-seal. New seal #A4533. Acceptable. No hold.'
            },
            {
                who: 'voyager',
                role: 'system',
                t: '11:11Z',
                text: 'Resolved \u00b7 seal swap recorded against AWB chain-of-custody.'
            },
        ],
    },
];
