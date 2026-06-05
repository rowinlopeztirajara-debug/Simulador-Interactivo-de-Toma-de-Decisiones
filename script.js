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
function startAmbientSound() { if (!ambientSoundEnabled) return; try { ambientAudio = new Audio("data:audio/wav;base64,U3RlcmVvIG5vIGV4aXN0ZQ=="); ambientAudio.loop = true; ambientAudio.volume = 0.1; ambientAudio.play().catch(()=>{}); } catch(e) {} }
function stopAmbientSound() { if (ambientAudio) { ambientAudio.pause(); ambientAudio = null; } }
function toggleAmbientSound() { ambientSoundEnabled = !ambientSoundEnabled; localStorage.setItem("ambientSoundEnabled", ambientSoundEnabled); if (ambientSoundEnabled) startAmbientSound(); else stopAmbientSound(); const btn = document.getElementById("ambientSoundBtn"); if (btn) btn.innerHTML = ambientSoundEnabled ? '<i class="fas fa-head-side-vr"></i> Ambiente ON' : '<i class="fas fa-head-side-vr"></i> Ambiente OFF'; }

// ========== LOGROS ==========
let achievements = JSON.parse(localStorage.getItem("achievements")) || { firstVictory: false, quickDecision: false, strategist: false, perfectMision: false };
let totalWins = parseInt(localStorage.getItem("totalWins") || 0);
function unlockAchievement(id) { if (achievements[id]) return; achievements[id] = true; localStorage.setItem("achievements", JSON.stringify(achievements)); playSound("victory"); alert(`🏅 ¡LOGRO DESBLOQUEADO! ${getAchievementName(id)}`); }
function getAchievementName(id) { const names = { firstVictory: "Primera Victoria", quickDecision: "Decisión Rápida", strategist: "Estratega", perfectMision: "Perfecto" }; return names[id]; }
function getAchievementDesc(id) { const desc = { firstVictory: "Completa tu primera misión con éxito.", quickDecision: "Decisión en menos de 10 segundos (Normal+).", strategist: "Acumula 3 victorias.", perfectMision: "5+ decisiones sin fallar." }; return desc[id]; }
function checkAchievements(finalType, decisionCount, tiempoPromedio, training) {
    if (finalType === "exito") { if (!achievements.firstVictory) unlockAchievement("firstVictory"); totalWins++; localStorage.setItem("totalWins", totalWins); if (totalWins >= 3 && !achievements.strategist) unlockAchievement("strategist"); if (decisionCount >= 5 && !achievements.perfectMision) unlockAchievement("perfectMision"); }
    if (!training && tiempoPromedio && tiempoPromedio < 10 && decisionCount >= 1 && dificultadActual !== "easy") { if (!achievements.quickDecision) unlockAchievement("quickDecision"); }
}

// ========== TEMAS Y MODALES ==========
function setColorTheme(theme) { document.body.classList.remove("theme-military", "theme-steel", "theme-default"); if (theme === "military") document.body.classList.add("theme-military"); else if (theme === "steel") document.body.classList.add("theme-steel"); localStorage.setItem("colorTheme", theme); }
function loadColorTheme() { const theme = localStorage.getItem("colorTheme") || "default"; setColorTheme(theme); }
function showModal(title, content) { const modalDiv = document.createElement("div"); modalDiv.className = "modal"; modalDiv.innerHTML = `<div class="modal-content"><h3><i class="fas fa-info-circle"></i> ${title}</h3>${content}<button onclick="this.closest('.modal').remove()">Cerrar</button></div>`; document.body.appendChild(modalDiv); }
function showManual() { showModal("Manual Táctico", "<p>✔️ Desplegar patrullas y pedir refuerzos es la táctica más segura.<br>✔️ En rehenes, priorizar rescate con fuerzas especiales.<br>✔️ Atacar suministros enemigos cambia el rumbo.<br>✔️ El diálogo temprano evita víctimas civiles.<br>✔️ Activar código rojo ante intrusión.</p>"); }
function showAchievements() { let list = ""; for (let [id, unlocked] of Object.entries(achievements)) { list += `<li style="display:flex; align-items:center; gap:10px; margin:10px 0; ${!unlocked ? 'opacity:0.6' : ''}"><i class="fas fa-${unlocked ? 'medal' : 'lock'} fa-2x"></i><div><strong>${getAchievementName(id)}</strong><br><small>${getAchievementDesc(id)}</small></div>${unlocked ? '<i class="fas fa-check-circle" style="color:#4ade80"></i>' : '<i class="fas fa-hourglass-half"></i>'}</li>`; } showModal("Logros", `<ul style="list-style:none">${list}</ul>`); }
function showPaletteSelector() { const modal = document.createElement("div"); modal.className = "modal"; modal.innerHTML = `<div class="modal-content"><h3><i class="fas fa-palette"></i> Tema</h3><div style="display:flex; gap:15px; justify-content:center"><div style="width:50px;height:50px;background:#2c4c6e;border-radius:25px;cursor:pointer" onclick="setColorTheme('default'); this.closest('.modal').remove();"></div><div style="width:50px;height:50px;background:#2c5e2a;border-radius:25px;cursor:pointer" onclick="setColorTheme('military'); this.closest('.modal').remove();"></div><div style="width:50px;height:50px;background:#4a5568;border-radius:25px;cursor:pointer" onclick="setColorTheme('steel'); this.closest('.modal').remove();"></div></div><button onclick="this.closest('.modal').remove()">Cerrar</button></div>`; document.body.appendChild(modal); }

// ========== ESCENARIOS LARGOS CON RUTAS DE VICTORIA ==========
const gifPlaceholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='180' viewBox='0 0 300 180'%3E%3Crect width='300' height='180' fill='%232c4c6e'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='white' font-size='16' font-family='Arial' dy='.3em'%3E🎖️ SIMULADOR%3C/text%3E%3C/svg%3E";

function shuffleOptions(opts) {
    let newOpts = [...opts];
    for (let i = newOpts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newOpts[i], newOpts[j]] = [newOpts[j], newOpts[i]];
    }
    const letters = ["A", "B", "C"];
    newOpts.forEach((opt, idx) => { opt.letra = letters[idx]; });
    return newOpts;
}

// Escenario 1: FRONTERA
const escenarioFrontera = {
    nombre: "Crisis en la Frontera Occidental",
    p1: { texto: "Inteligencia detecta grupo irregular armado a 5 km de la frontera. Planean atacar un puesto de control. ¿Primera acción?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Desplegar patrullas y solicitar refuerzos aéreos", destino: "consA1" },
            { texto: "Ataque preventivo con drones", destino: "consA2" },
            { texto: "Enviar negociadores", destino: "consA3" }
        ] },
    consA1: { texto: "Refuerzos aéreos llegarán en 20 minutos. Sus patrullas detectan movimiento enemigo.", gif: gifPlaceholder, siguiente: "p2" },
    consA2: { texto: "Los drones destruyen un depósito de munición, pero el enemigo responde con fuego de mortero. 3 heridos.", gif: gifPlaceholder, siguiente: "p2b" },
    consA3: { texto: "Los negociadores son tomados como rehenes. La situación se vuelve crítica.", gif: gifPlaceholder, siguiente: "p2c" },
    p2: { texto: "Refuerzos en camino. La columna enemiga avanza rápidamente. ¿Qué ordena?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Atacar con francotiradores", destino: "consB1" },
            { texto: "Esperar refuerzos", destino: "consB2" },
            { texto: "Evacuar el puesto", destino: "consB3" }
        ] },
    consB1: { texto: "Los francotiradores eliminan a dos cabecillas. El enemigo se desorganiza.", gif: gifPlaceholder, siguiente: "p3" },
    consB2: { texto: "La espera permite al enemigo atrincherarse. La misión se complica.", gif: gifPlaceholder, siguiente: "p3b" },
    consB3: { texto: "La retirada es ordenada, pero se pierde terreno estratégico.", gif: gifPlaceholder, siguiente: "p3c" },
    p2b: { texto: "Tras el bombardeo, el enemigo se repliega a una cueva cercana. ¿Qué acción toma?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Asaltar la cueva con fuerzas especiales", destino: "consC1" },
            { texto: "Sellar las salidas y negociar", destino: "consC2" },
            { texto: "Solicitar bombardeo aéreo", destino: "consC3" }
        ] },
    consC1: { texto: "Asalto exitoso, 2 bajas propias. Capturan documentos.", gif: gifPlaceholder, siguiente: "p4" },
    consC2: { texto: "Negociación tensa: 10 enemigos se rinden, otros huyen.", gif: gifPlaceholder, siguiente: "p4b" },
    consC3: { texto: "El bombardeo destruye la cueva, pero daña un oleoducto cercano.", gif: gifPlaceholder, siguiente: "p4c" },
    p2c: { texto: "Los rehenes (3 soldados) están en poder del enemigo. ¿Qué prioriza?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Lanzar un rescate inmediato", destino: "consD1" },
            { texto: "Negociar la liberación", destino: "consD2" }
        ] },
    consD1: { texto: "Rescate exitoso, pero un soldado resulta herido. El enemigo huye.", gif: gifPlaceholder, siguiente: "p5" },
    consD2: { texto: "Negociación larga: liberan a los rehenes, pero el enemigo obtiene armamento.", gif: gifPlaceholder, siguiente: "p5b" },
    p3: { texto: "El enemigo se reagrupa en una colina. Tiene unos 100 efectivos. ¿Qué estrategia emplea?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Ataque envolvente nocturno", destino: "consE1" },
            { texto: "Bombardeo de artillería", destino: "consE2" }
        ] },
    consE1: { texto: "Ataque sorpresa logra romper la defensa enemiga. Avance significativo.", gif: gifPlaceholder, siguiente: "p6" },
    consE2: { texto: "El bombardeo causa pánico y deserción masiva. El enemigo se rinde.", gif: gifPlaceholder, siguiente: "finalExito" },
    p3b: { texto: "El enemigo atrincherado lanza un contraataque. ¿Cómo responde?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Retirada táctica", destino: "consF1" },
            { texto: "Defensa firme con morteros", destino: "consF2" }
        ] },
    consF1: { texto: "Retirada ordenada, pero pierde terreno.", gif: gifPlaceholder, siguiente: "p6b" },
    consF2: { texto: "Repelen ataque con 10 bajas enemigas.", gif: gifPlaceholder, siguiente: "finalExitoParcial" },
    p3c: { texto: "El tiempo perdido permitió al enemigo recibir suministros. ¿Qué orden da?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Atacar cadena de suministros", destino: "consG1" },
            { texto: "Solicitar alto el fuego", destino: "consG2" }
        ] },
    consG1: { texto: "Destruyen convoy enemigo. Golpe de gracia.", gif: gifPlaceholder, siguiente: "finalExito" },
    consG2: { texto: "Alto el fuego rechazado. El enemigo ataca con más fuerza.", gif: gifPlaceholder, siguiente: "finalFracasoTotal" },
    p4: { texto: "Los documentos capturados revelan un plan de ataque contra una ciudad cercana. ¿Qué hace?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Alertar autoridades y evacuar", destino: "consH1" },
            { texto: "Emboscar células enemigas", destino: "consH2" }
        ] },
    consH1: { texto: "Evacuación exitosa. La ciudad está a salvo.", gif: gifPlaceholder, siguiente: "finalExito" },
    consH2: { texto: "Emboscada elimina a 15 terroristas.", gif: gifPlaceholder, siguiente: "finalExito" },
    p4b: { texto: "Los que huyeron se refugian en una aldea. ¿Cómo procede?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Cercar y negociar", destino: "consI1" },
            { texto: "Asalto directo", destino: "consI2" }
        ] },
    consI1: { texto: "Capturan a los líderes. Operación exitosa.", gif: gifPlaceholder, siguiente: "finalExito" },
    consI2: { texto: "Asalto violento, muchos heridos.", gif: gifPlaceholder, siguiente: "finalExitoParcial" },
    p4c: { texto: "El oleoducto dañado provoca un incendio. ¿Cuál es su prioridad?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Apagar fuego", destino: "consJ1" },
            { texto: "Abandonar zona", destino: "consJ2" }
        ] },
    consJ1: { texto: "Fuego controlado. Daño limitado.", gif: gifPlaceholder, siguiente: "finalExitoParcial" },
    consJ2: { texto: "El fuego se expande y causa una crisis diplomática.", gif: gifPlaceholder, siguiente: "finalFracasoTotal" },
    p5: { texto: "El enemigo fugitivo busca refugio en zona montañosa. ¿Qué táctica usa?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Persecución con helicópteros", destino: "consK1" },
            { texto: "Bloqueo de rutas", destino: "consK2" }
        ] },
    consK1: { texto: "Capturan al líder. Fin de la amenaza.", gif: gifPlaceholder, siguiente: "finalExito" },
    consK2: { texto: "El enemigo se rinde por falta de suministros.", gif: gifPlaceholder, siguiente: "finalExito" },
    p5b: { texto: "El armamento entregado durante la negociación ahora es usado en su contra. ¿Cómo se defiende?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Ataque nocturno sorpresa", destino: "consL1" },
            { texto: "Mediación internacional", destino: "consL2" }
        ] },
    consL1: { texto: "Ataque exitoso. Recuperan armamento.", gif: gifPlaceholder, siguiente: "finalExitoParcial" },
    consL2: { texto: "Mediación fracasa. Escalada del conflicto.", gif: gifPlaceholder, siguiente: "finalFracasoTotal" },
    p6: { texto: "Operación casi finalizada. Enemigo pide tregua. ¿Acepta?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Aceptar tregua", destino: "finalExitoParcial" },
            { texto: "Rechazar y continuar", destino: "finalExito" }
        ] },
    p6b: { texto: "Ha perdido posiciones. Moral baja. ¿Qué orden da?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Reorganizar y contraatacar", destino: "finalExitoParcial" },
            { texto: "Retirada estratégica", destino: "finalFracasoTotal" }
        ] }
};

// Escenario 2: DISTURBIOS
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
    consE1: { texto: "Presencia evita nuevos disturbios.", gif: gifPlaceholder, siguiente: "finalExito" },
    consE2: { texto: "Reconstrucción gana apoyo ciudadano.", gif: gifPlaceholder, siguiente: "finalExito" },
    p3b: { texto: "Disturbios se expanden a zonas residenciales. ¿Qué ordena?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Toque de queda y ejército", destino: "consF1" },
            { texto: "Negociar con líderes vecinales", destino: "consF2" }
        ] },
    consF1: { texto: "Toque de queda restablece orden, pero tensiones sociales.", gif: gifPlaceholder, siguiente: "finalExitoParcial" },
    consF2: { texto: "Negociación reduce violencia, pero radicales persisten.", gif: gifPlaceholder, siguiente: "finalExitoParcial" },
    p3c: { texto: "Radicales se refugian en barrio popular. ¿Qué acción?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Cercar y negociar", destino: "consG1" },
            { texto: "Allanamientos selectivos", destino: "consG2" }
        ] },
    consG1: { texto: "Logran rendición de radicales.", gif: gifPlaceholder, siguiente: "finalExito" },
    consG2: { texto: "Allanamientos capturan cabecillas, con heridos civiles.", gif: gifPlaceholder, siguiente: "finalFracasoTotal" },
    p4: { texto: "Líderes detenidos. Estrategia de largo plazo.", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Programas sociales", destino: "consH1" },
            { texto: "Aumentar vigilancia", destino: "consH2" }
        ] },
    consH1: { texto: "Programas mejoran convivencia.", gif: gifPlaceholder, siguiente: "finalExito" },
    consH2: { texto: "Vigilancia reduce delincuencia, pero persiste malestar.", gif: gifPlaceholder, siguiente: "finalExitoParcial" },
    p4b: { texto: "Orden parcial, focos de resistencia. ¿Qué hace?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Intensificar presencia policial", destino: "consI1" },
            { texto: "Diálogos comunitarios", destino: "consI2" }
        ] },
    consI1: { texto: "Presión policial disuelve focos.", gif: gifPlaceholder, siguiente: "finalExito" },
    consI2: { texto: "Diálogo reduce tensión, requiere más tiempo.", gif: gifPlaceholder, siguiente: "finalExitoParcial" },
    p4c: { texto: "Daños materiales enormes. ¿Prioridad?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Reconstruir infraestructura", destino: "consJ1" },
            { texto: "Capturar responsables", destino: "consJ2" }
        ] },
    consJ1: { texto: "Reconstrucción gana apoyo ciudadano.", gif: gifPlaceholder, siguiente: "finalExitoParcial" },
    consJ2: { texto: "Capturas exitosas, pero ciudad en ruinas.", gif: gifPlaceholder, siguiente: "finalFracasoTotal" },
    p5: { texto: "Heridos civiles necesitan atención. ¿Qué ordena?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Ambulancias y hospital de campaña", destino: "consK1" },
            { texto: "Ayuda humanitaria internacional", destino: "consK2" }
        ] },
    consK1: { texto: "Atención médica salva vidas.", gif: gifPlaceholder, siguiente: "finalExito" },
    consK2: { texto: "Ayuda llega tarde. Se pierden vidas.", gif: gifPlaceholder, siguiente: "finalFracasoTotal" },
    p5b: { texto: "Economía local afectada por saqueos. ¿Qué prioriza?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Ayudas a comerciantes", destino: "consL1" },
            { texto: "Reforzar seguridad", destino: "consL2" }
        ] },
    consL1: { texto: "Ayudas reactivan comercio.", gif: gifPlaceholder, siguiente: "finalExito" },
    consL2: { texto: "Seguridad evita nuevos incidentes, pero economía se hunde.", gif: gifPlaceholder, siguiente: "finalExitoParcial" }
};

// Escenario 3: INFILTRACIÓN
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
    consF1: { texto: "Se bloquea acceso. Intrusos se rinden.", gif: gifPlaceholder, siguiente: "finalExito" },
    consF2: { texto: "Al entrar, activan bomba. Explosión y daños.", gif: gifPlaceholder, siguiente: "finalFracasoTotal" },
    p3c: { texto: "Intrusos tienen rehenes. ¿Cómo procede?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Negociación", destino: "consG1" },
            { texto: "Asalto relámpago", destino: "consG2" }
        ] },
    consG1: { texto: "Negociación exitosa: liberan rehenes a cambio de helicóptero.", gif: gifPlaceholder, siguiente: "finalExitoParcial" },
    consG2: { texto: "Asalto exitoso, dos rehenes heridos.", gif: gifPlaceholder, siguiente: "finalExitoParcial" },
    p4: { texto: "Información robada incluye planes de defensa. ¿Qué hace?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Cambiar códigos y protocolos", destino: "consH1" },
            { texto: "Rastrear responsables", destino: "consH2" }
        ] },
    consH1: { texto: "Códigos cambiados. Información obsoleta.", gif: gifPlaceholder, siguiente: "finalExito" },
    consH2: { texto: "Recuperan información antes de ser vendida.", gif: gifPlaceholder, siguiente: "finalExito" },
    p4b: { texto: "Huellas llevan a casa en pueblo. ¿Qué orden?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Solicitar orden de allanamiento", destino: "consI1" },
            { texto: "Allanar sin orden por urgencia", destino: "consI2" }
        ] },
    consI1: { texto: "Orden llega tarde. Sospechosos huyen.", gif: gifPlaceholder, siguiente: "finalExitoParcial" },
    consI2: { texto: "Capturan espías y recuperan material.", gif: gifPlaceholder, siguiente: "finalExito" },
    p4c: { texto: "Equipos de espionaje activos. ¿Qué acción?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Desconectar red y auditoría", destino: "consJ1" },
            { texto: "Usar equipos para enviar información falsa", destino: "consJ2" }
        ] },
    consJ1: { texto: "Auditoría descubre sistema comprometido. Reemplazan equipos.", gif: gifPlaceholder, siguiente: "finalExitoParcial" },
    consJ2: { texto: "Contra-inteligencia funciona. Desenmascaran red de espionaje.", gif: gifPlaceholder, siguiente: "finalExito" },
    p5: { texto: "Intrusos huyeron, dejaron pistas. ¿Qué prioriza?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Analizar pistas", destino: "consK1" },
            { texto: "Reforzar seguridad", destino: "consK2" }
        ] },
    consK1: { texto: "Identifican célula enemiga. Toman medidas.", gif: gifPlaceholder, siguiente: "finalExito" },
    consK2: { texto: "Seguridad reforzada, pero culpables no capturados.", gif: gifPlaceholder, siguiente: "finalExitoParcial" },
    p5b: { texto: "Intrusos capturados se niegan a hablar. ¿Qué técnica?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Interrogatorio psicológico", destino: "consL1" },
            { texto: "Ofrecer reducción de condena", destino: "consL2" }
        ] },
    consL1: { texto: "Uno confiesa red de apoyo.", gif: gifPlaceholder, siguiente: "finalExito" },
    consL2: { texto: "Obtienen información valiosa sobre futuros ataques.", gif: gifPlaceholder, siguiente: "finalExito" },
    p6: { texto: "Intruso capturado ofrece información a cambio de asilo. ¿Acepta?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Aceptar trato", destino: "finalExito" },
            { texto: "Rechazar y juzgar", destino: "finalExitoParcial" }
        ] },
    p6b: { texto: "Intruso murió en explosión. No hay pistas. ¿Qué concluye?", gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Amenaza continúa. Incrementar vigilancia", destino: "finalExitoParcial" },
            { texto: "Cerrar caso por falta de pruebas", destino: "finalFracasoTotal" }
        ] }
};

const escenariosPosibles = [escenarioFrontera, escenarioDisturbios, escenarioInfiltracion];

const resultadosBase = {
    finalExito: { tipo: "exito", mensaje: "¡MISIÓN CUMPLIDA CON ÉXITO TOTAL!", analisisBase: "Ha demostrado una excelente capacidad de mando. Sus decisiones fueron acertadas.", gif: gifPlaceholder },
    finalExitoParcial: { tipo: "parcial", mensaje: "ÉXITO PARCIAL", analisisBase: "El objetivo se alcanzó, pero hubo contratiempos evitables.", gif: gifPlaceholder },
    finalFracasoTotal: { tipo: "fracaso", mensaje: "FRACASO TOTAL", analisisBase: "Error estratégico. Revise la doctrina.", gif: gifPlaceholder },
    finalError: { tipo: "fracaso", mensaje: "ERROR", analisisBase: "Reinicie la simulación.", gif: gifPlaceholder }
};

let escenarioActivo = null, pasoActual = null, esperando = false, dificultadActual = "medium", historial = [];
let temporizadorInterval = null, tiempoRestante = 60, tiempoActivo = false, decisionTomada = false;
let tiemposDificultad = { easy: 90, medium: 60, hard: 45 };
let trainingModeFlag = false, currentChosenLetters = [];

function prepararEscenario(escenarioBase) {
    let escenario = JSON.parse(JSON.stringify(escenarioBase));
    escenario.finalExito = resultadosBase.finalExito;
    escenario.finalExitoParcial = resultadosBase.finalExitoParcial;
    escenario.finalFracasoTotal = resultadosBase.finalFracasoTotal;
    escenario.finalError = resultadosBase.finalError;
    for(let key in escenario) {
        if(escenario[key].opciones_raw) {
            let opts = shuffleOptions(escenario[key].opciones_raw);
            escenario[key].opciones = opts;
            escenario[key].opciones.forEach(op => {
                if(op.destino === "finalExito") op.destino = "finalExito";
                else if(op.destino === "finalExitoParcial") op.destino = "finalExitoParcial";
                else if(op.destino === "finalFracasoTotal") op.destino = "finalFracasoTotal";
            });
        }
        if(escenario[key].siguiente) {
            if(escenario[key].siguiente === "finalExito") escenario[key].siguiente = "finalExito";
            else if(escenario[key].siguiente === "finalExitoParcial") escenario[key].siguiente = "finalExitoParcial";
            else if(escenario[key].siguiente === "finalFracasoTotal") escenario[key].siguiente = "finalFracasoTotal";
        }
    }
    return escenario;
}

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
            else mostrarFeedback(escenarioActivo.finalError);
        } else { tiempoRestante--; actualizarDisplayTimer(); }
    }, 1000);
}
function actualizarDisplayTimer() {
    if (trainingModeFlag) return;
    let mins = Math.floor(tiempoRestante/60), segs = tiempoRestante%60;
    const disp = document.getElementById("timerDisplay");
    if(disp) disp.textContent = `${mins.toString().padStart(2,'0')}:${segs.toString().padStart(2,'0')}`;
    if(tiempoRestante <= 5) disp.style.color = "#f87171";
    else disp.style.color = "white";
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
    document.getElementById("startScreen").style.display = "none";
    document.getElementById("simScreen").style.display = "block";
    document.getElementById("feedbackScreen").style.display = "none";
    const primera = escenarioActivo.p1;
    if(!primera) mostrarFeedback(escenarioActivo.finalError);
    else mostrarPregunta(primera);
}

function mostrarPregunta(preg) {
    if(!preg) { mostrarFeedback(escenarioActivo.finalError); return; }
    detenerTemporizador();
    const situationBox = document.getElementById("situationBox");
    situationBox.style.animation = "none";
    situationBox.offsetHeight;
    situationBox.style.animation = "slideInLeft 0.5s ease";
    document.getElementById("situationText").innerHTML = preg.texto;
    document.getElementById("situationGif").src = preg.gif || gifPlaceholder;
    const optsDiv = document.getElementById("optionsBox");
    optsDiv.innerHTML = "";
    if(!preg.opciones || preg.opciones.length === 0) { mostrarFeedback(escenarioActivo.finalError); return; }
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

function elegirOpcion(dest, letra, texto) {
    if(esperando || decisionTomada) return;
    decisionTomada = true;
    esperando = true;
    detenerTemporizador();
    playSound("click");
    let tiempoUsado = trainingModeFlag ? 0 : tiemposDificultad[dificultadActual] - tiempoRestante;
    historial.push({ letra, texto, momento: new Date().toLocaleTimeString(), tiempo: tiempoUsado });
    currentChosenLetters.push(letra);
    if(dest === "finalExito" || dest === "finalExitoParcial" || dest === "finalFracasoTotal") {
        mostrarFeedback(escenarioActivo[dest] || escenarioActivo.finalError);
        return;
    }
    const cons = escenarioActivo[dest];
    if(!cons) { mostrarFeedback(escenarioActivo.finalError); return; }
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
        const sig = escenarioActivo[cons.siguiente];
        if(!sig) { mostrarFeedback(escenarioActivo.finalError); return; }
        pasoActual = cons.siguiente;
        esperando = false;
        decisionTomada = false;
        mostrarPregunta(sig);
    }, 3500);
}

function generarAnalisisCritico(final, historialDecisiones, tiempoPromedio, escenarioNombre) {
    let analisis = "";
    if (final.tipo === "exito") {
        analisis = `<span style="color: var(--color-success);"><i class="fas fa-check-circle"></i> RESULTADO: ÉXITO OPERACIONAL</span><hr>`;
        analisis += `<p><strong>Valoración del mando:</strong> ${final.analisisBase}</p>`;
    } else if (final.tipo === "parcial") {
        analisis = `<span style="color: var(--color-warning);"><i class="fas fa-exclamation-triangle"></i> RESULTADO: ÉXITO LIMITADO</span><hr>`;
        analisis += `<p><strong>Valoración del mando:</strong> ${final.analisisBase}</p>`;
    } else {
        analisis = `<span style="color: var(--color-danger);"><i class="fas fa-times-circle"></i> RESULTADO: NO CUMPLIDO</span><hr>`;
        analisis += `<p><strong>Valoración del mando:</strong> ${final.analisisBase}</p>`;
    }
    analisis += `<p><strong>📋 Lecciones aprendidas:</strong><br>`;
    if (final.tipo === "exito") {
        analisis += `✓ Coherencia estratégica: sus decisiones mantuvieron una línea de mando efectiva.<br>`;
        analisis += `✓ Gestión de riesgos: supo priorizar adecuadamente en cada fase.<br>`;
    } else if (final.tipo === "parcial") {
        analisis += `⚠️ Puntos de mejora: identifique los momentos donde dudó o eligió una opción subóptima.<br>`;
        analisis += `💡 Recomendación: en escenarios similares, priorice siempre la seguridad de la tropa y la obtención de información.<br>`;
    } else {
        analisis += `❌ Error crítico: la indecisión o la táctica inapropiada fueron determinantes.<br>`;
        analisis += `🎯 Para la próxima: evite posturas pasivas cuando la iniciativa es necesaria. Revise la doctrina básica.<br>`;
    }
    analisis += `</p>`;
    analisis += `<p><strong>🎯 Enfoque para ${escenarioNombre}:</strong><br>`;
    if (escenarioNombre.includes("Frontera")) {
        analisis += `• En operaciones fronterizas, combine poder aéreo con reconocimiento terrestre. La negociación con grupos irregulares rara vez funciona sin presión militar.`;
    } else if (escenarioNombre.includes("Orden Público")) {
        analisis += `• En disturbios, la disuasión temprana evita escaladas. El diálogo es complementario, no sustituto.`;
    } else if (escenarioNombre.includes("Seguridad")) {
        analisis += `• En protección de instalaciones, active los protocolos de inmediato. Dudar da ventaja al intruso.`;
    }
    analisis += `</p>`;
    analisis += `<p><strong>📌 Conclusión:</strong> Cada simulación es una oportunidad de crecimiento. Analice sus aciertos y errores, y vuelva a intentarlo.</p>`;
    return analisis;
}

function mostrarFeedback(final) {
    detenerTemporizador();
    let tiempos = historial.map(h => h.tiempo).filter(t => t !== undefined);
    let tiempoPromedio = tiempos.length ? (tiempos.reduce((a,b)=>a+b,0)/tiempos.length).toFixed(1) : 0;
    let decisionCount = historial.length;
    checkAchievements(final.tipo, decisionCount, tiempoPromedio, trainingModeFlag);
    let analisisCompleto = generarAnalisisCritico(final, historial, tiempoPromedio, escenarioActivo.nombre);
    document.getElementById("simScreen").style.display = "none";
    document.getElementById("feedbackScreen").style.display = "block";
    const badge = document.getElementById("resultBadge");
    if(final.tipo === "exito") { badge.innerHTML = '<i class="fas fa-trophy"></i> VICTORIA TÁCTICA'; badge.className = "result-badge result-success"; playSound("victory"); }
    else if(final.tipo === "parcial") { badge.innerHTML = '<i class="fas fa-chart-line"></i> ÉXITO PARCIAL'; badge.className = "result-badge result-parcial"; playSound("failure"); }
    else { badge.innerHTML = '<i class="fas fa-skull-crossbones"></i> MISIÓN NO CUMPLIDA'; badge.className = "result-badge result-failure"; playSound("failure"); }
    document.getElementById("resultGifArea").innerHTML = `<img src="${final.gif}" alt="Resultado">`;
    document.getElementById("feedbackText").innerHTML = final.mensaje;
    let historialHtml = "";
    historial.forEach((h,i) => {
        historialHtml += `<br>• Decisión ${i+1}: Opción ${h.letra} - "${h.texto}" (${h.momento}) - ⏱️ ${h.tiempo}s`;
    });
    let diffName = dificultadActual === "easy" ? "FÁCIL" : (dificultadActual === "medium" ? "NORMAL" : "DIFÍCIL");
    document.getElementById("analysisText").innerHTML = `${analisisCompleto}<hr><strong>REGISTRO DE DECISIONES:</strong>${historialHtml}<br><br><strong>TIEMPO PROMEDIO POR DECISIÓN:</strong> ${tiempoPromedio} segundos<br><strong>DIFICULTAD:</strong> ${diffName}<br><strong>ESCENARIO:</strong> ${escenarioActivo.nombre}`;
}

function volverMenu() { location.reload(); }
function reiniciarMismo() { iniciarJuego(); }
function setDifficulty(d) { dificultadActual = d; const badge = document.getElementById("difficultyBadge"); if(d === "easy") badge.innerHTML = '<i class="fas fa-seedling"></i> FÁCIL'; else if(d === "medium") badge.innerHTML = '<i class="fas fa-chart-line"></i> NORMAL'; else badge.innerHTML = '<i class="fas fa-skull"></i> DIFÍCIL'; }

// Eventos
document.getElementById("startBtn").onclick = () => { document.getElementById("levelMenu").style.display = "block"; document.getElementById("startBtn").style.display = "none"; };
document.querySelectorAll(".level-btn").forEach(btn => { btn.onclick = () => { setDifficulty(btn.getAttribute("data-difficulty")); iniciarJuego(); }; });
document.getElementById("themeToggleBtn").onclick = () => { document.body.classList.toggle("dark"); localStorage.setItem("darkMode", document.body.classList.contains("dark")); };
document.getElementById("tutorialBtn").onclick = () => { showModal("Tutorial", "<p>Seleccione dificultad, lea la situación y elija una opción. El temporizador corre por decisión. Al final, obtendrá un análisis detallado.</p>"); };
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