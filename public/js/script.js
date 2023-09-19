// HTML ELEMENTS
const buttons = document.querySelector('.setting-buttons');
const panels = document.querySelectorAll('.panel');

// FUNCTIONS
function APIGetCall(link){
  return fetch(link)
}

function updateDateTime() {
  const dateTimeElement = document.getElementById("current-date-time");
  const currentDate = new Date();

  const formattedDateTime = currentDate.toLocaleString();

  dateTimeElement.textContent = formattedDateTime;
}

updateDateTime();
setInterval(updateDateTime, 1000);

function handleClick(e) {
  if (e.target.matches('button')) {
    // Hide all panels by removing the 'show' class
    panels.forEach(panel => panel.classList.remove('show'));

    // Extract the 'id' attribute from the clicked button's dataset
    const { id } = e.target.dataset;

    // Construct a CSS selector to select the corresponding panel
    const selector = `.panel[id="${id}"]`;

    // Add the 'show' class to the selected panel to make it visible
    document.querySelector(selector).classList.add('show');
  }
}

// LISTENERS
buttons?.addEventListener('click', handleClick);




