// Cargo iQ EHCP codes V1.4 — January 2026
// Source: "Cargo iQ EHCP codes V1.4 - January 2026-1.xlsx"
// L1 + L2 + L3 concatenate to a 6-char EHCP code (L3 zero-padded to 2 digits).

export interface EhcpOption { value: string; label: string; dis?: string; }

export const EHCP_L1: EhcpOption[] = [
        {value: "AS", label: "Aviation Security"},
        {value: "BX", label: "Booking deviation"},
        {value: "CL", label: "Cargo late"},
        {value: "CP", label: "Physical issues"},
        {value: "CX", label: "Cargo Location"},
        {value: "EF", label: "Equipment & Facility"},
        {value: "MD", label: "Movement deviation"},
        {value: "PI", label: "Information (Doc, data)"},
        {value: "RR", label: "Rules & Regulations"},
        {value: "SK", label: "Force majeure"},
    ];

export const EHCP_L2: Record<string, EhcpOption[]> = {
    "AS": [
        {value: "SE", label: "Security problem"},
    ],
    "BX": [
        {value: "BC", label: "Booking cancelled"},
        {value: "BD", label: "Booking Deviation"},
        {value: "HS", label: "High show"},
        {value: "LS", label: "Low show"},
        {value: "RB", label: "Rebooked"},
    ],
    "CL": [
        {value: "DD", label: "Delivery delayed"},
        {value: "LP", label: "Pick up Delayed or on hold"},
        {value: "TD", label: "Transfer/Transit Delayed or on hold"},
    ],
    "CP": [
        {value: "SC", label: "Special cargo check failed"},
        {value: "SP", label: "Shipment or piece damaged"},
    ],
    "CX": [
        {value: "AC", label: "Abandoned cargo"},
        {value: "CL", label: "Cargo not located"},
        {value: "CR", label: "Cargo not received"},
        {value: "FC", label: "Found cargo"},
        {value: "IL", label: "Incorrect warehouse location"},
        {value: "OC", label: "Overcarried (OVCD) or Found cargo (FDCA)"},
    ],
    "EF": [
        {value: "ED", label: "Equipment breakdown, damage or failure"},
        {value: "EM", label: "Correct equipment missing"},
        {value: "FP", label: "Facility problem"},
        {value: "IR", label: "Insufficient resources"},
        {value: "MS", label: "IT System"},
        {value: "RH", label: "Ramp handling"},
        {value: "SU", label: "Shortage or damaged ULD (interline)"},
        {value: "WB", label: "Wrongly or badly built unit"},
    ],
    "MD": [
        {value: "FD", label: "Flight disruption"},
        {value: "NB", label: "No booking (interline)"},
        {value: "NF", label: "Not flown, Offload or Held"},
        {value: "OS", label: "Handled out of specifications"},
        {value: "RH", label: "Ramp handling"},
        {value: "SI", label: "No space (interline)"},
    ],
    "PI": [
        {value: "MI", label: "Missing, incorrect or incomplete information"},
        {value: "ML", label: "Missing or invalid label"},
    ],
    "RR": [
        {value: "CD", label: "Customs Delay, Hold or Seize"},
        {value: "CH", label: "Cargo on hold"},
        {value: "RH", label: "Ramp handling"},
        {value: "RJ", label: "Rejection"},
        {value: "SD", label: "Screening delay (authorities, third party)"},
    ],
    "SK": [
        {value: "SK", label: "Force majeure"},
    ],
};

export const EHCP_L3: Record<string, EhcpOption[]> = {
    "AS/SE": [
        {value: "01", label: "Cargo left unattended Security Cycle", dis: "EHCP"},
        {value: "02", label: "Security Seal broken", dis: "EHCP"},
    ],
    "BX/BC": [
        {value: "01", label: "Booking cancelled due to shipper request", dis: "EHCP"},
    ],
    "BX/BD": [
        {value: "01", label: "Transit time too short or short connection", dis: "EHCP"},
    ],
    "BX/HS": [
        {value: "01", label: "High show: dimensions", dis: "EHCP"},
        {value: "02", label: "High show: weight", dis: "EHCP"},
        {value: "03", label: "High show: pieces", dis: "EHCP"},
        {value: "04", label: "High show: loadable volume", dis: "EHCP"},
    ],
    "BX/LS": [
        {value: "01", label: "Low show: dimensions", dis: "EHCP"},
        {value: "02", label: "Low show: weight", dis: "EHCP"},
        {value: "03", label: "Low show: pieces", dis: "EHCP"},
        {value: "04", label: "Low show: loadable volume", dis: "EHCP"},
    ],
    "BX/RB": [
        {value: "01", label: "Booking changed after acceptance (RCS)", dis: "OFLD"},
        {value: "10", label: "Rebooked to accommodate Special Cargo", dis: "OFLD"},
        {value: "11", label: "Pre-carried", dis: "EHCP"},
        {value: "02", label: "Booking changed after flight booking list (FBL) or loading list release", dis: "OFLD"},
        {value: "03", label: "Cargo added after flight booking list (FBL) or loading list release ", dis: "OFLD"},
        {value: "04", label: "Rebooked due to backlog or Snowball Effect", dis: "OFLD"},
        {value: "05", label: "Rebooked due to capacity", dis: "OFLD"},
        {value: "06", label: "Rebooked due to late release of flight booking list (FBL) or loading list release", dis: "OFLD"},
        {value: "07", label: "Rebooked due to payload", dis: "OFLD"},
        {value: "08", label: "Rebooked due to prioritization", dis: "OFLD"},
        {value: "09", label: "Rebooked due to shipper request", dis: "OFLD"},
    ],
    "CL/DD": [
        {value: "01", label: "Delay in releasing Letter of Credit (LOC)", dis: "EHCP"},
        {value: "02", label: "Delayed bank guarantee", dis: "EHCP"},
        {value: "03", label: "Delivery delayed as consignee does not accept damaged cargo", dis: "EHCP"},
    ],
    "CL/LP": [
        {value: "01", label: "Pick up Delayed or on hold by Authorities - (for example: PHL, certificate origin, inspection, etc.) ", dis: "EHCP"},
        {value: "02", label: "Pick up Delayed or on hold by customer", dis: "EHCP"},
        {value: "03", label: "Pick up Delayed or on hold by Subcontractor (trucker) ", dis: "EHCP"},
        {value: "04", label: "Pick up Delayed or on hold due to cargo not located, not ready for loading", dis: "MSCA"},
        {value: "05", label: "Pick up Delayed or on hold due to Traffic or Congestion", dis: "EHCP"},
    ],
    "CL/TD": [
        {value: "01", label: "Transfer/Transit Delayed or on hold by Authorities - (for example: certificate origin, inspection, etc.) ", dis: "EHCP"},
        {value: "02", label: "Transfer/Transit Delayed or on hold by customer", dis: "EHCP"},
        {value: "03", label: "Transfer/Transit Delayed or on hold by Subcontractor (trucker) ", dis: "EHCP"},
        {value: "04", label: "Transfer/Transit Delayed or on hold due to cargo not located, not ready for loading", dis: "MSCA"},
        {value: "05", label: "Transfer/Transit Delayed or on hold due to late transfer of cargo. ", dis: "EHCP"},
        {value: "06", label: "Transfer/Transit Delayed or on hold due to Traffic or Congestion", dis: "EHCP"},
        {value: "07", label: "Transfer/Transit Delayed or on hold unloading congestion ", dis: "OFLD"},
    ],
    "CP/SC": [
        {value: "01", label: "Live Animals (AVI) check failed", dis: "OFLD"},
        {value: "02", label: "Pharma product (PIL) check failed", dis: "OFLD"},
        {value: "03", label: "Perishable product (PER) check failed", dis: "OFLD"},
        {value: "04", label: "Dangerous Goods (DGR) check failed", dis: "OFLD"},
        {value: "05", label: "Other products check failed", dis: "OFLD"},
    ],
    "CP/SP": [
        {value: "01", label: "Crushed cargo", dis: "EHCP"},
        {value: "02", label: "Superficial or cosmetic damage on cargo", dis: "EHCP"},
        {value: "03", label: "Torn cargo", dis: "EHCP"},
        {value: "04", label: "Wet cargo", dis: "EHCP"},
        {value: "05", label: "Poor or wrong packaging", dis: "EHCP"},
        {value: "06", label: "Damaged due to wrong storage", dis: "EHCP"},
    ],
    "CX/AC": [
        {value: "01", label: "Consignee did not show up to collect the shipment", dis: "EHCP"},
    ],
    "CX/CL": [
        {value: "01", label: "Cargo Theft or pilferage", dis: "MSCA"},
        {value: "02", label: "Not located (UTL) in warehouse", dis: "MSCA"},
    ],
    "CX/CR": [
        {value: "01", label: "Missing Cargo (MSCA)", dis: "MSCA"},
        {value: "02", label: "No show", dis: "OFLD"},
        {value: "03", label: "Shipment partially arrived", dis: "OFLD"},
        {value: "04", label: "Short Shipped (SSPD)", dis: "SSPD"},
    ],
    "CX/FC": [
        {value: "01", label: "Found cargo without AWB number or identification", dis: "FDCA"},
    ],
    "CX/IL": [
        {value: "01", label: "Not stored according to (special) handling instructions", dis: "EHCP"},
        {value: "02", label: "Partly or wrongly stored", dis: "EHCP"},
    ],
    "CX/OC": [
        {value: "01", label: "Found or Received unmanifested (FDCA)", dis: "FDCA"},
        {value: "02", label: "Overcarried (OVCD)", dis: "OVCD"},
    ],
    "EF/ED": [
        {value: "01", label: "Material handling equipment failure", dis: "EHCP"},
    ],
    "EF/EM": [
        {value: "01", label: "Correct equipment missing (forklift, truck dock)", dis: "EHCP"},
        {value: "02", label: "Equipment breakdown or damage", dis: "EHCP"},
        {value: "03", label: "Equipment delayed (for example: container, ULD, straps)", dis: "EHCP"},
    ],
    "EF/FP": [
        {value: "01", label: "Facility problem", dis: "EHCP"},
        {value: "02", label: "Cool equipment issue", dis: "EHCP"},
        {value: "03", label: "No space in facility", dis: "EHCP"},
    ],
    "EF/IR": [
        {value: "01", label: "Lack of equipment or space (workload exceeds equipment or space)", dis: "EHCP"},
        {value: "02", label: "Lack of staff (Workload exceeds staff planning)", dis: "EHCP"},
        {value: "03", label: "Peak at (un)loading dock (workload exceeds planning at docks)", dis: "EHCP"},
        {value: "04", label: "Peak document handling (workload exceeds planning at document handling)", dis: "EHCP"},
    ],
    "EF/MS": [
        {value: "01", label: "System breakdown", dis: "EHCP"},
        {value: "02", label: "System error", dis: "EHCP"},
    ],
    "EF/RH": [
        {value: "01", label: "Lack of Resources, Equipment or Time at ramp", dis: "OFLD"},
        {value: "02", label: "ULD Damaged at ramp", dis: "OFLD"},
        {value: "03", label: "ULD load shifted or collapsed at ramp", dis: "OFLD"},
        {value: "04", label: "Aircraft change or downgrading", dis: "OFLD"},
        {value: "05", label: "Aircraft technical problem or incompatibility", dis: "OFLD"},
    ],
    "EF/SU": [
        {value: "01", label: "Shortage or damaged ULD by receiving carrier (interline)", dis: "EHCP"},
        {value: "02", label: "Shortage or damaged ULD by transferring carrier (interline)", dis: "EHCP"},
    ],
    "EF/WB": [
        {value: "01", label: "Collapsed build-up unit", dis: "OFLD"},
        {value: "02", label: "Wrong build-up unit contour ", dis: "OFLD"},
        {value: "03", label: "Wrong or bad Strapping or netting on build-up unit", dis: "OFLD"},
        {value: "04", label: "Wrong or bad weather or fire wrapping", dis: "OFLD"},
        {value: "05", label: "Wrong or bad weight spreading on build-up unit", dis: "OFLD"},
        {value: "06", label: "Wrongly or badly built ULD", dis: "OFLD"},
    ],
    "MD/FD": [
        {value: "01", label: "Flight delay", dis: "EHCP"},
        {value: "02", label: "Flight or Truck diversion", dis: "EHCP"},
        {value: "03", label: "Late incoming flight or truck", dis: "OFLD"},
    ],
    "MD/NB": [
        {value: "01", label: "No booking by transferring carrier  (interline)", dis: "EHCP"},
    ],
    "MD/NF": [
        {value: "01", label: "Aircraft change or downgrading", dis: "OFLD"},
        {value: "02", label: "Aircraft technical problem or incompatibility", dis: "OFLD"},
        {value: "03", label: "Offload due payload, volume restrictions", dis: "OFLD"},
        {value: "04", label: "Shipment cancelled, abandonned or refused", dis: "OFLD"},
        {value: "05", label: "Shipment re-routed ", dis: "OFLD"},
        {value: "06", label: "Cargo missing", dis: "MSCA"},
        {value: "07", label: "Cargo/build-up unit damaged", dis: "OFLD"},
        {value: "08", label: "Overbooked", dis: "OFLD"},
        {value: "09", label: "Definitely loaded", dis: "DFLD"},
    ],
    "MD/OS": [
        {value: "01", label: "Handled out of temperature specifications", dis: "EHCP"},
        {value: "02", label: "Handled out of special handling specifications", dis: "EHCP"},
    ],
    "MD/RH": [
        {value: "01", label: "Cargo not offloaded at destination or over carried at ramp", dis: "OVCD"},
        {value: "02", label: "Cargo offloaded due additional baggage/mail forecast at ramp", dis: "OFLD"},
        {value: "03", label: "Air traffic control accident or incident", dis: "OFLD"},
        {value: "04", label: "Construction work, maintenance", dis: "OFLD"},
        {value: "05", label: "Crew rotation", dis: "OFLD"},
        {value: "06", label: "Departure delay previous station", dis: "OFLD"},
        {value: "07", label: "Interline (third party hand-over)", dis: "OFLD"},
        {value: "08", label: "Misplacing of cargo unit", dis: "OFLD"},
    ],
    "MD/SI": [
        {value: "01", label: "No space by receiving carrier (interline)", dis: "EHCP"},
    ],
    "PI/MI": [
        {value: "01", label: "Missing documents or information", dis: "MSAW"},
        {value: "10", label: "Missing or incomplete MAN/FFM", dis: "EHCP"},
        {value: "11", label: "Missing or incomplete Pouch", dis: "MSAW"},
        {value: "12", label: "Missing or incomplete Special Cargo (DGR, AVI, PIL, VAL, VUN, PER, etc) information", dis: "EHCP"},
        {value: "13", label: "Missing or incomplete Transfer documents , CMR or Truck manifest ", dis: "EHCP"},
        {value: "14", label: "Wrong break down instructions given", dis: "EHCP"},
        {value: "15", label: "Incorrect weight distribution", dis: "EHCP"},
        {value: "16", label: "Found AWB", dis: "FDAW"},
        {value: "02", label: "Missing or incomplete AWB", dis: "MSAW"},
        {value: "03", label: "Missing or incomplete Cargo Receipt ", dis: "EHCP"},
        {value: "04", label: "Missing or incomplete Certificates, POD, etc documentation missing", dis: "EHCP"},
        {value: "05", label: "Missing or incomplete Commercial Documents  (written records, aspects of commercial documents, commercial invoice, packing list, certificate of origin, permits etc) ", dis: "EHCP"},
        {value: "06", label: "Missing or incomplete Customer instructions (how to handle a particular customers cargo (including mode of transport, rates, services, etc.)", dis: "EHCP"},
        {value: "07", label: "Missing or incomplete Handling instructions related to country (Gateway, Import, Transit ) ", dis: "EHCP"},
        {value: "08", label: "Missing or incomplete FHL", dis: "EHCP"},
        {value: "09", label: "Missing or incomplete FWB", dis: "EHCP"},
    ],
    "PI/ML": [
        {value: "01", label: "Missing or invalid AWB label", dis: "FDCA"},
        {value: "02", label: "Missing or invalid special cargo label", dis: "EHCP"},
    ],
    "RR/CD": [
        {value: "01", label: "Customs Delay due to product sample sent for testing purposes", dis: "EHCP"},
        {value: "02", label: "Customs Delay, Hold or Seize due to Any other reason provided by Government authorities", dis: "EHCP"},
        {value: "03", label: "Customs Delay, Hold or Seize due to Incorrect documents or info", dis: "EHCP"},
        {value: "04", label: "Customs Delay, Hold or Seize due to Missing documents or info", dis: "EHCP"},
        {value: "05", label: "Customs Delay, Hold or Seize due to Undervalue of the consignment", dis: "EHCP"},
    ],
    "RR/CH": [
        {value: "01", label: "Cargo on hold by customer due to certificate origin, inspection or any other", dis: "EHCP"},
        {value: "02", label: "Delayed in handling by the Government appointed authorities", dis: "EHCP"},
    ],
    "RR/RH": [
        {value: "01", label: "Security control check point or screening", dis: "EHCP"},
    ],
    "RR/RJ": [
        {value: "01", label: "Rejection due to Embargoes and/or restrictions", dis: "EHCP"},
        {value: "02", label: "Rejection due to Sanctions", dis: "EHCP"},
        {value: "03", label: "Rejection duer to Banned or restricted commodities ", dis: "EHCP"},
        {value: "04", label: "Special cargo received in higher quantity than permitted in GOM/CSM", dis: "EHCP"},
        {value: "05", label: "Shipment Split not allowed", dis: "EHCP"},
    ],
    "RR/SD": [
        {value: "01", label: "Screening delay due to Authorities", dis: "EHCP"},
        {value: "02", label: "Screening delay due to Incompatible equipment", dis: "EHCP"},
        {value: "03", label: "Screening delay due to Screening agent", dis: "EHCP"},
        {value: "04", label: "Screening delay due to Secondary screening", dis: "EHCP"},
    ],
    "SK/SK": [
        {value: "01", label: "Force majeur human related", dis: "EHCP"},
        {value: "02", label: "Force majeur nature related", dis: "EHCP"},
    ],
};
