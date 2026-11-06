# WeatherNow — Live Weather Dashboard

A responsive weather dashboard built with **HTML, CSS, vanilla JavaScript (ES modules)**, the OpenWeather API and Chart.js. Created as a Week 2 frontend internship project.

## Features

- City search with debounced autocomplete suggestions
- Current weather: temperature, feels-like, humidity, wind, sunrise and sunset
- Hourly temperature chart using Chart.js
- Five-day forecast
- Browser geolocation (with user permission)
- Favourite cities saved in localStorage
- Celsius/Fahrenheit switch with persistent setting
- Weather-responsive page theme
- Air quality index card
- Loading states and friendly API/network errors
- PWA manifest and service worker for installability/basic offline shell

## Tech stack

- HTML5 and CSS3 (responsive Grid/Flexbox)
- Vanilla JavaScript ES modules, `fetch`, `async/await`, `Promise.all`, `try/catch`
- OpenWeather Geocoding, Current Weather, 5-day Forecast and Air Pollution APIs
- Chart.js

## Run locally

1. Download or clone this repository.
2. Open the folder in VS Code.
3. Start a local server. In VS Code, use the **Live Server** extension and open `index.html`. Alternatively, run `python -m http.server 5500` in the project folder and visit `http://localhost:5500`.
4. Click the ⚙ settings button and paste your OpenWeather API key.
5. Search for a city or select **Use my location** and allow location access.

> ES modules, geolocation and service workers work best on `localhost` or HTTPS. Opening `index.html` directly as a `file://` URL may not work correctly.

## API key and security

Get an API key from [OpenWeather](https://home.openweathermap.org/api_keys). WeatherNow stores a key entered in the Settings dialog in the current browser's localStorage; it is **not written into the repository**. The project also ignores `js/config.js` for local-only configuration.

**Security note:** a key used directly by a static browser app can be inspected by visitors. For a production public deployment, use a serverless/backend proxy and restrict the key in your OpenWeather account where supported. Never commit a real API key to GitHub. New OpenWeather keys may take some time to activate.

## Deployment

This is a static website and can be hosted with GitHub Pages:

1. Push the project files to a new public GitHub repository.
2. Open **Settings → Pages**.
3. Under Build and deployment, choose **Deploy from a branch**.
4. Select `main` and `/ (root)`, then save.
5. Wait for deployment and open the published URL.

On the live site, each visitor needs to enter their own API key unless you configure a secure backend proxy. The app must be served over HTTPS for geolocation and PWA features.

## Test checklist

- [ ] Search a valid city and select an autocomplete suggestion
- [ ] Search an invalid city and confirm a friendly error appears
- [ ] Toggle °C/°F and refresh to confirm the preference persists
- [ ] Save a favourite, refresh, and load it again
- [ ] Test geolocation after granting permission
- [ ] Test location denial and API key errors
- [ ] Test mobile layout at a narrow viewport
- [ ] Confirm no API key is committed to the repository


Record a 2–3 minute demo showing city search, current weather, chart, five-day forecast, favourites, units and geolocation. Add the video URL here when ready.

## Resume bullet

Built a live weather dashboard in vanilla JavaScript (ES modules, async/await) with geolocation, debounced city search, forecast charts and persisted favourites.
