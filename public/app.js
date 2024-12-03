// app.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getDatabase, ref, set, push, get, remove } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

// Configura Firebase
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

let value = 0;

function getFormattedDate() {
    const now = new Date();
    const day = now.toLocaleDateString();
    const time = now.toLocaleTimeString();
    return { day, time };
}

function displayHistory() {
    const zeroRef = ref(database, 'buttonHistory/zero');
    const oneRef = ref(database, 'buttonHistory/one');

    // Obtener y mostrar el historial para el valor 0
    get(zeroRef).then(snapshot => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            let zeroHistory = '';
            const sortedZeroData = Object.entries(data).reverse();
            sortedZeroData.forEach(([key, value]) => {
                zeroHistory += `<p> Fecha: ${value.date}, Hora: ${value.time}</p>`;
            });
            document.getElementById('zeroHistory').innerHTML = zeroHistory;
        } else {
            document.getElementById('zeroHistory').innerHTML = '<p>No hay historial para el valor 0.</p>';
        }
    });

    // Obtener y mostrar el historial para el valor 1
    get(oneRef).then(snapshot => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            let oneHistory = '';
            const sortedOneData = Object.entries(data).reverse();
            sortedOneData.forEach(([key, value]) => {
                oneHistory += `<p> Fecha: ${value.date}, Hora: ${value.time}</p>`;
            });
            document.getElementById('oneHistory').innerHTML = oneHistory;
        } else {
            document.getElementById('oneHistory').innerHTML = '<p>No hay historial para el valor 1.</p>';
        }
    });
}

function limitRecords(historyRef) {
    const recordsRef = ref(database, historyRef);
    get(recordsRef).then(snapshot => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            const records = Object.entries(data);
            if (records.length >= 10) {
                const oldestKey = records[0][0];
                const oldestRef = ref(database, `${historyRef}/${oldestKey}`);
                remove(oldestRef).then(() => {
                    console.log('Registro más antiguo eliminado');
                }).catch(error => {
                    console.error('Error al eliminar el registro más antiguo:', error);
                });
            }
        }
    }).catch(error => {
        console.error('Error al obtener los registros:', error);
    });
}

function saveHistory(value) {
    const { day, time } = getFormattedDate();
    const historyRef = ref(database, 'buttonHistory/' + (value === 0 ? 'zero' : 'one'));
    limitRecords('buttonHistory/' + (value === 0 ? 'zero' : 'one'));
    push(historyRef, { value, date: day, time: time });
}

function updateButtonBasedOnLedStatus() {
    const ledStatusRef = ref(database, 'ledStatus');
    const toggleButton = document.getElementById('toggleButton');
    const statusText = document.getElementById('statusText');
    
    get(ledStatusRef).then(snapshot => {
        if (snapshot.exists()) {
            const ledStatus = snapshot.val();
            toggleButton.textContent = ledStatus === 1 ? 'Apagar' : 'Encender';
            statusText.textContent = ledStatus === 1 ? 'El LED está Prendido' : 'El LED está Apagado';
        }
    }).catch(error => {
        console.error('Error al obtener el estado del LED:', error);
    });
}

const toggleButton = document.getElementById('toggleButton');
const deleteButton = document.getElementById('deleteButton');

toggleButton.addEventListener('click', () => {
    value = (value === 0) ? 1 : 0;
    const buttonRef = ref(database, 'ledStatus');
    set(buttonRef, value);
    saveHistory(value);
    toggleButton.textContent = value === 0 ? 'Encender' : 'Apagar';
    displayHistory();
});

deleteButton.addEventListener('click', () => {
    const zeroRef = ref(database, 'buttonHistory/zero');
    const oneRef = ref(database, 'buttonHistory/one');
    remove(zeroRef).then(() => {
        console.log('Historial de valores 0 eliminado');
    }).catch(error => {
        console.error('Error al eliminar el historial de valores 0:', error);
    });
    remove(oneRef).then(() => {
        console.log('Historial de valores 1 eliminado');
    }).catch(error => {
        console.error('Error al eliminar el historial de valores 1:', error);
    });
});

window.onload = function() {
    displayMessages();
    displayHistory();
    updateButtonBasedOnLedStatus();
};
