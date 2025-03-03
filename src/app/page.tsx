"use client";

import { useState, useEffect } from "react";
import { OverviewCards } from "@/components/OverviewCards"; // Assuming this is a custom component
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarMinus, faEnvelope, faCalendarDays } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { faClock } from "@fortawesome/free-solid-svg-icons/faClock";

type WeatherData = {
  [x: string]: any;
  date: string;
  time?: string;
  temp: number;
  description: string;
  humidity: number;
  windSpeed: number;
  feelslike?: number;
};

const Home = () => {
  const [city, setCity] = useState<string>("");
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const [hourlyForecast, setHourlyForecast] = useState<WeatherData[]>([]);
  const [dailyForecast, setDailyForecast] = useState<WeatherData[]>([]);
  const [advice, setAdvice] = useState<string>("Đang tải lời khuyên...");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const weatherApiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || "a601622a383aee1aea5573743d8e8875";
  const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "AIzaSyAqL19kGLcLKYqo5b-B1RAPy9AKOXL42BE";

  const fetchWeather = async (cityName: string | { lat: number; lon: number }) => {
    setLoading(true);
    setError(null);
    try {
      const currentUrl =
        typeof cityName === "string"
          ? `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&units=metric&appid=${weatherApiKey}`
          : `https://api.openweathermap.org/data/2.5/weather?lat=${cityName.lat}&lon=${cityName.lon}&units=metric&appid=${weatherApiKey}`;
      const currentResponse = await axios.get(currentUrl);
      const currentData = {
        date: new Date().toLocaleDateString(),
        temp: Math.round(currentResponse.data.main.temp),
        description: currentResponse.data.weather[0].description,
        humidity: currentResponse.data.main.humidity,
        windSpeed: currentResponse.data.wind.speed,
        feelslike: Math.round(currentResponse.data.main.feels_like),
        coordlon: currentResponse.data.coord.lon,
        coordlat: currentResponse.data.coord.lat,
      };
      setCurrentWeather(currentData);

      const forecastUrl =
        typeof cityName === "string"
          ? `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&cnt=40&units=metric&appid=${weatherApiKey}`
          : `https://api.openweathermap.org/data/2.5/forecast?lat=${cityName.lat}&lon=${cityName.lon}&cnt=40&units=metric&appid=${weatherApiKey}`;
      const forecastResponse = await axios.get(forecastUrl);
      const forecastList = forecastResponse.data.list;

      const today = new Date().toLocaleDateString();
      const hourlyData = forecastList
        .filter((item: any) => new Date(item.dt * 1000).toLocaleDateString() === today)
        .map((item: any) => ({
          date: new Date(item.dt * 1000).toLocaleDateString(),
          time: new Date(item.dt * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          temp: Math.round(item.main.temp),
          description: item.weather[0].description,
          humidity: item.main.humidity,
          windSpeed: item.wind.speed,
        }));
      setHourlyForecast(hourlyData);

      const dailyData = forecastList
        .filter((_: any, index: number) => index % 8 === 0)
        .slice(0, 10)
        .map((item: any) => ({
          date: new Date(item.dt * 1000).toLocaleDateString(),
          temp: Math.round(item.main.temp),
          description: item.weather[0].description,
          humidity: item.main.humidity,
          windSpeed: item.wind.speed,
        }));
      setDailyForecast(dailyData);

      await fetchGeminiAdvice(currentData);
    } catch (err) {
      setError("Không tìm thấy dữ liệu thời tiết. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const fetchGeminiAdvice = async (weather: WeatherData) => {
    try {
      const query = `Dựa trên thời tiết hiện tại: nhiệt độ ${weather.temp}°C, mô tả "${weather.description}", độ ẩm ${weather.humidity}%, tốc độ gió ${weather.windSpeed} m/s, hãy đưa ra lời khuyên ngắn gọn và hữu ích bằng tiếng Việt cho người dùng.`;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: query }] }] }),
      });

      const data = await response.json();
      const adviceText = data.candidates[0]?.content?.parts[0]?.text || "Không có lời khuyên từ AI.";
      setAdvice(adviceText);
    } catch (err) {
      setAdvice("Lỗi khi lấy lời khuyên từ AI. Vui lòng thử lại sau!");
      console.error(err);
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchWeather({ lat: latitude, lon: longitude });
        },
        (err) => {
          console.error(err);
          setError("Không thể lấy vị trí. Sử dụng Hà Nội làm mặc định.");
          fetchWeather("Hanoi");
        }
      );
    } else {
      setError("Trình duyệt không hỗ trợ định vị. Sử dụng Hà Nội làm mặc định.");
      fetchWeather("Hanoi");
    }
  }, []);

  const getWeatherIcon = (description: string) => {
    const lowerDesc = description.toLowerCase();

    if (lowerDesc.includes("rain") && lowerDesc.includes("thunder")) return "⛈";
    if (lowerDesc.includes("thunder")) return "⚡";
    if (lowerDesc.includes("rain")) return "🌧";
    if (lowerDesc.includes("snow")) return "🌨";
    if (lowerDesc.includes("cloud")) return "⛅";
    if (lowerDesc.includes("clear")) return "🌞";
    if (lowerDesc.includes("hot") || lowerDesc.includes("sunny")) return "🔥";
    if (lowerDesc.includes("storm")) return "🌩";
    if (lowerDesc.includes("drizzle")) return "☔";
    if (lowerDesc.includes("mist") || lowerDesc.includes("fog")) return "🌫";
    return "🌕";
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (city) fetchWeather(city);
  };

  return (
    <div className="max-h-dvh bg-gradient-to-b from-[#C1D9FF] ring-offset-blue-50 to-[#F6CF96] overflow-y-scroll">
      <form onSubmit={handleSearch} className="flex w-full mt-2">
        <div className="mx-auto">
          <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Nhập tên thành phố." className="text-black h-[32px] rounded-md focus:outline-none px-2 py-3" />
          <button type="submit" className="bg-black size-8 rounded-md ml-2">
            Đi
          </button>
        </div>
      </form>
      <div className=" max-w-5xl p-2 mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          {currentWeather && (
            <div className="text-black w-full flex flex-col items-center mt-10 mb-10">
              <p className="capitalize font-medium">{currentWeather.description}</p>
              <div className="flex">
                <p className="text-8xl font-bold ">{currentWeather.temp}</p>
                <div className="text-5xl mt-4"> {getWeatherIcon(currentWeather.description)}</div>
              </div>
              <p className="mt-1">Cảm giác như {currentWeather.feelslike}°</p>
              <p>Gió: {currentWeather.windSpeed} m/s</p>
            </div>
          )}

          <OverviewCards text="Lời Khuyên" icon={<FontAwesomeIcon icon={faEnvelope} />}>
            <p className="text-black/80">{advice}</p>
          </OverviewCards>

          <OverviewCards text="Dự Báo Trong Ngày" icon={<FontAwesomeIcon icon={faCalendarMinus} />}>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {hourlyForecast.map((hour, index) => (
                <div key={index} className=" rounded-lg flex flex-col items-center">
                  <p className="text-base font-semibold">{hour.temp}°C</p>
                  <div className="flex items-center text-2xl gap-2 mt-1 mb-2">{getWeatherIcon(hour.description)}</div>
                  <p className="text-xs font-medium text-black/80">{hour.time}</p>
                </div>
              ))}
            </div>
          </OverviewCards>

          <OverviewCards text="Cách Ngày Tiếp Theo" icon={<FontAwesomeIcon icon={faCalendarDays} />}>
            <div className="grid grid-cols-5">
              {dailyForecast.map((day, index) => (
                <div key={index} className="flex flex-col items-center mt-1">
                  <p className="text-base font-semibold">{day.temp}°C</p>
                  <div className="flex items-center text-3xl gap-2 mt-1 mb-2">{getWeatherIcon(day.description)}</div>
                  <p className="text-xs font-medium text-black/80">{day.date}</p>
                </div>
              ))}
            </div>
          </OverviewCards>
        </div>
        <div className="grid ">
          <OverviewCards text="Bản Đồ" icon={<FontAwesomeIcon icon={faClock} />}>
            <div className="size-full">
              {currentWeather && (
                <iframe
                  className="w-full md:h-[624px] h-[400px]"
                  src={`https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=mm&metricTemp=°C&metricWind=km/h&zoom=8&overlay=wind&product=ecmwf&level=surface&lat=${currentWeather.coordlat}&lon=${currentWeather.coordlon}&message=true`}
                  frameBorder="0"
                ></iframe>
              )}
            </div>
          </OverviewCards>
        </div>
      </div>
    </div>
  );
};

export default Home;
