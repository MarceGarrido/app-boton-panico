// =============================================
//  BOTÓN DE PÁNICO - Lógica Principal (app.js)
//  Aplicación PWA de emergencia para comerciantes
//  y adultos mayores.
// =============================================

// -----------------------------------------
//  CLAVES DE ALMACENAMIENTO PARA TELEGRAM
//  Las credenciales se configuran desde la
//  pantalla de ajustes y se guardan en
//  localStorage (nunca en el código fuente).
// -----------------------------------------
const CLAVE_BOT_TOKEN = 'telegramBotToken';
const CLAVE_CHAT_ID   = 'telegramChatId';

// -----------------------------------------
//  CONSTANTES DE LA APLICACIÓN
// -----------------------------------------
const CLAVE_NOMBRE          = 'nombreUsuario';
const CLAVE_DIRECCION       = 'direccionRegistrada';
const CLAVE_TELEFONO        = 'telefonoContacto';
const CLAVE_SMS_EMERGENCIA  = 'smsEmergencia';
const DURACION_FEEDBACK = 5000; // 5 segundos para el mensaje de feedback
const TIMEOUT_GPS = 15000;      // 15 segundos de timeout para GPS

// -----------------------------------------
//  REFERENCIAS AL DOM
// -----------------------------------------
const pantallaRegistro  = document.getElementById('pantalla-registro');
const pantallaPrincipal = document.getElementById('pantalla-principal');
const formulario        = document.getElementById('formulario-registro');
const inputNombre       = document.getElementById('input-nombre');
const inputDireccion    = document.getElementById('input-direccion');
const inputTelefono     = document.getElementById('input-telefono');
const inputBotToken     = document.getElementById('input-bot-token');
const inputChatId       = document.getElementById('input-chat-id');
const inputSmsEmergencia = document.getElementById('input-sms-emergencia');
const configTelegram    = document.getElementById('config-telegram');
const btnPanico         = document.getElementById('btn-panico');
const btnAjustes        = document.getElementById('btn-ajustes');
const displayNombre     = document.getElementById('display-nombre');
const displayDireccion  = document.getElementById('display-direccion');
const displayTelefono   = document.getElementById('display-telefono');
const feedbackDiv       = document.getElementById('feedback');
const feedbackTexto     = document.getElementById('feedback-texto');

// -----------------------------------------
//  INICIALIZACIÓN DE LA APLICACIÓN
//  Verifica si existen datos en localStorage
//  y decide qué pantalla mostrar.
// -----------------------------------------
function inicializar() {
  const nombre    = localStorage.getItem(CLAVE_NOMBRE);
  const direccion = localStorage.getItem(CLAVE_DIRECCION);

  if (nombre && direccion) {
    // El usuario ya está registrado, mostrar pantalla principal
    mostrarPantallaPrincipal(nombre, direccion);
  } else {
    // Mostrar formulario de registro
    mostrarPantallaRegistro();
  }

  // Registrar el Service Worker para habilitar PWA
  registrarServiceWorker();
}

// -----------------------------------------
//  REGISTRO DEL SERVICE WORKER
// -----------------------------------------
function registrarServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('./service-worker.js')
        .then((registro) => {
          console.log('✅ Service Worker registrado con éxito:', registro.scope);
        })
        .catch((error) => {
          console.warn('⚠️ Error al registrar el Service Worker:', error);
        });
    });
  }
}

// -----------------------------------------
//  NAVEGACIÓN ENTRE PANTALLAS
// -----------------------------------------

/**
 * Muestra la pantalla de registro/onboarding.
 * Si hay datos existentes, los precarga en el formulario.
 */
function mostrarPantallaRegistro() {
  // Precargar datos existentes si los hay (modo edición)
  const nombreExistente    = localStorage.getItem(CLAVE_NOMBRE);
  const direccionExistente = localStorage.getItem(CLAVE_DIRECCION);
  const telefonoExistente  = localStorage.getItem(CLAVE_TELEFONO);
  const tokenExistente     = localStorage.getItem(CLAVE_BOT_TOKEN);
  const chatIdExistente    = localStorage.getItem(CLAVE_CHAT_ID);
  const smsExistente       = localStorage.getItem(CLAVE_SMS_EMERGENCIA);

  if (nombreExistente)    inputNombre.value         = nombreExistente;
  if (direccionExistente) inputDireccion.value      = direccionExistente;
  if (telefonoExistente)  inputTelefono.value       = telefonoExistente;
  if (tokenExistente)     inputBotToken.value       = tokenExistente;
  if (chatIdExistente)    inputChatId.value         = chatIdExistente;
  if (smsExistente)       inputSmsEmergencia.value  = smsExistente;

  // Si ya hay credenciales de Telegram o SMS, abrir el acordeón
  if (tokenExistente || chatIdExistente || smsExistente) {
    configTelegram.setAttribute('open', '');
  }

  // Cambiar visibilidad de pantallas
  pantallaPrincipal.classList.add('oculto');
  pantallaRegistro.classList.remove('oculto');

  // Enfocar el primer campo para accesibilidad
  setTimeout(() => inputNombre.focus(), 300);
}

/**
 * Oculta el registro y muestra el botón de pánico grande.
 * @param {string} nombre - Nombre del usuario.
 * @param {string} direccion - Dirección del usuario.
 * @param {string} telefono - Teléfono del usuario.
 */
function mostrarPantallaPrincipal(nombre, direccion, telefono) {
  pantallaRegistro.classList.add('oculto');
  pantallaPrincipal.classList.remove('oculto');

  displayNombre.textContent = nombre;
  displayDireccion.textContent = direccion;
  displayTelefono.textContent = telefono || localStorage.getItem(CLAVE_TELEFONO) || 'Sin teléfono';
}

// -----------------------------------------
//  EVENTOS
// -----------------------------------------

/**
 * Evento: Guardar datos del formulario.
 * Valida, guarda en localStorage y pasa a la pantalla principal.
 */
formulario.addEventListener('submit', (evento) => {
  evento.preventDefault();

  const nombre    = inputNombre.value.trim();
  const direccion = inputDireccion.value.trim();
  const telefono  = inputTelefono.value.trim();
  const botToken       = inputBotToken.value.trim();
  const chatId         = inputChatId.value.trim();
  const smsEmergencia  = inputSmsEmergencia.value.trim();

  // Validación básica de nombre, dirección y teléfono
  if (!nombre || !direccion || !telefono) {
    // Sacudir el formulario si los campos están vacíos
    formulario.style.animation = 'none';
    setTimeout(() => formulario.style.animation = 'sacudir 0.4s ease', 10);
    return;
  }

  // Guardar datos del usuario en localStorage
  localStorage.setItem(CLAVE_NOMBRE, nombre);
  localStorage.setItem(CLAVE_DIRECCION, direccion);
  localStorage.setItem(CLAVE_TELEFONO, telefono);

  // Guardar credenciales de Telegram (si se proporcionaron)
  if (botToken)      localStorage.setItem(CLAVE_BOT_TOKEN, botToken);
  if (chatId)        localStorage.setItem(CLAVE_CHAT_ID, chatId);
  if (smsEmergencia) localStorage.setItem(CLAVE_SMS_EMERGENCIA, smsEmergencia);

  // Ir a la pantalla principal
  mostrarPantallaPrincipal(nombre, direccion, telefono);
});

/**
 * Evento: Botón de ajustes (engranaje).
 * Vuelve al formulario de registro para editar datos.
 */
btnAjustes.addEventListener('click', () => {
  mostrarPantallaRegistro();
});

/**
 * Evento: Botón de Pánico.
 * Ejecuta la secuencia completa de alerta.
 */
btnPanico.addEventListener('click', () => {
  ejecutarAlertaPanico();
});

// -----------------------------------------
//  LÓGICA PRINCIPAL DE ALERTA
// -----------------------------------------

/**
 * Ejecuta la secuencia completa del botón de pánico:
 * 1. Muestra animación de onda
 * 2. Cambia el botón a estado "enviando"
 * 3. Intenta obtener GPS
 * 4. Arma y envía el mensaje a Telegram
 * 5. Muestra feedback al usuario
 */
async function ejecutarAlertaPanico() {
  // Prevenir múltiples pulsaciones
  if (btnPanico.classList.contains('enviando')) return;

  // Activar estado visual de "enviando"
  btnPanico.classList.add('enviando');
  cambiarTextoBoton('ENVIANDO...', 'PROCESANDO ALERTA');

  // Crear efecto de onda visual
  crearEfectoOnda();

  // Vibrar el dispositivo si está disponible (patrón de emergencia)
  if (navigator.vibrate) {
    navigator.vibrate([200, 100, 200, 100, 400]);
  }

  // Obtener datos del usuario
  const nombre    = localStorage.getItem(CLAVE_NOMBRE)    || 'Sin nombre';
  const direccion = localStorage.getItem(CLAVE_DIRECCION) || 'Sin dirección';
  const telefono  = localStorage.getItem(CLAVE_TELEFONO)  || 'No especificado';

  // Paso 1: Intentar obtener GPS (no crítico, puede fallar)
  let coordenadas = null;
  try {
    coordenadas = await obtenerUbicacion();
  } catch (errorGPS) {
    console.warn('⚠️ GPS no disponible:', errorGPS.message);
  }

  // Paso 2: Armar el mensaje según si tenemos GPS o no
  const mensaje = coordenadas
    ? armarMensajeConGPS(nombre, direccion, telefono, coordenadas)
    : armarMensajeSinGPS(nombre, direccion, telefono);

  // Paso 3: Intentar enviar por Telegram
  try {
    await enviarATelegram(mensaje);

    // Éxito
    if (coordenadas) {
      mostrarFeedback('✅ ¡Alerta enviada correctamente!', 'exito');
    } else {
      mostrarFeedback('⚠️ Alerta enviada (sin ubicación GPS)', 'exito');
    }

  } catch (errorEnvio) {
    console.error('❌ Error al enviar alerta:', errorEnvio);
    // Telegram falló (ya sea por internet u otro error no auto-corregible)
    // → abrir SMS como respaldo
    enviarSMSEmergencia(nombre, direccion, telefono);
  }

  // Restaurar el botón al estado original
  btnPanico.classList.remove('enviando');
  cambiarTextoBoton('SOS', 'PRESIONÁ PARA ALERTAR');
}

// -----------------------------------------
//  GEOLOCALIZACIÓN
// -----------------------------------------

/**
 * Obtiene las coordenadas GPS del dispositivo.
 * @returns {Promise<{lat: number, lon: number}>}
 */
function obtenerUbicacion() {
  return new Promise((resolve, reject) => {
    // Verificar si el navegador soporta geolocalización
    if (!navigator.geolocation) {
      reject(new Error('Geolocalización no soportada en este navegador.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      // Éxito
      (posicion) => {
        resolve({
          lat: posicion.coords.latitude,
          lon: posicion.coords.longitude
        });
      },
      // Error
      (error) => {
        let mensajeError;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            mensajeError = 'Permiso de ubicación denegado.';
            break;
          case error.POSITION_UNAVAILABLE:
            mensajeError = 'Información de ubicación no disponible.';
            break;
          case error.TIMEOUT:
            mensajeError = 'Tiempo de espera agotado para obtener ubicación.';
            break;
          default:
            mensajeError = 'Error desconocido al obtener ubicación.';
        }
        reject(new Error(mensajeError));
      },
      // Opciones
      {
        enableHighAccuracy: true,
        timeout: TIMEOUT_GPS,
        maximumAge: 30000 // Aceptar ubicación en caché de hasta 30s
      }
    );
  });
}

// -----------------------------------------
//  ARMADO DE MENSAJES
// -----------------------------------------

/**
 * Construye el mensaje de alerta incluyendo enlace a Google Maps.
 * @param {string} nombre 
 * @param {string} direccion 
 * @param {string} telefono 
 * @param {{lat: number, lon: number}} coordenadas 
 * @returns {string} Mensaje formateado en Markdown.
 */
function armarMensajeConGPS(nombre, direccion, telefono, coordenadas) {
  const mapUrl = `https://www.google.com/maps?q=${coordenadas.lat},${coordenadas.lon}`;
  
  return `🚨 *¡ALERTA DE PÁNICO!* 🚨

👤 *Comercio / Nombre:* ${nombre}
📍 *Dirección:* ${direccion}
📞 *Teléfono:* ${telefono}

🗺️ *Ubicación GPS:*
[Abrir en Google Maps](${mapUrl})

⏰ *Hora de activación:* ${obtenerFechaHoraFormateada()}

_Por favor, verificar la situación de inmediato._`;
}

/**
 * Arma el mensaje de alerta SIN coordenadas GPS.
 * Aclara que el GPS no estaba disponible.
 */
function armarMensajeSinGPS(nombre, direccion, telefono) {
  return `🚨🚨🚨 *ALERTA DE PÁNICO* 🚨🚨🚨

⚠️ *Se ha activado una alerta de emergencia*

👤 *Nombre/Comercio:* ${nombre}
📍 *Dirección Registrada:* ${direccion}
📞 *Teléfono:* ${telefono}

📡 *GPS:* ❌ _No disponible al momento de la alerta._
_Dirigirse a la dirección registrada._

🕐 *Hora:* ${obtenerFechaHoraFormateada()}

_Por favor, verificar la situación de inmediato._`;
}

/**
 * Retorna la fecha y hora actual formateada en español.
 */
function obtenerFechaHoraFormateada() {
  const ahora = new Date();
  return ahora.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

// -----------------------------------------
//  FALLBACK: SMS DE EMERGENCIA
//  Se activa cuando Telegram falla (sin internet).
//  Abre la app de Mensajes con el texto prellenado.
// -----------------------------------------

/**
 * Abre la aplicación de SMS nativa con un mensaje de emergencia prellenado.
 * @param {string} nombre - Nombre del usuario.
 * @param {string} direccion - Dirección del usuario.
 * @param {string} telefono - Teléfono del usuario.
 */
function enviarSMSEmergencia(nombre, direccion, telefono) {
  const numeroSMS = localStorage.getItem(CLAVE_SMS_EMERGENCIA);

  if (!numeroSMS) {
    mostrarFeedback('❌ Sin internet y sin nº SMS configurado', 'error');
    alert('No se pudo enviar la alerta por Telegram (sin conexión) y no hay un número de SMS de emergencia configurado. Configuralo en Ajustes > Avanzado.');
    return;
  }

  // Armar mensaje de texto plano (sin Markdown, los SMS no lo soportan)
  const hora = obtenerFechaHoraFormateada();
  const textoSMS = `🚨 ALERTA DE PÁNICO 🚨\n\nNombre: ${nombre}\nDirección: ${direccion}\nTeléfono: ${telefono}\nHora: ${hora}\n\nSe necesita verificar la situación de inmediato.`;

  // Codificar el texto para la URL del SMS
  const textoCodificado = encodeURIComponent(textoSMS);

  // Abrir la app de SMS nativa del celular
  // El formato sms: funciona tanto en Android como en iOS
  window.location.href = `sms:${numeroSMS}?body=${textoCodificado}`;

  mostrarFeedback('📱 Abriendo SMS de emergencia...', 'exito');
}

// -----------------------------------------
//  ENVÍO A TELEGRAM
// -----------------------------------------

/**
 * Envía un mensaje al grupo de Telegram usando la Bot API.
 * @param {string} mensaje - Texto del mensaje (con formato Markdown).
 */
async function enviarATelegram(mensaje) {
  // Leer credenciales desde localStorage
  const botToken = localStorage.getItem(CLAVE_BOT_TOKEN);
  const chatId   = localStorage.getItem(CLAVE_CHAT_ID);

  // Validar que las credenciales estén configuradas
  if (!botToken || !chatId) {
    console.error('❌ Bot Token o Chat ID no configurados.');
    throw new Error('Credenciales de Telegram no configuradas. Configurá el Bot Token y Chat ID en Ajustes.');
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  const respuesta = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: mensaje,
      parse_mode: 'Markdown',
      disable_web_page_preview: false
    })
  });

  // Verificar si la respuesta fue exitosa
  if (!respuesta.ok) {
    const errorData = await respuesta.json().catch(() => ({}));
    console.error('❌ Error de Telegram API:', errorData);
    
    // Auto-corregir migración a supergrupo (ej: cuando se agregan administradores o se cambian permisos)
    if (errorData.parameters && errorData.parameters.migrate_to_chat_id) {
      const nuevoChatId = errorData.parameters.migrate_to_chat_id;
      console.warn(`🔄 Grupo migrado a supergrupo. Actualizando Chat ID a ${nuevoChatId}`);
      localStorage.setItem(CLAVE_CHAT_ID, nuevoChatId);

      // Reintentar el envío con el nuevo ID
      const nuevaRespuesta = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: nuevoChatId,
          text: mensaje,
          parse_mode: 'Markdown',
          disable_web_page_preview: false
        })
      });

      if (nuevaRespuesta.ok) {
        const nuevaData = await nuevaRespuesta.json();
        console.log('✅ Mensaje enviado a Telegram (reintento post-migración):', nuevaData);
        // Ocultar el error ya que se solucionó automáticamente
        return nuevaData; 
      }
    }

    throw new Error(`Telegram error ${respuesta.status}: ${errorData.description || 'Desconocido'}`);
  }

  const data = await respuesta.json();
  console.log('✅ Mensaje enviado a Telegram:', data);
  return data;
}

// -----------------------------------------
//  EFECTOS VISUALES Y FEEDBACK
// -----------------------------------------

/**
 * Muestra el mensaje de feedback en la parte inferior.
 * Se oculta automáticamente después de DURACION_FEEDBACK ms.
 * @param {string} texto - Texto a mostrar.
 * @param {string} tipo - 'exito' o 'error'.
 */
function mostrarFeedback(texto, tipo) {
  feedbackTexto.textContent = texto;

  // Limpiar clases anteriores y aplicar la nueva
  feedbackDiv.classList.remove('oculto', 'exito', 'error');
  feedbackDiv.classList.add(tipo);

  // Cambiar ícono según el tipo
  const iconoSVG = feedbackDiv.querySelector('.feedback-icono');
  if (tipo === 'exito') {
    iconoSVG.innerHTML = `
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    `;
  } else {
    iconoSVG.innerHTML = `
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    `;
  }

  // Ocultar después de 5 segundos
  setTimeout(() => {
    feedbackDiv.classList.add('oculto');
  }, DURACION_FEEDBACK);
}

/**
 * Crea un efecto de onda expansiva desde el centro del botón.
 */
function crearEfectoOnda() {
  const onda = document.createElement('div');
  onda.classList.add('onda-alerta');
  document.body.appendChild(onda);

  // Remover la onda del DOM después de la animación
  onda.addEventListener('animationend', () => {
    onda.remove();
  });
}

/**
 * Cambia el texto del botón de pánico.
 * @param {string} textoPrincipal - Texto grande (ej: "SOS").
 * @param {string} textoSecundario - Texto pequeño debajo.
 */
function cambiarTextoBoton(textoPrincipal, textoSecundario) {
  const textoElem = btnPanico.querySelector('.btn-panico-texto');
  const subTextoElem = btnPanico.querySelector('.btn-panico-subtexto');

  if (textoElem) textoElem.textContent = textoPrincipal;
  if (subTextoElem) subTextoElem.textContent = textoSecundario;
}

// -----------------------------------------
//  INICIAR LA APLICACIÓN
// -----------------------------------------
document.addEventListener('DOMContentLoaded', inicializar);
