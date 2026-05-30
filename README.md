# Simulador-Interactivo-de-Toma-de-Decisiones
Aplicacion web de Simulador Interactivo de Toma de Decisiones ante amenazas

<img width="1324" height="662" alt="prototipo 1" src="https://github.com/user-attachments/assets/bc8a3687-a782-4afe-9aee-a5ae8a8d9c60" />


## Diagrama de Arquitectura

```mermaid
graph TD
    subgraph Cliente ["🔷 Cliente"]
        HTML["HTML/CSS<br/>Interfaz"]
        JS["JavaScript<br/>Lógica"]
        GIFs["GIFs<br/>Medios"]
    end

    HTML ~~~ JS
    JS ~~~ GIFs
    HTML ~~~ GIFs

    Módulo_Central["⚙️ Módulo Central<br/>━━━━━━━━━━━━━<br/>• Gestor de Estado<br/>• Árbol de Decisión<br/>• Renderizador UI"]

    subgraph Backend ["🟠 Backend"]
        API["API REST"]
        Logs["Logs<br/>Sesiones"]
    end

    Cliente --> Módulo_Central
    Módulo_Central --> Backend

    ## Diagrama de Flujo

```mermaid
flowchart TB
    %% Nodo de inicio
    Inicio((Inicio))
    
    %% Acción del usuario
    A1[Usuario hace click en<br/>nuevo escenario simulado]
    
    %% Menú
    A2[Mostrar menú]
    
    %% Decisión - selección de escenario
    A3{Usuario selecciona<br/>escenario?}
    
    %% Procesos
    A4[Identificar escenario]
    A5[Clonar escenario seleccionado]
    A6[Inyectar resultados finales]
    A7[Reemplazar referencia<br/>en opciones]
    A8[Resetear estadoActualID = "p1"]
    A9[Renderizar pregunta]
    
    %% Romboide (usuario dentro del nuevo escenario)
    A10[/Usuario dentro del<br/>nuevo escenario/]
    
    %% Conexiones
    Inicio --> A1
    A1 --> A2
    A2 --> A3
    
    %% Ramificaciones del rombo
    A3 -->|Sí| A4
    A3 -->|No| A2
    
    %% Flujo principal
    A4 --> A5
    A5 --> A6
    A6 --> A7
    A7 --> A8
    A8 --> A9
    A9 --> A10
    
    %% Opcional: bucle para reiniciar o continuar
    A10 -.->|Nuevo escenario| A1

    ## Diagrama de Secuencia - UML (Corregido)

```mermaid
sequenceDiagram
    box 🎯 SISTEMA COMPLETO
        participant Usuario as 👤 Usuario (Actor)
        participant Interfaz as 🖥️ Interfaz (Vista)
        participant Control as ⚙️ Control (Lógica)
        participant Modelo as 📊 Modelo (Datos)
    end

    %% Usuario → Interfaz
    Usuario ->> Interfaz: Click opciones
    
    %% Interfaz → Usuario (respuestas visuales)
    Interfaz -->> Usuario: Visualiza
    Interfaz -->> Usuario: Nueva pregunta
    
    %% Interfaz → Control
    Interfaz ->> Control: Elegir opción
    
    %% Control → Interfaz
    Control -->> Interfaz: Mostrar consecuencias
    Control -->> Interfaz: Cargar siguiente pregunta
    
    %% Control → Modelo
    Control ->> Modelo: getEstado(ID)
    
    %% Auto-mensaje en Control (entre Control y Modelo)
    loop Delay (repetición/espera)
        Control ->> Control: Procesar lógica interna
    end
    
    %% Modelo → Control
    Modelo -->> Control: Retornar estado

    ## Diagrama de Casos de Uso - UML

```mermaid
flowchart TB
    subgraph Sistema ["🎯 SISTEMA DE SIMULACIÓN"]
        
        %% Casos de uso - Usuario
        UC1[Iniciar Simulación]
        UC2[Seleccionar Escenario]
        UC3[Tomar Decisiones]
        UC4[Ver Resultado]
        UC5[Visualizar Consecuencias]
        UC6[Volver al Menú Principal]
        
        %% Extensiones Usuario
        UC1_restart[(Reiniciar)]
        UC2_repeat[(Repetir)]
        UC3_feedback[(Feedback)]
        
        %% Relaciones punteadas internas (Usuario)
        UC1 -.->|"⟳ Reiniciar simulación"| UC1_restart
        UC2 -.->|"⟲ Repetición de escenarios"| UC2_repeat
        UC3 -.->|"🔄 Retroalimentación\n(continuar siguiente decisión)"| UC3_feedback
        
        %% Casos de uso - Admin
        A1[Crear Escenario]
        A2[Modificar Preguntas]
        A3[Configurar Ramificaciones]
        A4[Actualizar GIF]
        
        %% Extensión Admin
        A1_validate[(Validar)]
        
        %% Relación punteada interna (Admin)
        A1 -.->|"✓ Validar escenario\nantes de publicación"| A1_validate
    end
    
    %% ACTORES FUERA DEL SISTEMA
    Usuario((👤 Usuario))
    Admin((👨‍💼 Admin))
    
    %% Conexiones de Usuario al sistema
    Usuario -->|"Iniciar simulación"| UC1
    Usuario -->|"Seleccionar escenario"| UC2
    Usuario -->|"Leer y tomar decisiones"| UC3
    Usuario -->|"Ver resultado"| UC4
    Usuario -->|"Visualizar consecuencias"| UC5
    Usuario -->|"Volver al menú principal"| UC6
    
    %% Conexiones de Admin al sistema
    Admin -->|"Crear nuevo escenario"| A1
    Admin -->|"Modificar preguntas"| A2
    Admin -->|"Configurar ramificaciones"| A3
    Admin -->|"Actualizar GIF"| A4

    ## Diagrama de Flujo - Simulación de Escenarios

```mermaid
flowchart TD
    Inicio([Inicio])
    Click[Jugador hace click en Jugar]
    Dificultad[Jugador selecciona la dificultad del escenario]
    Escenario[Se muestra un escenario simulado<br>y 4 opciones estratégicas]
    Decision1[Jugador toma una decisión]
    EscenarioRama[Se muestra un escenario ramificado<br>de la decisión anterior]
    Opciones2[Se muestran otras 4 opciones estratégicas]
    Decision2[Jugador toma su siguiente decisión]
    Resultado[Se termina la simulación<br>indicando éxito o fracaso<br>y retroalimentación]
    Reinicio{¿Empezar de nuevo<br>o volver al menú?}
    VolverMenu[Volver al menú principal]
    EmpezarOtro[Empezar de nuevo]
    Fin([Fin])

    Inicio --> Click
    Click --> Dificultad
    Dificultad --> Escenario
    Escenario --> Decision1
    Decision1 --> EscenarioRama
    EscenarioRama --> Opciones2
    Opciones2 --> Decision2
    Decision2 --> Resultado
    Resultado --> Reinicio
    Reinicio -->|Volver al menú| VolverMenu
    Reinicio -->|Empezar de nuevo| EmpezarOtro
    VolverMenu --> Fin
    EmpezarOtro --> Click