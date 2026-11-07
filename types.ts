export type Language = 'vi' | 'en';

export type VietnamMacroRegion = 'all' | 'north' | 'central' | 'south' | 'islands';

export type VietnamRegion = 
  | 'bac_bo'
  | 'dong_bac_bo'
  | 'tay_bac_bo'
  | 'dong_bang_song_hong'
  | 'bac_trung_bo'
  | 'trung_trung_bo'
  | 'nam_trung_bo'
  | 'tay_nguyen'
  | 'dong_nam_bo'
  | 'tay_nam_bo'
  | 'hai_dao';

export interface HourlyForecast {
  time: string; // e.g. "01:00", "04:00", etc.
  temp: number; // Celsius
  rainMm: number; // precipitation in mm
  pop: number; // probability of precipitation %
  windSpeedKmh: number;
  windDir: string;
  condition: string;
  humidity: number;
}

export interface StationForecast {
  id: string;
  name: string;
  nameEn?: string;
  province: string;
  provinceEn?: string;
  macroRegion: 'north' | 'central' | 'south' | 'islands';
  region: VietnamRegion;
  regionName: string;
  regionNameEn: string;
  lat: number;
  lng: number;
  tempMin: number;
  tempMax: number;
  feelsLike: number;
  rainMm24h: number;
  pop: number; // Probability of precipitation (0-100)
  humidity: number;
  pressureHpa: number;
  windDirection: string;
  windSpeedKmh: number;
  windGustKmh: number;
  uvIndex: number;
  conditionSummary: string;
  conditionSummaryEn: string;
  weatherCode: 'heavy_rain' | 'thunderstorm' | 'moderate_rain' | 'light_rain' | 'cloudy' | 'sunny_intervals' | 'clear' | 'fog' | 'heatwave' | 'cold_surge';
  floodRisk: 'critical' | 'high' | 'moderate' | 'low';
  landslideRisk: 'critical' | 'high' | 'moderate' | 'low' | 'none';
  marineAlert?: string;
  marineAlertEn?: string;
  tideAlert?: string;
  tideAlertEn?: string;
  hourly: HourlyForecast[];
  ecmwfRain: number;
  gfsRain: number;
  jmaRain: number;
  aiEnsembleRain: number;
}

export interface DayForecast {
  date: string; // YYYY-MM-DD
  dateFormatted: string;
  dateFormattedEn: string;
  lunarDate: string;
  lunarDateEn: string;
  seasonName: string;
  seasonNameEn: string;
  synopticSummary: string;
  synopticSummaryEn: string;
  itczAxis: string;
  itczAxisEn: string;
  coldAirSurge: string;
  coldAirSurgeEn: string;
  tropicalDisturbanceStatus: string;
  tropicalDisturbanceStatusEn: string;
  stations: StationForecast[];
  marineForecast: {
    gulfOfTonkin: string;
    centralSeaQuangTriQuangNgai: string;
    southCentralSeaBinhDinhNinhThuan: string;
    southernSeaBinhThuanCaMau: string;
    gulfOfThailand: string;
    paracelIslands: string;
    spratlyIslands: string;
  };
  macroRegionStationsSummary?: {
    north?: string;
    central?: string;
    south?: string;
    islands?: string;
  };
}

export interface GlobalModelComparison {
  name: string;
  organization: string;
  resolution: string;
  centralRainBias: string;
  southernRainBias: string;
  northernRainBias?: string;
  typhoonSensitivity: string;
  leadTimeConfidence: string;
  coreTech: string;
}

export interface SatelliteDataPoint {
  satelliteName: string;
  operator: string;
  orbitType: string;
  bandInfo: string;
  cloudCoverPercent: number;
  seaSurfaceTempC: number;
  convectiveCloudTopTempC: number;
  statusNotes: string;
  statusNotesEn?: string;
  lastScanTimestamp: string;
  resolutionKm: string;
}

export interface SatelliteLiveTelemetry {
  id?: string;
  name?: string;
  operator?: string;
  orbitType?: string;
  altitudeKm?: number;
  primarySensor?: string;
  channels?: number;
  resolutionSpatial?: string;
  temporalResolution?: string;
  scientificPurpose?: string;
  latencySec?: number;
  satelliteId: string;
  satelliteName: string;
  channel: string;
  status: 'ONLINE' | 'TRANSMITTING' | 'CALIBRATING';
  lastPingSec: number;
  dataRateMbps: number;
  coverageArea: string;
  signalStrength: number;
}

export type LiveSatelliteOrbiter = SatelliteLiveTelemetry;

export interface ScientificCitation {
  id: string;
  title: string;
  authors: string;
  institution: string;
  year: number;
  category: 'ensemble' | 'ai_deep_learning' | 'cyclone_physics' | 'satellite_remote_sensing' | 'teleconnections';
  abstractVi: string;
  abstractEn: string;
  doiOrUrl: string;
}

export interface AIConsultMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  sources?: string[];
}
