const form = document.getElementById("tripForm");
const sweetStops = document.getElementById("sweetStops");
const countdown = document.getElementById("countdown");
const progressBar = document.getElementById("progressBar");
let map, totalDuration = 0, sweetTimers = [];

document.getElementById("toggleDark").addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearTimers();
  sweetStops.innerHTML = "";
  countdown.textContent = "";
  progressBar.style.width = "0%";

  const start = document.getElementById("start").value;
  const end = document.getElementById("end").value;
  const sweets = document.getElementById("sweets").value.split(",").map(s => s.trim());

  const coords = await getCoordinates([start, end]);
  const route = await getRoute(coords[0], coords[1]);
  displayMap(route.geometry.coordinates, sweets, route.features[0].properties.summary.duration);
});

async function getCoordinates(locations) {
  const key = "YOUR_API_KEY"; // replace with your OpenRouteService key
  const results = [];

  for (let location of locations) {
    const res = await fetch(`https://api.openrouteservice.org/geocode/search?api_key=${key}&text=${encodeURIComponent(location)}`);
    const data = await res.json();
    const [lon, lat] = data.features[0].geometry.coordinates;
    results.push([lon, lat]);
  }
  return results;
}

async function getRoute(startCoord, endCoord) {
  const key = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImZmNTMyZTAyM2FmMjQxYzJiM2UzYTUzMjgzZWU5NjAxIiwiaCI6Im11cm11cjY0In0=";
  const body = {
    coordinates: [startCoord, endCoord]
  };

  const res = await fetch(`https://api.openrouteservice.org/v2/directions/driving-car/geojson`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": key
    },
    body: JSON.stringify(body)
  });

  return await res.json();
}

function displayMap(coords, sweets, duration) {
  if (map) map.remove();
  map = L.map("map").setView([coords[0][1], coords[0][0]], 10);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

  const latlngs = coords.map(([lon, lat]) => [lat, lon]);
  L.polyline(latlngs, { color: "purple" }).addTo(map);

  totalDuration = duration; // in seconds
  const spacing = Math.floor(coords.length / sweets.length);
  const interval = Math.floor(duration / sweets.length); // in seconds

  sweets.forEach((sweet, i) => {
    const index = spacing * i;
    const [lon, lat] = coords[index];
    const marker = L.marker([lat, lon]).addTo(map);
    marker.bindPopup(`🍬 Time for: ${sweet}`).openPopup();

    const li = document.createElement("li");
    li.textContent = `Eat "${sweet}" at ~${Math.round((i + 1) * interval / 60)} mins`;
    sweetStops.appendChild(li);

    // Create countdown for each sweet
    const timer = setTimeout(() => {
      updateProgress((i + 1) / sweets.length * 100);
      countdown.textContent = `⏰ Eat "${sweet}" now! (${Math.round((i + 1) * interval / 60)} mins into trip)`;
    }, (i + 1) * interval * 1000);
    sweetTimers.push(timer);
  });
}

function updateProgress(percent) {
  progressBar.style.width = `${percent}%`;
}

function clearTimers() {
  sweetTimers.forEach(timer => clearTimeout(timer));
  sweetTimers = [];
}
