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
            const horas = ['Hora_1', 'Hora_2', 'Hora_3', 'Hora_4', 'Hora_5', 'Hora_6'];

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
            document.getElementById(`Hora${i}`).textContent = `Hora ${i}: Error al cargar`;
        }
    });
}


// Función para agregar una nueva hora a la agenda y programar encendido/apagado
function addNewHourAndSchedule(startTime, endTime) {
    const agendaRef = ref(database, 'intervalos'); // Ruta en Firebase para intervalos
    const agendaContainer = document.getElementById('agenda'); // Contenedor de la agenda en HTML

    get(agendaRef).then((snapshot) => {
        let intervalos = {};

        if (snapshot.exists()) {
            intervalos = snapshot.val(); // Obtener los intervalos existentes
        }

        // Agregar el nuevo horario a los intervalos existentes
        const newIntervalos = { ...intervalos, [`hora${Object.keys(intervalos).length + 1}`]: `${startTime} a ${endTime}` };

        // Ordenar los intervalos por la hora de inicio
        const sortedIntervalos = Object.entries(newIntervalos).sort(([, a], [, b]) => {
            const [startA] = a.split(' a ');
            const [startB] = b.split(' a ');
            return startA.localeCompare(startB); // Ordenar alfabéticamente por hora
        });

        // Guardar los intervalos ordenados en Firebase
        const updatedIntervalos = Object.fromEntries(sortedIntervalos);
        set(agendaRef, updatedIntervalos).then(() => {
            console.log('Intervalos actualizados en Firebase.');

            // Actualizar dinámicamente la Agenda Semanal en el HTML
            agendaContainer.innerHTML = ''; // Limpiar la agenda
            sortedIntervalos.forEach(([key, value]) => {
                // Crear el elemento del intervalo
                const intervalElement = document.createElement('div');
                intervalElement.id = key;
                intervalElement.classList.add('interval');

                // Texto del intervalo
                const intervalText = document.createElement('p');
                intervalText.textContent = `${key}: ${value}`;

                // Botón para eliminar el intervalo
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Eliminar';
                deleteButton.addEventListener('click', () => deleteInterval(key));

                // Agregar el texto y el botón al elemento del intervalo
                intervalElement.appendChild(intervalText);
                intervalElement.appendChild(deleteButton);

                // Agregar el elemento del intervalo al contenedor de la agenda
                agendaContainer.appendChild(intervalElement);
            });

            // Programar el control del LED para el nuevo intervalo
            scheduleLedControl(startTime, endTime, key);
        }).catch((error) => {
            console.error('Error al actualizar los intervalos en Firebase:', error);
        });
    }).catch((error) => {
        console.error('Error al obtener la agenda:', error);
    });
}


// Función para programar encendido/apagado y eliminar del HTML al final del intervalo
function scheduleLedControl(startTime, endTime, intervalKey) {
    const ledStatusRef = ref(database, 'ledStatus'); // Ruta en Firebase para estado del LED
    const agendaContainer = document.getElementById('agenda'); // Contenedor de la agenda en HTML

    // Obtener la hora actual en formato HH:mm
    const getCurrentTime = () => {
        const now = new Date();
        return now.toTimeString().slice(0, 5); // Obtener solo HH:mm
    };

    // Monitorear cada minuto para comprobar si coincide con el inicio o fin
    const intervalCheck = setInterval(() => {
        const currentTime = getCurrentTime();

        if (currentTime === startTime) {
            console.log(`Encendiendo LED a las ${currentTime}`);
            set(ledStatusRef, 1)
                .then(() => saveHistory(1)) // Guardar en el historial
                .catch((error) => console.error('Error al encender el LED:', error));
        }

        if (currentTime === endTime) {
            console.log(`Apagando LED a las ${currentTime}`);
            set(ledStatusRef, 0)
                .then(() => saveHistory(0)) // Guardar en el historial
                .catch((error) => console.error('Error al apagar el LED:', error));

            // Eliminar el intervalo de Firebase y del HTML
            const intervalRef = ref(database, `intervalos/${intervalKey}`);
            remove(intervalRef).then(() => {
                console.log(`Intervalo ${intervalKey} eliminado de Firebase.`);
            }).catch((error) => {
                console.error('Error al eliminar el intervalo de Firebase:', error);
            });

            // Eliminar el intervalo del HTML
            const intervalElement = document.getElementById(intervalKey);
            if (intervalElement) {
                agendaContainer.removeChild(intervalElement);
            }

            // Detener el intervalo de monitoreo
            clearInterval(intervalCheck);
        }
    }, 60000); // Verificar cada minuto
}

// Evento para agregar una nueva hora
document.getElementById('addHourButton').addEventListener('click', () => {
    const startHourInput = document.getElementById('startHour').value;
    const endHourInput = document.getElementById('endHour').value;

    if (startHourInput && endHourInput) {
        addNewHourAndSchedule(startHourInput, endHourInput); // Llama a la función para agregar y programar
    } else {
        alert('Por favor, ingresa una hora de inicio y fin válidas.');
    }
});

// Función para eliminar un intervalo por su clave
function deleteInterval(intervalKey) {
    const intervalRef = ref(database, `intervalos/${intervalKey}`); // Ruta al intervalo en Firebase
    const agendaContainer = document.getElementById('agenda'); // Contenedor de la agenda en HTML

    // Eliminar el intervalo de Firebase
    remove(intervalRef)
        .then(() => {
            console.log(`Intervalo ${intervalKey} eliminado de Firebase.`);

            // Eliminar el intervalo del HTML
            const intervalElement = document.getElementById(intervalKey);
            if (intervalElement) {
                agendaContainer.removeChild(intervalElement);
            }
        })
        .catch((error) => {
            console.error('Error al eliminar el intervalo de Firebase:', error);
        });
}



// Función para cargar y mostrar los intervalos existentes al cargar la página
function loadAndDisplayIntervals() {
    const agendaRef = ref(database, 'intervalos'); // Ruta en Firebase para los intervalos
    const agendaContainer = document.getElementById('agenda'); // Contenedor de la agenda en HTML

    get(agendaRef).then((snapshot) => {
        if (snapshot.exists()) {
            const intervalos = snapshot.val(); // Obtener los intervalos existentes

            // Limpiar la agenda antes de renderizar
            agendaContainer.innerHTML = '';

            // Renderizar cada intervalo
            Object.entries(intervalos).forEach(([key, value]) => {
                // Crear el elemento del intervalo
                const intervalElement = document.createElement('div');
                intervalElement.id = key;
                intervalElement.classList.add('interval');

                // Texto del intervalo
                const intervalText = document.createElement('p');
                intervalText.textContent = `${key}: ${value}`;

                // Botón para eliminar el intervalo
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Eliminar';
                deleteButton.addEventListener('click', () => deleteInterval(key));

                // Botón para editar el intervalo
                const editButton = document.createElement('button');
                editButton.textContent = 'Editar';
                editButton.addEventListener('click', () => enableEditInterval(key, value));

                // Agregar el texto y los botones al elemento del intervalo
                intervalElement.appendChild(intervalText);
                intervalElement.appendChild(editButton); // Agregar el botón de editar
                intervalElement.appendChild(deleteButton);

                // Agregar el elemento del intervalo al contenedor de la agenda
                agendaContainer.appendChild(intervalElement);
            });
        } else {
            agendaContainer.innerHTML = '<p>No hay horarios programados.</p>';
        }
    }).catch((error) => {
        console.error('Error al cargar los intervalos desde Firebase:', error);
    });
}



// Función para habilitar la edición de un horario
function enableEditInterval(intervalKey, currentInterval) {
    const agendaRef = ref(database, `intervalos/${intervalKey}`); // Ruta en Firebase para el intervalo
    const intervalElement = document.getElementById(intervalKey); // Elemento del intervalo en el HTML

    // Dividir el intervalo actual en hora de inicio y fin
    const [currentStartTime, currentEndTime] = currentInterval.split(' a ');

    // Limpiar el contenido actual del intervalo
    intervalElement.innerHTML = '';

    // Crear campos de texto para la edición
    const startInput = document.createElement('input');
    startInput.type = 'time';
    startInput.value = currentStartTime;

    const endInput = document.createElement('input');
    endInput.type = 'time';
    endInput.value = currentEndTime;

    // Crear botón para guardar los cambios
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Guardar';
    saveButton.addEventListener('click', () => {
        const newStartTime = startInput.value;
        const newEndTime = endInput.value;

        // Validar que las horas sean correctas
        if (newStartTime && newEndTime && newStartTime < newEndTime) {
            // Actualizar el intervalo en Firebase
            set(agendaRef, `${newStartTime} a ${newEndTime}`)
                .then(() => {
                    console.log(`Intervalo ${intervalKey} actualizado a ${newStartTime} a ${newEndTime}`);
                    loadAndDisplayIntervals(); // Recargar la lista de intervalos en la UI
                })
                .catch((error) => {
                    console.error('Error al actualizar el intervalo:', error);
                });
        } else {
            alert('Horas inválidas o incompletas. Por favor, intente nuevamente.');
        }
    });

    // Crear botón para cancelar la edición
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancelar';
    cancelButton.addEventListener('click', () => {
        loadAndDisplayIntervals(); // Recargar la lista de intervalos en la UI sin guardar cambios
    });

    // Agregar los campos y botones al elemento del intervalo
    intervalElement.appendChild(startInput);
    intervalElement.appendChild(document.createTextNode(' a '));
    intervalElement.appendChild(endInput);
    intervalElement.appendChild(saveButton);
    intervalElement.appendChild(cancelButton);
}

function checkAndUpdateLedStatus() {
    const agendaRef = ref(database, 'intervalos'); // Ruta en Firebase para los intervalos
    const ledStatusRef = ref(database, 'ledStatus'); // Ruta en Firebase para el estado del LED
    const cancelButtonContainer = document.getElementById('cancelButtonContainer'); // Contenedor del botón de cancelar

    let lastSentStatus = null; // Para evitar enviar repetidamente el mismo estado
    let manuallyStopped = false; // Bandera para saber si el usuario apagó el LED manualmente

    // Obtener la hora actual en formato HH:mm
    const getCurrentTime = () => {
        const now = new Date();
        return now.toTimeString().slice(0, 5); // Obtener solo HH:mm
    };

    // Monitorear cada segundo
    setInterval(() => {
        const currentTime = getCurrentTime();

        get(agendaRef).then((snapshot) => {
            if (snapshot.exists()) {
                const intervalos = snapshot.val(); // Obtener los intervalos existentes

                let ledShouldBeOn = false; // Bandera para saber si el LED debe estar encendido por horario
                let shouldSendZero = false; // Bandera para enviar 0 solo al final del intervalo

                // Recorrer cada intervalo para verificar el inicio o fin
                Object.values(intervalos).forEach((interval) => {
                    const [startTime, endTime] = interval.split(' a '); // Separar inicio y fin

                    if (currentTime >= startTime && currentTime < endTime) {
                        ledShouldBeOn = true; // Dentro del intervalo: Mantener encendido
                        cancelButtonContainer.style.display = 'block'; // Mostrar el botón
                    }
                    if (currentTime === endTime) {
                        shouldSendZero = true; // Hora de fin: Enviar 0
                    }
                });

                // Verificar el estado actual del LED
                get(ledStatusRef).then((ledSnapshot) => {
                    const currentLedStatus = ledSnapshot.exists() ? ledSnapshot.val() : 0;

                    if (ledShouldBeOn && !manuallyStopped && currentLedStatus === 0 && lastSentStatus !== 1) {
                        // Encender el LED solo una vez al inicio del intervalo
                        set(ledStatusRef, 1)
                            .then(() => {
                                console.log('LED encendido automáticamente dentro del horario.');
                                lastSentStatus = 1; // Actualizar el último estado enviado
                                manuallyStopped = false; // Reiniciar bandera de apagado manual
                            })
                            .catch((error) => console.error('Error al encender el LED automáticamente:', error));
                    } else if (shouldSendZero && currentLedStatus === 1 && lastSentStatus !== 0) {
                        // Apagar el LED solo una vez al final del intervalo
                        set(ledStatusRef, 0)
                            .then(() => {
                                console.log('LED apagado automáticamente al final del horario.');
                                lastSentStatus = 0; // Actualizar el último estado enviado
                                cancelButtonContainer.style.display = 'none'; // Ocultar el botón
                            })
                            .catch((error) => console.error('Error al apagar el LED automáticamente:', error));
                    }

                    if (!ledShouldBeOn && !shouldSendZero) {
                        cancelButtonContainer.style.display = 'none'; // Ocultar el botón si no hay intervalos activos
                    }
                }).catch((error) => {
                    console.error('Error al obtener el estado actual del LED:', error);
                });
            } else {
                console.log('No hay intervalos configurados.');
                cancelButtonContainer.style.display = 'none'; // Ocultar el botón si no hay intervalos configurados
            }
        }).catch((error) => {
            console.error('Error al verificar los intervalos:', error);
        });
    }, 1000); // Verificar cada segundo

    // Monitorear el evento de clic en el botón de "Parar Tiempo Automático"
    const cancelButton = document.getElementById('cancelAutomaticButton');
    cancelButton.addEventListener('click', () => {
        console.log('Parar Tiempo Automático: Desactivando el inicio automático.');
        
        // Apagar el LED manualmente y desactivar automático para este intervalo
        set(ledStatusRef, 0)
            .then(() => {
                console.log('LED apagado manualmente. No se encenderá automáticamente hasta el próximo intervalo.');
                manuallyStopped = true; // Activar bandera de apagado manual
                cancelButtonContainer.style.display = 'none'; // Ocultar el botón
            })
            .catch((error) => {
                console.error('Error al apagar manualmente el LED:', error);
            });
    });
}



// Función para manejar el botón de "Parar Tiempo Automático"
function stopAutomaticTime() {
    const cancelButtonContainer = document.getElementById('cancelButtonContainer'); // Contenedor del botón
    const cancelButton = document.getElementById('cancelAutomaticButton'); // Botón de cancelar

    // Monitorear el evento de clic en el botón
    cancelButton.addEventListener('click', () => {
        console.log('Parar Tiempo Automático: Desactivando el inicio automático.');
        
        // Actualizar el estado en Firebase a 0 para indicar apagado manual
        set(ref(database, 'ledStatus'), 0)
            .then(() => {
                console.log('LED apagado manualmente. No se encenderá automáticamente hasta el próximo intervalo.');
                cancelButtonContainer.style.display = 'none'; // Ocultar el botón
            })
            .catch((error) => {
                console.error('Error al apagar manualmente el LED:', error);
            });
    });
}





// Llamar a la función loadNextOnOff al cargar la página
window.onload = function() {
    loadAndDisplayIntervals(); // Cargar y mostrar los intervalos existentes
    loadNextOnOff();  // Cargar los próximos eventos de encendido y apagado
    loadTimerState();  // Cargar el estado del temporizador desde Firebase
    displayHistory();   // Mostrar el historial de botones
    updateButtonBasedOnLedStatus();  // Actualizar el texto del botón y el estado del LED
    checkAndUpdateLedStatus(); // Verificar y actualizar automáticamente el estado del LED
    toggleLedManually()
    stopAutomaticTime()
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


