// ========== SONIDOS ==========
let soundEnabled = localStorage.getItem("soundEnabled") !== "false";
let audioCtx = null;
function initAudio() { if (!audioCtx && soundEnabled) { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } }
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
let ambientSoundEnabled = localStorage.getItem("ambientSoundEnabled") === "true";
let ambientAudio = null;
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
    } catch(e) { console.warn("Ambient sound not supported"); }
}
function stopAmbientSound() {
    if (ambientAudio) {
        try { ambientAudio.source.stop(); } catch(e) {}
        try { ambientAudio.ctx.close(); } catch(e) {}
        ambientAudio = null;
    }
}
function toggleAmbientSound() {
    ambientSoundEnabled = !ambientSoundEnabled;
    localStorage.setItem("ambientSoundEnabled", ambientSoundEnabled);
    if (ambientSoundEnabled) startAmbientSound();
    else stopAmbientSound();
    const btn = document.getElementById("ambientSoundBtn");
    if (btn) btn.innerHTML = ambientSoundEnabled ? '<i class="fas fa-head-side-vr"></i> Ambiente ON' : '<i class="fas fa-head-side-vr"></i> Ambiente OFF';
}

// ========== LOGROS ==========
let achievements = { firstVictory: false, quickDecision: false, strategist: false, perfectMision: false };
try {
    const stored = localStorage.getItem("achievements");
    if (stored) achievements = JSON.parse(stored);
} catch (e) {
    localStorage.removeItem("achievements");
    console.warn("Achievements corrupted, reset.");
}
let totalWins = parseInt(localStorage.getItem("totalWins") || "0");
function unlockAchievement(id) {
    if (achievements[id]) return;
    achievements[id] = true;
    localStorage.setItem("achievements", JSON.stringify(achievements));
    playSound("victory");
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
function getAchievementName(id) {
    const names = { firstVictory: "Primera Victoria", quickDecision: "Decisión Rápida", strategist: "Estratega", perfectMision: "Perfecto" };
    return names[id];
}
function getAchievementDesc(id) {
    const desc = { firstVictory: "Completa tu primera misión con éxito.", quickDecision: "Decisión en menos de 10 segundos (Normal+).", strategist: "Acumula 3 victorias.", perfectMision: "5+ decisiones sin fallar." };
    return desc[id];
}
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
}
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
function showModal(title, content) {
    const modalDiv = document.createElement("div");
    modalDiv.className = "modal";
    modalDiv.innerHTML = `<div class="modal-content"><h3><i class="fas fa-info-circle"></i> ${title}</h3>${content}<button onclick="this.closest('.modal').remove()">Cerrar</button></div>`;
    document.body.appendChild(modalDiv);
}
function showManual() {
    showModal("Manual Táctico", "<p>✔️ Desplegar patrullas y pedir refuerzos es la táctica más segura.<br>✔️ En rehenes, priorizar rescate con fuerzas especiales.<br>✔️ Atacar suministros enemigos cambia el rumbo.<br>✔️ El diálogo temprano evita víctimas civiles.<br>✔️ Activar código rojo ante intrusión.</p>");
}
function showAchievements() {
    let list = "";
    for (let [id, unlocked] of Object.entries(achievements)) {
        list += `<li style="display:flex; align-items:center; gap:10px; margin:10px 0; ${!unlocked ? 'opacity:0.6' : ''}"><i class="fas fa-${unlocked ? 'medal' : 'lock'} fa-2x"></i><div><strong>${getAchievementName(id)}</strong><br><small>${getAchievementDesc(id)}</small></div>${unlocked ? '<i class="fas fa-check-circle" style="color:#4ade80"></i>' : '<i class="fas fa-hourglass-half"></i>'}</li>`;
    }
    showModal("Logros", `<ul style="list-style:none">${list}</ul>`);
}
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
const gifPlaceholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='180' viewBox='0 0 300 180'%3E%3Crect width='300' height='180' fill='%232c4c6e'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='white' font-size='16' font-family='Arial' dy='.3em'%3E🎖️ SIMULADOR%3C/text%3E%3C/svg%3E";

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
    parcial: { tipo: "parcial", mensaje: "ÉXITO PARCIAL", analisisBase: "El objetivo se alcanzó, pero hubo contratiempos evitables.", gif: gifPlaceholder },
    fracaso: { tipo: "fracaso", mensaje: "FRACASO TOTAL", analisisBase: "Error estratégico. Revise la doctrina.", gif: gifPlaceholder },
    error: { tipo: "fracaso", mensaje: "ERROR", analisisBase: "Reinicie la simulación.", gif: gifPlaceholder }
};

// ===== ESCENARIO 1: FRONTERA =====
const escenarioFrontera = {
    nombre: "Crisis en la Frontera Occidental",
    p1: {
        texto: "Inteligencia detecta grupo irregular armado a 5 km de la frontera. Planean atacar un puesto de control. ¿Primera acción?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Desplegar patrullas y solicitar refuerzos aéreos", destino: "consA1" },
            { texto: "Ataque preventivo con drones", destino: "consA2" },
            { texto: "Enviar negociadores", destino: "consA3" }
        ]
    },
    consA1: { texto: "Refuerzos aéreos llegarán en 20 minutos. Sus patrullas detectan movimiento enemigo.", gif: gifPlaceholder, siguiente: "p2" },
    consA2: { texto: "Los drones destruyen un depósito de munición, pero el enemigo responde con fuego de mortero. 3 heridos.", gif: gifPlaceholder, siguiente: "p2b" },
    consA3: { texto: "Los negociadores son tomados como rehenes. La situación se vuelve crítica.", gif: gifPlaceholder, siguiente: "p2c" },
    p2: {
        texto: "Refuerzos en camino. La columna enemiga avanza rápidamente. ¿Qué ordena?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Atacar con francotiradores", destino: "consB1" },
            { texto: "Esperar refuerzos", destino: "consB2" },
            { texto: "Evacuar el puesto", destino: "consB3" }
        ]
    },
    consB1: { texto: "Los francotiradores eliminan a dos cabecillas. El enemigo se desorganiza.", gif: gifPlaceholder, siguiente: "p3" },
    consB2: { texto: "La espera permite al enemigo atrincherarse. La misión se complica.", gif: gifPlaceholder, siguiente: "p3b" },
    consB3: { texto: "La retirada es ordenada, pero se pierde terreno estratégico.", gif: gifPlaceholder, siguiente: "p3c" },
    p2b: {
        texto: "Tras el bombardeo, el enemigo se repliega a una cueva cercana. ¿Qué acción toma?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Asaltar la cueva con fuerzas especiales", destino: "consC1" },
            { texto: "Sellar las salidas y negociar", destino: "consC2" },
            { texto: "Solicitar bombardeo aéreo", destino: "consC3" }
        ]
    },
    consC1: { texto: "Asalto exitoso, 2 bajas propias. Capturan documentos.", gif: gifPlaceholder, siguiente: "p4" },
    consC2: { texto: "Negociación tensa: 10 enemigos se rinden, otros huyen.", gif: gifPlaceholder, siguiente: "p4b" },
    consC3: { texto: "El bombardeo destruye la cueva, pero daña un oleoducto cercano.", gif: gifPlaceholder, siguiente: "p4c" },
    p2c: {
        texto: "Los rehenes (3 soldados) están en poder del enemigo. ¿Qué prioriza?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Lanzar un rescate inmediato", destino: "consD1" },
            { texto: "Negociar la liberación", destino: "consD2" }
        ]
    },
    consD1: { texto: "Rescate exitoso, pero un soldado resulta herido. El enemigo huye.", gif: gifPlaceholder, siguiente: "p5" },
    consD2: { texto: "Negociación larga: liberan a los rehenes, pero el enemigo obtiene armamento.", gif: gifPlaceholder, siguiente: "p5b" },
    p3: {
        texto: "El enemigo se reagrupa en una colina. Tiene unos 100 efectivos. ¿Qué estrategia emplea?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Ataque envolvente nocturno", destino: "consE1" },
            { texto: "Bombardeo de artillería", destino: "consE2" }
        ]
    },
    consE1: { texto: "Ataque sorpresa logra romper la defensa enemiga. Avance significativo.", gif: gifPlaceholder, siguiente: "p6" },
    consE2: { texto: "El bombardeo causa pánico y deserción masiva. El enemigo se rinde.", gif: gifPlaceholder, siguiente: "exito" },
    p3b: {
        texto: "El enemigo atrincherado lanza un contraataque. ¿Cómo responde?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Retirada táctica", destino: "consF1" },
            { texto: "Defensa firme con morteros", destino: "consF2" }
        ]
    },
    consF1: { texto: "Retirada ordenada, pero pierde terreno.", gif: gifPlaceholder, siguiente: "p6b" },
    consF2: { texto: "Repelen ataque con 10 bajas enemigas.", gif: gifPlaceholder, siguiente: "parcial" },
    p3c: {
        texto: "El tiempo perdido permitió al enemigo recibir suministros. ¿Qué orden da?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Atacar cadena de suministros", destino: "consG1" },
            { texto: "Solicitar alto el fuego", destino: "consG2" }
        ]
    },
    consG1: { texto: "Destruyen convoy enemigo. Golpe de gracia.", gif: gifPlaceholder, siguiente: "exito" },
    consG2: { texto: "Alto el fuego rechazado. El enemigo ataca con más fuerza.", gif: gifPlaceholder, siguiente: "fracaso" },
    p4: {
        texto: "Los documentos capturados revelan un plan de ataque contra una ciudad cercana. ¿Qué hace?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Alertar autoridades y evacuar", destino: "consH1" },
            { texto: "Emboscar células enemigas", destino: "consH2" }
        ]
    },
    consH1: { texto: "Evacuación exitosa. La ciudad está a salvo.", gif: gifPlaceholder, siguiente: "exito" },
    consH2: { texto: "Emboscada elimina a 15 terroristas.", gif: gifPlaceholder, siguiente: "exito" },
    p4b: {
        texto: "Los que huyeron se refugian en una aldea. ¿Cómo procede?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Cercar y negociar", destino: "consI1" },
            { texto: "Asalto directo", destino: "consI2" }
        ]
    },
    consI1: { texto: "Capturan a los líderes. Operación exitosa.", gif: gifPlaceholder, siguiente: "exito" },
    consI2: { texto: "Asalto violento, muchos heridos.", gif: gifPlaceholder, siguiente: "parcial" },
    p4c: {
        texto: "El oleoducto dañado provoca un incendio. ¿Cuál es su prioridad?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Apagar fuego", destino: "consJ1" },
            { texto: "Abandonar zona", destino: "consJ2" }
        ]
    },
    consJ1: { texto: "Fuego controlado. Daño limitado.", gif: gifPlaceholder, siguiente: "parcial" },
    consJ2: { texto: "El fuego se expande y causa una crisis diplomática.", gif: gifPlaceholder, siguiente: "fracaso" },
    p5: {
        texto: "El enemigo fugitivo busca refugio en zona montañosa. ¿Qué táctica usa?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Persecución con helicópteros", destino: "consK1" },
            { texto: "Bloqueo de rutas", destino: "consK2" }
        ]
    },
    consK1: { texto: "Capturan al líder. Fin de la amenaza.", gif: gifPlaceholder, siguiente: "exito" },
    consK2: { texto: "El enemigo se rinde por falta de suministros.", gif: gifPlaceholder, siguiente: "exito" },
    p5b: {
        texto: "El armamento entregado durante la negociación ahora es usado en su contra. ¿Cómo se defiende?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Ataque nocturno sorpresa", destino: "consL1" },
            { texto: "Mediación internacional", destino: "consL2" }
        ]
    },
    consL1: { texto: "Ataque exitoso. Recuperan armamento.", gif: gifPlaceholder, siguiente: "parcial" },
    consL2: { texto: "Mediación fracasa. Escalada del conflicto.", gif: gifPlaceholder, siguiente: "fracaso" },
    p6: {
        texto: "Operación casi finalizada. Enemigo pide tregua. ¿Acepta?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Aceptar tregua", destino: "parcial" },
            { texto: "Rechazar y continuar", destino: "exito" }
        ]
    },
    p6b: {
        texto: "Ha perdido posiciones. Moral baja. ¿Qué orden da?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Reorganizar y contraatacar", destino: "parcial" },
            { texto: "Retirada estratégica", destino: "fracaso" }
        ]
    }
};

// ===== ESCENARIO 2: DISTURBIOS =====
const escenarioDisturbios = {
    nombre: "Control de Orden Público",
    p1: { texto: "Manifestaciones violentas en el centro. Grupos encapuchados atacan comercios. ¿Qué ordena?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Desplegar antimotines", destino: "consA1" },
            { texto: "Dialogar con líderes", destino: "consA2" },
            { texto: "Solicitar refuerzos y esperar", destino: "consA3" }
        ] },
    consA1: { texto: "Antimotines contienen disturbios. 5 detenidos.", gif: gifPlaceholder, siguiente: "p2" },
    consA2: { texto: "Diálogo calma ánimos temporalmente. Líderes piden 24h.", gif: gifPlaceholder, siguiente: "p2b" },
    consA3: { texto: "Espera permite saqueos masivos.", gif: gifPlaceholder, siguiente: "p2c" },
    p2: { texto: "Enfrentamientos escalan. Lanzan cócteles molotov. ¿Qué ordena?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Gas lacrimógeno", destino: "consB1" },
            { texto: "Retirarse y esperar", destino: "consB2" },
            { texto: "Negociar nuevamente", destino: "consB3" }
        ] },
    consB1: { texto: "Gas dispersa multitud, varios heridos. Situación se calma.", gif: gifPlaceholder, siguiente: "p3" },
    consB2: { texto: "Retirada permite que disturbios se extiendan.", gif: gifPlaceholder, siguiente: "p3b" },
    consB3: { texto: "Líderes dialogan, pero radicales no obedecen.", gif: gifPlaceholder, siguiente: "p3c" },
    p2b: { texto: "Durante tregua, radicales se reagrupan. ¿Qué acción?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Operaciones de inteligencia", destino: "consC1" },
            { texto: "Reforzar puntos críticos", destino: "consC2" },
            { texto: "Mantener calma", destino: "consC3" }
        ] },
    consC1: { texto: "Identifican y detienen líderes radicales.", gif: gifPlaceholder, siguiente: "p4" },
    consC2: { texto: "Refuerzo disuade nuevos ataques.", gif: gifPlaceholder, siguiente: "p4b" },
    consC3: { texto: "Radicales atacan de nuevo, más daños.", gif: gifPlaceholder, siguiente: "p4c" },
    p2c: { texto: "Saqueos se extienden. ¿Qué prioriza?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Proteger comercios", destino: "consD1" },
            { texto: "Evacuar civiles", destino: "consD2" }
        ] },
    consD1: { texto: "Protegen bienes, pero hay heridos civiles.", gif: gifPlaceholder, siguiente: "p5" },
    consD2: { texto: "Evacuación exitosa, pero pérdidas millonarias.", gif: gifPlaceholder, siguiente: "p5b" },
    p3: { texto: "Orden restablecido en mayoría de zonas. ¿Cómo procede?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Mantener presencia policial", destino: "consE1" },
            { texto: "Operaciones de reconstrucción", destino: "consE2" }
        ] },
    consE1: { texto: "Presencia evita nuevos disturbios.", gif: gifPlaceholder, siguiente: "exito" },
    consE2: { texto: "Reconstrucción gana apoyo ciudadano.", gif: gifPlaceholder, siguiente: "exito" },
    p3b: { texto: "Disturbios se expanden a zonas residenciales. ¿Qué ordena?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Toque de queda y ejército", destino: "consF1" },
            { texto: "Negociar con líderes vecinales", destino: "consF2" }
        ] },
    consF1: { texto: "Toque de queda restablece orden, pero tensiones sociales.", gif: gifPlaceholder, siguiente: "parcial" },
    consF2: { texto: "Negociación reduce violencia, pero radicales persisten.", gif: gifPlaceholder, siguiente: "parcial" },
    p3c: { texto: "Radicales se refugian en barrio popular. ¿Qué acción?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Cercar y negociar", destino: "consG1" },
            { texto: "Allanamientos selectivos", destino: "consG2" }
        ] },
    consG1: { texto: "Logran rendición de radicales.", gif: gifPlaceholder, siguiente: "exito" },
    consG2: { texto: "Allanamientos capturan cabecillas, con heridos civiles.", gif: gifPlaceholder, siguiente: "fracaso" },
    p4: { texto: "Líderes detenidos. Estrategia de largo plazo.", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Programas sociales", destino: "consH1" },
            { texto: "Aumentar vigilancia", destino: "consH2" }
        ] },
    consH1: { texto: "Programas mejoran convivencia.", gif: gifPlaceholder, siguiente: "exito" },
    consH2: { texto: "Vigilancia reduce delincuencia, pero persiste malestar.", gif: gifPlaceholder, siguiente: "parcial" },
    p4b: { texto: "Orden parcial, focos de resistencia. ¿Qué hace?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Intensificar presencia policial", destino: "consI1" },
            { texto: "Diálogos comunitarios", destino: "consI2" }
        ] },
    consI1: { texto: "Presión policial disuelve focos.", gif: gifPlaceholder, siguiente: "exito" },
    consI2: { texto: "Diálogo reduce tensión, requiere más tiempo.", gif: gifPlaceholder, siguiente: "parcial" },
    p4c: { texto: "Daños materiales enormes. ¿Prioridad?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Reconstruir infraestructura", destino: "consJ1" },
            { texto: "Capturar responsables", destino: "consJ2" }
        ] },
    consJ1: { texto: "Reconstrucción gana apoyo ciudadano.", gif: gifPlaceholder, siguiente: "parcial" },
    consJ2: { texto: "Capturas exitosas, pero ciudad en ruinas.", gif: gifPlaceholder, siguiente: "fracaso" },
    p5: { texto: "Heridos civiles necesitan atención. ¿Qué ordena?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Ambulancias y hospital de campaña", destino: "consK1" },
            { texto: "Ayuda humanitaria internacional", destino: "consK2" }
        ] },
    consK1: { texto: "Atención médica salva vidas.", gif: gifPlaceholder, siguiente: "exito" },
    consK2: { texto: "Ayuda llega tarde. Se pierden vidas.", gif: gifPlaceholder, siguiente: "fracaso" },
    p5b: { texto: "Economía local afectada por saqueos. ¿Qué prioriza?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Ayudas a comerciantes", destino: "consL1" },
            { texto: "Reforzar seguridad", destino: "consL2" }
        ] },
    consL1: { texto: "Ayudas reactivan comercio.", gif: gifPlaceholder, siguiente: "exito" },
    consL2: { texto: "Seguridad evita nuevos incidentes, pero economía se hunde.", gif: gifPlaceholder, siguiente: "parcial" }
};

// ===== ESCENARIO 3: INFILTRACIÓN =====
const escenarioInfiltracion = {
    nombre: "Seguridad Perimetral de la Base",
    p1: { texto: "Sensores detectan intrusión en perímetro norte. Son las 03:00. ¿Qué ordena?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Activar código rojo", destino: "consA1" },
            { texto: "Enviar ronda de investigación", destino: "consA2" },
            { texto: "Revisar cámaras", destino: "consA3" }
        ] },
    consA1: { texto: "Código rojo activado. Se sellan salidas. Movimientos en comunicaciones.", gif: gifPlaceholder, siguiente: "p2" },
    consA2: { texto: "Ronda encuentra brecha, sin intrusos a la vista.", gif: gifPlaceholder, siguiente: "p2b" },
    consA3: { texto: "Mientras revisa cámaras, intrusos acceden a centro de datos.", gif: gifPlaceholder, siguiente: "p2c" },
    p2: { texto: "Intrusos en área de comunicaciones. ¿Qué ordena?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Equipo de reacción rápida", destino: "consB1" },
            { texto: "Aislar área y cortar energía", destino: "consB2" },
            { texto: "Negociar", destino: "consB3" }
        ] },
    consB1: { texto: "Capturan dos intrusos, uno escapa a hangares.", gif: gifPlaceholder, siguiente: "p3" },
    consB2: { texto: "Corte de energía dificulta visión. Intrusos se mueven al arsenal.", gif: gifPlaceholder, siguiente: "p3b" },
    consB3: { texto: "No negocian. Se atrincheran con rehenes.", gif: gifPlaceholder, siguiente: "p3c" },
    p2b: { texto: "Brecha abierta. No hay señales. ¿Qué acción?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Reparar brecha y aumentar vigilancia", destino: "consC1" },
            { texto: "Patrullas al exterior para buscar rastros", destino: "consC2" },
            { texto: "Desestimar alerta", destino: "consC3" }
        ] },
    consC1: { texto: "Reparación completa. Horas después, robaron información clasificada.", gif: gifPlaceholder, siguiente: "p4" },
    consC2: { texto: "Patrullas encuentran huellas hacia pueblo cercano.", gif: gifPlaceholder, siguiente: "p4b" },
    consC3: { texto: "Al día siguiente, descubren equipos de espionaje instalados.", gif: gifPlaceholder, siguiente: "p4c" },
    p2c: { texto: "Intrusos en centro de datos. ¿Prioridad?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Proteger información clasificada", destino: "consD1" },
            { texto: "Capturar intrusos vivos", destino: "consD2" }
        ] },
    consD1: { texto: "Desconectan servidores. Información a salvo, intrusos huyen.", gif: gifPlaceholder, siguiente: "p5" },
    consD2: { texto: "Capturan intrusos, pero datos fueron copiados.", gif: gifPlaceholder, siguiente: "p5b" },
    p3: { texto: "Intruso se oculta en hangares. ¿Qué ordena?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Cercar y usar perros detectores", destino: "consE1" },
            { texto: "Entrar con equipo táctico", destino: "consE2" }
        ] },
    consE1: { texto: "Perros detectan intruso escondido. Capturado.", gif: gifPlaceholder, siguiente: "p6" },
    consE2: { texto: "Equipo lo acorrala, pero se inmola con granada.", gif: gifPlaceholder, siguiente: "p6b" },
    p3b: { texto: "Intrusos se dirigen al arsenal. ¿Qué acción?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Bloquear acceso", destino: "consF1" },
            { texto: "Permitirles entrar para atraparlos", destino: "consF2" }
        ] },
    consF1: { texto: "Se bloquea acceso. Intrusos se rinden.", gif: gifPlaceholder, siguiente: "exito" },
    consF2: { texto: "Al entrar, activan bomba. Explosión y daños.", gif: gifPlaceholder, siguiente: "fracaso" },
    p3c: { texto: "Intrusos tienen rehenes. ¿Cómo procede?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Negociación", destino: "consG1" },
            { texto: "Asalto relámpago", destino: "consG2" }
        ] },
    consG1: { texto: "Negociación exitosa: liberan rehenes a cambio de helicóptero.", gif: gifPlaceholder, siguiente: "parcial" },
    consG2: { texto: "Asalto exitoso, dos rehenes heridos.", gif: gifPlaceholder, siguiente: "parcial" },
    p4: { texto: "Información robada incluye planes de defensa. ¿Qué hace?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Cambiar códigos y protocolos", destino: "consH1" },
            { texto: "Rastrear responsables", destino: "consH2" }
        ] },
    consH1: { texto: "Códigos cambiados. Información obsoleta.", gif: gifPlaceholder, siguiente: "exito" },
    consH2: { texto: "Recuperan información antes de ser vendida.", gif: gifPlaceholder, siguiente: "exito" },
    p4b: { texto: "Huellas llevan a casa en pueblo. ¿Qué orden?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Solicitar orden de allanamiento", destino: "consI1" },
            { texto: "Allanar sin orden por urgencia", destino: "consI2" }
        ] },
    consI1: { texto: "Orden llega tarde. Sospechosos huyen.", gif: gifPlaceholder, siguiente: "parcial" },
    consI2: { texto: "Capturan espías y recuperan material.", gif: gifPlaceholder, siguiente: "exito" },
    p4c: { texto: "Equipos de espionaje activos. ¿Qué acción?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Desconectar red y auditoría", destino: "consJ1" },
            { texto: "Usar equipos para enviar información falsa", destino: "consJ2" }
        ] },
    consJ1: { texto: "Auditoría descubre sistema comprometido. Reemplazan equipos.", gif: gifPlaceholder, siguiente: "parcial" },
    consJ2: { texto: "Contra-inteligencia funciona. Desenmascaran red de espionaje.", gif: gifPlaceholder, siguiente: "exito" },
    p5: { texto: "Intrusos huyeron, dejaron pistas. ¿Qué prioriza?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Analizar pistas", destino: "consK1" },
            { texto: "Reforzar seguridad", destino: "consK2" }
        ] },
    consK1: { texto: "Identifican célula enemiga. Toman medidas.", gif: gifPlaceholder, siguiente: "exito" },
    consK2: { texto: "Seguridad reforzada, pero culpables no capturados.", gif: gifPlaceholder, siguiente: "parcial" },
    p5b: { texto: "Intrusos capturados se niegan a hablar. ¿Qué técnica?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Interrogatorio psicológico", destino: "consL1" },
            { texto: "Ofrecer reducción de condena", destino: "consL2" }
        ] },
    consL1: { texto: "Uno confiesa red de apoyo.", gif: gifPlaceholder, siguiente: "exito" },
    consL2: { texto: "Obtienen información valiosa sobre futuros ataques.", gif: gifPlaceholder, siguiente: "exito" },
    p6: { texto: "Intruso capturado ofrece información a cambio de asilo. ¿Acepta?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Aceptar trato", destino: "exito" },
            { texto: "Rechazar y juzgar", destino: "parcial" }
        ] },
    p6b: { texto: "Intruso murió en explosión. No hay pistas. ¿Qué concluye?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Amenaza continúa. Incrementar vigilancia", destino: "parcial" },
            { texto: "Cerrar caso por falta de pruebas", destino: "fracaso" }
        ] }
};

const escenariosPosibles = [escenarioFrontera, escenarioDisturbios, escenarioInfiltracion];

// ========== VARIABLES GLOBALES ==========
let escenarioActivo = null, pasoActual = null, esperando = false, dificultadActual = "medium", historial = [];
let temporizadorInterval = null, tiempoRestante = 60, tiempoActivo = false, decisionTomada = false;
let tiemposDificultad = { easy: 90, medium: 60, hard: 45 };
let trainingModeFlag = false, currentChosenLetters = [];
let avisoMostrado = false;

function updateProgressCounter() {
    const counterSpan = document.getElementById("progressCounter");
    if (counterSpan) counterSpan.innerHTML = `<i class="fas fa-list-ol"></i> Decisiones: ${historial.length}`;
}

// ===== PREPARAR ESCENARIO (con barajado) =====
function prepararEscenario(escenarioBase) {
    let escenario = JSON.parse(JSON.stringify(escenarioBase));
    // Barajar opciones
    for (let key in escenario) {
        if (escenario[key].opciones_raw) {
            let rawOpts = escenario[key].opciones_raw;
            let shuffled = shuffleOptions(rawOpts);
            escenario[key].opciones = shuffled;
        }
    }
    console.log(`🎯 Escenario preparado: ${escenario.nombre}`);
    return escenario;
}

// ===== FUNCIONES DE CONTROL =====
function detenerTemporizador() { if(temporizadorInterval) clearInterval(temporizadorInterval); temporizadorInterval = null; tiempoActivo = false; }
function iniciarTemporizador() {
    if (trainingModeFlag) { document.getElementById("timerDisplay").textContent = "--:--"; return; }
    detenerTemporizador();
    decisionTomada = false;
    tiempoRestante = tiemposDificultad[dificultadActual];
    actualizarDisplayTimer();
    tiempoActivo = true;
    temporizadorInterval = setInterval(() => {
        if(!tiempoActivo || decisionTomada) return;
        if(tiempoRestante <= 1) {
            detenerTemporizador();
            playSound("timeout");
            const botones = document.querySelectorAll('.option-btn');
            if(botones.length > 0 && !decisionTomada) botones[Math.floor(Math.random()*botones.length)].click();
            else mostrarFeedback(resultadosBase.error);
        } else { tiempoRestante--; actualizarDisplayTimer(); }
    }, 1000);
}
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

function iniciarJuego() {
    trainingModeFlag = document.getElementById("trainingModeCheckbox")?.checked || false;
    localStorage.setItem("trainingMode", trainingModeFlag);
    const randomIndex = Math.floor(Math.random() * escenariosPosibles.length);
    const escenarioSeleccionado = escenariosPosibles[randomIndex];
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
    if(!primera) mostrarFeedback(resultadosBase.error);
    else mostrarPregunta(primera);
}

function mostrarPregunta(preg) {
    if(!preg) { mostrarFeedback(resultadosBase.error); return; }
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
    if(!preg.opciones || preg.opciones.length === 0) { mostrarFeedback(resultadosBase.error); return; }
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

// ===== FUNCIONES CORREGIDAS (con detección de "exito", "parcial", "fracaso") =====
function elegirOpcion(dest, letra, texto) {
    if(esperando || decisionTomada) return;
    decisionTomada = true;
    esperando = true;
    detenerTemporizador();
    playSound("click");
    let tiempoUsado = trainingModeFlag ? 0 : tiemposDificultad[dificultadActual] - tiempoRestante;
    historial.push({ letra, texto, momento: new Date().toLocaleTimeString(), tiempo: tiempoUsado });
    currentChosenLetters.push(letra);
    updateProgressCounter();
    console.log(`👉 Elegiste: "${texto}" → Destino: ${dest}`);

    // === COMPROBAR SI ES UN RESULTADO DIRECTO ===
    if (dest === "exito") {
        console.log("🏆 VICTORIA DIRECTA");
        mostrarFeedback(resultadosBase.exito);
        return;
    } else if (dest === "parcial") {
        console.log("⚠️ ÉXITO PARCIAL");
        mostrarFeedback(resultadosBase.parcial);
        return;
    } else if (dest === "fracaso") {
        console.log("💀 FRACASO");
        mostrarFeedback(resultadosBase.fracaso);
        return;
    }

    // SI ES UN NODO, BUSCARLO
    const cons = escenarioActivo[dest];
    if(!cons) { 
        console.error(`❌ Nodo "${dest}" no encontrado.`);
        mostrarFeedback(resultadosBase.error); 
        return; 
    }
    console.log(`✅ Nodo encontrado: ${dest}, siguiente: ${cons.siguiente}`);
    mostrarConsecuencia(cons);
}

function mostrarConsecuencia(cons) {
    const situationBox = document.getElementById("situationBox");
    situationBox.style.animation = "none";
    situationBox.offsetHeight;
    situationBox.style.animation = "slideInLeft 0.5s ease";
    document.getElementById("situationText").innerHTML = cons.texto;
    document.getElementById("situationGif").src = cons.gif || gifPlaceholder;
    document.getElementById("optionsBox").innerHTML = `<div class="loading"><div class="loading-spinner"></div> ANALIZANDO CONSECUENCIAS...</div>`;
    setTimeout(() => {
        // === COMPROBAR SI EL SIGUIENTE ES UN RESULTADO DIRECTO ===
        if (cons.siguiente === "exito") {
            mostrarFeedback(resultadosBase.exito);
            return;
        } else if (cons.siguiente === "parcial") {
            mostrarFeedback(resultadosBase.parcial);
            return;
        } else if (cons.siguiente === "fracaso") {
            mostrarFeedback(resultadosBase.fracaso);
            return;
        }
        
        // SI ES UN NODO, CONTINUAR
        const sig = escenarioActivo[cons.siguiente];
        if(!sig) { 
            console.error(`❌ Siguiente nodo "${cons.siguiente}" no encontrado.`);
            mostrarFeedback(resultadosBase.error); 
            return; 
        }
        pasoActual = cons.siguiente;
        esperando = false;
        decisionTomada = false;
        mostrarPregunta(sig);
    }, 3500);
}

// ===== ANÁLISIS Y FEEDBACK =====
function generarAnalisisCritico(final, historialDecisiones, tiempoPromedio, escenarioNombre) {
    let analisis = "";
    if (final.tipo === "exito") {
        analisis = `<div style="text-align: center; font-size: 1.5em; font-weight: bold; color: #4ade80; margin-bottom: 15px;">
                        <i class="fas fa-check-circle"></i> RESULTADO: ÉXITO OPERACIONAL
                    </div>`;
    } else if (final.tipo === "parcial") {
        analisis = `<div style="text-align: center; font-size: 1.5em; font-weight: bold; color: #facc15; margin-bottom: 15px;">
                        <i class="fas fa-exclamation-triangle"></i> RESULTADO: ÉXITO LIMITADO
                    </div>`;
    } else {
        analisis = `<div style="text-align: center; font-size: 1.5em; font-weight: bold; color: #f87171; margin-bottom: 15px;">
                        <i class="fas fa-times-circle"></i> RESULTADO: NO CUMPLIDO
                    </div>`;
    }
    analisis += `<p><strong>Valoración del mando:</strong> ${final.analisisBase}</p>`;
    let conclusionTexto = "Cada simulación es una oportunidad de crecimiento. Analice sus aciertos y errores, y vuelva a intentarlo. ";
    if (final.tipo === "exito") {
        conclusionTexto += "La victoria es el resultado de una planificación sólida y una ejecución precisa. Mantenga este nivel de excelencia en futuras misiones. El mando confía en su criterio y capacidad para tomar decisiones bajo presión. Siga así, comandante.";
    } else if (final.tipo === "parcial") {
        conclusionTexto += "El éxito parcial indica que va por buen camino, pero aún hay margen de mejora. Revise los momentos clave donde pudo haber actuado con más determinación o anticipación. La próxima vez, el triunfo total estará a su alcance. No baje la guardia.";
    } else {
        conclusionTexto += "El fracaso es una lección en sí mismo. Identifique los errores tácticos y estratégicos que llevaron a este resultado. La próxima vez, asegúrese de mantener la iniciativa y aplicar la doctrina aprendida. El camino hacia la maestría está pavimentado con experiencias como esta. Levántese y vuelva a intentarlo.";
    }
    analisis += `<p><strong>📌 Conclusión:</strong> ${conclusionTexto}</p>`;
    return analisis;
}

function mostrarFeedback(final) {
    detenerTemporizador();
    let tiempos = historial.map(h => h.tiempo).filter(t => t !== undefined);
    let tiempoPromedio = tiempos.length ? (tiempos.reduce((a,b)=>a+b,0)/tiempos.length).toFixed(1) : 0;
    let decisionCount = historial.length;
    checkAchievements(final.tipo, decisionCount, tiempoPromedio, trainingModeFlag);
    
    document.getElementById("simScreen").style.display = "none";
    document.getElementById("feedbackScreen").style.display = "block";
    
    const badge = document.getElementById("resultBadge");
    if(final.tipo === "exito") { 
        badge.innerHTML = '<i class="fas fa-trophy"></i> VICTORIA TÁCTICA'; 
        badge.className = "result-badge result-success"; 
        playSound("victory"); 
    } else if(final.tipo === "parcial") { 
        badge.innerHTML = '<i class="fas fa-chart-line"></i> ÉXITO PARCIAL'; 
        badge.className = "result-badge result-parcial"; 
        playSound("failure"); 
    } else { 
        badge.innerHTML = '<i class="fas fa-skull-crossbones"></i> MISIÓN NO CUMPLIDA'; 
        badge.className = "result-badge result-failure"; 
        playSound("failure"); 
    }
    
    document.getElementById("resultGifArea").innerHTML = `<img src="${final.gif}" alt="Resultado">`;
    document.getElementById("feedbackText").innerHTML = `<div style="text-align: center; font-size: 1.8em; font-weight: bold; margin-bottom: 10px;">${final.mensaje}</div>`;
    
    let analisisCompleto = generarAnalisisCritico(final, historial, tiempoPromedio, escenarioActivo.nombre);
    let diffName = dificultadActual === "easy" ? "FÁCIL" : (dificultadActual === "medium" ? "NORMAL" : "DIFÍCIL");
    analisisCompleto += `<hr><p><strong>⏱️ TIEMPO PROMEDIO POR DECISIÓN:</strong> ${tiempoPromedio} segundos</p>`;
    analisisCompleto += `<p><strong>📊 DIFICULTAD:</strong> ${diffName}</p>`;
    analisisCompleto += `<p><strong>📌 ESCENARIO:</strong> ${escenarioActivo.nombre}</p>`;
    
    document.getElementById("analysisText").innerHTML = analisisCompleto;
}

function volverMenu() { location.reload(); }
function reiniciarMismo() { iniciarJuego(); }
function setDifficulty(d) { dificultadActual = d; const badge = document.getElementById("difficultyBadge"); if(d === "easy") badge.innerHTML = '<i class="fas fa-seedling"></i> FÁCIL'; else if(d === "medium") badge.innerHTML = '<i class="fas fa-chart-line"></i> NORMAL'; else badge.innerHTML = '<i class="fas fa-skull"></i> DIFÍCIL'; }

// ========== EVENTOS ==========
document.getElementById("startBtn").onclick = () => { document.getElementById("levelMenu").style.display = "block"; document.getElementById("startBtn").style.display = "none"; };
document.querySelectorAll(".level-btn").forEach(btn => { btn.onclick = () => { setDifficulty(btn.getAttribute("data-difficulty")); iniciarJuego(); }; });
document.getElementById("themeToggleBtn").onclick = () => {
    const isDark = document.body.classList.contains("dark");
    if (isDark) {
        const savedTheme = localStorage.getItem("colorTheme") || "default";
        setColorTheme(savedTheme);
        localStorage.setItem("darkMode", "false");
        document.getElementById("themeToggleBtn").innerHTML = '<i class="fas fa-moon"></i>';
    } else {
        document.body.classList.remove("theme-default", "theme-llanero", "theme-selva", "theme-costa", "theme-ceremonial");
        document.body.classList.add("dark");
        localStorage.setItem("darkMode", "true");
        document.getElementById("themeToggleBtn").innerHTML = '<i class="fas fa-sun"></i>';
    }
};
document.getElementById("tutorialBtn").onclick = () => { showModal("Tutorial", "<p>Seleccione dificultad, lea la situación y elija una opción.</p>"); };
document.getElementById("exitToMenuBtn").onclick = volverMenu;
document.getElementById("retryBtn").onclick = reiniciarMismo;
document.getElementById("mainMenuBtn").onclick = volverMenu;
document.getElementById("openManualBtn").onclick = showManual;
document.getElementById("openAchievementsBtn").onclick = showAchievements;
document.getElementById("openPaletteBtn").onclick = showPaletteSelector;
document.getElementById("soundToggleBtn").onclick = () => { soundEnabled = !soundEnabled; localStorage.setItem("soundEnabled", soundEnabled); document.getElementById("soundToggleBtn").innerHTML = soundEnabled ? '<i class="fas fa-volume-up"></i> Sonido' : '<i class="fas fa-volume-mute"></i> Sonido'; if (soundEnabled) initAudio(); };
document.getElementById("ambientSoundBtn").onclick = toggleAmbientSound;

loadColorTheme();
if (localStorage.getItem("darkMode") === "true") document.body.classList.add("dark");
if (ambientSoundEnabled) startAmbientSound();
document.getElementById("trainingModeCheckbox").checked = localStorage.getItem("trainingMode") === "true";
if (localStorage.getItem("tutorialVisto") !== "true") {
    setTimeout(() => showModal("Bienvenido", "<p>Simulador táctico. Sus decisiones determinan el éxito.</p>"), 500);
    localStorage.setItem("tutorialVisto", "true");
}