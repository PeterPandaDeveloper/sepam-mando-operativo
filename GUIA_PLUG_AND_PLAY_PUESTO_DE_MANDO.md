# 🚑 MANUAL TÁCTICO PLUG & PLAY - PUESTO DE MANDO UNIFICADO (PMU)
### Sistema SEPAM Ecuador • Eventos Masivos y Conciertos

---

## 🎯 OBJETIVO: CERO PROGRAMACIÓN Y CERO CONFIGURACIÓN
Este sistema fue diseñado para que **Don Pedro** y el equipo de mando central puedan encender la laptop en cualquier estadio, explanada o coliseo y tener el sistema médico funcionando en menos de **60 segundos** sin escribir comandos ni configurar direcciones IP.

---

## ⚡ PASO 1: ARRANCAR EL SISTEMA (1 SOLO CLIC)

En la carpeta principal del sistema en la laptop, tienes 2 opciones (ambas hacen lo mismo):

1. **Opción Recomendada:** Haz doble clic en el archivo ejecutable:
   ```
   SEPAM_PUESTO_DE_MANDO.exe
   ```
2. **Opción Alternativa:** O haz doble clic en el archivo por lotes:
   ```
   INICIAR_SISTEMA_SEPAM.bat
   ```

*El sistema encenderá el motor de base de datos de campo (DuckDB + SQLite WAL) y abrirá automáticamente la pantalla en Google Chrome o Microsoft Edge.*

---

## 🌐 PASO 2: ELEGIR EL MODO DE RED EN EL ESTADIO

El sistema detecta automáticamente qué conexión estás usando. Elige la que más te convenga:

### 📱 Opción A: Zona Móvil Hotspot (CERO CABLES - La más rápida)
* **¿Cuándo usarla?** Si no llevaste el router o si quieres instalar el puesto de mando en 10 segundos.
* **¿Cómo se activa?**
  1. En la esquina inferior derecha de Windows 11 (junto al reloj y la batería), haz clic en el icono de red.
  2. Haz clic en el botón **"Zona con cobertura móvil"** (Mobile Hotspot) para encenderlo.
* **Resultado:**
  * La laptop emite su propia red Wi-Fi.
  * Los brigadistas se conectan a ese Wi-Fi.
  * Si la laptop tiene internet por datos o Wi-Fi del estadio, los brigadistas tendrán **WhatsApp, llamadas y fotos funcionando normalmente** a través del Wi-Fi de la laptop.

---

### 🔌 Opción B: Router TP-Link por Cable Ethernet (MÁXIMO ALCANCE: 100 Metros)
* **¿Cuándo usarla?** En estadios grandes donde necesitas que la señal del router cubra gradas, cancha y accesos lejanos.
* **¿Cómo se conecta?**
  1. Enchufa el router TP-Link a la corriente eléctrica.
  2. Conecta el cable de red amarillo desde el puerto de red de la laptop hacia el **puerto azul (WAN/Internet)** del router TP-Link.
* **Resultado:**
  * El router TP-Link crea una red inalámbrica gigante.
  * El sistema de la laptop detecta el cable en 1 segundo y actualiza la dirección IP automáticamente.

---

## 📲 PASO 3: CÓMO SE CONECTAN LOS BRIGADISTAS (CÓDIGO QR)

**¡Ya nadie tiene que escribir números de IP complicados en el celular!**

1. En la pantalla de la laptop, en la barra superior verde, haz clic en el botón:
   ```
   🛰️ Red & QR
   ```
   *(También disponible en la pestaña "Conectividad & QR" del Panel de Super Usuario).*

2. Se abrirá una ventana táctica con un **Código QR Gigante y Nítido**.

3. Diles a los brigadistas y paramédicos:
   > *"Abran la cámara normal de su celular y apunten a la pantalla de mi laptop."*

4. En sus teléfonos aparecerá un aviso amarillo; al tocarlo, **se abrirá la aplicación móvil de SEPAM de inmediato**.

5. Si algún brigadista está lejos y no alcanza a conectarse al Wi-Fi, cambia a la pestaña:
   ```
   [☁️ Nube Oracle (Datos 4G)]
   ```
   Ese código QR le permite ingresar usando sus propios datos celulares de Claro, Movistar, CNT o Tuenti.

---

## 💬 ACLARACIÓN CLAVE: INTERNET Y WHATSAPP SIN INTERRUPCIONES

* **¿Se quedan sin WhatsApp los brigadistas? NO.**
* Al compartir internet desde la laptop hacia el Hotspot o hacia el cable del router TP-Link:
  * La red Wi-Fi les entrega tanto el acceso a la aplicación médica **SEPAM** como salida a internet general.
  * Pueden enviar audios de WhatsApp, recibir llamadas y coordinar con sus familiares sin desconectarse del sistema de emergencias.

---

## 📊 SEMÁFORO DE SERVICIOS EN PANTALLA

En el botón **`🛰️ Red & QR`** verás un punto luminoso:
* 🟢 **Verde Palpitante:** Todo perfecto. Red activa, salida a internet operativa y WhatsApp verificado con baja latencia.
* 🟡 **Ámbar:** Modo Local Autónomo. El sistema médico SEPAM, DuckDB y el registro de ambulancias funcionan al 100%, pero no hay salida a internet exterior (los celulares no tendrán WhatsApp hasta que la laptop reciba internet).
* 🔵 **Azul (Nube Oracle):** Sincronización en vivo con el servidor público `150.136.238.32`.

---

## 📁 RESUMEN DE ARCHIVOS CLAVE EN LA LAPTOP

| Archivo / Carpeta | Función |
| :--- | :--- |
| `SEPAM_PUESTO_DE_MANDO.exe` | **Lanzador principal.** Doble clic y listo. |
| `INICIAR_SISTEMA_SEPAM.bat` | Lanzador alternativo por consola de comandos. |
| `backend/main.py` | Servidor FastAPI + DuckDB 1.5 + SQLite WAL + Gestor de Redes. |
| `backend/network_manager.py` | Motor de auto-detección de Hotspot, Ethernet, Wi-Fi y QRs. |
| `backend/sepam.db` | Base de datos local transaccional segura y portátil. |
| `dist/sepam-mando-operativo/` | Aplicación web compilada y optimizada para producción. |
