const API_KEY = 'your-weather-api-key';
const BASE_URL = 'https://api.weatherapi.com/v1';

// Predefined list of cities for suggestions
const cities = [
  "New York", "Los Angeles", "Chicago", "Houston", "Phoenix",
  "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose"
];

// Variables for suggestions
let filteredCities = [];
let selectedSuggestionIndex = -1;

// DOM Elements
const searchBtn = document.getElementById('search-btn');
const cityInput = document.getElementById('city-input');
const suggestionsContainer = document.getElementById('suggestions');
const weatherInfo = document.getElementById('weather-info');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('error-message');

// Icon mapping for weather conditions
const iconMap = {
  '01': 'sun',
  '02': 'cloud-sun',
  '03': 'cloud',
  '04': 'cloud',
  '09': 'cloud-rain',
  '10': 'cloud-drizzle',
  '11': 'cloud-lightning',
  '13': 'cloud-snow',
  '50': 'wind'
};

// Event Listeners for weather fetching
searchBtn.addEventListener('click', fetchWeather);
cityInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && selectedSuggestionIndex === -1) {
    fetchWeather();
  }
});

// Update suggestions as user types
cityInput.addEventListener('input', () => {
  const inputValue = cityInput.value.trim();
  if (!inputValue) {
    clearSuggestions();
    return;
  }
  
  filteredCities = cities.filter(city =>
    city.toLowerCase().includes(inputValue.toLowerCase())
  ).slice(0, 4);
  showSuggestions(filteredCities);
  selectedSuggestionIndex = -1;
});

// Handle keyboard navigation for suggestions
cityInput.addEventListener('keydown', (e) => {
  const suggestionItems = suggestionsContainer.querySelectorAll('li');
  if (!suggestionItems.length) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    selectedSuggestionIndex = (selectedSuggestionIndex + 1) % suggestionItems.length;
    updateSuggestionHighlight(suggestionItems);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    selectedSuggestionIndex = (selectedSuggestionIndex - 1 + suggestionItems.length) % suggestionItems.length;
    updateSuggestionHighlight(suggestionItems);
  } else if (e.key === 'Enter') {
    if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < suggestionItems.length) {
      const selectedCity = suggestionItems[selectedSuggestionIndex].textContent;
      cityInput.value = selectedCity;
      clearSuggestions();
      fetchWeather();
    }
  }
});

// Display suggestion list
function showSuggestions(suggestions) {
  suggestionsContainer.innerHTML = '';
  if (!suggestions.length) return;

  const ul = document.createElement('ul');
  ul.className = 'absolute z-10 w-full mt-1 rounded-lg shadow-lg';
  suggestions.forEach((suggestion, index) => {
    const li = document.createElement('li');
    li.textContent = suggestion;
    li.className = 'hover:bg-blue-500 hover:text-white';
    li.addEventListener('click', () => {
      cityInput.value = suggestion;
      clearSuggestions();
      fetchWeather();
    });
    ul.appendChild(li);
  });
  suggestionsContainer.appendChild(ul);
}

// Clear suggestions from the UI
function clearSuggestions() {
  suggestionsContainer.innerHTML = '';
  selectedSuggestionIndex = -1;
}

// Update the visual highlight for keyboard navigation
function updateSuggestionHighlight(items) {
  items.forEach((item, index) => {
    if (index === selectedSuggestionIndex) {
      item.classList.add('bg-blue-500', 'text-white');
    } else {
      item.classList.remove('bg-blue-500', 'text-white');
    }
  });
}

// Fetch weather data from the API
async function fetchWeather() {
  const city = cityInput.value.trim();
  if (!city) return;

  toggleLoading(true);
  clearErrors();

  try {
    const response = await fetch(`${BASE_URL}/current.json?key=${API_KEY}&q=${city}&aqi=no`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();
    updateWeatherUI(data);
    localStorage.setItem('weatherData', JSON.stringify(data));
  } catch (error) {
    console.error('Error:', error);
    showError(error.message.includes('Failed to fetch') ?
      'Failed to connect to weather service' :
      'City not found. Please try again.');
  } finally {
    toggleLoading(false);
    clearSuggestions();
  }
}

// Update the UI with weather data
function updateWeatherUI(data) {
  const { current, location } = data;
  const iconUrlParts = current.condition.icon.split('/');
  const iconFilename = iconUrlParts[iconUrlParts.length - 1];
  const iconCode = iconFilename.slice(0, 2);

  document.getElementById('location').querySelector('span').textContent = location.name;
  document.getElementById('temperature').textContent = `${Math.round(current.temp_c)}°C`;
  document.getElementById('description').textContent = current.condition.text;
  document.getElementById('humidity').textContent = `${current.humidity}%`;
  document.getElementById('wind-speed').textContent = `${current.wind_kph} km/h`;
  document.getElementById('feels-like').textContent = `${Math.round(current.feelslike_c)}°C`;
  document.getElementById('visibility').textContent = `${current.vis_km} km`;

  const weatherIcon = document.getElementById('weather-icon');
  weatherIcon.setAttribute('data-feather', iconMap[iconCode] || 'sun');
  feather.replace();

  weatherInfo.classList.remove('hidden');
  weatherInfo.classList.add('animate-fade-in-up');
}

// Toggle loading state
function toggleLoading(isLoading) {
  const loader = document.getElementById('button-loader');
  const searchIcon = searchBtn.querySelector('i');

  if (!loading || !loader || !searchIcon) {
    console.error('One or more required DOM elements are missing.');
    return;
  }

  searchBtn.disabled = isLoading;
  loading.classList.toggle('hidden', !isLoading);
  weatherInfo.classList.add('hidden');
  loader.classList.toggle('hidden', !isLoading);
  searchIcon.classList.toggle('hidden', isLoading);
}

// Show error message
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove('hidden');
}

// Clear error message
function clearErrors() {
  errorMessage.classList.add('hidden');
}

// Check if there is saved weather data in local storage when the page loads
window.addEventListener('load', () => {
  const savedData = localStorage.getItem('weatherData');
  if (savedData) {
    try {
      const data = JSON.parse(savedData);
      updateWeatherUI(data);
    } catch (error) {
      console.error('Error parsing saved weather data:', error);
    }
  }
});

// Initialize Feather Icons on load
feather.replace();
