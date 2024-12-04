import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getDatabase, ref, set, push, get, remove } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCH68ou5-6yxPrImHZw54iP281e6h3V1AQ",
    authDomain: "esp32robot-165bc.firebaseapp.com",
    databaseURL: "https://esp32robot-165bc-default-rtdb.firebaseio.com",
    projectId: "esp32robot-165bc",
    storageBucket: "esp32robot-165bc.firebasestorage.app",
    messagingSenderId: "745604045901",
    appId: "1:745604045901:web:01408c136e00fcd88ed004",
    measurementId: "G-8135PSM8TY"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Estado inicial del valor del LED (0 o 1)
let ledStatusValue = 0;
let remainingTime = 0;  // Tiempo restante en segundos
let timerInterval = null;  // Intervalo del temporizador

function getFormattedDate() {
    const now = new Date();
    const day = now.toLocaleDateString();  // Día en formato "dd/mm/yyyy"
    const time = now.toLocaleTimeString(); // Hora en formato "hh:mm:ss AM/PM"
    return { day, time };
}

// Actualizar la hora cada segundo
function updateCurrentTime() {
    const currentTime = new Date().toLocaleTimeString(); // Obtener la hora actual
    document.getElementById('currentTime').textContent = `Hora actual: ${currentTime}`;
}

setInterval(updateCurrentTime, 1000); // Actualizar cada segundo

// Función para guardar el historial en Firebase
function saveHistory(value) {
    const { day, time } = getFormattedDate();
    const historyRef = ref(database, 'buttonHistory/' + (value === 0 ? 'zero' : 'one'));

    // Limitar a 10 registros
    limitRecords('buttonHistory/' + (value === 0 ? 'zero' : 'one'));

    // Usamos `push` para crear un nuevo nodo único en Firebase
    push(historyRef, {
        value: value,
        date: day,
        time: time
    });
}

// Función para limitar a 10 los registros en Firebase
function limitRecords(historyRef) {
    // Obtener los últimos 10 registros
    const recordsRef = ref(database, historyRef);
    get(recordsRef).then((snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            const records = Object.entries(data);

            // Si hay más de 10 registros, eliminar el más antiguo
            if (records.length >= 10) {
                const oldestKey = records[0][0]; // Obtener la clave del registro más antiguo
                const oldestRef = ref(database, historyRef + '/' + oldestKey);
                remove(oldestRef).then(() => {
                    console.log('Registro más antiguo eliminado');
                }).catch((error) => {
                    console.error('Error al eliminar el registro más antiguo:', error);
                });
            }
        }
    }).catch((error) => {
        console.error('Error al obtener los registros para limitar:', error);
    });
}

// Función para mostrar el historial en la página, de más reciente a más antiguo
function displayHistory() {
    const zeroRef = ref(database, 'buttonHistory/zero');
    const oneRef = ref(database, 'buttonHistory/one');

    // Mostrar los datos para el valor 0
    get(zeroRef).then((snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            let zeroHistory = '';
            const sortedZeroData = Object.entries(data).reverse();  // Ordenar de más reciente a más antiguo

            for (const [key, value] of sortedZeroData) {
                zeroHistory += `<p> Fecha: ${value.date}, Hora: ${value.time}</p>`;
            }
            document.getElementById('zeroHistory').innerHTML = zeroHistory;
        } else {
            document.getElementById('zeroHistory').innerHTML = '<p>No hay historial para el valor 0.</p>';
        }
    }).catch((error) => {
        console.error('Error al obtener los datos de "zero":', error);
    });

    // Mostrar los datos para el valor 1
    get(oneRef).then((snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            let oneHistory = '';
            const sortedOneData = Object.entries(data).reverse();  // Ordenar de más reciente a más antiguo

            for (const [key, value] of sortedOneData) {
                oneHistory += `<p> Fecha: ${value.date}, Hora: ${value.time}</p>`;
            }
            document.getElementById('oneHistory').innerHTML = oneHistory;
        } else {
            document.getElementById('oneHistory').innerHTML = '<p>No hay historial para el valor 1.</p>';
        }
    }).catch((error) => {
        console.error('Error al obtener los datos de "one":', error);
    });
}

// Función para obtener el estado de 'ledStatus' y actualizar el botón
function updateButtonBasedOnLedStatus() {
    const ledStatusRef = ref(database, 'ledStatus');
    const toggleButton = document.getElementById('toggleButton');

    get(ledStatusRef).then((snapshot) => {
        if (snapshot.exists()) {
            ledStatusValue = snapshot.val();
            toggleButton.textContent = ledStatusValue === 0 ? 'Encender' : 'Apagar';
        } else {
            toggleButton.textContent = 'Encender';
        }
    }).catch((error) => {
        console.error('Error al obtener el estado del LED:', error);
    });
}

// Función para actualizar el tiempo restante
function updateRemainingTime() {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    document.getElementById('timeRemaining').textContent = `Tiempo restante: ${minutes}m ${seconds}s`;

    if (remainingTime <= 0) {
        clearInterval(timerInterval);
        set(ref(database, 'ledStatus'), 0); // Apagar el LED en Firebase
        document.getElementById('statusText').textContent = 'El LED está Apagado';
        saveHistory(0);  // Guardar el historial de apagado
    } else {
        remainingTime--;
    }
}

// Función para controlar el temporizador del LED
function startTimerForLed() {
    const timeInput = document.getElementById('timerInput').value;  // Obtener el tiempo en minutos desde el input
    const ledStatusRef = ref(database, 'ledStatus');
    const statusText = document.getElementById('statusText');
    remainingTime = timeInput * 60;  // Convertir el tiempo a segundos

    if (timeInput && !isNaN(timeInput) && timeInput > 0) {
        // Encender el LED
        set(ledStatusRef, 1);
        statusText.textContent = `El LED está Prendido por ${timeInput} minutos`;

        // Guardar el historial
        saveHistory(1);

        // Iniciar el temporizador
        if (timerInterval) clearInterval(timerInterval); // Limpiar cualquier intervalo previo
        timerInterval = setInterval(updateRemainingTime, 1000);  // Actualizar cada segundo
    } else {
        alert('Por favor, ingresa un valor válido de tiempo (en minutos)');
    }
}

// Event listeners
document.getElementById('toggleButton').addEventListener('click', () => {
    ledStatusValue = (ledStatusValue === 0) ? 1 : 0;
    const buttonRef = ref(database, 'ledStatus');
    set(buttonRef, ledStatusValue);  // Guardar el valor en Firebase
    saveHistory(ledStatusValue);      // Guardar el historial cuando se cambia el valor del LED
    document.getElementById('toggleButton').textContent = ledStatusValue === 0 ? 'Encender' : 'Apagar';
    displayHistory();        // Actualizar el historial mostrado en la página
});

document.getElementById('startTimerButton').addEventListener('click', startTimerForLed);

document.getElementById('deleteButton').addEventListener('click', () => {
    const zeroRef = ref(database, 'buttonHistory/zero');
    const oneRef = ref(database, 'buttonHistory/one');

    remove(zeroRef).then(() => {
        console.log('Historial de valores 0 eliminado');
        document.getElementById('zeroHistory').innerHTML = '<p>No hay historial para el valor 0.</p>';
    }).catch((error) => {
        console.error('Error al eliminar el historial de valores 0:', error);
    });

    remove(oneRef).then(() => {
        console.log('Historial de valores 1 eliminado');
        document.getElementById('oneHistory').innerHTML = '<p>No hay historial para el valor 1.</p>';
    }).catch((error) => {
        console.error('Error al eliminar el historial de valores 1:', error);
    });
});

// Mostrar el historial y el estado del LED al cargar la página
window.onload = function() {
    displayHistory();       // Mostrar el historial de botones
    updateButtonBasedOnLedStatus();  // Actualizar el texto del botón y el estado del LED
};


