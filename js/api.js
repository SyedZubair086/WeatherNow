const BASE = "https://api.openweathermap.org";
export function getApiKey() {
  return localStorage.getItem("weathernow_api_key") || "";
}
async function request(url) {
  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 401) throw new Error("Your API key is invalid or not active yet. Check your OpenWeather account and try again.");
    if (response.status === 404) throw new Error("We couldn't find that city. Check the spelling or choose a suggestion.");
    if (response.status === 429) throw new Error("Weather service is busy. Please wait a moment and try again.");
    throw new Error(`Weather service returned an error (${response.status}). Please try again.`);
  }
  return response.json();
}
function keyQuery(key) { return `appid=${encodeURIComponent(key)}`; }
export async function geocodeCity(city) {
  const key = getApiKey();
  if (!key) throw new Error("Add your OpenWeather API key using the ⚙ button to load live weather.");
  const results = await request(`${BASE}/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=5&${keyQuery(key)}`);
  return results.map(item => ({ name:item.name, state:item.state || "", country:item.country, lat:item.lat, lon:item.lon }));
}
export async function getCurrentByCoords(lat, lon) {
  const key = getApiKey();
  if (!key) throw new Error("Add your OpenWeather API key using the ⚙ button to load live weather.");
  const query = `lat=${lat}&lon=${lon}&${keyQuery(key)}&units=metric`;
  const [current, forecast, air] = await Promise.all([
    request(`${BASE}/data/2.5/weather?${query}`),
    request(`${BASE}/data/2.5/forecast?${query}`),
    request(`${BASE}/data/2.5/air_pollution?lat=${lat}&lon=${lon}&${keyQuery(key)}`).catch(() => null)
  ]);
  return { current, forecast, air };
}
export async function getCityWeather(city) {
  const places = await geocodeCity(city);
  if (!places.length) throw new Error("We couldn't find that city. Try another spelling or nearby city.");
  return { ...(await getCurrentByCoords(places[0].lat, places[0].lon)), place: places[0] };
}
export async function searchCities(city) {
  if (!city.trim() || city.trim().length < 2 || !getApiKey()) return [];
  return geocodeCity(city.trim());
}