const fs = require('fs');
const path = require('path');

// ==============================================
// CONFIGURAR DOM PARA LAS PRUEBAS
// ==============================================

beforeEach(() => {
  // Limpiar el documento y crear TODOS los elementos que el script necesita
  document.body.innerHTML = '';
  
  const elementos = [
    'startBtn', 'levelMenu', 'themeToggleBtn', 'tutorialBtn',
    'exitToMenuBtn', 'retryBtn', 'mainMenuBtn', 'openManualBtn',
    'openAchievementsBtn', 'openStatsBtn', 'openPaletteBtn',
    'soundToggleBtn', 'ambientSoundBtn', 'difficultyBadge',
    'timerDisplay', 'situationGif', 'situationText', 'optionsBox',
    'resultBadge', 'feedbackText', 'analysisText', 'resultGifArea',
    'progressCounter', 'levelMenu'
  ];
  
  elementos.forEach(id => {
    const el = document.createElement('div');
    el.id = id;
    el.onclick = null;
    document.body.appendChild(el);
  });
  
  document.getElementById('progressCounter').innerHTML = '<i class="fas fa-list-ol"></i> Decisiones: 0';
  document.getElementById('timerDisplay').textContent = '01:00';
  document.getElementById('difficultyBadge').textContent = 'NORMAL';
  document.getElementById('optionsBox').innerHTML = '';
  
  document.querySelectorAll = jest.fn(() => []);
  
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
  
  Object.defineProperty(window, 'sessionStorage', {
    value: {
      getItem: jest.fn(() => null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    },
    writable: true
  });
  
  window.Audio = jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    loop: false,
    volume: 0
  }));
  
  window.AudioContext = jest.fn(() => ({
    createOscillator: jest.fn(() => ({
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      frequency: { value: 0 }
    })),
    createGain: jest.fn(() => ({
      connect: jest.fn(),
      gain: { value: 0, setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() }
    })),
    createBuffer: jest.fn(),
    createBufferSource: jest.fn(() => ({
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      loop: false,
      buffer: null
    })),
    destination: {},
    currentTime: 0
  }));
  
  window.alert = jest.fn();
});

// ==============================================
// EXTRAER FUNCIONES DEL SCRIPT SIN EJECUTAR LA INICIALIZACIÓN
// ==============================================

const scriptContent = fs.readFileSync(path.join(__dirname, 'script.js'), 'utf8');

const mockElement = {
  onclick: null,
  style: {},
  addEventListener: jest.fn(),
  appendChild: jest.fn(),
  innerHTML: '',
  textContent: '',
  className: '',
  offsetHeight: 0,
  style: { animation: '' },
  setAttribute: jest.fn(),
  getAttribute: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(() => []),
  closest: jest.fn(() => mockElement),
  remove: jest.fn(),
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    toggle: jest.fn(),
    contains: jest.fn()
  }
};

const originalGetElementById = document.getElementById;
document.getElementById = jest.fn((id) => {
  if (document.body.querySelector(`#${id}`)) {
    return document.body.querySelector(`#${id}`);
  }
  return mockElement;
});

document.querySelector = jest.fn(() => mockElement);
document.querySelectorAll = jest.fn(() => []);

const context = {
  document: document,
  window: window,
  localStorage: window.localStorage,
  sessionStorage: window.sessionStorage,
  Audio: window.Audio,
  alert: window.alert,
  console: console,
  soundEnabled: true,
  audioCtx: null,
};

const fn = new Function('context', `
  const module = { exports: {} };
  const exports = module.exports;
  const document = context.document;
  const window = context.window;
  const localStorage = context.localStorage;
  const sessionStorage = context.sessionStorage;
  const Audio = context.Audio;
  const alert = context.alert;
  const console = context.console;
  
  ${scriptContent}
  
  context.shuffleOptions = shuffleOptions;
  context.prepararEscenario = prepararEscenario;
  context.checkAchievements = checkAchievements;
  context.updateProgressCounter = updateProgressCounter;
  context.historial = historial;
  context.achievements = achievements;
  context.unlockAchievement = unlockAchievement;
  context.getAchievementName = getAchievementName;
  context.getAchievementDesc = getAchievementDesc;
  context.resultadosBase = resultadosBase;
  context.elegirOpcion = elegirOpcion;
  context.volverMenu = volverMenu;           
  context.reiniciarMismo = reiniciarMismo;    
  
  Object.defineProperty(context, 'totalWins', {
    get: () => totalWins,
    set: (val) => { totalWins = val; }
  });
  context.resetTotalWins = () => { totalWins = 0; };
`);

fn(context);

// Extraer las funciones del contexto (ya están)
const {
  shuffleOptions,
  prepararEscenario,
  checkAchievements,
  updateProgressCounter,
  historial,
  achievements,
  unlockAchievement,
  getAchievementName,
  getAchievementDesc
} = context;

// ==============================================
// PRUEBAS UNITARIAS
// ==============================================

describe('Pruebas del Simulador Táctico', () => {

  // Restaurar el comportamiento original de getElementById después de las pruebas
  afterEach(() => {
    document.getElementById = originalGetElementById;
  });

  // Reiniciar estado antes de cada prueba
  beforeEach(() => {
    // Reiniciar logros
    achievements.firstVictory = false;
    achievements.quickDecision = false;
    achievements.strategist = false;
    achievements.perfectMision = false;
    // Reiniciar totalWins usando el setter
    context.totalWins = 0;
    // Limpiar historial
    historial.length = 0;
    // Limpiar mocks de localStorage (opcional)
    localStorage.setItem.mockClear();
  });

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
    // Ya reiniciamos en beforeEach, pero por si acaso
    achievements.firstVictory = false;
    context.totalWins = 0;
    
    checkAchievements('exito', 3, 5, false);
    
    expect(achievements.firstVictory).toBe(true);
    expect(context.totalWins).toBe(1);   // <-- Ahora usa el getter
  });

  // ---------- PRUEBA 4: checkAchievements (Estratega) ----------
  test('checkAchievements: debe desbloquear "Estratega" al acumular 3 victorias', () => {
    achievements.firstVictory = false;
    achievements.strategist = false;
    context.totalWins = 0;
    
    checkAchievements('exito', 3, 5, false);
    checkAchievements('exito', 3, 5, false);
    checkAchievements('exito', 3, 5, false);
    
    expect(achievements.strategist).toBe(true);
    expect(context.totalWins).toBe(3);   // <-- Ahora usa el getter
  });

  // ---------- PRUEBA 5: updateProgressCounter ----------
  test('updateProgressCounter: debe actualizar el contador de decisiones en el DOM', () => {
    const counterSpan = document.getElementById('progressCounter');
    counterSpan.innerHTML = '<i class="fas fa-list-ol"></i> Decisiones: 0';
    
    historial.length = 0;
    historial.push({ letra: 'A' }, { letra: 'B' }, { letra: 'C' });
    
    updateProgressCounter();
    
    expect(counterSpan.innerHTML).toContain('Decisiones: 3');
  });

  // ---------- PRUEBA 6: Historial de decisiones ----------
  test('El historial debe almacenar las decisiones correctamente', () => {
    historial.length = 0;
    historial.push({ letra: 'A', texto: 'Opción A', tiempo: 5 });
    historial.push({ letra: 'B', texto: 'Opción B', tiempo: 3 });
    
    expect(historial.length).toBe(2);
    expect(historial[0].letra).toBe('A');
    expect(historial[1].tiempo).toBe(3);
  });

});