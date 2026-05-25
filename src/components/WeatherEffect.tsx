import React from 'react';
import { Sun, Cloud, Umbrella, Snowflake } from 'lucide-react';
import { WeatherType } from '../types/types';

interface WeatherProps {
  type: WeatherType;
}

export const WeatherEffect: React.FC<WeatherProps> = ({ type }) => {
  switch (type) {
    case 'sunny':
      return (
        <div className="absolute -top-6 -right-6 animate-pulse text-yellow-500">
          <Sun className="w-8 h-8 fill-current" />
        </div>
      );
    case 'cloudy':
      return (
        <div className="absolute -top-6 -right-6 animate-bounce text-gray-400">
          <Cloud className="w-8 h-8 fill-current" />
        </div>
      );
    case 'rainy':
      return (
        <div className="absolute -top-10 -right-2 animate-bounce text-blue-400">
          <Umbrella className="w-10 h-10" />
        </div>
      );
    case 'snowy':
      return (
        <div className="absolute -top-4 -right-2 text-blue-100">
          <div className="bg-red-500 h-2 w-10 rounded-full rotate-45" title="Scarf effect" />
          <Snowflake className="w-6 h-6 animate-spin duration-5000" />
        </div>
      );
    default:
      return null;
  }
};
