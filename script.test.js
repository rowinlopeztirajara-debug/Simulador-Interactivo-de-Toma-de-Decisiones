/**
 * Pruebas unitarias para el simulador táctico
 * Funciones críticas: shuffleOptions, prepararEscenario, checkAchievements,
 * updateProgressCounter, y validación de historial
 */

const fs = require('fs');
const path = require('path');

// ==============================================
// CONFIGURAR DOM PARA LAS PRUEBAS
// ==============================================

// Limpiar el documento antes de cada prueba
beforeEach(() => {
  document.body.innerHTML = '';
  // Crear todos los elementos que el script original necesita
  const elementos = [
    'startBtn',
    'levelMenu',
    'themeToggleBtn',
    'tutorialBtn',
    'exitToMenuBtn',
    'retryBtn',
    'mainMenuBtn',
    'openManualBtn',
    'openAchievementsBtn',
    'openStatsBtn',
    'openPaletteBtn',
    'soundToggleBtn',
    'ambientSoundBtn',
    'difficultyBadge',
    'timerDisplay',
    'situationGif',
    'situationText',
    'optionsBox',
    'resultBadge',
    'feedbackText',
    'analysisText',
    'resultGifArea',
    'progressCounter'
  ];
  
  elementos.forEach(id => {
    const el = document.createElement('div');
    el.id = id;
    document.body.appendChild(el);
  });
  
  // Configurar elementos especiales
  document.getElementById('progressCounter').innerHTML = '<i class="fas fa-list-ol"></i> Decisiones: 0';
  document.getElementById('timerDisplay').textContent = '01:00';
  document.getElementById('difficultyBadge').textContent = 'NORMAL';
  
  // Simular localStorage
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn(() => null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    },
    writable: true
  });
  
  // Simular Audio (para sonidos)
  window.Audio = jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    loop: false,
    volume: 0
  }));
});

// ==============================================
// EVALUAR EL SCRIPT Y CAPTURAR FUNCIONES
// ==============================================

// Leer el contenido de script.js
const scriptContent = fs.readFileSync(path.join(__dirname, 'script.js'), 'utf8');

// Crear un contexto aislado para evaluar el script
const context = {
  document: document,
  window: window,
  localStorage: window.localStorage,
  Audio: window.Audio,
  alert: jest.fn(), // para no mostrar alertas reales
  console: console,
  // Variables que el script podría esperar
  soundEnabled: true,
  audioCtx: null,
};

// Evaluar el script en el contexto
const fn = new Function('context', `
  const module = { exports: {} };
  const exports = module.exports;
  // Pasar el contexto como variables globales
  const document = context.document;
  const window = context.window;
  const localStorage = context.localStorage;
  const Audio = context.Audio;
  const alert = context.alert;
  const console = context.console;
  
  // Ejecutar el código del script
  ${scriptContent}
  
  // Exponer las funciones y variables al contexto
  context.shuffleOptions = shuffleOptions;
  context.prepararEscenario = prepararEscenario;
  context.checkAchievements = checkAchievements;
  context.updateProgressCounter = updateProgressCounter;
  context.historial = historial;
  context.achievements = achievements;
  context.totalWins = totalWins;
  context.unlockAchievement = unlockAchievement;
  context.getAchievementName = getAchievementName;
  context.getAchievementDesc = getAchievementDesc;
`);

fn(context);

// Extraer las funciones del contexto
const {
  shuffleOptions,
  prepararEscenario,
  checkAchievements,
  updateProgressCounter,
  historial,
  achievements,
  totalWins,
  unlockAchievement,
  getAchievementName,
  getAchievementDesc
} = context;

// ==============================================
// PRUEBAS UNITARIAS
// ==============================================

describe('Pruebas del Simulador Táctico', () => {

  // ---------- PRUEBA 1: shuffleOptions ----------
  test('shuffleOptions: debe barajar opciones y asignar letras A, B, C', () => {
    const opciones = [
      { texto: 'Opción 1', destino: 'dest1' },
      { texto: 'Opción 2', destino: 'dest2' },
      { texto: 'Opción 3', destino: 'dest3' }
    ];
    
    const resultado = shuffleOptions(opciones);
    
    expect(resultado.length).toBe(3);
    const letras = resultado.map(o => o.letra);
    expect(letras).toContain('A');
    expect(letras).toContain('B');
    expect(letras).toContain('C');
    const textos = resultado.map(o => o.texto);
    expect(textos).toEqual(expect.arrayContaining(['Opción 1', 'Opción 2', 'Opción 3']));
  });

  // ---------- PRUEBA 2: prepararEscenario ----------
  test('prepararEscenario: debe inyectar resultados finales y barajar opciones', () => {
    const escenarioMock = {
      nombre: 'Prueba',
      p1: {
        texto: 'Pregunta 1',
        opciones_raw: [
          { texto: 'A', destino: 'finalExito' },
          { texto: 'B', destino: 'finalFracasoTotal' }
        ]
      }
    };
    
    const escenarioPreparado = prepararEscenario(escenarioMock);
    
    expect(escenarioPreparado).toBeDefined();
    expect(escenarioPreparado.p1.opciones).toBeDefined();
    expect(escenarioPreparado.p1.opciones.length).toBe(2);
    const destinos = escenarioPreparado.p1.opciones.map(o => o.destino);
    expect(destinos).toContain('finalExito');
    expect(destinos).toContain('finalFracasoTotal');
  });

  // ---------- PRUEBA 3: checkAchievements (Primera Victoria) ----------
  test('checkAchievements: debe desbloquear "Primera Victoria" al ganar', () => {
    context.achievements.firstVictory = false;
    context.totalWins = 0;
    
    checkAchievements('exito', 3, 5, false);
    
    expect(context.achievements.firstVictory).toBe(true);
    expect(context.totalWins).toBe(1);
  });

  // ---------- PRUEBA 4: checkAchievements (Estratega) ----------
  test('checkAchievements: debe desbloquear "Estratega" al acumular 3 victorias', () => {
    context.achievements.firstVictory = false;
    context.achievements.strategist = false;
    context.totalWins = 0;
    
    checkAchievements('exito', 3, 5, false);
    checkAchievements('exito', 3, 5, false);
    checkAchievements('exito', 3, 5, false);
    
    expect(context.achievements.strategist).toBe(true);
    expect(context.totalWins).toBe(3);
  });

  // ---------- PRUEBA 5: updateProgressCounter ----------
  test('updateProgressCounter: debe actualizar el contador de decisiones en el DOM', () => {
    const counterSpan = document.getElementById('progressCounter');
    counterSpan.innerHTML = '<i class="fas fa-list-ol"></i> Decisiones: 0';
    
    context.historial.length = 0;
    context.historial.push({ letra: 'A' }, { letra: 'B' }, { letra: 'C' });
    
    updateProgressCounter();
    
    expect(counterSpan.innerHTML).toContain('Decisiones: 3');
  });

  // ---------- PRUEBA 6: Historial de decisiones ----------
  test('El historial debe almacenar las decisiones correctamente', () => {
    context.historial.length = 0;
    context.historial.push({ letra: 'A', texto: 'Opción A', tiempo: 5 });
    context.historial.push({ letra: 'B', texto: 'Opción B', tiempo: 3 });
    
    expect(context.historial.length).toBe(2);
    expect(context.historial[0].letra).toBe('A');
    expect(context.historial[1].tiempo).toBe(3);
  });

});