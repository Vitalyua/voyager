export interface AirportCdn {
  id: number;
  iata: string;
  icao: string;
  city: string;
  airport_name: string;
  country_name: string;
  country_code: string;
  latitude: number;
  longitude: number;
  port_type: string;
  gmt: string;
  timezone: string;
  runway_ft: number | null;
}

export interface AirportRecord {
  iata: string;
  icao: string;
  name: string;
  city: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  timezone: string;
  gmt: string;
}
