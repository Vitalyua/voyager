export interface Piece {
    id: string;
    weight: number;
    length: number;
    width: number;
    height: number;
}

export interface PieceGroup {
    pieces: number;
    totalWeight: number;
    dimensions: { length: number; width: number; height: number };
}

export interface ShipperConsignee {
    name: string;
    address: string;
    city: string;
    country: string;
    postalCode: string;
    phone: string;
    email: string;
}

export interface BookingShipment {
    commodity: string;
    hsCode: string;
    pieceGroup: PieceGroup;
    specialHandling: string[];
}

export interface BookingRequest {
    id: string;
    origin: string;
    destination: string;
    requestedDate: Date;
    shipment: BookingShipment;
    shipper: ShipperConsignee;
    consignee: ShipperConsignee;
    createdAt: Date;
}
