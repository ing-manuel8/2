import { getDatabase, ref, set, push } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';
import { app } from './app.js';  // Importa la inicialización de Firebase desde app.js

const database = getDatabase(app);

// Función para controlar el LED con un temporizador
function startTimerForLed() {
    const timeInput = document.getElementById('timerInput').value;  // Obtener el tiempo en minutos desde el input
    const ledStatusRef = ref(database, 'ledStatus');
    const statusText = document.getElementById('statusText');
    let timeInMilliseconds = timeInput * 60000;  // Convertir el tiempo a milisegundos

    if (timeInput && !isNaN(timeInput) && timeInput > 0) {
        // Encender el LED
        set(ledStatusRef, 1);
        statusText.textContent = `El LED está Prendido por ${timeInput} minutos`;

        // Guardar el historial
        saveHistory(1);

        // Desactivar el LED después del tiempo especificado
        setTimeout(() => {
            set(ledStatusRef, 0);
            statusText.textContent = `El LED está Apagado después de ${timeInput} minutos`;

            // Guardar el historial
            saveHistory(0);
        }, timeInMilliseconds);
    } else {
        alert('Por favor, ingresa un valor válido de tiempo (en minutos)');
    }
}

// Función para guardar el historial en Firebase
function saveHistory(value) {
    const { day, time } = getFormattedDate();  // Obtener la fecha y la hora actual
    const historyRef = ref(database, 'buttonHistory/' + (value === 0 ? 'zero' : 'one'));

    // Usamos `push` para crear un nuevo nodo único en Firebase
    push(historyRef, {
        value: value,
        date: day,
        time: time
    });
}

// Función para obtener la fecha y la hora actual en formato "dd/mm/yyyy" y "hh:mm:ss AM/PM"
function getFormattedDate() {
    const now = new Date();
    const day = now.toLocaleDateString();  // Día en formato "dd/mm/yyyy"
    const time = now.toLocaleTimeString(); // Hora en formato "hh:mm:ss AM/PM"
    return { day, time };
}

// Función para inicializar el temporizador
function initTimerButton() {
    const timerButton = document.getElementById('startTimerButton');
    timerButton.addEventListener('click', startTimerForLed);
}

// Inicializar el botón cuando la página se cargue
window.onload = initTimerButton;
