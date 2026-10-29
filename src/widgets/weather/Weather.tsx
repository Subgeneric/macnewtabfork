import { memo, useContext } from "react";
import "./Weather.css";
import { AppContext } from "../../context/provider";
import { translation } from "../../locale/languages";

type WeatherKind =
  | "sun" | "partly-cloudy" | "cloud" | "fog"
  | "drizzle" | "rain" | "snow" | "sleet" | "thunder" | "unknown";

// WeatherAPI.com condition codes grouped by the type of weather.
const getWeatherKind = (code: number): WeatherKind => {
  if (code === 1000) return "sun";
  if (code === 1003) return "partly-cloudy";
  if (code === 1006 || code === 1009) return "cloud";
  if ([1030, 1135, 1147].includes(code)) return "fog";
  if ([1150, 1153, 1168, 1171].includes(code)) return "drizzle";
  if ([1063, 1180, 1183, 1186, 1189, 1192, 1195, 1240, 1243, 1246].includes(code)) return "rain";
  if ([1066, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258].includes(code)) return "snow";
  if ([1069, 1072, 1198, 1201, 1204, 1207, 1237, 1249, 1252, 1261, 1264].includes(code)) return "sleet";
  if ([1087, 1273, 1276, 1279, 1282].includes(code)) return "thunder";
  return "unknown";
};

const WeatherIcon = memo(function WeatherIcon({
  code,
  className = "",
}: {
  code: number;
  isDay?: boolean;
  className?: string;
}) {
  const kind = getWeatherKind(code);
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg
      className={`weather-icon-svg weather-icon--${kind} ${className}`}
      viewBox="0 0 40 40"
      aria-hidden="true"
      focusable="false"
      {...common}
    >
      {(kind === "sun" || kind === "partly-cloudy") && (
        <>
          <circle cx="15" cy="14" r="6" />
          <path d="M15 3v3 M15 22v3 M4 14h3 M23 14h3 M7.2 6.2l2.1 2.1 M20.7 19.7l2.1 2.1 M22.8 6.2l-2.1 2.1" />
        </>
      )}
      {(kind === "cloud" || kind === "partly-cloudy" || kind === "fog" ||
        kind === "drizzle" || kind === "rain" || kind === "snow" ||
        kind === "sleet" || kind === "thunder") && (
        <path d="M10 29h19a6 6 0 0 0 .3-12 9.5 9.5 0 0 0-18-1.7A7 7 0 0 0 10 29Z" fill="currentColor" stroke="none" />
      )}
      {kind === "fog" && <path d="M7 33h25 M11 37h18" />}
      {kind === "drizzle" && <path d="M14 32l-1 2 M22 32l-1 2 M30 32l-1 2" />}
      {kind === "rain" && <path d="M13 32l-2 4 M21 32l-2 4 M29 32l-2 4" />}
      {kind === "snow" && (
        <>
          <path d="M14 32v6 M11 33.5l6 3 M17 33.5l-6 3 M26 32v6 M23 33.5l6 3 M29 33.5l-6 3" />
        </>
      )}
      {kind === "sleet" && <path d="M13 32l-2 4 M23 32v6 M20 33.5l6 3 M26 33.5l-6 3" />}
      {kind === "thunder" && <path d="M22 28l-7 7h5l-2 5 9-9h-5l2-3" fill="currentColor" stroke="none" />}
      {kind === "unknown" && (
        <>
          <circle cx="20" cy="20" r="13" />
          <path d="M20 13v9 M20 27h.01" />
        </>
      )}
    </svg>
  );
});

const Weather = memo(function Weather() {
  const {
    locale,
    weatherTempUnit,
    weatherData,
    weatherLoading,
    weatherError,
    weatherForecastDisplay,
    setOpenSettingsToWeather,
  } = useContext(AppContext);

  const tempSymbol = weatherTempUnit === "fahrenheit" ? "°F" : "°C";

  if (weatherLoading) {
    return (
      <div className="weather-widget weather-loading">
        <WeatherIcon code={1000} className="weather-status-icon" />
        <span className="weather-text">
          {translation[locale]?.weather_loading || "Loading weather..."}
        </span>
      </div>
    );
  }

  if (weatherError === "weather_api_key_needed") {
    return (
      <div
        className="weather-widget weather-api-key-needed"
        onClick={() => setOpenSettingsToWeather(true)}
        title={translation[locale]?.weather_api_key_needed || "API key needed"}
      >
        <span className="weather-status-icon" aria-hidden="true">⚙</span>
        <span className="weather-text">
          {translation[locale]?.weather_api_key_needed || "API key needed"}
        </span>
      </div>
    );
  }

  if (weatherError) {
    return (
      <div className="weather-widget weather-error">
        <WeatherIcon code={-1} className="weather-status-icon" />
        <span className="weather-text">
          {translation[locale]?.[
            weatherError as keyof (typeof translation)[typeof locale]
          ] || weatherError}
        </span>
      </div>
    );
  }

  if (!weatherData) return null;

  return (
    <div className={`weather-widget weather-widget--${weatherForecastDisplay}`}>
      <div className="weather-current">
        <div className="weather-current-top">
          {weatherData.cityName && (
            <span className="weather-city">{weatherData.cityName}</span>
          )}
          <div className="weather-main">
            <span className="weather-temp">
              {weatherData.temperature}
              <span className="weather-degree">{tempSymbol}</span>
            </span>
            <WeatherIcon code={weatherData.conditionCode} className="weather-current-icon" />
          </div>
          <span className="weather-label">{weatherData.conditionText}</span>
        </div>
      </div>

      {(weatherForecastDisplay === "3-day" || weatherForecastDisplay === "both") && (
        <div className="weather-forecast-days">
          {weatherData.forecastDays?.map((day, index) => {
            const date = new Date(`${day.date}T12:00:00`);
            const dayLabel = index === 0
              ? "Today"
              : index === 1
                ? "Tomorrow"
                : date.toLocaleDateString(locale, { weekday: "short" });
            return (
              <div className="weather-forecast-day" key={day.date} title={day.conditionText}>
                <span className="weather-forecast-day-name">{dayLabel}</span>
                <WeatherIcon code={day.conditionCode} className="weather-forecast-day-icon" />
                <span className="weather-forecast-day-temps">
                  {day.maxTemperature}° <span>{day.minTemperature}°</span>
                </span>
                <span className="weather-forecast-rain">{day.chanceOfRain}% <span aria-hidden="true">☂</span></span>
              </div>
            );
          })}
        </div>
      )}

      {(weatherForecastDisplay === "hourly" || weatherForecastDisplay === "both") && (
        <div className="weather-forecast-hourly" aria-label={translation[locale]?.weather_forecast_hourly || "Hourly forecast"}>
          {weatherData.hourlyForecast?.map((hour) => (
            <div className="weather-forecast-hour" key={hour.time}>
              <span className="weather-forecast-hour-time">{hour.time.slice(11, 16)}</span>
              <WeatherIcon code={hour.conditionCode} className="weather-forecast-hour-icon" />
              <span className="weather-forecast-hour-temp">{hour.temperature}°</span>
              <span className="weather-forecast-rain">{hour.chanceOfRain}% <span aria-hidden="true">☂</span></span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default Weather;
