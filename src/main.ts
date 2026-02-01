function updateClock() {
  const clockElement = document.getElementById('clock');
  if (clockElement) {
    const now = new Date();
    clockElement.textContent = now.toLocaleTimeString();
  }
}

updateClock();
setInterval(updateClock, 1000);
