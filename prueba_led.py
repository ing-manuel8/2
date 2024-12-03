import network
import time
import urequests as urequests
from machine import Pin

# Configuración WiFi
SSID = 'UNIFI-ITSA'
PASSWORD = ''  # Si tienes contraseña

# Conexión WiFi
def connect_wifi(SSID, PASSWORD):
    wlan = network.WLAN(network.STA_IF)
    wlan.active(False)
    wlan.active(True)
    wlan.connect(SSID, PASSWORD)
    while not wlan.isconnected():
        print("Esperando conexión WiFi...")
        time.sleep(1)
    print('WiFi conectado:', wlan.ifconfig())

# Conectar a WiFi
connect_wifi(SSID, PASSWORD)

# URL de Firebase (reemplaza con tu URL real)
FIREBASE_URL = 'https://esp32robot-165bc-default-rtdb.firebaseio.com/'
AUTH = 'ftfOcG1nY6ZujnnxgvwFv7Y0TRprB4BffQcceUbL'  # Si no tienes auth, deja este string vacío

# Inicializar LED
led = Pin(2, Pin.OUT)
led.value(0)  # Asegurar que el LED inicie apagado

# Variables globales
override_led = False  # Indica si el control manual tiene prioridad
manual_led_state = 0  # Estado manual del LED (0: apagado, 1: encendido)
ultimo_estado_led = None  # Último estado enviado a Firebase

# Lista de intervalos de encendido
intervalos = [
    (7, 0, 7, 3),
    (9, 18, 9, 19),
    (11, 0, 11, 3),
    (13, 0, 13, 5),
    (15, 0, 15, 5),
    (17, 0, 17, 7),
]

# Función para obtener la hora actual desde el sistema
def obtener_hora_actual():
    tm = time.localtime()
    return tm[3], tm[4]

# Función para determinar si el LED debe estar encendido según horarios
def led_encendido(hora, minuto):
    for inicio_h, inicio_m, fin_h, fin_m in intervalos:
        if (hora > inicio_h or (hora == inicio_h and minuto >= inicio_m)) and \
           (hora < fin_h or (hora == fin_h and minuto <= fin_m)):
            return True
    return False
# Función para calcular la próxima hora de encendido y apagado
def proximo_horario(hora, minuto):
    proximo_encendido = None
    proximo_apagado = None
    for inicio_h, inicio_m, fin_h, fin_m in intervalos:
        # Encontrar el próximo encendido
        if (hora < inicio_h or (hora == inicio_h and minuto < inicio_m)) and not proximo_encendido:
            proximo_encendido = (inicio_h, inicio_m)
        # Encontrar el próximo apagado
        if (hora < fin_h or (hora == fin_h and minuto < fin_m)) and not proximo_apagado:
            proximo_apagado = (fin_h, fin_m)

    # Si no se encuentra un próximo horario, tomar el primer intervalo del siguiente día
    if not proximo_encendido:
        proximo_encendido = (intervalos[0][0], intervalos[0][1])
    if not proximo_apagado:
        proximo_apagado = (intervalos[0][2], intervalos[0][3])

    return proximo_encendido, proximo_apagado


# Función para leer el estado del LED desde Firebase
def leer_led_estado():
    global override_led, manual_led_state
    try:
        response = urequests.get(f'{FIREBASE_URL}/ledStatus.json?auth={AUTH}')
        if response.status_code == 200:
            led_state = response.json()
            print("Estado recibido de Firebase:", led_state)
            if led_state == 1:
                override_led = True
                manual_led_state = 1
            elif led_state == 0:
                override_led = True
                manual_led_state = 0
        else:
            print("Error al obtener el estado del LED:", response.status_code)
        response.close()  # Liberar memoria
    except Exception as e:
        print("Error al leer de Firebase:", str(e))

# Función para enviar el estado del LED a Firebase
def enviar_estado_firebase(valor):
    try:
        response = urequests.put(f'{FIREBASE_URL}/ledStatus.json?auth={AUTH}', json=valor)
        if response.status_code == 200:
            print(f"Estado enviado a Firebase: {valor}")
        else:
            print(f"Error al enviar estado a Firebase: {response.status_code}")
        response.close()  # Liberar memoria
    except Exception as e:
        print("Error al enviar estado a Firebase:", str(e))
# Función para enviar un mensaje personalizado a Firebase
def enviar_mensaje_firebase(clave, valor):
    try:
        data = {clave: valor}
        response = urequests.patch(f'{FIREBASE_URL}/messages.json?auth={AUTH}', json=data)
        if response.status_code == 200:
            print(f"Mensaje enviado a Firebase: {clave} -> {valor}")
        else:
            print(f"Error al enviar mensaje a Firebase: {response.status_code}")
        response.close()  # Liberar memoria
    except Exception as e:
        print("Error al enviar mensaje a Firebase:", str(e))
# Bucle principal para manejar el control del LED
try:
    while True:
        # Obtener la hora actual
        hora, minuto = obtener_hora_actual()
        print(f"Hora actual: {hora:02}:{minuto:02}")

        # Calcular próxima hora de encendido y apagado
        proximo_encendido, proximo_apagado = proximo_horario(hora, minuto)
        print(f"Próximo encendido: {proximo_encendido[0]:02}:{proximo_encendido[1]:02}")
        print(f"Próximo apagado: {proximo_apagado[0]:02}:{proximo_apagado[1]:02}")

        # Enviar las próximas horas de encendido y apagado a Firebase
        enviar_mensaje_firebase("proximo_encendido", f"{proximo_encendido[0]:02}:{proximo_encendido[1]:02}")
        enviar_mensaje_firebase("proximo_apagado", f"{proximo_apagado[0]:02}:{proximo_apagado[1]:02}")

        # Leer estado desde Firebase
        leer_led_estado()

        # Verificar si es hora exacta de apagado
        if (hora, minuto) == proximo_apagado:
            print(f"Apagando LED exactamente a {proximo_apagado[0]:02}:{proximo_apagado[1]:02}")
            if ultimo_estado_led != 0:
                led.value(0)  # Apagar el LED
                enviar_estado_firebase(0)  # Enviar estado apagado a Firebase
                ultimo_estado_led = 0
            continue  # Saltar al siguiente ciclo para evitar conflictos

        # Determinar si está en horario de encendido
        estado_automatico = 1 if led_encendido(hora, minuto) else 0

        # Enviar valor a Firebase solo al inicio del horario
        if estado_automatico != ultimo_estado_led:
            enviar_estado_firebase(estado_automatico)
            ultimo_estado_led = estado_automatico

        # Controlar el LED
        if override_led:
            led.value(manual_led_state)
            print(f"LED {'encendido' if manual_led_state == 1 else 'apagado'} (control manual)")
        else:
            led.value(estado_automatico)
            print(f"LED {'encendido' if estado_automatico == 1 else 'apagado'} (control automático)")

        time.sleep(1)  # Actualizar más rápidamente
except KeyboardInterrupt:
    print("Programa terminado.")

