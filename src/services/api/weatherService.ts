import axios from '@/lib/axios';
import { API } from '@/constants/api';
import { WeatherResponse, WeatherData } from '@/types/weather';

export const weatherService = {
  async getWeather(): Promise<WeatherData> {
    console.log('🌤️ weatherService: Requesting weather data...');
    
    try {
      const response = await axios.get<WeatherResponse>(API.ENDPOINTS.WEATHER);
      
      console.log('✅ weatherService: Weather data received successfully');
      
      if (!response.data.data) {
        console.error('❌ weatherService: Invalid response format:', response.data);
        throw new Error('Invalid weather response format');
      }

      // Valida se tem dados de now e forecast
      if (!response.data.data.now || !response.data.data.forecast) {
        console.error('❌ weatherService: Missing weather data:', response.data.data);
        throw new Error('Incomplete weather data');
      }

      console.log('🌡️ Current temp:', response.data.data.now.temp + '°C');
      console.log('📅 Forecast days:', response.data.data.forecast.length);
      
      return response.data.data;
    } catch (error) {
      console.error('❌ weatherService: Error fetching weather:', error);
      throw error;
    }
  }
};