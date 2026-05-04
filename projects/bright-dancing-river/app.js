const teamColors = {
  "Red Bull Racing": "#3671C6",
  "McLaren": "#FF8000",
  "Ferrari": "#E8002D",
  "Mercedes": "#27F4D2",
  "Aston Martin": "#229971",
  "Alpine": "#FF87BC",
  "Williams": "#64C4FF",
  "Kick Sauber": "#52E252",
  "Haas": "#B6BABD",
  "RB": "#6692FF",
};

const drivers = [
  { num: 1, name: "Max Verstappen", team: "Red Bull Racing", country: "NED", championships: 4 },
  { num: 4, name: "Lando Norris", team: "McLaren", country: "GBR", championships: 1 },
  { num: 81, name: "Oscar Piastri", team: "McLaren", country: "AUS", championships: 0 },
  { num: 16, name: "Charles Leclerc", team: "Ferrari", country: "MON", championships: 0 },
  { num: 44, name: "Lewis Hamilton", team: "Ferrari", country: "GBR", championships: 7 },
  { num: 63, name: "George Russell", team: "Mercedes", country: "GBR", championships: 0 },
  { num: 12, name: "Andrea Kimi Antonelli", team: "Mercedes", country: "ITA", championships: 0 },
  { num: 14, name: "Fernando Alonso", team: "Aston Martin", country: "ESP", championships: 2 },
  { num: 18, name: "Lance Stroll", team: "Aston Martin", country: "CAN", championships: 0 },
  { num: 10, name: "Pierre Gasly", team: "Alpine", country: "FRA", championships: 0 },
  { num: 23, name: "Alex Albon", team: "Williams", country: "THA", championships: 0 },
  { num: 27, name: "Nico Hülkenberg", team: "Kick Sauber", country: "GER", championships: 0 },
];

const teams = [
  { name: "McLaren", base: "Woking, UK", drivers: ["Lando Norris", "Oscar Piastri"], titles: 9 },
  { name: "Ferrari", base: "Maranello, Italy", drivers: ["Charles Leclerc", "Lewis Hamilton"], titles: 16 },
  { name: "Red Bull Racing", base: "Milton Keynes, UK", drivers: ["Max Verstappen", "Yuki Tsunoda"], titles: 6 },
  { name: "Mercedes", base: "Brackley, UK", drivers: ["George Russell", "Andrea Kimi Antonelli"], titles: 8 },
  { name: "Aston Martin", base: "Silverstone, UK", drivers: ["Fernando Alonso", "Lance Stroll"], titles: 0 },
  { name: "Alpine", base: "Enstone, UK", drivers: ["Pierre Gasly", "Franco Colapinto"], titles: 2 },
  { name: "Williams", base: "Grove, UK", drivers: ["Alex Albon", "Carlos Sainz"], titles: 9 },
  { name: "Haas", base: "Kannapolis, USA", drivers: ["Esteban Ocon", "Oliver Bearman"], titles: 0 },
  { name: "RB", base: "Faenza, Italy", drivers: ["Liam Lawson", "Isack Hadjar"], titles: 0 },
  { name: "Kick Sauber", base: "Hinwil, Switzerland", drivers: ["Nico Hülkenberg", "Gabriel Bortoleto"], titles: 1 },
];

const calendar = [
  { round: "01", race: "Australian GP", circuit: "Albert Park, Melbourne" },
  { round: "02", race: "Chinese GP", circuit: "Shanghai International" },
  { round: "04", race: "Japanese GP", circuit: "Suzuka" },
  { round: "06", race: "Miami GP", circuit: "Miami International Autodrome" },
  { round: "07", race: "Emilia-Romagna GP", circuit: "Imola" },
  { round: "08", race: "Monaco GP", circuit: "Circuit de Monaco" },
  { round: "11", race: "Canadian GP", circuit: "Circuit Gilles Villeneuve" },
  { round: "12", race: "British GP", circuit: "Silverstone" },
  { round: "14", race: "Belgian GP", circuit: "Spa-Francorchamps" },
  { round: "16", race: "Italian GP", circuit: "Monza" },
  { round: "20", race: "United States GP", circuit: "Circuit of the Americas" },
  { round: "23", race: "Las Vegas GP", circuit: "Las Vegas Strip Circuit" },
  { round: "24", race: "Abu Dhabi GP", circuit: "Yas Marina" },
];

function renderDrivers() {
  const grid = document.getElementById("driver-grid");
  grid.innerHTML = drivers.map(d => `
    <div class="driver-card" style="--team-color: ${teamColors[d.team] || "#e10600"}">
      <div class="driver-num">${d.num}</div>
      <div class="driver-name">${d.name}</div>
      <div class="driver-team">${d.team}</div>
      <div class="driver-meta">
        <span><strong>${d.country}</strong>Country</span>
        <span><strong>${d.championships}</strong>Titles</span>
      </div>
    </div>
  `).join("");
}

function renderTeams() {
  const grid = document.getElementById("team-grid");
  grid.innerHTML = teams.map(t => `
    <div class="team-card" style="--team-color: ${teamColors[t.name] || "#e10600"}">
      <div class="team-name">${t.name}</div>
      <div class="team-base">${t.base} · ${t.titles} constructors' titles</div>
      <div class="team-drivers">
        <span><strong>${t.drivers[0]}</strong></span>
        <span><strong>${t.drivers[1]}</strong></span>
      </div>
    </div>
  `).join("");
}

function renderCalendar() {
  const list = document.getElementById("calendar-list");
  list.innerHTML = calendar.map(r => `
    <li>
      <div class="race-info">
        <span class="race-name">${r.race}</span>
        <span class="race-circuit">${r.circuit}</span>
      </div>
      <span class="race-round">R${r.round}</span>
    </li>
  `).join("");
}

renderDrivers();
renderTeams();
renderCalendar();
