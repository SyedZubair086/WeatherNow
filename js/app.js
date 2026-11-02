import { getCurrentByCoords, getCityWeather, searchCities, getApiKey } from "./api.js";
import { $, $$, showNotice, hideNotice, setLoading, renderCurrent, renderForecast, renderAir, renderFavourites } from "./ui.js";

const STORE = { favourites:"weathernow_favourites", unit:"weathernow_unit", last:"weathernow_last_city" };
let unit = localStorage.getItem(STORE.unit) || "C";
let currentData = null;
let debounceTimer;
let suggestionRequest = 0;
let favourites = readFavourites();

function readFavourites(){ try{return JSON.parse(localStorage.getItem(STORE.favourites)||"[]")}catch{return[]} }
function saveFavourites(){localStorage.setItem(STORE.favourites,JSON.stringify(favourites)); refreshFavourites()}
function refreshFavourites(){renderFavourites(favourites, currentData?.current?.name, f=>loadCity(f.name), index=>{favourites.splice(index,1);saveFavourites()})}
function setUnit(next){unit=next;localStorage.setItem(STORE.unit,unit);$$("[data-unit]").forEach(el=>el.classList.toggle("active",el.dataset.unit===unit));if(currentData)renderAll(currentData)}
function renderAll(data){currentData=data;renderCurrent(data,unit);renderForecast(data,unit);renderAir(data.air);refreshFavourites();$("#dashboard").hidden=false}
async function loadCity(city){
  if(!city?.trim()) {showNotice("Please type a city name first.","error");return}
  setLoading(true);hideNotice();$("#suggestions").hidden=true;
  try{const data=await getCityWeather(city.trim());renderAll(data);localStorage.setItem(STORE.last,JSON.stringify({name:data.place?.name||data.current.name,lat:data.current.coord.lat,lon:data.current.coord.lon}));$("#cityInput").value=data.place?.name||data.current.name;$("#clearSearch").hidden=false}
  catch(error){showNotice(error.message||"Something went wrong. Please try again.","error")}
  finally{setLoading(false)}
}
async function loadCoords(lat,lon,place=null){
  setLoading(true);hideNotice();
  try{const result=await getCurrentByCoords(lat,lon);renderAll({...result,place});localStorage.setItem(STORE.last,JSON.stringify({name:place?.name||result.current.name,lat,lon}));$("#cityInput").value=place?.name||result.current.name;$("#clearSearch").hidden=false}
  catch(error){showNotice(error.message||"Could not load weather for this location.","error")}
  finally{setLoading(false)}
}
function chooseSuggestion(place){$("#suggestions").hidden=true;$("#cityInput").value=place.name;loadCoords(place.lat,place.lon,place)}
async function updateSuggestions(){
  const query=$("#cityInput").value.trim();$("#clearSearch").hidden=!query;
  if(query.length<2||!getApiKey()){$("#suggestions").hidden=true;return}
  const requestId=++suggestionRequest;
  try{
    const places=await searchCities(query);
    if(requestId!==suggestionRequest)return;
    const box=$("#suggestions");
    if(!places.length){box.hidden=true;return}
    box.innerHTML=places.map((p,i)=>`<button class="suggestion-item" type="button" role="option" data-suggestion="${i}"><span>${escapeHtml(p.name)}${p.state?`, ${escapeHtml(p.state)}`:""}</span><small>${escapeHtml(p.country)}</small></button>`).join("");
    box.hidden=false;
    box.querySelectorAll("[data-suggestion]").forEach(btn=>btn.addEventListener("click",()=>chooseSuggestion(places[Number(btn.dataset.suggestion)])));
  }catch{$("#suggestions").hidden=true}
}
function escapeHtml(value=""){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function askLocation(){
  if(!navigator.geolocation){showNotice("Geolocation is not supported by this browser.","error");return}
  if(!getApiKey()){showNotice("First add your OpenWeather API key using the ⚙ button.","error");$("#settingsDialog").showModal();return}
  setLoading(true);
  navigator.geolocation.getCurrentPosition(
    position=>loadCoords(position.coords.latitude,position.coords.longitude),
    error=>{setLoading(false);const message=error.code===1?"Location permission was denied. Allow location access in your browser settings.":"We couldn't get your location. Search for a city instead.";showNotice(message,"error")},
    {enableHighAccuracy:false,timeout:10000,maximumAge:300000}
  );
}
function saveCurrentFavourite(){
  if(!currentData){showNotice("Load a city before saving it as a favourite.","error");return}
  const c=currentData.current, place=currentData.place;
  const item={name:place?.name||c.name,country:place?.country||c.sys?.country,lat:c.coord.lat,lon:c.coord.lon};
  if(favourites.some(f=>f.lat===item.lat&&f.lon===item.lon)){showNotice("This city is already in your favourites.");return}
  favourites.unshift(item);favourites=favourites.slice(0,8);saveFavourites();showNotice(`${item.name} added to your favourites.`);
}
function openSettings(){ $("#apiKeyInput").value=getApiKey();$("#settingsDialog").showModal() }
function init(){
  $("#todayDate").textContent=new Intl.DateTimeFormat(undefined,{weekday:"long",month:"short",day:"numeric"}).format(new Date());
  $("#footerYear").textContent=`© ${new Date().getFullYear()}`;
  setUnit(unit);refreshFavourites();
  $("#searchButton").addEventListener("click",()=>loadCity($("#cityInput").value));
  $("#cityInput").addEventListener("keydown",event=>{if(event.key==="Enter"){event.preventDefault();loadCity($("#cityInput").value)}if(event.key==="Escape")$("#suggestions").hidden=true});
  $("#cityInput").addEventListener("input",()=>{clearTimeout(debounceTimer);debounceTimer=setTimeout(updateSuggestions,350)});
  document.addEventListener("click",event=>{if(!event.target.closest(".search-wrap"))$("#suggestions").hidden=true});
  $("#clearSearch").addEventListener("click",()=>{$("#cityInput").value="";$("#clearSearch").hidden=true;$("#suggestions").hidden=true;$("#cityInput").focus()});
  $("#locationButton").addEventListener("click",askLocation);
  $("#unitToggle").addEventListener("click",()=>setUnit(unit==="C"?"F":"C"));
  $("#settingsButton").addEventListener("click",openSettings);
  $("#showKey").addEventListener("change",event=>$("#apiKeyInput").type=event.target.checked?"text":"password");
  $("#settingsForm").addEventListener("submit",event=>{
    if(event.submitter?.id!=="saveKeyButton")return;
    event.preventDefault();
    const key=$("#apiKeyInput").value.trim();
    if(!key){showNotice("Paste your OpenWeather API key first.","error");return}
    localStorage.setItem("weathernow_api_key",key);$("#settingsDialog").close();loadCity($("#cityInput").value.trim()||"Karachi");
  });
  $("#addFavourite").addEventListener("click",saveCurrentFavourite);
  if(!getApiKey()){showNotice("Welcome to WeatherNow! Add your OpenWeather API key with the ⚙ button to activate live weather. The dashboard layout is ready.","info");$("#settingsDialog").showModal()}
  else {const last=(()=>{try{return JSON.parse(localStorage.getItem(STORE.last)||"null")}catch{return null}})();if(last?.lat&&last?.lon)loadCoords(last.lat,last.lon);else loadCity("Karachi")}
}
init();

if("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(()=>{}));
}