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

// ========== ESTADÍSTICAS ==========
let stats = JSON.parse(localStorage.getItem("simStats")) || { totalGames: 0, totalWins: 0, totalPartial: 0, totalLosses: 0, bestStreak: 0, currentStreak: 0, avgDecisions: 0, decisionsHistory: [], mostChosenOption: { letter: "", count: 0 } };
function updateStats(result, decisionCount, chosenLetters) {
    stats.totalGames++; if (result === "exito") stats.totalWins++; else if (result === "parcial") stats.totalPartial++; else stats.totalLosses++;
    if (result === "exito") { stats.currentStreak++; if (stats.currentStreak > stats.bestStreak) stats.bestStreak = stats.currentStreak; } else stats.currentStreak = 0;
    stats.decisionsHistory.push(decisionCount); let sum = stats.decisionsHistory.reduce((a,b)=>a+b,0); stats.avgDecisions = (sum / stats.decisionsHistory.length).toFixed(1);
    let letterCount = {}; chosenLetters.forEach(l => { letterCount[l] = (letterCount[l] || 0) + 1; });
    for (let [letter, count] of Object.entries(letterCount)) { if (count > stats.mostChosenOption.count) stats.mostChosenOption = { letter, count }; }
    localStorage.setItem("simStats", JSON.stringify(stats));
}

// ========== LOGROS ==========
let achievements = JSON.parse(localStorage.getItem("achievements")) || { firstVictory: false, quickDecision: false, strategist: false, perfectMision: false };
function unlockAchievement(id) { if (achievements[id]) return; achievements[id] = true; localStorage.setItem("achievements", JSON.stringify(achievements)); playSound("victory"); alert(`🏅 ¡LOGRO DESBLOQUEADO! ${getAchievementName(id)}`); }
function getAchievementName(id) { const names = { firstVictory: "Primera Victoria", quickDecision: "Decisión Rápida", strategist: "Estratega", perfectMision: "Perfecto" }; return names[id]; }
function getAchievementDesc(id) { const desc = { firstVictory: "Completa tu primera misión con éxito.", quickDecision: "Decisión en menos de 10 segundos (Normal+).", strategist: "Acumula 3 victorias.", perfectMision: "5+ decisiones sin fallar." }; return desc[id]; }
function checkAchievements(finalType, decisionCount, tiempoPromedio, training) {
    if (finalType === "exito") { if (!achievements.firstVictory) unlockAchievement("firstVictory"); let wins = parseInt(localStorage.getItem("totalWins") || 0) + 1; localStorage.setItem("totalWins", wins); if (wins >= 3 && !achievements.strategist) unlockAchievement("strategist"); if (decisionCount >= 5 && !achievements.perfectMision) unlockAchievement("perfectMision"); }
    if (!training && tiempoPromedio && tiempoPromedio < 10 && decisionCount >= 1 && dificultadActual !== "easy") { if (!achievements.quickDecision) unlockAchievement("quickDecision"); }
}

// ========== TEMAS Y MODALES ==========
function setColorTheme(theme) { document.body.classList.remove("theme-military", "theme-steel", "theme-default"); if (theme === "military") document.body.classList.add("theme-military"); else if (theme === "steel") document.body.classList.add("theme-steel"); localStorage.setItem("colorTheme", theme); }
function loadColorTheme() { const theme = localStorage.getItem("colorTheme") || "default"; setColorTheme(theme); }
function showModal(title, content) { const modalDiv = document.createElement("div"); modalDiv.className = "modal"; modalDiv.innerHTML = `<div class="modal-content"><h3><i class="fas fa-info-circle"></i> ${title}</h3>${content}<button onclick="this.closest('.modal').remove()">Cerrar</button></div>`; document.body.appendChild(modalDiv); }
function showManual() { showModal("Manual Táctico", "<p>✔️ Desplegar patrullas y pedir refuerzos es la táctica más segura.<br>✔️ En rehenes, priorizar rescate con fuerzas especiales.<br>✔️ Atacar suministros enemigos cambia el rumbo.<br>✔️ El diálogo temprano evita víctimas civiles.<br>✔️ Activar código rojo ante intrusión.</p>"); }
function showAchievements() { let list = ""; for (let [id, unlocked] of Object.entries(achievements)) { list += `<li style="display:flex; align-items:center; gap:10px; margin:10px 0; ${!unlocked ? 'opacity:0.6' : ''}"><i class="fas fa-${unlocked ? 'medal' : 'lock'} fa-2x"></i><div><strong>${getAchievementName(id)}</strong><br><small>${getAchievementDesc(id)}</small></div>${unlocked ? '<i class="fas fa-check-circle" style="color:#4ade80"></i>' : '<i class="fas fa-hourglass-half"></i>'}</li>`; } showModal("Logros", `<ul style="list-style:none">${list}</ul>`); }
function showStats() { let winRate = stats.totalGames ? ((stats.totalWins / stats.totalGames) * 100).toFixed(1) : 0; let html = `<div class="stat-grid"><div class="stat-card"><div class="stat-number">${stats.totalGames}</div><div>Partidas</div></div><div class="stat-card"><div class="stat-number">${stats.totalWins}</div><div>Victorias</div></div><div class="stat-card"><div class="stat-number">${stats.totalPartial}</div><div>Parciales</div></div><div class="stat-card"><div class="stat-number">${stats.totalLosses}</div><div>Derrotas</div></div><div class="stat-card"><div class="stat-number">${winRate}%</div><div>Efectividad</div></div><div class="stat-card"><div class="stat-number">${stats.bestStreak}</div><div>Mejor racha</div></div><div class="stat-card"><div class="stat-number">${stats.avgDecisions}</div><div>Promedio decisiones</div></div><div class="stat-card"><div class="stat-number">${stats.mostChosenOption.letter || "—"}</div><div>Opción más usada</div></div></div>`; showModal("Estadísticas", html); }
function showPaletteSelector() { const modal = document.createElement("div"); modal.className = "modal"; modal.innerHTML = `<div class="modal-content"><h3><i class="fas fa-palette"></i> Tema</h3><div style="display:flex; gap:15px; justify-content:center"><div style="width:50px;height:50px;background:#2c4c6e;border-radius:25px;cursor:pointer" onclick="setColorTheme('default'); this.closest('.modal').remove();"></div><div style="width:50px;height:50px;background:#2c5e2a;border-radius:25px;cursor:pointer" onclick="setColorTheme('military'); this.closest('.modal').remove();"></div><div style="width:50px;height:50px;background:#4a5568;border-radius:25px;cursor:pointer" onclick="setColorTheme('steel'); this.closest('.modal').remove();"></div></div><button onclick="this.closest('.modal').remove()">Cerrar</button></div>`; document.body.appendChild(modal); }

// ========== ESCENARIOS LARGOS ==========
const gifPlaceholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='180' viewBox='0 0 300 180'%3E%3Crect width='300' height='180' fill='%232c4c6e'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='white' font-size='16' font-family='Arial' dy='.3em'%3E🎖️ SIMULADOR ADI CORO%3C/text%3E%3C/svg%3E";

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

// ESCENARIO 1: FRONTERA (árbol profundo)
const escenarioFrontera = {
    nombre: "Crisis en la Frontera Occidental",
    p1: {
        texto: "Inteligencia detecta un grupo irregular armado a 5 km de la frontera. Planean atacar un puesto de control. Usted tiene 200 soldados. ¿Primera acción?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Desplegar patrullas y solicitar refuerzos aéreos", destino: "consA1" },
            { texto: "Realizar un ataque preventivo con drones", destino: "consA2" },
            { texto: "Enviar negociadores para intentar un diálogo", destino: "consA3" }
        ]
    },
    consA1: { texto: "Refuerzos aéreos llegarán en 20 minutos. Sus patrullas detectan movimiento enemigo hacia el puesto.", gif: gifPlaceholder, siguiente: "p2" },
    consA2: { texto: "Los drones destruyen un depósito de munición, pero el enemigo responde con fuego de mortero. 3 heridos.", gif: gifPlaceholder, siguiente: "p2b" },
    consA3: { texto: "Los negociadores son tomados como rehenes. La situación se vuelve crítica.", gif: gifPlaceholder, siguiente: "p2c" },
    p2: {
        texto: "Refuerzos en camino. La columna enemiga avanza rápidamente. ¿Qué ordena?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Atacar con francotiradores para desmoralizar", destino: "consB1" },
            { texto: "Esperar refuerzos antes de cualquier acción", destino: "consB2" },
            { texto: "Evacuar el puesto y replegarse", destino: "consB3" }
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
            { texto: "Sellar las salidas y negociar la rendición", destino: "consC2" },
            { texto: "Solicitar bombardeo aéreo de precisión", destino: "consC3" }
        ]
    },
    consC1: { texto: "Asalto exitoso, 2 bajas propias. Capturan documentos con planes de ataque a una ciudad.", gif: gifPlaceholder, siguiente: "p4" },
    consC2: { texto: "Negociación tensa: 10 enemigos se rinden, otros huyen por túneles.", gif: gifPlaceholder, siguiente: "p4b" },
    consC3: { texto: "El bombardeo destruye la cueva, pero daña un oleoducto cercano.", gif: gifPlaceholder, siguiente: "p4c" },
    p2c: {
        texto: "Los rehenes (3 soldados) están en poder del enemigo. ¿Qué prioriza?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Lanzar un rescate inmediato con fuerzas especiales", destino: "consD1" },
            { texto: "Negociar la liberación a cambio de suministros", destino: "consD2" }
        ]
    },
    consD1: { texto: "Rescate exitoso, pero un soldado resulta herido. El enemigo huye hacia la montaña.", gif: gifPlaceholder, siguiente: "p5" },
    consD2: { texto: "Negociación larga: liberan a los rehenes, pero el enemigo obtiene armamento.", gif: gifPlaceholder, siguiente: "p5b" },
    p3: {
        texto: "El enemigo se reagrupa en una colina. Tiene unos 100 efectivos. ¿Qué estrategia emplea?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Ataque envolvente nocturno", destino: "consE1" },
            { texto: "Bombardeo de artillería previo al asalto", destino: "consE2" }
        ]
    },
    consE1: { texto: "Ataque sorpresa logra romper la defensa enemiga. Avance significativo.", gif: gifPlaceholder, siguiente: "p6" },
    consE2: { texto: "El bombardeo causa pánico y deserción masiva. El enemigo se rinde.", gif: gifPlaceholder, siguiente: "finalExito" },
    p3b: {
        texto: "El enemigo atrincherado lanza un contraataque. ¿Cómo responde?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Retirada táctica para reagruparse", destino: "consF1" },
            { texto: "Defensa firme con fuego de mortero", destino: "consF2" }
        ]
    },
    consF1: { texto: "Retirada ordenada, pero se pierde terreno. Necesita replantear.", gif: gifPlaceholder, siguiente: "p6b" },
    consF2: { texto: "Logran repeler el ataque con 10 bajas enemigas.", gif: gifPlaceholder, siguiente: "finalExitoParcial" },
    p3c: {
        texto: "El tiempo perdido permitió al enemigo recibir suministros. ¿Qué orden da?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Atacar la cadena de suministros enemiga", destino: "consG1" },
            { texto: "Solicitar un alto el fuego temporal", destino: "consG2" }
        ]
    },
    consG1: { texto: "Destruyen un convoy enemigo. Golpe de gracia.", gif: gifPlaceholder, siguiente: "finalExito" },
    consG2: { texto: "Alto el fuego rechazado. El enemigo ataca con más fuerza.", gif: gifPlaceholder, siguiente: "finalFracasoTotal" },
    p4: {
        texto: "Los documentos capturados revelan un plan de ataque contra una ciudad cercana. ¿Qué hace?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Alertar a las autoridades civiles y coordinar evacuación", destino: "consH1" },
            { texto: "Emboscar a las células enemigas antes de que actúen", destino: "consH2" }
        ]
    },
    consH1: { texto: "Evacuación exitosa. La ciudad está a salvo. El enemigo huye.", gif: gifPlaceholder, siguiente: "finalExito" },
    consH2: { texto: "Emboscada elimina a 15 terroristas. Misión completada con éxito.", gif: gifPlaceholder, siguiente: "finalExito" },
    p4b: {
        texto: "Los que huyeron se refugian en una aldea. ¿Cómo procede?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Cercar la aldea y negociar la rendición", destino: "consI1" },
            { texto: "Asalto directo", destino: "consI2" }
        ]
    },
    consI1: { texto: "Capturan a los líderes. Operación de alto impacto.", gif: gifPlaceholder, siguiente: "finalExito" },
    consI2: { texto: "Asalto violento, muchos heridos. Victoria pírrica.", gif: gifPlaceholder, siguiente: "finalExitoParcial" },
    p4c: {
        texto: "El oleoducto dañado provoca un incendio. ¿Cuál es su prioridad?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Apagar el fuego y reparar el daño", destino: "consJ1" },
            { texto: "Abandonar la zona y continuar la misión", destino: "consJ2" }
        ]
    },
    consJ1: { texto: "Fuego controlado. Daño ambiental limitado.", gif: gifPlaceholder, siguiente: "finalExitoParcial" },
    consJ2: { texto: "El fuego se expande y causa una crisis diplomática.", gif: gifPlaceholder, siguiente: "finalFracasoTotal" },
    p5: {
        texto: "El enemigo fugitivo busca refugio en zona montañosa. ¿Qué táctica usa?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Persecución implacable con helicópteros", destino: "consK1" },
            { texto: "Bloqueo de rutas de escape", destino: "consK2" }
        ]
    },
    consK1: { texto: "Capturan al líder. Fin de la amenaza.", gif: gifPlaceholder, siguiente: "finalExito" },
    consK2: { texto: "El enemigo se rinde por falta de suministros.", gif: gifPlaceholder, siguiente: "finalExito" },
    p5b: {
        texto: "El armamento entregado durante la negociación ahora es usado en su contra. ¿Cómo se defiende?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Atacar de noche sorpresivamente", destino: "consL1" },
            { texto: "Solicitar mediación internacional", destino: "consL2" }
        ]
    },
    consL1: { texto: "Ataque nocturno exitoso. Recuperan el armamento.", gif: gifPlaceholder, siguiente: "finalExitoParcial" },
    consL2: { texto: "Mediación fracasa. Escalada del conflicto.", gif: gifPlaceholder, siguiente: "finalFracasoTotal" },
    p6: {
        texto: "Operación casi finalizada. El enemigo pide una tregua. ¿Acepta?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Aceptar tregua y negociar condiciones", destino: "finalExitoParcial" },
            { texto: "Rechazar y continuar ofensiva", destino: "finalExito" }
        ]
    },
    p6b: {
        texto: "Ha perdido posiciones importantes. La moral de la tropa baja. ¿Qué orden da?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Reorganizar y contraatacar", destino: "finalExitoParcial" },
            { texto: "Solicitar retirada estratégica", destino: "finalFracasoTotal" }
        ]
    }
};

// ESCENARIO 2: DISTURBIOS (árbol profundo)
const escenarioDisturbios = {
    nombre: "Control de Orden Público en Caracas",
    p1: {
        texto: "Manifestaciones violentas en el centro de la ciudad. Grupos encapuchados atacan comercios y queman vehículos. Usted comanda la unidad de respuesta. ¿Qué ordena?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Desplegar antimotines y establecer perímetro", destino: "consA1" },
            { texto: "Dialogar con líderes comunitarios", destino: "consA2" },
            { texto: "Solicitar refuerzos y esperar órdenes", destino: "consA3" }
        ]
    },
    consA1: { texto: "El despliegue contiene a los manifestantes, pero se producen enfrentamientos aislados. 5 detenidos.", gif: gifPlaceholder, siguiente: "p2" },
    consA2: { texto: "El diálogo calma los ánimos temporalmente. Los líderes piden 24 horas para despejar las vías.", gif: gifPlaceholder, siguiente: "p2b" },
    consA3: { texto: "La espera permite que los grupos violentos tomen el control. Hay saqueos masivos.", gif: gifPlaceholder, siguiente: "p2c" },
    p2: {
        texto: "Los enfrentamientos escalan. Los manifestantes lanzan piedras y cócteles molotov. ¿Qué ordena?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Usar gas lacrimógeno para dispersar", destino: "consB1" },
            { texto: "Retirarse y esperar refuerzos", destino: "consB2" },
            { texto: "Negociar nuevamente con los líderes", destino: "consB3" }
        ]
    },
    consB1: { texto: "El gas dispersa a la multitud, pero hay varios heridos. La situación se calma.", gif: gifPlaceholder, siguiente: "p3" },
    consB2: { texto: "La retirada permite que los disturbios se extiendan a otras zonas.", gif: gifPlaceholder, siguiente: "p3b" },
    consB3: { texto: "Los líderes acceden a dialogar, pero los radicales no obedecen.", gif: gifPlaceholder, siguiente: "p3c" },
    p2b: {
        texto: "Durante la tregua, los radicales se reagrupan. ¿Qué acción toma?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Realizar operaciones de inteligencia para identificar cabecillas", destino: "consC1" },
            { texto: "Reforzar los puntos críticos con unidades de élite", destino: "consC2" },
            { texto: "Mantener la calma y esperar", destino: "consC3" }
        ]
    },
    consC1: { texto: "Identifican a los líderes radicales y los detienen. La violencia disminuye.", gif: gifPlaceholder, siguiente: "p4" },
    consC2: { texto: "El refuerzo disuade nuevos ataques. Se restablece el orden parcialmente.", gif: gifPlaceholder, siguiente: "p4b" },
    consC3: { texto: "Los radicales atacan de nuevo, causando más daños.", gif: gifPlaceholder, siguiente: "p4c" },
    p2c: {
        texto: "La situación es crítica. Los saqueos se extienden. ¿Qué prioriza?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Proteger los comercios y bancos", destino: "consD1" },
            { texto: "Evacuar a los civiles de la zona", destino: "consD2" }
        ]
    },
    consD1: { texto: "Se protegen los bienes, pero hay heridos civiles. Se necesita apoyo médico.", gif: gifPlaceholder, siguiente: "p5" },
    consD2: { texto: "La evacuación es exitosa, pero los saqueos causan pérdidas millonarias.", gif: gifPlaceholder, siguiente: "p5b" },
    p3: {
        texto: "El orden se restablece en la mayoría de las zonas. ¿Cómo procede?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Mantener presencia policial disuasiva", destino: "consE1" },
            { texto: "Iniciar operaciones de limpieza y reconstrucción", destino: "consE2" }
        ]
    },
    consE1: { texto: "La presencia evita nuevos disturbios. La ciudad vuelve a la normalidad.", gif: gifPlaceholder, siguiente: "finalExito" },
    consE2: { texto: "La reconstrucción gana el apoyo ciudadano. La calma es duradera.", gif: gifPlaceholder, siguiente: "finalExito" },
    p3b: {
        texto: "Los disturbios se expanden a zonas residenciales. ¿Qué ordena?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Declarar toque de queda y desplegar el ejército", destino: "consF1" },
            { texto: "Negociar con los líderes vecinales", destino: "consF2" }
        ]
    },
    consF1: { texto: "El toque de queda restablece el orden, pero se generan tensiones sociales.", gif: gifPlaceholder, siguiente: "finalExitoParcial" },
    consF2: { texto: "La negociación reduce la violencia, pero algunos grupos radicales persisten.", gif: gifPlaceholder, siguiente: "finalExitoParcial" },
    p3c: {
        texto: "Los radicales se refugian en un barrio popular. ¿Qué acción toma?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Cercar el barrio y negociar", destino: "consG1" },
            { texto: "Realizar allanamientos selectivos", destino: "consG2" }
        ]
    },
    consG1: { texto: "Tras negociaciones, se logra la rendición de los radicales.", gif: gifPlaceholder, siguiente: "finalExito" },
    consG2: { texto: "Los allanamientos capturan a los cabecillas, pero con heridos civiles.", gif: gifPlaceholder, siguiente: "finalFracasoTotal" },
    p4: {
        texto: "Con los líderes detenidos, se requiere una estrategia de largo plazo. ¿Qué recomienda?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Implementar programas sociales y empleo", destino: "consH1" },
            { texto: "Aumentar la vigilancia policial", destino: "consH2" }
        ]
    },
    consH1: { texto: "Los programas mejoran la convivencia. La paz se consolida.", gif: gifPlaceholder, siguiente: "finalExito" },
    consH2: { texto: "La vigilancia reduce la delincuencia, pero persiste el malestar.", gif: gifPlaceholder, siguiente: "finalExitoParcial" },
    p4b: {
        texto: "El orden parcial se mantiene, pero hay focos de resistencia. ¿Qué hace?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Intensificar la presencia policial en los focos", destino: "consI1" },
            { texto: "Iniciar diálogos comunitarios", destino: "consI2" }
        ]
    },
    consI1: { texto: "La presión policial disuelve los focos. La ciudad se normaliza.", gif: gifPlaceholder, siguiente: "finalExito" },
    consI2: { texto: "El diálogo reduce la tensión, pero se requiere más tiempo.", gif: gifPlaceholder, siguiente: "finalExitoParcial" },
    p4c: {
        texto: "Los daños materiales son enormes. ¿Cuál es la prioridad?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Reconstruir la infraestructura dañada", destino: "consJ1" },
            { texto: "Asegurar la captura de los responsables", destino: "consJ2" }
        ]
    },
    consJ1: { texto: "La reconstrucción gana apoyo ciudadano. La crisis se supera.", gif: gifPlaceholder, siguiente: "finalExitoParcial" },
    consJ2: { texto: "Las capturas son exitosas, pero la ciudad sigue en ruinas.", gif: gifPlaceholder, siguiente: "finalFracasoTotal" },
    p5: {
        texto: "Hay heridos civiles que necesitan atención. ¿Qué ordena?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Enviar ambulancias y desplegar hospitales de campaña", destino: "consK1" },
            { texto: "Solicitar ayuda humanitaria internacional", destino: "consK2" }
        ]
    },
    consK1: { texto: "La atención médica salva vidas. La población agradece.", gif: gifPlaceholder, siguiente: "finalExito" },
    consK2: { texto: "La ayuda internacional llega tarde. Se pierden vidas.", gif: gifPlaceholder, siguiente: "finalFracasoTotal" },
    p5b: {
        texto: "Tras los saqueos, la economía local está afectada. ¿Qué prioriza?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Ayudas económicas a los comerciantes afectados", destino: "consL1" },
            { texto: "Reforzar la seguridad para evitar nuevos saqueos", destino: "consL2" }
        ]
    },
    consL1: { texto: "Las ayudas reactivan el comercio. La normalidad regresa.", gif: gifPlaceholder, siguiente: "finalExito" },
    consL2: { texto: "La seguridad evita nuevos incidentes, pero la economía se hunde.", gif: gifPlaceholder, siguiente: "finalExitoParcial" }
};

// ESCENARIO 3: INFILTRACIÓN (árbol profundo)
const escenarioInfiltracion = {
    nombre: "Seguridad Perimetral - Base Militar",
    p1: {
        texto: "Oficial de guardia. Los sensores detectan intrusión en el perímetro norte. Son las 03:00 horas. ¿Qué orden da?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Activar código rojo y sellar toda la base", destino: "consA1" },
            { texto: "Enviar una ronda de investigación al punto de intrusión", destino: "consA2" },
            { texto: "Revisar cámaras de seguridad antes de activar alarmas", destino: "consA3" }
        ]
    },
    consA1: { texto: "Código rojo activado. Se sellan todas las salidas. Se reportan movimientos en el área de comunicaciones.", gif: gifPlaceholder, siguiente: "p2" },
    consA2: { texto: "La ronda encuentra una brecha en la cerca, pero no hay intrusos a la vista.", gif: gifPlaceholder, siguiente: "p2b" },
    consA3: { texto: "Mientras revisa las cámaras, los intrusos acceden al centro de datos.", gif: gifPlaceholder, siguiente: "p2c" },
    p2: {
        texto: "Se detectan intrusos en el área de comunicaciones. ¿Qué ordena?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Enviar al equipo de reacción rápida", destino: "consB1" },
            { texto: "Aislar el área y cortar la energía", destino: "consB2" },
            { texto: "Negociar con los intrusos", destino: "consB3" }
        ]
    },
    consB1: { texto: "El equipo de reacción captura a dos intrusos, pero uno escapa hacia los hangares.", gif: gifPlaceholder, siguiente: "p3" },
    consB2: { texto: "El corte de energía dificulta la visión. Los intrusos se mueven hacia el arsenal.", gif: gifPlaceholder, siguiente: "p3b" },
    consB3: { texto: "Los intrusos no negocian. Se atrincheran con rehenes.", gif: gifPlaceholder, siguiente: "p3c" },
    p2b: {
        texto: "La brecha está abierta. No hay señales de intrusos. ¿Qué acción toma?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Reparar la brecha y aumentar la vigilancia", destino: "consC1" },
            { texto: "Enviar patrullas al exterior para buscar rastros", destino: "consC2" },
            { texto: "Desestimar la alerta como falsa", destino: "consC3" }
        ]
    },
    consC1: { texto: "La reparación se completa. Horas después, se descubre que robaron información clasificada.", gif: gifPlaceholder, siguiente: "p4" },
    consC2: { texto: "Las patrullas encuentran huellas hacia el pueblo cercano. Posible infiltración.", gif: gifPlaceholder, siguiente: "p4b" },
    consC3: { texto: "Al día siguiente, se descubre que equipos de espionaje fueron instalados en la red.", gif: gifPlaceholder, siguiente: "p4c" },
    p2c: {
        texto: "Los intrusos están en el centro de datos. ¿Qué prioriza?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Proteger la información clasificada", destino: "consD1" },
            { texto: "Capturar a los intrusos vivos", destino: "consD2" }
        ]
    },
    consD1: { texto: "Se desconectan los servidores. La información está a salvo, pero los intrusos huyen.", gif: gifPlaceholder, siguiente: "p5" },
    consD2: { texto: "Se logra capturar a los intrusos, pero algunos datos fueron copiados.", gif: gifPlaceholder, siguiente: "p5b" },
    p3: {
        texto: "Un intruso se oculta en los hangares. ¿Qué ordena?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Cercar los hangares y usar perros detectores", destino: "consE1" },
            { texto: "Entrar con equipo táctico y luces", destino: "consE2" }
        ]
    },
    consE1: { texto: "Los perros detectan al intruso escondido en un avión. Es capturado.", gif: gifPlaceholder, siguiente: "p6" },
    consE2: { texto: "El equipo táctico lo acorrala, pero se inmola con una granada.", gif: gifPlaceholder, siguiente: "p6b" },
    p3b: {
        texto: "Los intrusos se dirigen al arsenal. ¿Qué acción toma?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Bloquear el acceso al arsenal con fuerzas especiales", destino: "consF1" },
            { texto: "Permitirles entrar para atraparlos dentro", destino: "consF2" }
        ]
    },
    consF1: { texto: "Se bloquea el acceso. Los intrusos se rinden al verse acorralados.", gif: gifPlaceholder, siguiente: "finalExito" },
    consF2: { texto: "Al entrar, activan una bomba. Hay explosión y daños.", gif: gifPlaceholder, siguiente: "finalFracasoTotal" },
    p3c: {
        texto: "Los intrusos tienen rehenes. ¿Cómo procede?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Iniciar negociación con los secuestradores", destino: "consG1" },
            { texto: "Asalto relámpago por fuerzas especiales", destino: "consG2" }
        ]
    },
    consG1: { texto: "Negociación exitosa: liberan a los rehenes a cambio de un helicóptero.", gif: gifPlaceholder, siguiente: "finalExitoParcial" },
    consG2: { texto: "Asalto exitoso, pero dos rehenes resultan heridos.", gif: gifPlaceholder, siguiente: "finalExitoParcial" },
    p4: {
        texto: "Se descubre que la información robada incluye planes de defensa. ¿Qué hace?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Cambiar inmediatamente todos los códigos y protocolos", destino: "consH1" },
            { texto: "Rastrear a los responsables antes de que vendan la información", destino: "consH2" }
        ]
    },
    consH1: { texto: "Los códigos se cambian. La información robada queda obsoleta.", gif: gifPlaceholder, siguiente: "finalExito" },
    consH2: { texto: "Se logra recuperar la información antes de que sea vendida.", gif: gifPlaceholder, siguiente: "finalExito" },
    p4b: {
        texto: "Las huellas llevan a una casa en el pueblo. ¿Qué orden da?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Solicitar orden de allanamiento", destino: "consI1" },
            { texto: "Allanar sin orden por urgencia", destino: "consI2" }
        ]
    },
    consI1: { texto: "La orden llega tarde. Los sospechosos huyen.", gif: gifPlaceholder, siguiente: "finalExitoParcial" },
    consI2: { texto: "Se capturan a los espías y se recupera material robado.", gif: gifPlaceholder, siguiente: "finalExito" },
    p4c: {
        texto: "Los equipos de espionaje instalados están activos. ¿Qué acción toma?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Desconectar la red y realizar auditoría", destino: "consJ1" },
            { texto: "Usar los equipos para enviar información falsa", destino: "consJ2" }
        ]
    },
    consJ1: { texto: "La auditoría descubre todo el sistema comprometido. Se reemplazan equipos.", gif: gifPlaceholder, siguiente: "finalExitoParcial" },
    consJ2: { texto: "La contra-inteligencia funciona. Se desenmascara una red de espionaje.", gif: gifPlaceholder, siguiente: "finalExito" },
    p5: {
        texto: "Los intrusos huyeron, pero dejaron pistas. ¿Qué prioriza?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Analizar las pistas para identificar a los responsables", destino: "consK1" },
            { texto: "Reforzar la seguridad para evitar nuevos incidentes", destino: "consK2" }
        ]
    },
    consK1: { texto: "Se identifica a una célula enemiga. Se toman medidas.", gif: gifPlaceholder, siguiente: "finalExito" },
    consK2: { texto: "La seguridad se refuerza, pero los culpables no son capturados.", gif: gifPlaceholder, siguiente: "finalExitoParcial" },
    p5b: {
        texto: "Los intrusos capturados se niegan a hablar. ¿Qué técnica usa?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Interrogatorio psicológico", destino: "consL1" },
            { texto: "Ofrecer reducción de condena a cambio de información", destino: "consL2" }
        ]
    },
    consL1: { texto: "Uno de ellos confiesa la red de apoyo.", gif: gifPlaceholder, siguiente: "finalExito" },
    consL2: { texto: "Se obtiene información valiosa sobre futuros ataques.", gif: gifPlaceholder, siguiente: "finalExito" },
    p6: {
        texto: "El intruso capturado ofrece información a cambio de asilo. ¿Acepta?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "Aceptar el trato y protegerlo", destino: "finalExito" },
            { texto: "Rechazar y juzgarlo por espionaje", destino: "finalExitoParcial" }
        ]
    },
    p6b: {
        texto: "El intruso murió en la explosión. No hay más pistas. ¿Qué concluye?",
        gif: gifPlaceholder,
        opciones_raw: [
            { texto: "La amenaza continúa. Se incrementa la vigilancia", destino: "finalExitoParcial" },
            { texto: "Se cierra el caso por falta de pruebas", destino: "finalFracasoTotal" }
        ]
    }
};

const escenariosPosibles = [escenarioFrontera, escenarioDisturbios, escenarioInfiltracion];

const resultadosBase = {
    finalExito: { tipo: "exito", mensaje: "¡MISIÓN CUMPLIDA CON ÉXITO TOTAL!", analisis: "Excelente liderazgo táctico.", gif: gifPlaceholder },
    finalExitoParcial: { tipo: "parcial", mensaje: "ÉXITO PARCIAL", analisis: "Logró el objetivo con contratiempos.", gif: gifPlaceholder },
    finalFracasoTotal: { tipo: "fracaso", mensaje: "FRACASO TOTAL", analisis: "Error estratégico. Revise la doctrina.", gif: gifPlaceholder },
    finalError: { tipo: "fracaso", mensaje: "ERROR", analisis: "Reinicie la simulación.", gif: gifPlaceholder }
};

// Variables globales del simulador
let escenarioActivo = null, pasoActual = null, esperando = false, dificultadActual = "medium", historial = [];
let temporizadorInterval = null, tiempoRestante = 30, tiempoActivo = false, decisionTomada = false;
let tiemposDificultad = { easy: 45, medium: 30, hard: 20 };
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
        if(!sig) { 
            mostrarFeedback(escenarioActivo.finalError);
            return;
        }
        pasoActual = cons.siguiente;
        esperando = false;
        decisionTomada = false;
        mostrarPregunta(sig);
    }, 1500);
}

function mostrarFeedback(final) {
    detenerTemporizador();
    let tiempos = historial.map(h => h.tiempo).filter(t => t !== undefined);
    let tiempoPromedio = tiempos.length ? (tiempos.reduce((a,b)=>a+b,0)/tiempos.length).toFixed(1) : 0;
    let decisionCount = historial.length;
    checkAchievements(final.tipo, decisionCount, tiempoPromedio, trainingModeFlag);
    updateStats(final.tipo, decisionCount, currentChosenLetters);
    document.getElementById("simScreen").style.display = "none";
    document.getElementById("feedbackScreen").style.display = "block";
    const badge = document.getElementById("resultBadge");
    if(final.tipo === "exito") { badge.innerHTML = '<i class="fas fa-trophy"></i> VICTORIA TÁCTICA'; badge.className = "result-badge result-success"; playSound("victory"); }
    else if(final.tipo === "parcial") { badge.innerHTML = '<i class="fas fa-exclamation-triangle"></i> ÉXITO PARCIAL'; badge.className = "result-badge result-parcial"; playSound("failure"); }
    else { badge.innerHTML = '<i class="fas fa-skull-crossbones"></i> MISIÓN FALLIDA'; badge.className = "result-badge result-failure"; playSound("failure"); }
    document.getElementById("resultGifArea").innerHTML = `<img src="${final.gif}" alt="Resultado">`;
    document.getElementById("feedbackText").innerHTML = final.mensaje;
    let historialHtml = "";
    historial.forEach((h,i) => { historialHtml += `<br>• Decisión ${i+1}: Opción ${h.letra} - "${h.texto}" (${h.momento})`; });
    let diffName = dificultadActual === "easy" ? "FÁCIL" : (dificultadActual === "medium" ? "NORMAL" : "DIFÍCIL");
    document.getElementById("analysisText").innerHTML = `<strong>ANÁLISIS TÁCTICO:</strong><br>${final.analisis}<br><br><strong>REGISTRO:</strong>${historialHtml}<br><br><strong>TIEMPO PROMEDIO:</strong> ${tiempoPromedio} seg<br><strong>DIFICULTAD:</strong> ${diffName}<br><strong>ESCENARIO:</strong> ${escenarioActivo.nombre}`;
}

function volverMenu() { location.reload(); }
function reiniciarMismo() { iniciarJuego(); }
function setDifficulty(d) { dificultadActual = d; const badge = document.getElementById("difficultyBadge"); if(d === "easy") badge.innerHTML = '<i class="fas fa-seedling"></i> FÁCIL'; else if(d === "medium") badge.innerHTML = '<i class="fas fa-chart-line"></i> NORMAL'; else badge.innerHTML = '<i class="fas fa-skull"></i> DIFÍCIL'; }

// Eventos
document.getElementById("startBtn").onclick = () => { document.getElementById("levelMenu").style.display = "block"; document.getElementById("startBtn").style.display = "none"; };
document.querySelectorAll(".level-btn").forEach(btn => { btn.onclick = () => { setDifficulty(btn.getAttribute("data-difficulty")); iniciarJuego(); }; });
document.getElementById("themeToggleBtn").onclick = () => { document.body.classList.toggle("dark"); localStorage.setItem("darkMode", document.body.classList.contains("dark")); };
document.getElementById("tutorialBtn").onclick = () => { showModal("Tutorial", "<p>Seleccione dificultad, lea y elija. Escenario aleatorio. Modo entrenamiento sin tiempo.</p>"); };
document.getElementById("exitToMenuBtn").onclick = volverMenu;
document.getElementById("retryBtn").onclick = reiniciarMismo;
document.getElementById("mainMenuBtn").onclick = volverMenu;
document.getElementById("openManualBtn").onclick = showManual;
document.getElementById("openAchievementsBtn").onclick = showAchievements;
document.getElementById("openStatsBtn").onclick = showStats;
document.getElementById("openPaletteBtn").onclick = showPaletteSelector;
document.getElementById("soundToggleBtn").onclick = () => { soundEnabled = !soundEnabled; localStorage.setItem("soundEnabled", soundEnabled); document.getElementById("soundToggleBtn").innerHTML = soundEnabled ? '<i class="fas fa-volume-up"></i> Sonido' : '<i class="fas fa-volume-mute"></i> Sonido'; if (soundEnabled) initAudio(); };
document.getElementById("ambientSoundBtn").onclick = toggleAmbientSound;

loadColorTheme();
if (localStorage.getItem("darkMode") === "true") document.body.classList.add("dark");
if (ambientSoundEnabled) startAmbientSound();
document.getElementById("trainingModeCheckbox").checked = localStorage.getItem("trainingMode") === "true";
if (localStorage.getItem("tutorialVisto") !== "true") {
    setTimeout(() => showModal("Bienvenido", "<p>Simulador táctico con árboles profundos. Elija dificultad y tome decisiones.</p>"), 500);
    localStorage.setItem("tutorialVisto", "true");
}