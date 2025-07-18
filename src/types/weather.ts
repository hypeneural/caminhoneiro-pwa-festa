export interface WeatherNow {
  date: string;
  time: string;
  temp: number;
  description: string;
  condition: string;
  condition_icon: string;
  moon_phase: string;
  moon_icon: string;
  humidity: number;
  cloudiness: number;
  rain: number;
  wind_kmh: number;
  wind_dir_deg: number;
  wind_cardinal: string;
  sunrise: string;
  sunset: string;
  timezone: string;
}

export interface WeatherEvent {
  date: string;
  weekday: string;
  min: number;
  max: number;
  humidity: number;
  cloudiness: number;
  rain: number;
  rain_probability: number;
  wind_kmh: number;
  sunrise: string;
  sunset: string;
  moon_phase: string;
  moon_icon: string;
  description: string;
  condition: string;
  condition_icon: string;
}

export interface WeatherForecast {
  date: string;
  weekday: string;
  min: number;
  max: number;
  humidity: number;
  cloudiness: number;
  rain: number;
  rain_probability: number;
  wind_kmh: number;
  sunrise: string;
  sunset: string;
  moon_phase: string;
  moon_icon: string;
  description: string;
  condition: string;
  condition_icon: string;
}

export interface WeatherData {
  now: WeatherNow;
  event: WeatherEvent[];
  forecast: WeatherForecast[];
}

export interface WeatherResponse {
  status: string;
  message: string | null;
  meta: any[];
  data: WeatherData;
}