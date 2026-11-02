export const $ = selector => document.querySelector(selector);
export const $$ = selector => [...document.querySelectorAll(selector)];
export function showNotice(message, type = "info") {
  const notice = $("#notice");
  notice.textContent = message;
  notice.className = `notice ${type === "error" ? "error" : ""}`;
  notice.hidden = false;
}
export function hideNotice() { $("#notice").hidden = true; }
export function setLoading(loading) {
  $("#loading").hidden = !loading;
  $("#searchButton").disabled = loading;
  $("#locationButton").disabled = loading;
}
export function weatherEmoji(main, icon = "") {
  const group = (main || "").toLowerCase();
  if (group.includes("thunder")) return "⛈️";
  if (group.includes("drizzle") || group.includes("rain")) return "🌧️";
  if (group.includes("snow")) return "❄️";
  if (group.includes("mist") || group.includes("fog") || group.includes("haze") || group.includes("smoke")) return "🌫️";
  if (group.includes("cloud")) return icon.includes("n") ? "☁️" : "⛅";
  return icon.includes("n") ? "🌙" : "☀️";
}
export function formatTime(unix, timezone = 0) {
  if (!unix) return "--:--";
  return new Date((unix + timezone) * 1000).toLocaleTimeString("en-US", { hour:"numeric", minute:"2-digit", timeZone:"UTC" });
}
export function formatDay(unix, timezone = 0, options = { weekday:"short" }) {
  return new Date((unix + timezone) * 1000).toLocaleDateString("en-US", { ...options, timeZone:"UTC" });
}
export function displayName(place, current) {
  if (place) return [place.name, place.state, place.country].filter(Boolean).join(", ");
  return [current.name, current.sys?.country].filter(Boolean).join(", ");
}
export function renderCurrent(data, unit) {
  const c = data.current, tz = c.timezone || 0, weather = c.weather?.[0] || {};
  const convert = t => unit === "C" ? Math.round(t) : Math.round(t * 9/5 + 32);
  $("#placeName").textContent = displayName(data.place, c);
  $("#placeTime").textContent = `${formatDay(c.dt, tz, { weekday:"long", month:"short", day:"numeric" })} · Local time`;
  $("#temperature").textContent = convert(c.main.temp);
  $("#temperatureUnit").textContent = `°${unit}`;
  $("#weatherDescription").textContent = weather.description || "Conditions unavailable";
  $("#feelsLike").textContent = `${convert(c.main.feels_like)}°${unit}`;
  $("#humidity").textContent = `${c.main.humidity}%`;
  $("#wind").textContent = `${Math.round((c.wind?.speed || 0) * 3.6)} km/h`;
  $("#sunrise").textContent = formatTime(c.sys?.sunrise, tz);
  $("#sunset").textContent = formatTime(c.sys?.sunset, tz);
  $("#weatherArt").textContent = weatherEmoji(weather.main, weather.icon);
  $("#todayRange").textContent = `${convert(c.main.temp_max)}° / ${convert(c.main.temp_min)}°`;
  $("#updatedAt").textContent = `Updated ${new Date().toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})}`;
  document.body.dataset.weather = (weather.main || "clear").toLowerCase().includes("rain") ? "rain" : (weather.main || "").toLowerCase().includes("cloud") ? "clouds" : "clear";
}
export function renderForecast(data, unit) {
  const list = $("#fiveDayForecast");
  const entries = data.forecast.list || [];
  const byDay = new Map();
  entries.forEach(item => {
    const day = formatDay(item.dt, data.current.timezone || 0, { year:"numeric", month:"2-digit", day:"2-digit" });
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day).push(item);
  });
  const days = [...byDay.values()].slice(0, 5);
  const convert = t => unit === "C" ? Math.round(t) : Math.round(t * 9/5 + 32);
  list.innerHTML = days.map((items, index) => {
    const midday = items.reduce((best, item) => Math.abs(new Date(item.dt * 1000).getUTCHours() - 12) < Math.abs(new Date(best.dt * 1000).getUTCHours() - 12) ? item : best, items[0]);
    const min = Math.min(...items.map(i => i.main.temp_min)), max = Math.max(...items.map(i => i.main.temp_max));
    const w = midday.weather[0];
    const day = index === 0 ? "Today" : formatDay(midday.dt, data.current.timezone || 0, {weekday:"short"});
    return `<div class="forecast-row"><span class="forecast-day">${day}</span><span class="forecast-icon">${weatherEmoji(w.main,w.icon)}</span><span class="forecast-desc">${w.description}</span><span class="forecast-temps">${convert(max)}° <span>${convert(min)}°</span></span></div>`;
  }).join("");
  const next = entries.slice(0, 8);
  $("#hourlyStrip").innerHTML = next.filter((_,i)=>i%2===0).slice(0,5).map(item => `<div class="hourly-item"><span>${formatTime(item.dt, data.current.timezone || 0)}</span><div class="hour-icon">${weatherEmoji(item.weather[0].main,item.weather[0].icon)}</div><strong>${convert(item.main.temp)}°</strong></div>`).join("");
  renderChart(next, unit, data.current.timezone || 0);
}
let chart;
function renderChart(entries, unit, timezone) {
  const canvas = $("#hourlyChart");
  $("#chartEmpty").hidden = entries.length > 0;
  if (!window.Chart || !entries.length) return;
  if (chart) chart.destroy();
  const convert = t => unit === "C" ? Math.round(t) : Math.round(t * 9/5 + 32);
  chart = new Chart(canvas, {
    type:"line",
    data:{labels:entries.map(i=>formatTime(i.dt,timezone)),datasets:[{data:entries.map(i=>convert(i.main.temp)),borderColor:"#8fd5ff",backgroundColor:"rgba(143,213,255,.12)",fill:true,tension:.38,pointRadius:3,pointHoverRadius:5,pointBackgroundColor:"#d8f2ff",borderWidth:2}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{displayColors:false,callbacks:{label:ctx=>`${ctx.raw}°${unit}`}}},scales:{x:{grid:{display:false},ticks:{color:"#8195ad",maxTicksLimit:6,font:{size:10}},border:{display:false}},y:{grid:{color:"rgba(255,255,255,.06)"},ticks:{color:"#8195ad",font:{size:10},callback:value=>`${value}°`},border:{display:false}}}}
  });
}
export function renderAir(air) {
  if (!air?.list?.[0]) { $("#aqiLabel").textContent="Unavailable"; $("#aqiDescription").textContent="Air quality data is not available right now."; return; }
  const value = air.list[0].main.aqi;
  const levels = [{label:"Good",desc:"Air quality is considered satisfactory."},{label:"Fair",desc:"Air quality is generally acceptable."},{label:"Moderate",desc:"Sensitive people may want to take care."},{label:"Poor",desc:"Consider limiting prolonged outdoor activity."},{label:"Very poor",desc:"Reduce outdoor exposure if possible."}];
  $("#aqiNumber").textContent=value;
  $("#aqiLabel").textContent=levels[value-1].label;
  $("#aqiDescription").textContent=levels[value-1].desc;
  $("#aqiMeterFill").style.width=`${value*20}%`;
}
export function renderFavourites(favourites, currentName, onSelect, onRemove) {
  const container=$("#favourites");
  $("#favouriteCount").textContent=`${favourites.length} SAVED`;
  if (!favourites.length) { container.innerHTML='<p class="muted empty-favourites">Save a city with the ☆ button to find it here.</p>'; return; }
  container.innerHTML=favourites.map((f,i)=>`<div class="favourite-chip"><button class="favourite-chip-main" data-fav="${i}" aria-label="Load ${escapeHtml(f.name)}" style="display:flex;align-items:center;gap:12px;flex:1;border:0;background:none;color:inherit;text-align:left;cursor:pointer;font:inherit"><span class="fav-icon">📍</span><span class="fav-info"><strong>${escapeHtml(f.name)}</strong><small>${f.country || "Saved city"}</small></span></button><button class="remove-fav" data-remove="${i}" aria-label="Remove ${escapeHtml(f.name)}">×</button></div>`).join("");
  container.querySelectorAll("[data-fav]").forEach(btn=>btn.addEventListener("click",()=>onSelect(favourites[Number(btn.dataset.fav)])));
  container.querySelectorAll("[data-remove]").forEach(btn=>btn.addEventListener("click",()=>onRemove(Number(btn.dataset.remove))));
}
function escapeHtml(value="") { return String(value).replace(/[&<>"']/g, char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char])); }