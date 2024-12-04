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
    const ledStatusRef = ref(database, 'ledStatus');  // Verifica que esta ruta es la correcta
    const toggleButton = document.getElementById('toggleButton');
    const statusText = document.getElementById('statusText');

    get(ledStatusRef).then((snapshot) => {
        if (snapshot.exists()) {
            ledStatusValue = snapshot.val();  // Obtener el valor de 'ledStatus'
            
            if (ledStatusValue === 1) {
                // Si el LED está encendido
                toggleButton.textContent = 'Apagar';  // Cambiar texto del botón
                statusText.textContent = 'El LED está Prendido';  // Actualizar el texto del estado
            } else {
                // Si el LED está apagado
                toggleButton.textContent = 'Encender';  // Cambiar texto del botón
                statusText.textContent = 'El LED está Apagado';  // Actualizar el texto del estado
            }
        } else {
            // Si no existe el valor 'ledStatus' en Firebase, lo tratamos como apagado
            toggleButton.textContent = 'Encender';
            statusText.textContent = 'El LED está Apagado';
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




















// Event listeners
document.getElementById('toggleButton').addEventListener('click', () => {
    // Cambiar el valor del LED (0 o 1)
    ledStatusValue = (ledStatusValue === 0) ? 1 : 0;
    const buttonRef = ref(database, 'ledStatus');
    
    // Guardar el valor del LED en Firebase
    set(buttonRef, ledStatusValue);  
    
    // Guardar el historial cuando se cambia el valor del LED
    saveHistory(ledStatusValue);      
    
    // Actualizar el texto del botón según el nuevo estado del LED
    document.getElementById('toggleButton').textContent = ledStatusValue === 0 ? 'Encender' : 'Apagar';

    // Actualizar el historial mostrado en la página
    displayHistory();

    // Actualizar el estado del botón en la interfaz
    updateButtonBasedOnLedStatus(); 
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
// Función para controlar el temporizador del LED
// Variable para controlar el estado del temporizador
let isTimerRunning = false;
let isTimerPaused = false;  // Variable para controlar si el temporizador está pausado

// Función para controlar el temporizador del LED
function startTimerForLed() {
    const timeInput = document.getElementById('timerInput').value;  // Obtener el tiempo en minutos desde el input
    const ledStatusRef = ref(database, 'ledStatus');
    const statusText = document.getElementById('statusText');
    const timerButton = document.getElementById('startTimerButton');

    if (timeInput && !isNaN(timeInput) && timeInput > 0) {
        if (!isTimerRunning) {
            // Si el temporizador no está corriendo, iniciar el temporizador

            // Encender el LED
            set(ledStatusRef, 1); 
            statusText.textContent = `El LED está Prendido por ${timeInput} minutos`;

            // Guardar el historial de encendido
            saveHistory(1);

            // Convertir el tiempo en minutos a segundos
            remainingTime = timeInput * 60;

            // Iniciar el temporizador
            if (timerInterval) clearInterval(timerInterval);  // Limpiar cualquier intervalo previo
            timerInterval = setInterval(updateRemainingTime, 1000);  // Actualizar cada segundo

            // Cambiar el texto del botón a "Detener"
            timerButton.textContent = 'Detener Temporizador';

            // Marcar que el temporizador está en ejecución
            isTimerRunning = true;
            isTimerPaused = false;  // El temporizador no está pausado
        } else {
            // Si el temporizador ya está corriendo, detenerlo

            // Apagar el LED en Firebase
            set(ledStatusRef, 0);
            statusText.textContent = 'El LED está Apagado';

            // Guardar el historial de apagado
            saveHistory(0);

            // Detener el temporizador y reiniciar el valor de remainingTime
            clearInterval(timerInterval);

            // Reiniciar el valor de remainingTime a 0
            remainingTime = 0;

            // Cambiar el texto del botón a "Iniciar"
            timerButton.textContent = 'Iniciar Temporizador';

            // Marcar que el temporizador no está en ejecución
            isTimerRunning = false;
        }
    } else {
        alert('Por favor, ingresa un valor válido de tiempo (en minutos)');
    }
}

// Función para pausar o reanudar el temporizador
function togglePauseResume() {
    const ledStatusRef = ref(database, 'ledStatus');
    const statusText = document.getElementById('statusText');
    const pauseResumeButton = document.getElementById('pauseResumeButton');

    if (isTimerRunning && !isTimerPaused) {
        // Pausar el temporizador
        clearInterval(timerInterval);  // Detener el intervalo
        set(ledStatusRef, 0);  // Apagar el LED en Firebase
        statusText.textContent = 'El LED está Apagado (Pausado)';  // Indicar que está pausado
        pauseResumeButton.textContent = 'Reanudar';  // Cambiar el texto del botón a "Reanudar"
        isTimerPaused = true;  // Marcar como pausado
    } else if (isTimerRunning && isTimerPaused) {
        // Reanudar el temporizador
        set(ledStatusRef, 1);  // Encender el LED en Firebase
        statusText.textContent = 'El LED está Prendido (Reanudado)';  // Indicar que está reanudado

        // Reanudar el temporizador
        timerInterval = setInterval(updateRemainingTime, 1000);  // Volver a actualizar cada segundo
        pauseResumeButton.textContent = 'Pausar';  // Cambiar el texto del botón a "Pausar"
        isTimerPaused = false;  // Marcar como no pausado
    }
}

// Asignar el evento click al botón
document.getElementById('pauseResumeButton').addEventListener('click', togglePauseResume);


// Función para actualizar el tiempo restante


// Función para cargar los mensajes de Firebase y mostrar los valores
// Función para cargar los mensajes de Firebase y mostrar los valores
// Función para cargar los mensajes de Firebase y mostrar los valores
function loadNextOnOff() {
    const messagesRef = ref(database, 'messages');  // Ruta en Firebase donde se encuentran los mensajes

    get(messagesRef).then((snapshot) => {
        if (snapshot.exists()) {
            const messages = snapshot.val();  // Obtener los datos de 'messages'

            // Verificar si los mensajes existen y actualizar los elementos
            const apagado = messages.proximo_apagado || 'No disponible';
            const encendido = messages.proximo_encendido || 'No disponible';

            document.getElementById('proximoApagado').textContent = `Próximo Apagado: ${apagado}`;
            document.getElementById('proximoEncendido').textContent = `Próximo Encendido: ${encendido}`;
        } else {
            console.error("No hay datos en 'messages'");
            document.getElementById('proximoApagado').textContent = 'No disponible';
            document.getElementById('proximoEncendido').textContent = 'No disponible';
        }
    }).catch((error) => {
        console.error("Error al obtener los mensajes:", error);
        document.getElementById('proximoApagado').textContent = 'Error al cargar mensaje';
        document.getElementById('proximoEncendido').textContent = 'Error al cargar mensaje';
    });
}

function loadIntervalos() {
    const intervalosRef = ref(database, 'intervalos');  // Ruta en Firebase donde están los intervalos

    get(intervalosRef).then((snapshot) => {
        if (snapshot.exists()) {
            const intervalos = snapshot.val();  // Obtener los datos de 'intervalos'
            
            // Asignar los valores directamente a cada elemento
            const horas = ['hora1', 'hora2', 'hora3', 'hora4', 'hora5', 'hora6'];

            // Iteramos sobre las horas predefinidas
            horas.forEach((hora, index) => {
                const horaKey = `hora${index + 1}`;
                if (intervalos[horaKey]) {
                    document.getElementById(horaKey).textContent = `${horaKey}: ${intervalos[horaKey]}`;
                } else {
                    document.getElementById(horaKey).textContent = `${horaKey}: No disponible`;
                }
            });
        } else {
            console.error("No hay datos en 'intervalos'");
            // Si no hay datos, establecer 'No disponible' en todas las horas
            for (let i = 1; i <= 6; i++) {
                document.getElementById(`hora${i}`).textContent = `Hora ${i}: No disponible`;
            }
        }
    }).catch((error) => {
        console.error("Error al obtener los intervalos:", error);
        // Manejo de error, establecer 'Error al cargar' en las horas
        for (let i = 1; i <= 6; i++) {
            document.getElementById(`hora${i}`).textContent = `Hora ${i}: Error al cargar`;
        }
    });
}


// Llamar a la función loadNextOnOff al cargar la página
window.onload = function() {
    loadNextOnOff();  // Cargar los próximos eventos de encendido y apagado
    loadTimerState();  // Cargar el estado del temporizador desde Firebase
    displayHistory();   // Mostrar el historial de botones
    updateButtonBasedOnLedStatus();  // Actualizar el texto del botón y el estado del LED
    loadIntervalos()
};



// Función para cargar el estado del temporizador desde Firebase
function loadTimerState() {
    const ledStatusRef = ref(database, 'ledStatus');  // Ruta en Firebase donde está almacenado el estado del LED
    const statusText = document.getElementById('statusText');  // Elemento donde se muestra el estado del LED

    get(ledStatusRef).then((snapshot) => {
        if (snapshot.exists()) {
            const ledStatusValue = snapshot.val();  // Obtener el valor de 'ledStatus'
            
            if (ledStatusValue === 1) {
                // Si el LED está encendido
                statusText.textContent = 'El LED está Prendido';
            } else {
                // Si el LED está apagado
                statusText.textContent = 'El LED está Apagado';
            }
        } else {
            // Si no existe el valor 'ledStatus' en Firebase
            statusText.textContent = 'El LED está Apagado';
        }
    }).catch((error) => {
        console.error('Error al cargar el estado del LED:', error);
        statusText.textContent = 'Error al cargar el estado del LED';
    });
}


