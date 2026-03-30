# Traffic Expert Chatbot — Agente Conversacional para Optimización de Tráfico Urbano

> **Recurso Académico — Tesis de Máster**
>
> Este repositorio constituye el artefacto técnico principal de una **tesis de máster** centrada en el estudio, diseño e implementación de **agentes inteligentes basados en el Model Context Protocol (MCP)**. El proyecto no debe interpretarse como un producto de software de producción, sino como un entorno de investigación controlado para explorar empíricamente las capacidades, limitaciones y patrones arquitectónicos de los agentes LLM con herramientas externas bajo el paradigma MCP.

---

## Índice

1. [Contexto académico](#1-contexto-académico)
2. [Descripción del sistema](#2-descripción-del-sistema)
3. [Arquitectura](#3-arquitectura)
   - 3.1 [Visión general](#31-visión-general)
   - 3.2 [Backend — FastAPI + LangChain Agent](#32-backend--fastapi--langchain-agent)
   - 3.3 [Frontend — React + TypeScript](#33-frontend--react--typescript)
   - 3.4 [Servicios externos de optimización](#34-servicios-externos-de-optimización)
4. [Módulos del agente](#4-módulos-del-agente)
5. [Flujo de una conversación](#5-flujo-de-una-conversación)
6. [Parámetros de optimización](#6-parámetros-de-optimización)
7. [Stack tecnológico](#7-stack-tecnológico)
8. [Instalación y ejecución local](#8-instalación-y-ejecución-local)
9. [API del backend](#9-api-del-backend)
10. [Variables de entorno](#10-variables-de-entorno)

---

## 1. Contexto académico

Esta tesis de máster aborda la implementación práctica de **agentes conversacionales** fundamentados en el **Model Context Protocol (MCP)**, un paradigma arquitectónico que define cómo un modelo de lenguaje grande (LLM) puede interactuar de forma estructurada con herramientas y contextos externos a través de un protocolo estandarizado de llamadas.

El **dominio de aplicación elegido es la optimización de tráfico urbano**, un escenario con las siguientes características que lo hacen idóneo para la investigación:

- Requiere **razonamiento multi-paso**: el agente debe interpretar la intención del usuario, traducirla a parámetros cuantitativos, seleccionar la herramienta correcta y formatear la respuesta.
- Involucra **incertidumbre semántica**: los usuarios pueden expresar prioridades en lenguaje natural vago ("alta prioridad a las emisiones") o de forma numérica directa.
- Exige **selección dinámica de herramientas**: el agente dispone de dos APIs de optimización con semántica distinta y debe escoger autónomamente la adecuada según el contexto.
- Permite **evaluación objetiva**: los resultados del optimizador son numéricos (KPIs), lo que facilita medir la calidad de las decisiones del agente.

El sistema implementado sirve como **banco de pruebas (testbed)** para evaluar:

- La capacidad de selección contextual de herramientas por parte del agente.
- La robustez del módulo de interpretación semántica en presencia de ambigüedad.
- El comportamiento del agente ante solicitudes fuera de dominio (out-of-scope handling).
- La mantenibilidad del historial de conversación (memory management) en un contexto de agente con herramientas.

---

## 2. Descripción del sistema

**Traffic Expert Chatbot** es un asistente conversacional que permite a los usuarios ajustar, en lenguaje natural, los parámetros de optimización de una red de transporte urbano. El sistema expone dos modos de optimización:

| Modo | Activación | KPIs resultantes |
|------|-----------|-----------------|
| **Estándar** | Petición sin palabras clave dinámicas | Frecuencia TP, Retraso TP, Coste operacional, Congestión (Retraso), Emisiones, Coste del sistema |
| **Dinámico** | Palabras clave `dynamic`, `real-time`, `adaptive` | Ingresos, Congestión interior, Congestión (Retraso), Emisiones |

El usuario no necesita conocer la API subyacente; el agente traduce el lenguaje natural a pesos normalizados y presenta únicamente las **diferencias porcentuales en los KPIs**.

---

## 3. Arquitectura

### 3.1 Visión general

```
┌─────────────────────────────────────────────────────────────┐
│                        USUARIO                              │
└─────────────────────┬───────────────────────────────────────┘
                      │ Lenguaje natural
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              FRONTEND  (React + TypeScript + Vite)          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ChatContainer  ◄──►  useChat (hook)  ◄──►  lib/api  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │ POST /chat  { user_input }
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND  (Python + FastAPI)                    │
│                                                             │
│  main.py ──► agent.py ──► traffic_agent.invoke()           │
│                                    │                        │
│  ┌─────────────────────────────────▼──────────────────┐    │
│  │          LANGCHAIN AGENT  (AgentExecutor)           │    │
│  │  ┌───────────────────────────────────────────────┐  │    │
│  │  │  LLM: GPT-4o-mini  +  ConversationMemory      │  │    │
│  │  └───────────────┬───────────────────────────────┘  │    │
│  │                  │ Tool calling (MCP pattern)        │    │
│  │         ┌────────┴────────┐                         │    │
│  │         ▼                 ▼                         │    │
│  │  [tool: standard]  [tool: dynamic]                  │    │
│  └────────────────────────────────────────────────────┘    │
│           │                       │                         │
└───────────┼───────────────────────┼─────────────────────────┘
            │                       │
            ▼                       ▼
  ┌──────────────────┐   ┌──────────────────────────────┐
  │  Standard        │   │  Dynamic Congestion          │
  │  Optimizer API   │   │  Optimizer API               │
  │  (Render)        │   │  (Render)                    │
  └──────────────────┘   └──────────────────────────────┘
```

### 3.2 Backend — FastAPI + LangChain Agent

El backend es el núcleo de investigación del proyecto. Se estructura en cinco módulos claramente separados, diseñados para facilitar la extensión y el estudio independiente de cada componente:

#### `main.py` — Capa de transporte HTTP

Expone la API REST mediante **FastAPI**. Define tres endpoints:

| Método | Ruta | Propósito |
|--------|------|-----------|
| `POST` | `/chat` | Punto de entrada principal. Recibe `{ "user_input": string }` y devuelve `{ "response": string }` |
| `GET` | `/` | Health check de bienvenida |
| `GET` | `/health` | Estado del servicio |

Configura CORS permisivo (`*`) para facilitar las pruebas de investigación desde cualquier origen.

#### `agent.py` — Envoltorio del agente

Capa de adaptación mínima que invoca `traffic_agent` (instancia del `AgentExecutor`) y gestiona el logging. Su propósito es desacoplar la lógica de transporte HTTP de la lógica del agente.

#### `agent_logic.py` — Lógica del agente (núcleo de investigación)

Contiene la implementación completa del agente en cinco módulos de clase:

| Clase | Responsabilidad |
|-------|----------------|
| `ConfigModule` | Centraliza URLs de las APIs externas, parámetros por defecto e intervalos de prioridad |
| `InterpretationModule` | NLP ligero: limpieza de texto, fuzzy matching, extracción de pesos desde lenguaje natural |
| `ValidationModule` | Valida que los pesos estén en `[0, 1]` y los ajusta con advertencias |
| `FormattingModule` | Transforma la respuesta JSON cruda de la API en texto legible con porcentajes |
| `ApiModule` | Define las **herramientas LangChain** (`@tool`) que el agente puede invocar |
| `AgentModule` | Construye el `AgentExecutor` con prompt, LLM, herramientas y memoria |
| `InterfaceModule` | Interfaz de chat de alto nivel (usada en pruebas directas de consola) |

### 3.3 Frontend — React + TypeScript

La interfaz de usuario es deliberadamente sencilla para mantener el foco en el comportamiento del agente. Se construye con:

- **React 18** con TypeScript y Vite como bundler.
- **Tailwind CSS** + componentes Radix UI (estilo shadcn) para la UI.
- **Framer Motion** para animaciones de estado (carga, aparición de mensajes).
- Hook `useChat` que gestiona el estado de los mensajes, el envío y los errores.
- `lib/api.ts` como cliente HTTP centralizado que apunta a `VITE_API_URL` (por defecto `http://localhost:8000`).

### 3.4 Servicios externos de optimización

El sistema conecta con dos microservicios de optimización desplegados en Render:

| Servicio | URL | Método | Payload |
|----------|-----|--------|---------|
| Standard Optimizer | `https://fastapi-traffic-agent-v2.onrender.com/api/optimize` | `POST` | `{ "data": { weight_* } }` |
| Dynamic Optimizer | `https://fastapi2-traffic-agent-v1.onrender.com/dynamic_congestion_optimize_service/` | `POST` | `{ weight_* }` (JSON plano) |

Ambos servicios devuelven un objeto `KPIs` con una subclave `difference` que contiene las variaciones relativas de cada indicador respecto al estado base.

---

## 4. Módulos del agente

### InterpretationModule — Comprensión semántica

Es el componente que investiga cómo un agente puede interpretar lenguaje natural ambiguo sin delegar completamente al LLM. Implementa tres patrones de extracción mediante expresiones regulares y **fuzzy matching** (RapidFuzz):

| Patrón | Ejemplo de input | Resultado |
|--------|-----------------|-----------|
| **A** — `<prioridad> priority to <parámetro>` | `"high priority to emissions"` | `weight_Emissions = 0.795` |
| **B** — `<parámetro> <prioridad> priority` | `"congestion high priority"` | `weight_Congestion = 0.795` |
| **C** — `<parámetro> to <valor numérico>` | `"congestion to 0.4"` | `weight_Congestion = 0.4` |

Los intervalos de prioridad son:

| Prioridad | Intervalo | Valor asignado |
|-----------|----------|----------------|
| `very high` | [0.9, 1.0] | 0.95 |
| `high` | [0.7, 0.89] | 0.795 |
| `medium` | [0.5, 0.69] | 0.595 |
| `low` | [0.3, 0.49] | 0.395 |
| `very low` | [0.1, 0.29] | 0.195 |

### AgentModule — Configuración del agente LLM

El agente se construye con el patrón **ReAct** (Reasoning + Acting) de LangChain:

- **LLM:** `gpt-4o-mini` (temperatura 0.5, balance entre determinismo y variabilidad expresiva).
- **Prompt:** instrucciones del sistema con reglas explícitas de selección de herramientas, manejo de typos, restricción de dominio y formato de respuesta.
- **Herramientas:** `traffic_optimization_api` y `traffic_dynamic_optimization_api`, ambas decoradas con `@tool` de LangChain.
- **Memoria:** `ConversationBufferMemory` para mantener el historial de mensajes en `chat_history`.

El agente decide autónomamente qué herramienta invocar basándose en las palabras clave de la petición del usuario, sin que el código de enrutamiento sea explícito en el backend — esta decisión recae completamente en el LLM siguiendo el paradigma MCP investigado.

---

## 5. Flujo de una conversación

```
Usuario: "I want to give high priority to public transport and use dynamic optimization"
        │
        ▼
[Frontend] POST /chat  { "user_input": "I want to give high priority..." }
        │
        ▼
[FastAPI main.py] → chat_with_agent(user_input)
        │
        ▼
[agent.py] → traffic_agent.invoke(user_input)
        │
        ▼
[LLM GPT-4o-mini]
  Analiza: contiene "dynamic" → selecciona traffic_dynamic_optimization_api
        │
        ▼
[ApiModule.dynamic_optimization_api(user_input)]
  1. InterpretationModule.interpret_user_input()
     → weights = { weight_PublicTransport: 0.795, weight_Congestion: 0.1,
                   weight_Emissions: 0.1, weight_OperationalCost: 0.1 }
     → optimizer_type = "dynamic_optimizer"
  2. ValidationModule.validate_weights() → OK
  3. Normalización: suma de pesos → cada peso / total
  4. POST https://fastapi2-traffic-agent-v1.onrender.com/... → { KPIs: { difference: {...} } }
        │
        ▼
[LLM] recibe JSON con diferencias → redacta respuesta amigable:
  "The KPI 'Income' improves by 12%. The KPI 'Congestion inside' worsens by 3%..."
        │
        ▼
[Frontend] muestra la respuesta en el chat
```

---

## 6. Parámetros de optimización

### Parámetros de entrada (ambos optimizadores)

| Parámetro interno | Nombre natural |
|------------------|----------------|
| `weight_PublicTransport` | Public Transport |
| `weight_Congestion` | Congestion |
| `weight_Emissions` | Emissions |
| `weight_OperationalCost` | Operational Cost |

Todos los pesos se normalizan antes de enviarse a la API, de modo que su suma sea igual a 1.

### KPIs de salida — Optimizador Estándar

- PT Frequency (Frecuencia del transporte público)
- PT Delay (Retraso del transporte público)
- Operational Cost (Coste operacional)
- Congestion (Delay)
- Emissions
- System Cost

### KPIs de salida — Optimizador Dinámico

- Income (Ingresos)
- Congestion inside
- Congestion (Delay)
- Emissions

---

## 7. Stack tecnológico

| Capa | Tecnología | Versión / Notas |
|------|-----------|-----------------|
| **LLM** | OpenAI GPT-4o-mini | Temperatura 0.5 |
| **Framework de agente** | LangChain + LangGraph | `create_openai_tools_agent`, `AgentExecutor` |
| **Backend web** | FastAPI + Uvicorn | Python 3.x |
| **NLP ligero** | NLTK (stopwords) + RapidFuzz | Fuzzy matching para parámetros |
| **Frontend** | React 18 + TypeScript + Vite | |
| **Estilos** | Tailwind CSS + Radix UI | Estilo shadcn |
| **Animaciones** | Framer Motion | |
| **Optimizadores externos** | FastAPI en Render | Dos microservicios independientes |

---

## 8. Instalación y ejecución local

### Requisitos previos

- Python 3.10 o superior
- Node.js 18 o superior (o pnpm)
- Clave de API de OpenAI

### Backend

```bash
cd backend

# Crear y activar entorno virtual
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/macOS

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
# Crear backend/.env con el siguiente contenido:
# OPENAI_API_KEY=sk-...
# BACKEND_PORT=8000

# Arrancar el servidor
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend

```bash
cd frontend

# Instalar dependencias
npm install
# o: pnpm install

# Configurar variables de entorno
# Crear frontend/.env con:
# VITE_API_URL=http://localhost:8000

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

---

## 9. API del backend

### `POST /chat`

**Request:**
```json
{
  "user_input": "Give high priority to emissions and dynamic optimization"
}
```

**Response:**
```json
{
  "response": "The KPI 'Emissions' improves by 18.5%. The KPI 'Congestion inside' worsens by 4.2%."
}
```

**Error (400):** `user_input` ausente.  
**Error (500):** Fallo interno del agente o de la API externa.

---

## 10. Variables de entorno

### `backend/.env`

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Clave de API de OpenAI | `sk-...` |
| `BACKEND_PORT` | Puerto del servidor Uvicorn | `8000` |

### `frontend/.env`

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_API_URL` | URL base del backend | `http://localhost:8000` |

---

## Nota sobre el enfoque de investigación MCP

El **Model Context Protocol** estudiado en esta tesis define un conjunto de convenciones para que los LLMs interactúen con herramientas externas de manera estandarizada: el modelo recibe descripciones de herramientas en el contexto, razona sobre cuál invocar, emite una llamada estructurada, recibe el resultado e integra la información en su respuesta.

En este prototipo, ese patrón se implementa a través del framework LangChain (`create_openai_tools_agent` + `AgentExecutor`), que expone las dos APIs de optimización como herramientas con esquemas Pydantic validados. La investigación se centra en cómo el agente gestiona:

- **La selección contextual de herramientas** sin lógica de enrutamiento explícita en el código.
- **La cadena de razonamiento** (tool call → result → final answer) observable mediante el modo `verbose=True` del `AgentExecutor`.
- **La gestión del contexto conversacional** a través de `ConversationBufferMemory`.
- **El manejo de entradas fuera de dominio**, controlado exclusivamente por el prompt del sistema.

Estos aspectos son analizados en detalle en la memoria de la tesis, utilizando este repositorio como implementación de referencia.

---
*Universidad de Deusto - DeustoTech*
*Tesis de Máster — Investigación en Agentes MCP y LLMs aplicados a optimización urbana.*
