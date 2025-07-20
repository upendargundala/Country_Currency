// --- CONFIG ---

const COUNTRY_API = 'https://restcountries.com/v3.1/all'; // For list
const DEBOUNCE_DELAY = 300;

const form = document.getElementById('countryForm');
const input = document.getElementById('countryInput');
const speakerToggle = document.getElementById('speakerToggle');
const suggestionsDropdown = document.getElementById('suggestionsDropdown');

// --- STATE ---

let countries = [];
let debounceTimer = null;
let isSpeakerOn = localStorage.getItem('speakerOn') !== 'false'; // default on
let ttsUtterance = null;

// --- INITIALIZATION ---

speakerToggle.textContent = isSpeakerOn ? '🔊' : '🔇';
speakerToggle.setAttribute('aria-label', isSpeakerOn ? 'Speaker On' : 'Speaker Off');

// --- Country List Fetch (once on load) ---

fetch(COUNTRY_API)
  .then(res => res.json())
  .then(data => {
    countries = data.map(c => c.name.common);
  });

// --- SPEAKER TOGGLE ---

speakerToggle.addEventListener('click', () => {
  isSpeakerOn = !isSpeakerOn;
  localStorage.setItem('speakerOn', isSpeakerOn);
  speakerToggle.textContent = isSpeakerOn ? '🔊' : '🔇';
  speakerToggle.setAttribute('aria-label', isSpeakerOn ? 'Speaker On' : 'Speaker Off');
  if (!isSpeakerOn) window.speechSynthesis.cancel();
});

// --- FORM SUBMIT HANDLING (for Enter key and manual trigger) ---

form.addEventListener('submit', e => {
  e.preventDefault();
  const query = input.value.trim();
  if (!query) return;
  // Hide suggestions always
  suggestionsDropdown.innerHTML = '';
  suggestionsDropdown.style.display = 'none';
  // trigger your country search/handling logic :
  announceCountry(query);
});

// Enter key handling (captures Enter key only in input)
input.addEventListener('keydown', function(evt) {
  if (evt.key === 'Enter') {
    evt.preventDefault();
    const active = suggestionsDropdown.querySelector('.active');
    if (active) {
      // Suggestion selected with arrow+Enter
      input.value = active.textContent;
      suggestionsDropdown.innerHTML = '';
      suggestionsDropdown.style.display = 'none';
      form.dispatchEvent(new Event('submit'));
    } else if (input.value.trim() !== '') {
      // Plain Enter with a non-empty value
      suggestionsDropdown.innerHTML = '';
      suggestionsDropdown.style.display = 'none';
      form.dispatchEvent(new Event('submit'));
    }
    // If empty, ignore
  } else if (evt.key === 'ArrowDown' || evt.key === 'ArrowUp') {
    // Keyboard navigation through suggestions
    const items = [...suggestionsDropdown.querySelectorAll('.suggestion')];
    const current = suggestionsDropdown.querySelector('.active');
    let idx = items.indexOf(current);
    if (evt.key === 'ArrowDown') idx++;
    else idx--;
    if (idx < 0) idx = items.length - 1;
    if (idx >= items.length) idx = 0;
    items.forEach(el => el.classList.remove('active'));
    if (items[idx]) items[idx].classList.add('active');
    evt.preventDefault();
  }
});

// --- AUTOSUGGEST WITH DEBOUNCE & FUZZY SEARCH ---

input.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const query = input.value.trim().toLowerCase();
    if (!query) {
      suggestionsDropdown.innerHTML = '';
      suggestionsDropdown.style.display = 'none';
      return;
    }
    // Fuzzy (basic: includes or starts with or Levenshtein distance <=2)
    const needle = query.replace(/\s+/g, '');
    const matches = countries.filter(c => {
      const hay = c.toLowerCase().replace(/\s+/g, '');
      return hay.includes(needle) || getLevenshtein(hay, needle) <= 2;
    }).slice(0, 5);
    showSuggestions(matches, query);
  }, DEBOUNCE_DELAY);
});

function showSuggestions(matches, originalQuery) {
  suggestionsDropdown.innerHTML = '';
  if (matches.length === 0) {
    suggestionsDropdown.style.display = 'none';
    return;
  }
  matches.forEach(c => {
    const item = document.createElement('div');
    item.textContent = c;
    item.className = 'suggestion';
    item.addEventListener('mousedown', e => {
      // Mousedown fires before blur (so works). On click, fill and submit
      input.value = c;
      suggestionsDropdown.innerHTML = '';
      suggestionsDropdown.style.display = 'none';
      form.dispatchEvent(new Event('submit'));
    });
    suggestionsDropdown.appendChild(item);
  });
  suggestionsDropdown.firstChild.classList.add('active');
  suggestionsDropdown.style.display = 'block';
}

// Basic Levenshtein Distance (for fuzzy)
function getLevenshtein(a, b) {
  const an = a.length; const bn = b.length;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix = [];
  for (let i = 0; i <= bn; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= an; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[bn][an];
}

// --- Hide suggestions on blur ---
input.addEventListener('blur', () => {
  setTimeout(() => {
    suggestionsDropdown.innerHTML = '';
    suggestionsDropdown.style.display = 'none';
  }, 100);
});

// --- ANNOUNCE FUNCTION (use your real country function here) ---
function announceCountry(countryName) {
  // Call your API/data logic, then use speak()
  if (!isSpeakerOn) return;
  // You would fetch country info here — for demo, just announce name:
  const text = `You selected ${countryName}`;
  ttsUtterance = new SpeechSynthesisUtterance(text);
  ttsUtterance.lang = 'en-US';
  window.speechSynthesis.speak(ttsUtterance);
}

// --- Dark Mode and Country Info Fetch (new code) ---
document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const toggleDark = document.getElementById('toggleDark');
  const submitBtn = document.getElementById('submit');
  const input = document.getElementById('con');
  const valueEl = document.getElementById('value');
  const flagEl = document.getElementById('flag');

  // Dark mode toggle
  toggleDark.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    toggleDark.textContent = body.classList.contains('dark-mode') ? '☀️ Light Mode' : '🌙 Dark Mode';
  });

  // Fetch country info
  submitBtn.addEventListener('click', async () => {
    const country = input.value.trim();
    if (!country) {
      valueEl.textContent = 'Please enter a country name.';
      flagEl.hidden = true;
      flagEl.classList.remove('show');
      return;
    }
    valueEl.textContent = 'Loading...';
    flagEl.hidden = true;
    flagEl.classList.remove('show');
    try {
      const res = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(country)}?fullText=true`);
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0 || data.status === 404) {
        valueEl.textContent = 'Country not found.';
        return;
      }
      const info = data[0];
      valueEl.textContent = `Capital: ${info.capital?.[0] || 'N/A'}, Population: ${info.population.toLocaleString()}, Region: ${info.region}`;
      flagEl.src = info.flags?.svg || info.flags?.png || '';
      flagEl.alt = `${country} flag`;
      flagEl.hidden = false;
      flagEl.classList.add('show');
    } catch (e) {
      valueEl.textContent = 'Error fetching country info.';
    }
  });
});
