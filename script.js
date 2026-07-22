/**
 * ======================================================================
 * SIMULADOR TÁCTICO - ADI Sede Coro
 * ======================================================================
 * Archivo principal del simulador de toma de decisiones.
 * Contiene: sonidos, logs, logros, temas, escenarios (3 largos + 3 cortos),
 * lógica del juego, análisis y feedback.
 * Versión: 2.0.0 (Avance #4) + BlueTeam + Trazabilidad Avanzada (Avance #6)
 * Autor: López Tirajara
 * ======================================================================
 */

// ========== SONIDOS ==========

/**
 * Variable que indica si los sonidos están habilitados.
 * @type {boolean}
 */
let soundEnabled = localStorage.getItem("soundEnabled") !== "false";

/**
 * Contexto de audio para la Web Audio API.
 * @type {AudioContext|null}
 */
let audioCtx = null;

/**
 * Inicializa el contexto de audio si no está creado.
 * @function initAudio
 * @returns {void}
 */
function initAudio() {
    if (!audioCtx && soundEnabled) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

/**
 * Reproduce un sonido según el tipo indicado.
 * @param {string} type - Tipo de sonido: 'click', 'timeout', 'victory', 'failure'
 * @returns {void}
 */
function playSound(type) {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = "sine";
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.5);
    if (type === "click") { osc.frequency.value = 800; osc.start(); osc.stop(now + 0.15); }
    else if (type === "timeout") { osc.frequency.value = 400; osc.start(); osc.stop(now + 0.5); }
    else if (type === "victory") { osc.frequency.value = 1200; osc.start(); osc.stop(now + 0.3); }
    else if (type === "failure") { osc.frequency.value = 300; osc.start(); osc.stop(now + 0.5); }
}

/**
 * Variable que indica si el sonido ambiental está activo.
 * @type {boolean}
 */
let ambientSoundEnabled = localStorage.getItem("ambientSoundEnabled") === "true";

/**
 * Objeto que contiene el contexto y fuente del sonido ambiental.
 * @type {Object|null}
 */
let ambientAudio = null;

/**
 * Inicia el sonido ambiental (ruido de radio militar).
 * @function startAmbientSound
 * @returns {void}
 */
function startAmbientSound() {
    if (!ambientSoundEnabled) return;
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const bufferSize = 2 * ctx.sampleRate;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.05 + Math.sin(i * 0.05) * 0.02;
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        const gain = ctx.createGain();
        gain.gain.value = 0.05;
        source.connect(gain);
        gain.connect(ctx.destination);
        source.start();
        ambientAudio = { source, gain, ctx };
    } catch(e) {
        console.warn("Ambient sound not supported");
    }
}

/**
 * Detiene el sonido ambiental.
 * @function stopAmbientSound
 * @returns {void}
 */
function stopAmbientSound() {
    if (ambientAudio) {
        try { ambientAudio.source.stop(); } catch(e) {}
        try { ambientAudio.ctx.close(); } catch(e) {}
        ambientAudio = null;
    }
}

/**
 * Alterna el estado del sonido ambiental y guarda la preferencia.
 * @function toggleAmbientSound
 * @returns {void}
 */
function toggleAmbientSound() {
    ambientSoundEnabled = !ambientSoundEnabled;
    localStorage.setItem("ambientSoundEnabled", ambientSoundEnabled);
    if (ambientSoundEnabled) startAmbientSound();
    else stopAmbientSound();
    const btn = document.getElementById("ambientSoundBtn");
    if (btn) btn.innerHTML = ambientSoundEnabled ? '<i class="fas fa-head-side-vr"></i> Ambiente ON' : '<i class="fas fa-head-side-vr"></i> Ambiente OFF';
}

// ========== LOGGING CENTRALIZADO (Tarea 2) ==========

/**
 * Registra un mensaje en la consola con nivel y timestamp.
 * @param {string} level - Nivel del log: 'INFO', 'WARN', 'ERROR'
 * @param {string} message - Mensaje descriptivo
 * @param {*} [data] - Datos adicionales opcionales
 * @returns {void}
 */
function log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const prefix = `[${level}] [${timestamp}]`;
    if (data) {
        console.log(`${prefix} ${message}`, data);
    } else {
        console.log(`${prefix} ${message}`);
    }
}

// ========== LOGROS ==========

/**
 * Objeto que almacena el estado de los logros desbloqueados.
 * @type {Object.<string, boolean>}
 */
let achievements = { firstVictory: false, quickDecision: false, strategist: false, perfectMision: false };
try {
    const stored = localStorage.getItem("achievements");
    if (stored) achievements = JSON.parse(stored);
} catch (e) {
    localStorage.removeItem("achievements");
    log('WARN', 'Achievements corrupted, reset.');
}

/**
 * Total de victorias acumuladas.
 * @type {number}
 */
let totalWins = parseInt(localStorage.getItem("totalWins") || "0");

/**
 * Desbloquea un logro específico y lo guarda en localStorage.
 * @param {string} id - Identificador del logro: 'firstVictory', 'quickDecision', 'strategist', 'perfectMision'
 * @returns {void}
 */
function unlockAchievement(id) {
    if (achievements[id]) return;
    achievements[id] = true;
    localStorage.setItem("achievements", JSON.stringify(achievements));
    playSound("victory");
    log('INFO', `Logro desbloqueado: ${getAchievementName(id)}`);
    const names = {
        firstVictory: "Primera Victoria",
        quickDecision: "Decisión Rápida",
        strategist: "Estratega",
        perfectMision: "Perfecto"
    };
    const descs = {
        firstVictory: "Completa tu primera misión con éxito.",
        quickDecision: "Decisión en menos de 10 segundos (Normal+).",
        strategist: "Acumula 3 victorias.",
        perfectMision: "5+ decisiones sin fallar."
    };
    showModal("🏅 Logro desbloqueado", `<p><strong>${names[id]}</strong><br><small>${descs[id]}</small></p>`);
}

/**
 * Obtiene el nombre de un logro por su ID.
 * @param {string} id - ID del logro
 * @returns {string} Nombre del logro
 */
function getAchievementName(id) {
    const names = { firstVictory: "Primera Victoria", quickDecision: "Decisión Rápida", strategist: "Estratega", perfectMision: "Perfecto" };
    return names[id];
}

/**
 * Obtiene la descripción de un logro por su ID.
 * @param {string} id - ID del logro
 * @returns {string} Descripción del logro
 */
function getAchievementDesc(id) {
    const desc = { firstVictory: "Completa tu primera misión con éxito.", quickDecision: "Decisión en menos de 10 segundos (Normal+).", strategist: "Acumula 3 victorias.", perfectMision: "5+ decisiones sin fallar." };
    return desc[id];
}

/**
 * Verifica si se cumplen las condiciones para desbloquear logros.
 * @param {string} finalType - Tipo de resultado: 'exito', 'parcial', 'fracaso'
 * @param {number} decisionCount - Número de decisiones tomadas
 * @param {number} tiempoPromedio - Tiempo promedio por decisión en segundos
 * @param {boolean} training - Indica si está en modo entrenamiento
 * @returns {void}
 */
function checkAchievements(finalType, decisionCount, tiempoPromedio, training) {
    if (finalType === "exito") {
        if (!achievements.firstVictory) unlockAchievement("firstVictory");
        totalWins++;
        localStorage.setItem("totalWins", totalWins);
        if (totalWins >= 3 && !achievements.strategist) unlockAchievement("strategist");
        if (decisionCount >= 5 && !achievements.perfectMision) unlockAchievement("perfectMision");
    }
    if (!training && tiempoPromedio && tiempoPromedio < 10 && decisionCount >= 1 && dificultadActual !== "easy") {
        if (!achievements.quickDecision) unlockAchievement("quickDecision");
    }
}

// ========== TEMAS Y MODALES ==========

/**
 * Cambia el tema de color de la interfaz.
 * @param {string} theme - Tema: 'default', 'llanero', 'selva', 'costa', 'ceremonial'
 * @returns {void}
 */
function setColorTheme(theme) {
    document.body.classList.remove("theme-default", "theme-llanero", "theme-selva", "theme-costa", "theme-ceremonial", "dark");
    if (theme === "llanero") document.body.classList.add("theme-llanero");
    else if (theme === "selva") document.body.classList.add("theme-selva");
    else if (theme === "costa") document.body.classList.add("theme-costa");
    else if (theme === "ceremonial") document.body.classList.add("theme-ceremonial");
    else document.body.classList.add("theme-default");
    localStorage.setItem("colorTheme", theme);
    localStorage.setItem("darkMode", "false");
    const themeBtn = document.getElementById("themeToggleBtn");
    if (themeBtn) themeBtn.innerHTML = '<i class="fas fa-moon"></i>';
    log('INFO', `Tema de color cambiado a: ${theme}`);
}

/**
 * Carga el tema guardado en localStorage.
 * @function loadColorTheme
 * @returns {void}
 */
function loadColorTheme() {
    const theme = localStorage.getItem("colorTheme") || "default";
    setColorTheme(theme);
    const dark = localStorage.getItem("darkMode") === "true";
    if (dark) {
        document.body.classList.remove("theme-default", "theme-llanero", "theme-selva", "theme-costa", "theme-ceremonial");
        document.body.classList.add("dark");
        const themeBtn = document.getElementById("themeToggleBtn");
        if (themeBtn) themeBtn.innerHTML = '<i class="fas fa-sun"></i>';
    }
}

/**
 * Muestra un modal con título y contenido.
 * @param {string} title - Título del modal
 * @param {string} content - Contenido HTML del modal
 * @returns {void}
 */
function showModal(title, content) {
    const modalDiv = document.createElement("div");
    modalDiv.className = "modal";
    modalDiv.innerHTML = `<div class="modal-content"><h3><i class="fas fa-info-circle"></i> ${title}</h3>${content}<button onclick="this.closest('.modal').remove()">Cerrar</button></div>`;
    document.body.appendChild(modalDiv);
}

/**
 * Muestra el manual táctico.
 * @function showManual
 * @returns {void}
 */
function showManual() {
    showModal("Manual Táctico", "<p>✔️ Desplegar patrullas y pedir refuerzos es la táctica más segura.<br>✔️ En rehenes, priorizar rescate con fuerzas especiales.<br>✔️ Atacar suministros enemigos cambia el rumbo.<br>✔️ El diálogo temprano evita víctimas civiles.<br>✔️ Activar código rojo ante intrusión.</p>");
}

/**
 * Muestra los logros desbloqueados.
 * @function showAchievements
 * @returns {void}
 */
function showAchievements() {
    let list = "";
    for (let [id, unlocked] of Object.entries(achievements)) {
        list += `<li style="display:flex; align-items:center; gap:10px; margin:10px 0; ${!unlocked ? 'opacity:0.6' : ''}"><i class="fas fa-${unlocked ? 'medal' : 'lock'} fa-2x"></i><div><strong>${getAchievementName(id)}</strong><br><small>${getAchievementDesc(id)}</small></div>${unlocked ? '<i class="fas fa-check-circle" style="color:#4ade80"></i>' : '<i class="fas fa-hourglass-half"></i>'}</li>`;
    }
    showModal("Logros", `<ul style="list-style:none">${list}</ul>`);
}

/**
 * Muestra el selector de temas militares venezolanos.
 * @function showPaletteSelector
 * @returns {void}
 */
function showPaletteSelector() {
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.innerHTML = `
        <div class="modal-content">
            <h3><i class="fas fa-palette"></i> Temas Militares Venezolanos</h3>
            <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; margin: 15px 0;">
                <div style="width: 50px; height: 50px; background-color: #5b6e3f; border-radius: 25px; cursor: pointer; border: 2px solid white;" 
                     onclick="setColorTheme('llanero'); this.closest('.modal').remove();" title="Llanero"></div>
                <div style="width: 50px; height: 50px; background-color: #1e3a2f; border-radius: 25px; cursor: pointer; border: 2px solid white;" 
                     onclick="setColorTheme('selva'); this.closest('.modal').remove();" title="Selva"></div>
                <div style="width: 50px; height: 50px; background-color: #1f4e79; border-radius: 25px; cursor: pointer; border: 2px solid white;" 
                     onclick="setColorTheme('costa'); this.closest('.modal').remove();" title="Costa"></div>
                <div style="width: 50px; height: 50px; background-color: #6b1e2f; border-radius: 25px; cursor: pointer; border: 2px solid white;" 
                     onclick="setColorTheme('ceremonial'); this.closest('.modal').remove();" title="Ceremonial"></div>
            </div>
            <div style="font-size: 12px; color: #666; text-align: center;">* El modo oscuro se puede activar con el botón 🌙/☀️</div>
            <button onclick="this.closest('.modal').remove()" style="margin-top: 15px;">Cerrar</button>
        </div>
    `;
    document.body.appendChild(modal);
}

// ========== ESCENARIOS ==========

/**
 * Placeholder para GIFs cuando no hay imagen disponible.
 * @const {string}
 */
const gifPlaceholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='180' viewBox='0 0 300 180'%3E%3Crect width='300' height='180' fill='%232c4c6e'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='white' font-size='16' font-family='Arial' dy='.3em'%3E🎖️ SIMULADOR%3C/text%3E%3C/svg%3E";

/**
 * Baraja las opciones de una pregunta y asigna letras A, B, C,...
 * @param {Array} opts - Lista de opciones con los campos {texto, destino}
 * @returns {Array} Opciones barajadas con la propiedad 'letra' añadida
 */
function shuffleOptions(opts) {
    let newOpts = [...opts];
    for (let i = newOpts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newOpts[i], newOpts[j]] = [newOpts[j], newOpts[i]];
    }
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
    newOpts.forEach((opt, idx) => { opt.letra = letters[idx]; });
    return newOpts;
}

// ===== RESULTADOS BASE =====
const resultadosBase = {
    exito: {
        tipo: "exito",
        mensaje: "¡MISIÓN CUMPLIDA CON ÉXITO TOTAL!",
        analisisBase: "Ha demostrado una excelente capacidad de mando. Sus decisiones fueron acertadas.",
        gif: "https://www.image2url.com/r2/default/gifs/1781981587356-83265fec-b07c-41c9-bca5-33a13a815d32.gif"
    },
    parcial: {
        tipo: "parcial",
        mensaje: "ÉXITO PARCIAL",
        analisisBase: "El objetivo se alcanzó, pero hubo contratiempos evitables.",
        gif: "https://www.image2url.com/r2/default/gifs/1781984078609-f2649cb6-4733-46f4-9e93-06dba0d54418.gif"
    },
    fracaso: {
        tipo: "fracaso",
        mensaje: "FRACASO TOTAL",
        analisisBase: "Error estratégico. Revise la doctrina.",
        gif: "https://www.image2url.com/r2/default/gifs/1781986068272-440fb912-9c5e-4e37-8d37-95a84a2d53a2.gif"
    },
    error: {
        tipo: "fracaso",
        mensaje: "ERROR",
        analisisBase: "Reinicie la simulación.",
        gif: "https://www.image2url.com/r2/default/gifs/1781983547844-66b696ad-e9d4-46df-b97a-f2e673f84af6.gif"
    }
};

// ===== ESCENARIO 1: FRONTERA (largo) =====
const escenarioFrontera = {
    nombre: "Crisis en la Frontera Occidental",
    p1: {
        texto: "Inteligencia detecta grupo irregular armado a 5 km de la frontera. Planean atacar un puesto de control. ¿Primera acción?",
        gif: "https://www.image2url.com/r2/default/gifs/1781982706636-2a9e6056-4485-45db-9894-3d8cce1ff77e.gif",
        opciones_raw: [
            { texto: "Desplegar patrullas y solicitar refuerzos aéreos", destino: "consA1" },
            { texto: "Ataque preventivo con drones", destino: "consA2" },
            { texto: "Enviar negociadores", destino: "consA3" }
        ]
    },
    consA1: {
        texto: "Refuerzos aéreos llegarán en 20 minutos. Sus patrullas detectan movimiento enemigo.",
        gif: "https://www.image2url.com/r2/default/gifs/1781983346125-6d238762-bb71-465d-aeab-2d3a4c5683f0.gif",
        siguiente: "p2"
    },
    consA2: {
        texto: "Los drones destruyen un depósito de munición, pero el enemigo responde con fuego de mortero. 3 heridos.",
        gif: "https://www.image2url.com/r2/default/gifs/1781983486183-91576fe8-f8b8-43c7-88cd-ce72c3bfe448.gif",
        siguiente: "p2b"
    },
    consA3: {
        texto: "Los negociadores son tomados como rehenes. La situación se vuelve crítica.",
        gif: "https://www.image2url.com/r2/default/gifs/1782344003164-465dec20-0d87-4f0b-a511-fcab79a9b30a.gif",
        siguiente: "p2c"
    },
    p2: {
        texto: "Refuerzos en camino. La columna enemiga avanza rápidamente. ¿Qué ordena?",
        gif: "https://www.image2url.com/r2/default/gifs/1781982706636-2a9e6056-4485-45db-9894-3d8cce1ff77e.gif",
        opciones_raw: [
            { texto: "Atacar con francotiradores", destino: "consB1" },
            { texto: "Esperar refuerzos", destino: "consB2" },
            { texto: "Evacuar el puesto", destino: "consB3" }
        ]
    },
    consB1: {
        texto: "Los francotiradores eliminan a dos cabecillas. El enemigo se desorganiza.",
        gif: "https://www.image2url.com/r2/default/gifs/1781987009380-f979372a-73aa-4507-b7a9-4452f28b2f1b.gif",
        siguiente: "p3"
    },
    consB2: {
        texto: "La espera permite al enemigo atrincherarse. La misión se complica.",
        gif: "https://www.image2url.com/r2/default/gifs/1781982706636-2a9e6056-4485-45db-9894-3d8cce1ff77e.gif",
        siguiente: "p3b"
    },
    consB3: {
        texto: "La retirada es ordenada, pero se pierde terreno estratégico.",
        gif: "https://www.image2url.com/r2/default/gifs/1783365127440-bd0879cf-4085-46d7-9d82-27bac1b78095.gif",
        siguiente: "p3c"
    },
    p2b: {
        texto: "Tras el bombardeo, el enemigo se repliega a una cueva cercana. ¿Qué acción toma?",
        gif: "https://www.image2url.com/r2/default/gifs/1782422719699-eed1c881-f570-4339-8ebd-679e3ed187e3.gif",
        opciones_raw: [
            { texto: "Asaltar la cueva con fuerzas especiales", destino: "consC1" },
            { texto: "Sellar las salidas y negociar", destino: "consC2" },
            { texto: "Solicitar bombardeo aéreo", destino: "consC3" }
        ]
    },
    consC1: {
        texto: "Asalto exitoso, 2 bajas propias. Capturan documentos.",
        gif: "https://www.image2url.com/r2/default/gifs/1781987769945-849e75cc-c483-4243-bd65-1bd11996fd98.gif",
        siguiente: "p4"
    },
    consC2: {
        texto: "Negociación tensa: 10 enemigos se rinden, otros huyen.",
        gif: "https://www.image2url.com/r2/default/gifs/1781987769945-849e75cc-c483-4243-bd65-1bd11996fd98.gif",
        siguiente: "p4b"
    },
    consC3: {
        texto: "El bombardeo destruye la cueva, pero daña un oleoducto cercano.",
        gif: "https://www.image2url.com/r2/default/gifs/1781983547844-66b696ad-e9d4-46df-b97a-f2e673f84af6.gif",
        siguiente: "p4c"
    },
    p2c: {
        texto: "Los rehenes (3 soldados) están en poder del enemigo. ¿Qué prioriza?",
        gif: "https://www.image2url.com/r2/default/gifs/1781989372665-82cfb24b-212f-4d37-9cfc-ae56a1b4d6b0.gif",
        opciones_raw: [
            { texto: "Lanzar un rescate inmediato", destino: "consD1" },
            { texto: "Negociar la liberación", destino: "consD2" }
        ]
    },
    consD1: {
        texto: "Rescate exitoso, pero un soldado resulta herido. El enemigo huye.",
        gif: "https://www.image2url.com/r2/default/gifs/1781989372665-82cfb24b-212f-4d37-9cfc-ae56a1b4d6b0.gif",
        siguiente: "p5"
    },
    consD2: {
        texto: "Negociación larga: liberan a los rehenes, pero el enemigo obtiene armamento.",
        gif: "https://www.image2url.com/r2/default/gifs/1782344003164-465dec20-0d87-4f0b-a511-fcab79a9b30a.gif",
        siguiente: "p5b"
    },
    p3: {
        texto: "El enemigo se reagrupa en una colina. Tiene unos 100 efectivos. ¿Qué estrategia emplea?",
        gif: "https://www.image2url.com/r2/default/gifs/1781982706636-2a9e6056-4485-45db-9894-3d8cce1ff77e.gif",
        opciones_raw: [
            { texto: "Ataque envolvente nocturno", destino: "consE1" },
            { texto: "Bombardeo de artillería", destino: "consE2" }
        ]
    },
    consE1: {
        texto: "Ataque sorpresa logra romper la defensa enemiga. Avance significativo.",
        gif: "https://www.image2url.com/r2/default/gifs/1782348023841-7f46763a-54b5-4c8c-976d-1fc0b8951d88.gif",
        siguiente: "p6"
    },
    consE2: {
        texto: "El bombardeo causa pánico y deserción masiva. El enemigo se rinde.",
        gif: "https://www.image2url.com/r2/default/gifs/1781983547844-66b696ad-e9d4-46df-b97a-f2e673f84af6.gif",
        siguiente: "exito"
    },
    p3b: {
        texto: "El enemigo atrincherado lanza un contraataque. ¿Cómo responde?",
        gif: "https://www.image2url.com/r2/default/gifs/1781982706636-2a9e6056-4485-45db-9894-3d8cce1ff77e.gif",
        opciones_raw: [
            { texto: "Retirada táctica", destino: "consF1" },
            { texto: "Defensa firme con morteros", destino: "consF2" }
        ]
    },
    consF1: {
        texto: "Retirada ordenada, pero pierde terreno.",
        gif: "https://www.image2url.com/r2/default/gifs/1782531728490-84dc41b2-93c6-497f-8a65-1bd955d57f59.gif",
        siguiente: "p6b"
    },
    consF2: {
        texto: "Repelen ataque con 10 bajas enemigas.",
        gif: "https://www.image2url.com/r2/default/gifs/1781983547844-66b696ad-e9d4-46df-b97a-f2e673f84af6.gif",
        siguiente: "parcial"
    },
    p3c: {
        texto: "El tiempo perdido permitió al enemigo recibir suministros. ¿Qué orden da?",
        gif: "https://www.image2url.com/r2/default/gifs/1782527878625-f56705c2-916d-4906-9d0a-619dbede7fea.gif",
        opciones_raw: [
            { texto: "Atacar cadena de suministros", destino: "consG1" },
            { texto: "Solicitar alto el fuego", destino: "consG2" }
        ]
    },
    consG1: {
        texto: "Destruyen convoy enemigo. Golpe de gracia.",
        gif: "https://www.image2url.com/r2/default/gifs/1781983547844-66b696ad-e9d4-46df-b97a-f2e673f84af6.gif",
        siguiente: "exito"
    },
    consG2: {
        texto: "Alto el fuego rechazado. El enemigo ataca con más fuerza.",
        gif: "https://www.image2url.com/r2/default/gifs/1782531421224-b6b7b048-d64b-4b1b-a9a6-ebf19f9116dd.gif",
        siguiente: "fracaso"
    },
    p4: {
        texto: "Los documentos capturados revelan un plan de ataque contra una ciudad cercana. ¿Qué hace?",
        gif: "https://www.image2url.com/r2/default/gifs/1783911485917-3508f407-c88a-4aa6-a8bb-2d5bf4b4d2fc.gif",
        opciones_raw: [
            { texto: "Alertar autoridades y evacuar", destino: "consH1" },
            { texto: "Emboscar células enemigas", destino: "consH2" }
        ]
    },
    consH1: {
        texto: "Evacuación exitosa. La ciudad está a salvo.",
        gif: "https://www.image2url.com/r2/default/gifs/1782344602151-3c4d5460-9067-4a68-9410-9517d8f30190.gif",
        siguiente: "exito"
    },
    consH2: {
        texto: "Emboscada elimina a 15 terroristas.",
        gif: "https://www.image2url.com/r2/default/gifs/1781983547844-66b696ad-e9d4-46df-b97a-f2e673f84af6.gif",
        siguiente: "exito"
    },
    p4b: {
        texto: "Los que huyeron se refugian en una aldea. ¿Cómo procede?",
        gif: "https://www.image2url.com/r2/default/gifs/1782528486694-e7dd9a4b-f6b9-44d8-87cd-26def7ed3f6a.gif",
        opciones_raw: [
            { texto: "Cercar y negociar", destino: "consI1" },
            { texto: "Asalto directo", destino: "consI2" }
        ]
    },
    consI1: {
        texto: "Capturan a los líderes. Operación exitosa.",
        gif: "https://www.image2url.com/r2/default/gifs/1781987769945-849e75cc-c483-4243-bd65-1bd11996fd98.gif",
        siguiente: "exito"
    },
    consI2: {
        texto: "Asalto violento, muchos heridos.",
        gif: "https://www.image2url.com/r2/default/gifs/1781983547844-66b696ad-e9d4-46df-b97a-f2e673f84af6.gif",
        siguiente: "parcial"
    },
    p4c: {
        texto: "El oleoducto dañado provoca un incendio. ¿Cuál es su prioridad?",
        gif: "https://www.image2url.com/r2/default/gifs/1782528888880-87cd4af4-a26d-40b6-a86d-c4c57ee91051.gif",
        opciones_raw: [
            { texto: "Apagar fuego", destino: "consJ1" },
            { texto: "Abandonar zona", destino: "consJ2" }
        ]
    },
    consJ1: {
        texto: "Fuego controlado. Daño limitado.",
        gif: "https://www.image2url.com/r2/default/gifs/1782530678880-d64a5c4e-45f9-49ec-bfea-6b809b68194c.gif",
        siguiente: "parcial"
    },
    consJ2: {
        texto: "El fuego se expande y causa una crisis diplomática.",
        gif: "https://www.image2url.com/r2/default/gifs/1781983547844-66b696ad-e9d4-46df-b97a-f2e673f84af6.gif",
        siguiente: "fracaso"
    },
    p5: {
        texto: "El enemigo fugitivo busca refugio en zona montañosa. ¿Qué táctica usa?",
        gif: "https://www.image2url.com/r2/default/gifs/1782531182749-59b00bfd-de6c-41b5-88f3-36a976c35724.gif",
        opciones_raw: [
            { texto: "Persecución con helicópteros", destino: "consK1" },
            { texto: "Bloqueo de rutas", destino: "consK2" }
        ]
    },
    consK1: {
        texto: "Capturan al líder. Fin de la amenaza.",
        gif: "https://www.image2url.com/r2/default/gifs/1781983346125-6d238762-bb71-465d-aeab-2d3a4c5683f0.gif",
        siguiente: "exito"
    },
    consK2: {
        texto: "El enemigo se rinde por falta de suministros.",
        gif: "https://www.image2url.com/r2/default/gifs/1781987769945-849e75cc-c483-4243-bd65-1bd11996fd98.gif",
        siguiente: "exito"
    },
    p5b: {
        texto: "El armamento entregado durante la negociación ahora es usado en su contra. ¿Cómo se defiende?",
        gif: "https://www.image2url.com/r2/default/gifs/1782344003164-465dec20-0d87-4f0b-a511-fcab79a9b30a.gif",
        opciones_raw: [
            { texto: "Ataque nocturno sorpresa", destino: "consL1" },
            { texto: "Mediación internacional", destino: "consL2" }
        ]
    },
    consL1: {
        texto: "Ataque exitoso. Recuperan armamento.",
        gif: "https://www.image2url.com/r2/default/gifs/1782348023841-7f46763a-54b5-4c8c-976d-1fc0b8951d88.gif",
        siguiente: "parcial"
    },
    consL2: {
        texto: "Mediación fracasa. Escalada del conflicto.",
        gif: "https://www.image2url.com/r2/default/gifs/1782531421224-b6b7b048-d64b-4b1b-a9a6-ebf19f9116dd.gif",
        siguiente: "fracaso"
    },
    p6: {
        texto: "Operación casi finalizada. Enemigo pide tregua. ¿Acepta?",
        gif: "https://www.image2url.com/r2/default/gifs/1782531421224-b6b7b048-d64b-4b1b-a9a6-ebf19f9116dd.gif",
        opciones_raw: [
            { texto: "Aceptar tregua", destino: "parcial" },
            { texto: "Rechazar y continuar", destino: "exito" }
        ]
    },
    p6b: {
        texto: "Ha perdido posiciones. Moral baja. ¿Qué orden da?",
        gif: "https://www.image2url.com/r2/default/gifs/1782531728490-84dc41b2-93c6-497f-8a65-1bd955d57f59.gif",
        opciones_raw: [
            { texto: "Reorganizar y contraatacar", destino: "parcial" },
            { texto: "Retirada estratégica", destino: "fracaso" }
        ]
    }
};

// ===== ESCENARIO 2: DISTURBIOS (largo) =====
const escenarioDisturbios = {
    nombre: "Control de Orden Público",
    p1: {
        texto: "Manifestaciones violentas en el centro. Grupos encapuchados atacan comercios. ¿Qué ordena?",
        gif: "https://www.image2url.com/r2/default/gifs/1782532269712-58b416aa-210b-4ff5-b911-bbcb72f14a1f.gif",
        opciones_raw: [
            { texto: "Desplegar antimotines", destino: "consA1" },
            { texto: "Dialogar con líderes", destino: "consA2" },
            { texto: "Solicitar refuerzos y esperar", destino: "consA3" }
        ]
    },
    consA1: {
        texto: "Antimotines contienen disturbios. 5 detenidos.",
        gif: "https://www.image2url.com/r2/default/gifs/1782346262358-d817b7ef-d04c-4d68-8fff-bf6f6cb281a4.gif",
        siguiente: "p2"
    },
    consA2: {
        texto: "Diálogo calma ánimos temporalmente. Líderes piden 24h.",
        gif: "https://www.image2url.com/r2/default/gifs/1782345646233-66efe9eb-aa48-4d7e-838e-08baa14ff815.gif",
        siguiente: "p2b"
    },
    consA3: {
        texto: "Espera permite saqueos masivos.",
        gif: "https://www.image2url.com/r2/default/gifs/1783196826763-436af878-4736-4e5c-aaf8-457a852714ae.gif",
        siguiente: "p2c"
    },
    p2: {
        texto: "Enfrentamientos escalan. Lanzan cócteles molotov. ¿Qué ordena?",
        gif: "https://www.image2url.com/r2/default/gifs/1782532586728-669b649e-cbdb-444a-931d-8dedb36acdd4.gif",
        opciones_raw: [
            { texto: "Gas lacrimógeno", destino: "consB1" },
            { texto: "Retirarse y esperar", destino: "consB2" },
            { texto: "Negociar nuevamente", destino: "consB3" }
        ]
    },
    consB1: {
        texto: "Gas dispersa multitud, varios heridos. Situación se calma.",
        gif: "https://www.image2url.com/r2/default/gifs/1782346995635-05421d7e-c3ff-4934-a228-8a679571a5b1.gif",
        siguiente: "p3"
    },
    consB2: {
        texto: "Retirada permite que disturbios se extiendan.",
        gif: "https://www.image2url.com/r2/default/gifs/1782531728490-84dc41b2-93c6-497f-8a65-1bd955d57f59.gif",
        siguiente: "p3b"
    },
    consB3: {
        texto: "Líderes dialogan, pero radicales no obedecen.",
        gif: "https://www.image2url.com/r2/default/gifs/1782345646233-66efe9eb-aa48-4d7e-838e-08baa14ff815.gif",
        siguiente: "p3c"
    },
    p2b: {
        texto: "Durante tregua, radicales se reagrupan. ¿Qué acción?",
        gif: "https://www.image2url.com/r2/default/gifs/1782533050040-a49e9e92-dda9-4473-b0a8-d851568eb32c.gif",
        opciones_raw: [
            { texto: "Operaciones de inteligencia", destino: "consC1" },
            { texto: "Reforzar puntos críticos", destino: "consC2" },
            { texto: "Mantener calma", destino: "consC3" }
        ]
    },
    consC1: {
        texto: "Identifican y detienen líderes radicales.",
        gif: "https://www.image2url.com/r2/default/gifs/1783196346278-d02201ce-0726-4a65-9440-89159f19c955.gif",
        siguiente: "p4"
    },
    consC2: {
        texto: "Refuerzo disuade nuevos ataques.",
        gif: "https://www.image2url.com/r2/default/gifs/1782346262358-d817b7ef-d04c-4d68-8fff-bf6f6cb281a4.gif",
        siguiente: "p4b"
    },
    consC3: {
        texto: "Radicales atacan de nuevo, más daños.",
        gif: "https://www.image2url.com/r2/default/gifs/1782532269712-58b416aa-210b-4ff5-b911-bbcb72f14a1f.gif",
        siguiente: "p4c"
    },
    p2c: {
        texto: "Saqueos se extienden. ¿Qué prioriza?",
        gif: "https://www.image2url.com/r2/default/gifs/1783196826763-436af878-4736-4e5c-aaf8-457a852714ae.gif",
        opciones_raw: [
            { texto: "Proteger comercios", destino: "consD1" },
            { texto: "Evacuar civiles", destino: "consD2" }
        ]
    },
    consD1: {
        texto: "Protegen bienes, pero hay heridos civiles.",
        gif: "https://www.image2url.com/r2/default/gifs/1782346262358-d817b7ef-d04c-4d68-8fff-bf6f6cb281a4.gif",
        siguiente: "p5"
    },
    consD2: {
        texto: "Evacuación exitosa, pero pérdidas millonarias.",
        gif: "https://www.image2url.com/r2/default/gifs/1782344602151-3c4d5460-9067-4a68-9410-9517d8f30190.gif",
        siguiente: "p5b"
    },
    p3: {
        texto: "Orden restablecido en mayoría de zonas. ¿Cómo procede?",
        gif: "https://www.image2url.com/r2/default/gifs/1782345971074-4f83ce1f-1ec9-457b-8ff9-3de002a2a5e3.gif",
        opciones_raw: [
            { texto: "Mantener presencia policial", destino: "consE1" },
            { texto: "Operaciones de reconstrucción", destino: "consE2" }
        ]
    },
    consE1: {
        texto: "Presencia evita nuevos disturbios.",
        gif: "https://www.image2url.com/r2/default/gifs/1782346262358-d817b7ef-d04c-4d68-8fff-bf6f6cb281a4.gif",
        siguiente: "exito"
    },
    consE2: {
        texto: "Reconstrucción gana apoyo ciudadano.",
        gif: "https://www.image2url.com/r2/default/gifs/1783365586324-73a43515-1971-445b-91f7-5fdc83c2c85c.gif",
        siguiente: "exito"
    },
    p3b: {
        texto: "Disturbios se expanden a zonas residenciales. ¿Qué ordena?",
        gif: "https://www.image2url.com/r2/default/gifs/1783197416390-467a286d-eba4-431c-a735-17dc8e8cb6e3.gif",
        opciones_raw: [
            { texto: "Toque de queda y ejército", destino: "consF1" },
            { texto: "Negociar con líderes vecinales", destino: "consF2" }
        ]
    },
    consF1: {
        texto: "Toque de queda restablece orden, pero tensiones sociales.",
        gif: "https://www.image2url.com/r2/default/gifs/1782345971074-4f83ce1f-1ec9-457b-8ff9-3de002a2a5e3.gif",
        siguiente: "parcial"
    },
    consF2: {
        texto: "Negociación reduce violencia, pero radicales persisten.",
        gif: "https://www.image2url.com/r2/default/gifs/1782345646233-66efe9eb-aa48-4d7e-838e-08baa14ff815.gif",
        siguiente: "parcial"
    },
    p3c: {
        texto: "Radicales se refugian en barrio popular. ¿Qué acción?",
        gif: "https://www.image2url.com/r2/default/gifs/1783197843287-33731a3c-e55a-4352-b5b8-510d84fe6be9.gif",
        opciones_raw: [
            { texto: "Cercar y negociar", destino: "consG1" },
            { texto: "Allanamientos selectivos", destino: "consG2" }
        ]
    },
    consG1: {
        texto: "Logran rendición de radicales.",
        gif: "https://www.image2url.com/r2/default/gifs/1781987769945-849e75cc-c483-4243-bd65-1bd11996fd98.gif",
        siguiente: "exito"
    },
    consG2: {
        texto: "Allanamientos capturan cabecillas, con heridos civiles.",
        gif: "https://www.image2url.com/r2/default/gifs/1782346262358-d817b7ef-d04c-4d68-8fff-bf6f6cb281a4.gif",
        siguiente: "fracaso"
    },
    p4: {
        texto: "Líderes detenidos. Estrategia de largo plazo.",
        gif: "https://www.image2url.com/r2/default/gifs/1783196346278-d02201ce-0726-4a65-9440-89159f19c955.gif",
        opciones_raw: [
            { texto: "Programas sociales", destino: "consH1" },
            { texto: "Aumentar vigilancia", destino: "consH2" }
        ]
    },
    consH1: {
        texto: "Programas mejoran convivencia.",
        gif: "https://www.image2url.com/r2/default/gifs/1783366639611-56a1d1fd-363e-418c-81a2-a22e5377ded2.gif",
        siguiente: "exito"
    },
    consH2: {
        texto: "Vigilancia reduce delincuencia, pero persiste malestar.",
        gif: "https://www.image2url.com/r2/default/gifs/1782346262358-d817b7ef-d04c-4d68-8fff-bf6f6cb281a4.gif",
        siguiente: "parcial"
    },
    p4b: {
        texto: "Orden parcial, focos de resistencia. ¿Qué hace?",
        gif: "https://www.image2url.com/r2/default/gifs/1783209092708-70c459a9-762e-495f-a8cc-e5a25fc24bba.gif",
        opciones_raw: [
            { texto: "Intensificar presencia policial", destino: "consI1" },
            { texto: "Diálogos comunitarios", destino: "consI2" }
        ]
    },
    consI1: {
        texto: "Presión policial disuelve focos.",
        gif: "https://www.image2url.com/r2/default/gifs/1782346262358-d817b7ef-d04c-4d68-8fff-bf6f6cb281a4.gif",
        siguiente: "exito"
    },
    consI2: {
        texto: "Diálogo reduce tensión, requiere más tiempo.",
        gif: "https://www.image2url.com/r2/default/gifs/1782345646233-66efe9eb-aa48-4d7e-838e-08baa14ff815.gif",
        siguiente: "parcial"
    },
    p4c: {
        texto: "Daños materiales enormes. ¿Prioridad?",
        gif: "https://www.image2url.com/r2/default/gifs/1783365127440-bd0879cf-4085-46d7-9d82-27bac1b78095.gif",
        opciones_raw: [
            { texto: "Reconstruir infraestructura", destino: "consJ1" },
            { texto: "Capturar responsables", destino: "consJ2" }
        ]
    },
    consJ1: {
        texto: "Reconstrucción gana apoyo ciudadano.",
        gif: "https://www.image2url.com/r2/default/gifs/1783365586324-73a43515-1971-445b-91f7-5fdc83c2c85c.gif",
        siguiente: "parcial"
    },
    consJ2: {
        texto: "Capturas exitosas, pero ciudad en ruinas.",
        gif: "https://www.image2url.com/r2/default/gifs/1782346262358-d817b7ef-d04c-4d68-8fff-bf6f6cb281a4.gif",
        siguiente: "fracaso"
    },
    p5: {
        texto: "Heridos civiles necesitan atención. ¿Qué ordena?",
        gif: "https://www.image2url.com/r2/default/gifs/1782344966215-9e85e24c-ab40-49f0-8914-ba162fb747bd.gif",
        opciones_raw: [
            { texto: "Ambulancias y hospital de campaña", destino: "consK1" },
            { texto: "Ayuda humanitaria internacional", destino: "consK2" }
        ]
    },
    consK1: {
        texto: "Atención médica salva vidas.",
        gif: "https://www.image2url.com/r2/default/gifs/1782344966215-9e85e24c-ab40-49f0-8914-ba162fb747bd.gif",
        siguiente: "exito"
    },
    consK2: {
        texto: "Ayuda llega tarde. Se pierden vidas.",
        gif: "https://www.image2url.com/r2/default/gifs/1782344966215-9e85e24c-ab40-49f0-8914-ba162fb747bd.gif",
        siguiente: "fracaso"
    },
    p5b: {
        texto: "Economía local afectada por saqueos. ¿Qué prioriza?",
        gif: "https://www.image2url.com/r2/default/gifs/1783366096157-46388f61-2a4e-4782-8cdc-dcc4991cd400.gif",
        opciones_raw: [
            { texto: "Ayudas a comerciantes", destino: "consL1" },
            { texto: "Reforzar seguridad", destino: "consL2" }
        ]
    },
    consL1: {
        texto: "Ayudas reactivan comercio.",
        gif: "https://www.image2url.com/r2/default/gifs/1783366639611-56a1d1fd-363e-418c-81a2-a22e5377ded2.gif",
        siguiente: "exito"
    },
    consL2: {
        texto: "Seguridad evita nuevos incidentes, pero economía se hunde.",
        gif: "https://www.image2url.com/r2/default/gifs/1782346262358-d817b7ef-d04c-4d68-8fff-bf6f6cb281a4.gif",
        siguiente: "parcial"
    }
};

// ===== ESCENARIO 3: INFILTRACIÓN (largo) =====
const escenarioInfiltracion = {
    nombre: "Seguridad Perimetral de la Base",
    p1: {
        texto: "Sensores detectan intrusión en perímetro norte. Son las 03:00. ¿Qué ordena?",
        gif: "https://www.image2url.com/r2/default/gifs/1783366986807-7f02b8de-dc28-47e3-b21a-ff0bd0e991f6.gif",
        opciones_raw: [
            { texto: "Activar código rojo", destino: "consA1" },
            { texto: "Enviar ronda de investigación", destino: "consA2" },
            { texto: "Revisar cámaras", destino: "consA3" }
        ]
    },
    consA1: {
        texto: "Código rojo activado. Se sellan salidas. Movimientos en comunicaciones.",
        gif: "https://www.image2url.com/r2/default/gifs/1783367622347-68317f8e-4352-4059-bc6e-f76a38845151.gif",
        siguiente: "p2"
    },
    consA2: {
        texto: "Ronda encuentra brecha, sin intrusos a la vista.",
        gif: "https://www.image2url.com/r2/default/gifs/1783374616100-31a1ac15-7113-4671-9e3c-52a1f18b7e25.gif",
        siguiente: "p2b"
    },
    consA3: {
        texto: "Mientras revisa cámaras, intrusos acceden a centro de datos.",
        gif: "https://www.image2url.com/r2/default/gifs/1782347472455-df0e84e3-b6f9-48e0-bf53-7ee3089479e1.gif",
        siguiente: "p2c"
    },
    p2: {
        texto: "Intrusos en área de comunicaciones. ¿Qué ordena?",
        gif: "https://www.image2url.com/r2/default/gifs/1783375103987-9d8ddd4f-337e-4e1e-93c5-cd250cba4890.gif",
        opciones_raw: [
            { texto: "Equipo de reacción rápida", destino: "consB1" },
            { texto: "Aislar área y cortar energía", destino: "consB2" },
            { texto: "Negociar", destino: "consB3" }
        ]
    },
    consB1: {
        texto: "Capturan dos intrusos, uno escapa a hangares.",
        gif: "https://www.image2url.com/r2/default/gifs/1782348023841-7f46763a-54b5-4c8c-976d-1fc0b8951d88.gif",
        siguiente: "p3"
    },
    consB2: {
        texto: "Corte de energía dificulta visión. Intrusos se mueven al arsenal.",
        gif: "https://www.image2url.com/r2/default/gifs/1783375559754-8a6322ff-f7c1-4576-ab55-bd539fae033a.gif",
        siguiente: "p3b"
    },
    consB3: {
        texto: "No negocian. Se atrincheran con rehenes.",
        gif: "https://www.image2url.com/r2/default/gifs/1783910911918-e577ec11-5527-4491-abef-077dff4e727e.gif",
        siguiente: "p3c"
    },
    p2b: {
        texto: "Brecha abierta. No hay señales. ¿Qué acción?",
        gif: "https://www.image2url.com/r2/default/gifs/1783375814090-07d6626d-a89f-4633-8454-08acabcf1c20.gif",
        opciones_raw: [
            { texto: "Reparar brecha y aumentar vigilancia", destino: "consC1" },
            { texto: "Patrullas al exterior para buscar rastros", destino: "consC2" },
            { texto: "Desestimar alerta", destino: "consC3" }
        ]
    },
    consC1: {
        texto: "Reparación completa. Horas después, robaron información clasificada.",
        gif: "https://www.image2url.com/r2/default/gifs/1783908466997-3f7f7478-a87d-45f8-bfa4-52d32eceb29f.gif",
        siguiente: "p4"
    },
    consC2: {
        texto: "Patrullas encuentran huellas hacia pueblo cercano.",
        gif: "https://www.image2url.com/r2/default/gifs/1783374616100-31a1ac15-7113-4671-9e3c-52a1f18b7e25.gif",
        siguiente: "p4b"
    },
    consC3: {
        texto: "Al día siguiente, descubren equipos de espionaje instalados.",
        gif: "https://www.image2url.com/r2/default/gifs/1782347472455-df0e84e3-b6f9-48e0-bf53-7ee3089479e1.gif",
        siguiente: "p4c"
    },
    p2c: {
        texto: "Intrusos en centro de datos. ¿Prioridad?",
        gif: "https://www.image2url.com/r2/default/gifs/1783909356161-da663261-b80e-41e1-b85c-e1f01bff57e3.gif",
        opciones_raw: [
            { texto: "Proteger información clasificada", destino: "consD1" },
            { texto: "Capturar intrusos vivos", destino: "consD2" }
        ]
    },
    consD1: {
        texto: "Desconectan servidores. Información a salvo, intrusos huyen.",
        gif: "https://www.image2url.com/r2/default/gifs/1783909728201-02bafc00-206e-4357-9826-f8887ca0c3be.gif",
        siguiente: "p5"
    },
    consD2: {
        texto: "Capturan intrusos, pero datos fueron copiados.",
        gif: "https://www.image2url.com/r2/default/gifs/1782348023841-7f46763a-54b5-4c8c-976d-1fc0b8951d88.gif",
        siguiente: "p5b"
    },
    p3: {
        texto: "Intruso se oculta en hangares. ¿Qué ordena?",
        gif: "https://www.image2url.com/r2/default/gifs/1783910010804-3d40a06b-b328-496c-9615-87ac77dae57c.gif",
        opciones_raw: [
            { texto: "Cercar y usar perros detectores", destino: "consE1" },
            { texto: "Entrar con equipo táctico", destino: "consE2" }
        ]
    },
    consE1: {
        texto: "Perros detectan intruso escondido. Capturado.",
        gif: "https://www.image2url.com/r2/default/gifs/1782348547013-6b177aa1-f688-4eb4-9738-e0a49f20faf4.gif",
        siguiente: "p6"
    },
    consE2: {
        texto: "Equipo lo acorrala, pero se inmola con granada.",
        gif: "https://www.image2url.com/r2/default/gifs/1781983547844-66b696ad-e9d4-46df-b97a-f2e673f84af6.gif",
        siguiente: "p6b"
    },
    p3b: {
        texto: "Intrusos se dirigen al arsenal. ¿Qué acción?",
        gif: "https://www.image2url.com/r2/default/gifs/1783910253008-4058382c-d12c-4529-a7f7-332b1f198be4.gif",
        opciones_raw: [
            { texto: "Bloquear acceso", destino: "consF1" },
            { texto: "Permitirles entrar para atraparlos", destino: "consF2" }
        ]
    },
    consF1: {
        texto: "Se bloquea acceso. Intrusos se rinden.",
        gif: "https://www.image2url.com/r2/default/gifs/1781987769945-849e75cc-c483-4243-bd65-1bd11996fd98.gif",
        siguiente: "exito"
    },
    consF2: {
        texto: "Al entrar, activan bomba. Explosión y daños.",
        gif: "https://www.image2url.com/r2/default/gifs/1781983547844-66b696ad-e9d4-46df-b97a-f2e673f84af6.gif",
        siguiente: "fracaso"
    },
    p3c: {
        texto: "Intrusos tienen rehenes. ¿Cómo procede?",
        gif: "https://www.image2url.com/r2/default/gifs/1783910911918-e577ec11-5527-4491-abef-077dff4e727e.gif",
        opciones_raw: [
            { texto: "Negociación", destino: "consG1" },
            { texto: "Asalto relámpago", destino: "consG2" }
        ]
    },
    consG1: {
        texto: "Negociación exitosa: liberan rehenes a cambio de helicóptero.",
        gif: "https://www.image2url.com/r2/default/gifs/1783911224650-1c444c7c-dac9-4955-9d92-2c057cde6c18.gif",
        siguiente: "parcial"
    },
    consG2: {
        texto: "Asalto exitoso, dos rehenes heridos.",
        gif: "https://www.image2url.com/r2/default/gifs/1781989372665-82cfb24b-212f-4d37-9cfc-ae56a1b4d6b0.gif",
        siguiente: "parcial"
    },
    p4: {
        texto: "Información robada incluye planes de defensa. ¿Qué hace?",
        gif: "https://www.image2url.com/r2/default/gifs/1783911485917-3508f407-c88a-4aa6-a8bb-2d5bf4b4d2fc.gif",
        opciones_raw: [
            { texto: "Cambiar códigos y protocolos", destino: "consH1" },
            { texto: "Rastrear responsables", destino: "consH2" }
        ]
    },
    consH1: {
        texto: "Códigos cambiados. Información obsoleta.",
        gif: "https://www.image2url.com/r2/default/gifs/1783912152265-b1e14acf-cd8e-4e9d-95a1-4b73baf56ff2.gif",
        siguiente: "exito"
    },
    consH2: {
        texto: "Recuperan información antes de ser vendida.",
        gif: "https://www.image2url.com/r2/default/gifs/1783196346278-d02201ce-0726-4a65-9440-89159f19c955.gif",
        siguiente: "exito"
    },
    p4b: {
        texto: "Huellas llevan a casa en pueblo. ¿Qué orden?",
        gif: "https://www.image2url.com/r2/default/gifs/1783913725662-a8c311b7-3f5f-4c3f-a57f-c49b33f06745.gif",
        opciones_raw: [
            { texto: "Solicitar orden de allanamiento", destino: "consI1" },
            { texto: "Allanar sin orden por urgencia", destino: "consI2" }
        ]
    },
    consI1: {
        texto: "Orden llega tarde. Sospechosos huyen.",
        gif: "https://www.image2url.com/r2/default/gifs/1783374616100-31a1ac15-7113-4671-9e3c-52a1f18b7e25.gif",
        siguiente: "parcial"
    },
    consI2: {
        texto: "Capturan espías y recuperan material.",
        gif: "https://www.image2url.com/r2/default/gifs/1784743013722-dc12b240-b510-4d2c-9b44-244daa64ec0e.gif",
        siguiente: "exito"
    },
    p4c: {
        texto: "Equipos de espionaje activos. ¿Qué acción?",
        gif: "https://www.image2url.com/r2/default/gifs/1784743364576-27269487-99cd-4838-a8f2-84f22d9c7e3a.gif",
        opciones_raw: [
            { texto: "Desconectar red y auditoría", destino: "consJ1" },
            { texto: "Usar equipos para enviar información falsa", destino: "consJ2" }
        ]
    },
    consJ1: {
        texto: "Auditoría descubre sistema comprometido. Reemplazan equipos.",
        gif: "https://www.image2url.com/r2/default/gifs/1784743708420-7bba6165-ec08-4d81-ae33-0adb4dd47962.gif",
        siguiente: "parcial"
    },
    consJ2: {
        texto: "Contra-inteligencia funciona. Desenmascaran red de espionaje.",
        gif: "https://www.image2url.com/r2/default/gifs/1783196346278-d02201ce-0726-4a65-9440-89159f19c955.gif",
        siguiente: "exito"
    },
    p5: {
        texto: "Intrusos huyeron, dejaron pistas. ¿Qué prioriza?",
        gif: "https://www.image2url.com/r2/default/gifs/1784744052661-af744bad-e1dc-4f07-ae06-bf3fe1c4b70d.gif",
        opciones_raw: [
            { texto: "Analizar pistas", destino: "consK1" },
            { texto: "Reforzar seguridad", destino: "consK2" }
        ]
    },
    consK1: {
        texto: "Identifican célula enemiga. Toman medidas.",
        gif: "https://www.image2url.com/r2/default/gifs/1783196346278-d02201ce-0726-4a65-9440-89159f19c955.gif",
        siguiente: "exito"
    },
    consK2: {
        texto: "Seguridad reforzada, pero culpables no capturados.",
        gif: "https://www.image2url.com/r2/default/gifs/1783374616100-31a1ac15-7113-4671-9e3c-52a1f18b7e25.gif",
        siguiente: "parcial"
    },
    p5b: {
        texto: "Intrusos capturados se niegan a hablar. ¿Qué técnica?",
        gif: "https://www.image2url.com/r2/default/gifs/1784744567292-43e6718f-24a8-45cd-b65f-e1aa0a229c47.gif",
        opciones_raw: [
            { texto: "Interrogatorio psicológico", destino: "consL1" },
            { texto: "Ofrecer reducción de condena", destino: "consL2" }
        ]
    },
    consL1: {
        texto: "Uno confiesa red de apoyo.",
        gif: "https://www.image2url.com/r2/default/gifs/1782348923748-3d33047d-628e-4cd2-af45-757fd4ef6813.gif",
        siguiente: "exito"
    },
    consL2: {
        texto: "Obtienen información valiosa sobre futuros ataques.",
        gif: "https://www.image2url.com/r2/default/gifs/1782344003164-465dec20-0d87-4f0b-a511-fcab79a9b30a.gif",
        siguiente: "exito"
    },
    p6: {
        texto: "Intruso capturado ofrece información a cambio de asilo. ¿Acepta?",
        gif: "https://www.image2url.com/r2/default/gifs/1784749020304-ff1311eb-8111-40e2-addb-c71e81b93aae.gif",
        opciones_raw: [
            { texto: "Aceptar trato", destino: "exito" },
            { texto: "Rechazar y juzgar", destino: "parcial" }
        ]
    },
    p6b: {
        texto: "Intruso murió en explosión. No hay pistas. ¿Qué concluye?",
        gif: "https://www.image2url.com/r2/default/gifs/1784749714882-659984bc-4f8b-42cc-b399-005bc8e9d45c.gif",
        opciones_raw: [
            { texto: "Amenaza continúa. Incrementar vigilancia", destino: "parcial" },
            { texto: "Cerrar caso por falta de pruebas", destino: "fracaso" }
        ]
    }
};

// ===== ESCENARIO 4: CIBERATAQUE (corto - 3 niveles) =====
const escenarioCiberataque = {
    nombre: "Ciberataque a sistemas de comando",
    p1: {
        texto: "Se detecta un acceso no autorizado a la red de comunicaciones de la base. Los sistemas de comando están siendo escaneados. ¿Qué ordena?",
        gif: "https://www.image2url.com/r2/default/gifs/1784743364576-27269487-99cd-4838-a8f2-84f22d9c7e3a.gif",
        opciones_raw: [
            { texto: "Aislar físicamente los servidores principales", destino: "consA1" },
            { texto: "Rastrear la fuente del ataque", destino: "consA2" },
            { texto: "Ignorar y esperar a que pase", destino: "consA3" }
        ]
    },
    consA1: {
        texto: "Los servidores se aíslan, pero se pierde conectividad con las unidades móviles.",
        gif: "https://www.image2url.com/r2/default/gifs/1783909728201-02bafc00-206e-4357-9826-f8887ca0c3be.gif",
        siguiente: "p2"
    },
    consA2: {
        texto: "El rastreo identifica una dirección IP extranjera. Se activa el protocolo de contrainteligencia.",
        gif: "https://www.image2url.com/r2/default/gifs/1783196346278-d02201ce-0726-4a65-9440-89159f19c955.gif",
        siguiente: "p2b"
    },
    consA3: {
        texto: "El ataque se propaga a los sistemas de armas. Se pierde control de misiles.",
        gif: "https://www.image2url.com/r2/default/gifs/1783909356161-da663261-b80e-41e1-b85c-e1f01bff57e3.gif",
        siguiente: "p2c"
    },
    p2: {
        texto: "Las unidades móviles no reciben órdenes. ¿Qué acción prioriza?",
        gif: "https://www.image2url.com/r2/default/gifs/1783909356161-da663261-b80e-41e1-b85c-e1f01bff57e3.gif",
        opciones_raw: [
            { texto: "Restablecer comunicaciones por radio alternativa", destino: "consB1" },
            { texto: "Enviar mensajeros físicos con las órdenes", destino: "consB2" }
        ]
    },
    consB1: {
        texto: "La radio alternativa funciona. Las unidades recuperan el contacto. El ciberataque es contenido.",
        gif: "https://www.image2url.com/r2/default/gifs/1783912152265-b1e14acf-cd8e-4e9d-95a1-4b73baf56ff2.gif",
        siguiente: "exito"
    },
    consB2: {
        texto: "Los mensajeros sufren una emboscada. Las órdenes no llegan a tiempo.",
        gif: "https://www.image2url.com/r2/default/gifs/1781983547844-66b696ad-e9d4-46df-b97a-f2e673f84af6.gif",
        siguiente: "parcial"
    },
    p2b: {
        texto: "La IP rastreada pertenece a un país neutral. ¿Cómo procede?",
        gif: "https://www.image2url.com/r2/default/gifs/1783911485917-3508f407-c88a-4aa6-a8bb-2d5bf4b4d2fc.gif",
        opciones_raw: [
            { texto: "Informar al ministerio de defensa", destino: "consC1" },
            { texto: "Lanzar un contraataque cibernético inmediato", destino: "consC2" }
        ]
    },
    consC1: {
        texto: "La diplomacia detiene el ataque. Se refuerzan los cortafuegos.",
        gif: "https://www.image2url.com/r2/default/gifs/1782344003164-465dec20-0d87-4f0b-a511-fcab79a9b30a.gif",
        siguiente: "exito"
    },
    consC2: {
        texto: "El contraataque daña servidores aliados por error. Escándalo internacional.",
        gif: "https://www.image2url.com/r2/default/gifs/1781983547844-66b696ad-e9d4-46df-b97a-f2e673f84af6.gif",
        siguiente: "fracaso"
    },
    p2c: {
        texto: "Los misiles están bajo control enemigo. ¿Qué hace?",
        gif: "https://www.image2url.com/r2/default/gifs/1783909356161-da663261-b80e-41e1-b85c-e1f01bff57e3.gif",
        opciones_raw: [
            { texto: "Autodestruir los misiles remotamente", destino: "consD1" },
            { texto: "Intentar recuperar el control con códigos de emergencia", destino: "consD2" }
        ]
    },
    consD1: {
        texto: "Los misiles se autodestruyen sin víctimas. Pérdida de material.",
        gif: "https://www.image2url.com/r2/default/gifs/1781983547844-66b696ad-e9d4-46df-b97a-f2e673f84af6.gif",
        siguiente: "parcial"
    },
    consD2: {
        texto: "Se recupera el control, pero el enemigo copia la tecnología.",
        gif: "https://www.image2url.com/r2/default/gifs/1781983547844-66b696ad-e9d4-46df-b97a-f2e673f84af6.gif",
        siguiente: "fracaso"
    }
};

// ===== ESCENARIO 5: EVACUACIÓN (corto - 4 niveles) =====
const escenarioEvacuacion = {
    nombre: "Evacuación de personal en zona hostil",
    p1: {
        texto: "Un convoy de suministros ha sido emboscado en una carretera secundaria. Hay 5 soldados heridos y el enemigo se acerca. ¿Qué ordena?",
        gif: "https://www.image2url.com/r2/default/gifs/1782345283172-76f29534-8406-4d83-ad45-ead1934cc58e.gif",
        opciones_raw: [
            { texto: "Enviar helicópteros de evacuación médica", destino: "consA1" },
            { texto: "Desplegar un pelotón para asegurar la zona", destino: "consA2" },
            { texto: "Negociar con el enemigo un alto el fuego temporal", destino: "consA3" }
        ]
    },
    consA1: {
        texto: "Los helicópteros se acercan, pero el enemigo tiene lanzacohetes.",
        gif: "https://www.image2url.com/r2/default/gifs/1781983346125-6d238762-bb71-465d-aeab-2d3a4c5683f0.gif",
        siguiente: "p2"
    },
    consA2: {
        texto: "El pelotón establece un perímetro defensivo. El enemigo se repliega.",
        gif: "https://www.image2url.com/r2/default/gifs/1781982706636-2a9e6056-4485-45db-9894-3d8cce1ff77e.gif",
        siguiente: "p2b"
    },
    consA3: {
        texto: "El enemigo acepta negociar, pero pone condiciones políticas.",
        gif: "https://www.image2url.com/r2/default/gifs/1782344003164-465dec20-0d87-4f0b-a511-fcab79a9b30a.gif",
        siguiente: "p2c"
    },
    p2: {
        texto: "Los helicópteros son vulnerables. ¿Qué protección envía?",
        gif: "https://www.image2url.com/r2/default/gifs/1781983346125-6d238762-bb71-465d-aeab-2d3a4c5683f0.gif",
        opciones_raw: [
            { texto: "Drones de combate para supresión de amenazas", destino: "consB1" },
            { texto: "Fuego de artillería contra las posiciones enemigas", destino: "consB2" }
        ]
    },
    consB1: {
        texto: "Los drones neutralizan los lanzacohetes. Los helicópteros evacúan a los heridos.",
        gif: "https://www.image2url.com/r2/default/gifs/1781983486183-91576fe8-f8b8-43c7-88cd-ce72c3bfe448.gif",
        siguiente: "p3"
    },
    consB2: {
        texto: "La artillería daña accidentalmente el convoy. Más bajas.",
        gif: "https://www.image2url.com/r2/default/gifs/1781983547844-66b696ad-e9d4-46df-b97a-f2e673f84af6.gif",
        siguiente: "p3b"
    },
    p2b: {
        texto: "El enemigo se reagrupa a 500 metros. ¿Qué ordena?",
        gif: "https://www.image2url.com/r2/default/gifs/1781982706636-2a9e6056-4485-45db-9894-3d8cce1ff77e.gif",
        opciones_raw: [
            { texto: "Retirar el pelotón con los heridos", destino: "consC1" },
            { texto: "Atacar la posición enemiga antes de que reciban refuerzos", destino: "consC2" }
        ]
    },
    consC1: {
        texto: "La retirada es ordenada. Todos los soldados se salvan.",
        gif: "https://www.image2url.com/r2/default/gifs/1782531728490-84dc41b2-93c6-497f-8a65-1bd955d57f59.gif",
        siguiente: "p3c"
    },
    consC2: {
        texto: "El ataque sorpresa destruye la célula enemiga. Victoria táctica.",
        gif: "https://www.image2url.com/r2/default/gifs/1781983547844-66b696ad-e9d4-46df-b97a-f2e673f84af6.gif",
        siguiente: "exito"
    },
    p2c: {
        texto: "El enemigo pide liberar prisioneros a cambio del alto el fuego. ¿Acepta?",
        gif: "https://www.image2url.com/r2/default/gifs/1782344003164-465dec20-0d87-4f0b-a511-fcab79a9b30a.gif",
        opciones_raw: [
            { texto: "Aceptar el intercambio", destino: "consD1" },
            { texto: "Rechazar y rescatar por la fuerza", destino: "consD2" }
        ]
    },
    consD1: {
        texto: "Se liberan prisioneros, pero la moral baja. Misión cumplida a medias.",
        gif: "https://www.image2url.com/r2/default/gifs/1781987769945-849e75cc-c483-4243-bd65-1bd11996fd98.gif",
        siguiente: "parcial"
    },
    consD2: {
        texto: "El rescate es exitoso, pero dos soldados mueren en la operación.",
        gif: "https://www.image2url.com/r2/default/gifs/1781989372665-82cfb24b-212f-4d37-9cfc-ae56a1b4d6b0.gif",
        siguiente: "fracaso"
    },
    p3: {
        texto: "Los heridos llegan al hospital de campaña. ¿Qué recurso asigna?",
        gif: "https://www.image2url.com/r2/default/gifs/1782344966215-9e85e24c-ab40-49f0-8914-ba162fb747bd.gif",
        opciones_raw: [
            { texto: "Priorizar cirugías de emergencia", destino: "exito" },
            { texto: "Evacuar a los más graves a la capital", destino: "parcial" }
        ]
    },
    p3b: {
        texto: "Las bajas son numerosas. Se necesita apoyo médico adicional. ¿Qué hace?",
        gif: "https://www.image2url.com/r2/default/gifs/1782344966215-9e85e24c-ab40-49f0-8914-ba162fb747bd.gif",
        opciones_raw: [
            { texto: "Solicitar ayuda humanitaria internacional", destino: "parcial" },
            { texto: "Reorganizar los recursos propios", destino: "fracaso" }
        ]
    },
    p3c: {
        texto: "La retirada fue exitosa, pero se perdió el suministro. ¿Próximo paso?",
        gif: "https://www.image2url.com/r2/default/gifs/1782531728490-84dc41b2-93c6-497f-8a65-1bd955d57f59.gif",
        opciones_raw: [
            { texto: "Programar un nuevo convoy con mayor escolta", destino: "exito" },
            { texto: "Abandonar la misión de suministros", destino: "fracaso" }
        ]
    }
};

// ===== ESCENARIO 6: AMENAZA DE BOMBA (corto - 3 niveles) =====
const escenarioBomba = {
    nombre: "Amenaza de bomba en instalación",
    p1: {
        texto: "Una llamada anónima advierte que hay un artefacto explosivo en el comedor de la base. Hay 300 soldados en el área. ¿Qué ordena?",
        gif: "https://www.image2url.com/r2/default/gifs/1781983547844-66b696ad-e9d4-46df-b97a-f2e673f84af6.gif",
        opciones_raw: [
            { texto: "Evacuar inmediatamente todo el edificio", destino: "consA1" },
            { texto: "Enviar a los artificieros a inspeccionar", destino: "consA2" },
            { texto: "Ignorar la llamada como falsa alarma", destino: "consA3" }
        ]
    },
    consA1: {
        texto: "La evacuación es masiva, pero ordenada. Los artificieros buscan la bomba.",
        gif: "https://www.image2url.com/r2/default/gifs/1782344602151-3c4d5460-9067-4a68-9410-9517d8f30190.gif",
        siguiente: "p2"
    },
    consA2: {
        texto: "Los artificieros encuentran un artefacto en una mochila. Tienen 10 minutos.",
        gif: "https://www.image2url.com/r2/default/gifs/1781983547844-66b696ad-e9d4-46df-b97a-f2e673f84af6.gif",
        siguiente: "p2b"
    },
    consA3: {
        texto: "La bomba explota. Hay 20 muertos y 50 heridos.",
        gif: "https://www.image2url.com/r2/default/gifs/1781983547844-66b696ad-e9d4-46df-b97a-f2e673f84af6.gif",
        siguiente: "fracaso"
    },
    p2: {
        texto: "Los artificieros no encuentran la bomba. ¿Qué hace?",
        gif: "https://www.image2url.com/r2/default/gifs/1781983547844-66b696ad-e9d4-46df-b97a-f2e673f84af6.gif",
        opciones_raw: [
            { texto: "Ampliar la búsqueda a zonas cercanas", destino: "consB1" },
            { texto: "Reintegrar al personal y declarar falsa alarma", destino: "consB2" }
        ]
    },
    consB1: {
        texto: "Se encuentra un artefacto camuflado en los ventiladores. Es desactivado a tiempo.",
        gif: "https://www.image2url.com/r2/default/gifs/1781983547844-66b696ad-e9d4-46df-b97a-f2e673f84af6.gif",
        siguiente: "exito"
    },
    consB2: {
        texto: "La bomba explosiona 30 minutos después. Daños estructurales graves.",
        gif: "https://www.image2url.com/r2/default/gifs/1781983547844-66b696ad-e9d4-46df-b97a-f2e673f84af6.gif",
        siguiente: "fracaso"
    },
    p2b: {
        texto: "El artefacto tiene un temporizador. ¿Qué técnica usa?",
        gif: "https://www.image2url.com/r2/default/gifs/1781983547844-66b696ad-e9d4-46df-b97a-f2e673f84af6.gif",
        opciones_raw: [
            { texto: "Desactivación manual con equipo especializado", destino: "consC1" },
            { texto: "Trasladar la bomba a un área desierta", destino: "consC2" }
        ]
    },
    consC1: {
        texto: "Los artificieros desactivan la bomba a 30 segundos del estallido. Héroe del día.",
        gif: "https://www.image2url.com/r2/default/gifs/1781981587356-83265fec-b07c-41c9-bca5-33a13a815d32.gif",
        siguiente: "exito"
    },
    consC2: {
        texto: "Durante el traslado, la bomba explota en un camión. Daños materiales.",
        gif: "https://www.image2url.com/r2/default/gifs/1781983547844-66b696ad-e9d4-46df-b97a-f2e673f84af6.gif",
        siguiente: "parcial"
    }
};

// ===== LISTA DE TODOS LOS ESCENARIOS =====
const escenariosPosibles = [
    escenarioFrontera,
    escenarioDisturbios,
    escenarioInfiltracion,
    escenarioCiberataque,
    escenarioEvacuacion,
    escenarioBomba
];

// ========== VARIABLES GLOBALES ==========

/** @type {Object|null} Escenario actualmente activo */
let escenarioActivo = null;

/** @type {string|null} Identificador del paso actual (ej. 'p1', 'consA1') */
let pasoActual = null;

/** @type {boolean} Indica si se está esperando una respuesta */
let esperando = false;

/** @type {string} Dificultad actual: 'easy', 'medium', 'hard' */
let dificultadActual = "medium";

/**
 * Historial de decisiones tomadas por el usuario.
 * @type {Array<{letra: string, texto: string, momento: string, tiempo: number}>}
 */
let historial = [];

/** @type {number|null} ID del intervalo del temporizador */
let temporizadorInterval = null;

/** @type {number} Tiempo restante en segundos */
let tiempoRestante = 60;

/** @type {boolean} Indica si el temporizador está activo */
let tiempoActivo = false;

/** @type {boolean} Indica si ya se tomó una decisión en la pregunta actual */
let decisionTomada = false;

/**
 * Tiempos máximos por dificultad (en segundos).
 * @type {Object.<string, number>}
 */
const tiemposDificultad = { easy: 90, medium: 60, hard: 45 };

/** @type {boolean} Modo entrenamiento (sin temporizador) */
let trainingModeFlag = false;

/** @type {Array<string>} Letras de las opciones elegidas en la partida actual */
let currentChosenLetters = [];

/** @type {boolean} Indica si ya se mostró el aviso de opciones aleatorias */
let avisoMostrado = false;

/**
 * Actualiza el contador de decisiones en la interfaz.
 * @function updateProgressCounter
 * @returns {void}
 */
function updateProgressCounter() {
    const counterSpan = document.getElementById("progressCounter");
    if (counterSpan) counterSpan.innerHTML = `<i class="fas fa-list-ol"></i> Decisiones: ${historial.length}`;
}

// ===== PREPARAR ESCENARIO (con barajado) =====

/**
 * Prepara un escenario clonándolo, barajando sus opciones y añadiendo logs.
 * @param {Object} escenarioBase - Objeto escenario original
 * @returns {Object} Escenario preparado con opciones barajadas
 */
function prepararEscenario(escenarioBase) {
    let escenario = JSON.parse(JSON.stringify(escenarioBase));
    for (let key in escenario) {
        if (escenario[key].opciones_raw) {
            let rawOpts = escenario[key].opciones_raw;
            let shuffled = shuffleOptions(rawOpts);
            escenario[key].opciones = shuffled;
        }
    }
    log('INFO', `Escenario preparado: ${escenario.nombre}`);
    return escenario;
}

// ===== FUNCIONES DE CONTROL =====

/**
 * Detiene el temporizador actual.
 * @function detenerTemporizador
 * @returns {void}
 */
function detenerTemporizador() {
    if(temporizadorInterval) clearInterval(temporizadorInterval);
    temporizadorInterval = null;
    tiempoActivo = false;
}

/**
 * Inicia el temporizador para la decisión actual.
 * @function iniciarTemporizador
 * @returns {void}
 */
function iniciarTemporizador() {
    if (trainingModeFlag) {
        document.getElementById("timerDisplay").textContent = "--:--";
        return;
    }
    detenerTemporizador();
    decisionTomada = false;
    tiempoRestante = tiemposDificultad[dificultadActual];
    actualizarDisplayTimer();
    tiempoActivo = true;
    temporizadorInterval = setInterval(() => {
        if(!tiempoActivo || decisionTomada) return;
        if(tiempoRestante <= 1) {
            detenerTemporizador();
            log('WARN', 'Tiempo agotado, seleccionando opción aleatoria');
            playSound("timeout");
            const botones = document.querySelectorAll('.option-btn');
            if(botones.length > 0 && !decisionTomada) {
                botones[Math.floor(Math.random()*botones.length)].click();
            } else {
                mostrarFeedback(resultadosBase.error);
            }
        } else {
            tiempoRestante--;
            actualizarDisplayTimer();
        }
    }, 1000);
}

/**
 * Actualiza el display del temporizador en la interfaz.
 * @function actualizarDisplayTimer
 * @returns {void}
 */
function actualizarDisplayTimer() {
    if (trainingModeFlag) return;
    let mins = Math.floor(tiempoRestante/60), segs = tiempoRestante%60;
    const disp = document.getElementById("timerDisplay");
    if(disp) disp.textContent = `${mins.toString().padStart(2,'0')}:${segs.toString().padStart(2,'0')}`;
    if(tiempoRestante <= 5) {
        disp.style.color = (Math.floor(Date.now() / 300) % 2 === 0) ? '#f87171' : 'white';
    } else {
        disp.style.color = 'white';
    }
}

/**
 * Inicia una nueva partida.
 * @function iniciarJuego
 * @returns {void}
 */
function iniciarJuego() {
    log('INFO', 'Iniciando nueva simulación');
    trainingModeFlag = document.getElementById("trainingModeCheckbox")?.checked || false;
    localStorage.setItem("trainingMode", trainingModeFlag);
    const randomIndex = Math.floor(Math.random() * escenariosPosibles.length);
    const escenarioSeleccionado = escenariosPosibles[randomIndex];
    log('INFO', `Escenario seleccionado: ${escenarioSeleccionado.nombre}`);
    escenarioActivo = prepararEscenario(escenarioSeleccionado);
    pasoActual = "p1";
    esperando = false;
    historial = [];
    currentChosenLetters = [];
    decisionTomada = false;
    avisoMostrado = false;
    updateProgressCounter();
    document.getElementById("startScreen").style.display = "none";
    document.getElementById("simScreen").style.display = "block";
    document.getElementById("feedbackScreen").style.display = "none";
    const primera = escenarioActivo.p1;
    if(!primera) {
        log('ERROR', 'No se encontró la primera pregunta');
        mostrarFeedback(resultadosBase.error);
    } else {
        mostrarPregunta(primera);
    }
}

/**
 * Muestra una pregunta en la interfaz.
 * @param {Object} preg - Objeto pregunta con texto, opciones, etc.
 * @returns {void}
 */
function mostrarPregunta(preg) {
    if(!preg) {
        log('ERROR', 'Pregunta inválida');
        mostrarFeedback(resultadosBase.error);
        return;
    }
    detenerTemporizador();
    const situationBox = document.getElementById("situationBox");
    situationBox.style.animation = "none";
    situationBox.offsetHeight;
    situationBox.style.animation = "slideInLeft 0.5s ease";
    document.getElementById("situationText").innerHTML = preg.texto;
    document.getElementById("situationGif").src = preg.gif || gifPlaceholder;
    const optsDiv = document.getElementById("optionsBox");
    optsDiv.innerHTML = "";
    if (pasoActual === "p1" && !sessionStorage.getItem("avisoMostrado")) {
        const aviso = document.createElement("div");
        aviso.style.cssText = `
            background: rgba(255, 200, 0, 0.15);
            border-left: 4px solid #facc15;
            padding: 8px 16px;
            margin-bottom: 16px;
            border-radius: 8px;
            font-size: 13px;
            color: var(--text-dark);
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        aviso.innerHTML = `<i class="fas fa-info-circle" style="color:#facc15;"></i> Las opciones se reordenan cada partida. Elige por el <strong>texto</strong>, no por la letra.`;
        optsDiv.appendChild(aviso);
        sessionStorage.setItem("avisoMostrado", "true");
    }
    if(!preg.opciones || preg.opciones.length === 0) {
        log('ERROR', 'La pregunta no tiene opciones');
        mostrarFeedback(resultadosBase.error);
        return;
    }
    preg.opciones.forEach((op, idx) => {
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.style.setProperty('--i', idx);
        btn.innerHTML = `<span class="option-letter">${op.letra}</span>${op.texto}<i class="fas fa-chevron-right"></i>`;
        btn.onclick = () => elegirOpcion(op.destino, op.letra, op.texto);
        optsDiv.appendChild(btn);
    });
    decisionTomada = false;
    setTimeout(() => iniciarTemporizador(), 100);
}

// ======================================================================
// ========== TRAZABILIDAD AVANZADA (Avance #6) ==========
// ======================================================================

/**
 * Genera un UUID v4 (versión 4) para Correlation ID.
 * @returns {string} UUID en formato xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Crea un log estructurado en formato JSON y lo imprime en consola.
 * @param {string} level - Nivel del log: 'INFO', 'WARN', 'ERROR'
 * @param {string} message - Mensaje descriptivo
 * @param {string} correlationId - UUID para rastrear la acción
 * @param {Object} [data] - Datos adicionales opcionales (objeto)
 * @returns {Object} El objeto log completo
 */
function createStructuredLog(level, message, correlationId, data = null) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        level: level,
        correlationId: correlationId,
        message: message,
        data: data,
        service: "Simulador Táctico",
        version: "1.0.0"
    };
    console.log(JSON.stringify(logEntry));
    return logEntry;
}

/**
 * Middleware que envuelve cualquier acción del usuario, asignando un Correlation ID,
 * registrando el inicio, ejecutando la acción y capturando errores para mostrar
 * un mensaje seguro al usuario.
 * @param {string} action - Nombre de la acción (ej. 'click_jugar', 'seleccionar_opcion_A')
 * @param {Function} callback - Función que ejecuta la lógica real, recibe el correlationId como parámetro
 * @returns {void}
 */
function withCorrelation(action, callback) {
    const correlationId = generateUUID();
    createStructuredLog('INFO', `Iniciando acción: ${action}`, correlationId);
    try {
        callback(correlationId);
        createStructuredLog('INFO', `Acción completada: ${action}`, correlationId);
    } catch (error) {
        createStructuredLog('ERROR', `Error en acción: ${action}`, correlationId, {
            error: error.message,
            stack: error.stack
        });
        alert(`Ocurrió un error. Reporte el código: ${correlationId}`);
        console.error(`[ERROR] ${error.message}`, error);
    }
}

// ======================================================================
// ========== BLUETEAM - VALIDACIÓN Y SANITIZACIÓN DE ENTRADAS (Avance #6) ==========
// ======================================================================

/**
 * Sanitiza y valida una entrada de texto del usuario.
 * @param {string} input - El texto a validar.
 * @param {number} maxLength - Longitud máxima permitida (por defecto 100).
 * @param {RegExp} allowedChars - Patrón de caracteres permitidos.
 * @returns {string} El texto sanitizado, o cadena vacía si no pasa la validación.
 */
function sanitizeInput(input, maxLength = 100, allowedChars = /^[a-zA-Z0-9\sáéíóúüñÑ.,;:!?()\-]+$/) {
    if (typeof input !== 'string') {
        createStructuredLog('WARN', 'Entrada rechazada: no es un string', 'system', { inputType: typeof input });
        return '';
    }
    if (input.length > maxLength) {
        createStructuredLog('WARN', `Entrada rechazada: excede longitud máxima (${maxLength})`, 'system', { inputLength: input.length });
        return '';
    }
    if (!allowedChars.test(input)) {
        createStructuredLog('WARN', 'Entrada rechazada: contiene caracteres no permitidos', 'system', { input: input });
        return '';
    }
    const sanitized = input.replace(/<[^>]*>/g, '').replace(/[<>]/g, '').trim();
    if (sanitized.length === 0 && input.length > 0) {
        createStructuredLog('WARN', 'Entrada rechazada: después de sanitizar queda vacía', 'system', { input: input });
        return '';
    }
    createStructuredLog('INFO', 'Entrada validada y sanitizada correctamente', 'system', { original: input, sanitized: sanitized });
    return sanitized;
}

// ======================================================================
// ========== MODIFICACIONES A LA LÓGICA PRINCIPAL PARA USAR CORRELATION ID Y SANITIZACIÓN ==========
// ======================================================================

// Reescribir elegirOpcion para envolver con Correlation ID y sanitizar
elegirOpcion = function(dest, letra, texto) {
    const textoSanitizado = sanitizeInput(texto, 50);
    if (textoSanitizado === '') {
        alert('Opción inválida. Reporte el código: SYS-001');
        return;
    }
    withCorrelation(`seleccionar_opcion_${letra}`, function(cid) {
        if(esperando || decisionTomada) return;
        decisionTomada = true;
        esperando = true;
        detenerTemporizador();
        playSound("click");
        let tiempoUsado = trainingModeFlag ? 0 : tiemposDificultad[dificultadActual] - tiempoRestante;
        historial.push({ letra, texto: textoSanitizado, momento: new Date().toLocaleTimeString(), tiempo: tiempoUsado });
        currentChosenLetters.push(letra);
        updateProgressCounter();
        createStructuredLog('INFO', `Usuario eligió opción ${letra}: "${textoSanitizado}" → Destino: ${dest}`, cid);
        if (dest === "exito") {
            createStructuredLog('INFO', 'Resultado directo: EXITO', cid);
            mostrarFeedback(resultadosBase.exito);
            return;
        } else if (dest === "parcial") {
            createStructuredLog('INFO', 'Resultado directo: PARCIAL', cid);
            mostrarFeedback(resultadosBase.parcial);
            return;
        } else if (dest === "fracaso") {
            createStructuredLog('INFO', 'Resultado directo: FRACASO', cid);
            mostrarFeedback(resultadosBase.fracaso);
            return;
        }
        const cons = escenarioActivo[dest];
        if(!cons) {
            createStructuredLog('ERROR', `Nodo "${dest}" no encontrado.`, cid);
            mostrarFeedback(resultadosBase.error);
            return;
        }
        createStructuredLog('INFO', `Nodo encontrado: ${dest}, siguiente: ${cons.siguiente}`, cid);
        mostrarConsecuencia(cons);
    });
};

// Envolver eventos principales
document.getElementById("startBtn").onclick = function(e) {
    withCorrelation('click_jugar', function(cid) {
        log('INFO', 'Usuario hizo clic en JUGAR');
        document.getElementById("levelMenu").style.display = "block";
        document.getElementById("startBtn").style.display = "none";
        createStructuredLog('INFO', 'Menú de niveles mostrado', cid);
    });
};

document.querySelectorAll(".level-btn").forEach(btn => {
    btn.onclick = function(e) {
        const difficulty = btn.getAttribute("data-difficulty");
        withCorrelation(`seleccionar_dificultad_${difficulty}`, function(cid) {
            setDifficulty(difficulty);
            iniciarJuego();
            createStructuredLog('INFO', `Dificultad seleccionada: ${difficulty}`, cid);
        });
    };
});

// ======================================================================
// ========== MANEJADOR GLOBAL DE ERRORES (Catch-all) ==========
// ======================================================================

window.addEventListener('error', function(event) {
    const correlationId = generateUUID();
    createStructuredLog('ERROR', 'Error no controlado en la aplicación', correlationId, {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error ? event.error.stack : null
    });
    alert(`Ocurrió un error inesperado. Reporte el código: ${correlationId}`);
});

window.addEventListener('unhandledrejection', function(event) {
    const correlationId = generateUUID();
    createStructuredLog('ERROR', 'Promesa rechazada no manejada', correlationId, {
        reason: event.reason ? event.reason.toString() : 'sin razón'
    });
    alert(`Ocurrió un error en una operación asíncrona. Reporte el código: ${correlationId}`);
    event.preventDefault();
});

// ======================================================================
// ========== EVENTOS ORIGINALES QUE NO SE MODIFICAN ==========
// ======================================================================

document.getElementById("themeToggleBtn").onclick = () => {
    const isDark = document.body.classList.contains("dark");
    if (isDark) {
        const savedTheme = localStorage.getItem("colorTheme") || "default";
        setColorTheme(savedTheme);
        localStorage.setItem("darkMode", "false");
        document.getElementById("themeToggleBtn").innerHTML = '<i class="fas fa-moon"></i>';
        log('INFO', 'Modo oscuro desactivado');
    } else {
        document.body.classList.remove("theme-default", "theme-llanero", "theme-selva", "theme-costa", "theme-ceremonial");
        document.body.classList.add("dark");
        localStorage.setItem("darkMode", "true");
        document.getElementById("themeToggleBtn").innerHTML = '<i class="fas fa-sun"></i>';
        log('INFO', 'Modo oscuro activado');
    }
};

document.getElementById("tutorialBtn").onclick = () => {
    showModal("Tutorial", "<p>Seleccione dificultad, lea la situación y elija una opción.</p>");
};

document.getElementById("exitToMenuBtn").onclick = volverMenu;
document.getElementById("retryBtn").onclick = reiniciarMismo;
document.getElementById("mainMenuBtn").onclick = volverMenu;
document.getElementById("openManualBtn").onclick = showManual;
document.getElementById("openAchievementsBtn").onclick = showAchievements;
document.getElementById("openPaletteBtn").onclick = showPaletteSelector;
document.getElementById("soundToggleBtn").onclick = () => {
    soundEnabled = !soundEnabled;
    localStorage.setItem("soundEnabled", soundEnabled);
    document.getElementById("soundToggleBtn").innerHTML = soundEnabled ? '<i class="fas fa-volume-up"></i> Sonido' : '<i class="fas fa-volume-mute"></i> Sonido';
    if (soundEnabled) initAudio();
};
document.getElementById("ambientSoundBtn").onclick = toggleAmbientSound;

// ======================================================================
// ========== INICIALIZACIÓN ==========
// ======================================================================

loadColorTheme();
if (localStorage.getItem("darkMode") === "true") document.body.classList.add("dark");
if (ambientSoundEnabled) startAmbientSound();
document.getElementById("trainingModeCheckbox").checked = localStorage.getItem("trainingMode") === "true";
if (localStorage.getItem("tutorialVisto") !== "true") {
    setTimeout(() => {
        showModal("Bienvenido", "<p>Simulador táctico. Sus decisiones determinan el éxito.</p>");
        log('INFO', 'Tutorial mostrado al usuario');
    }, 500);
    localStorage.setItem("tutorialVisto", "true");
}