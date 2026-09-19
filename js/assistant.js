(() => {
"use strict";

const $ = s => document.querySelector(s);
const messages = $("#messages");
const input = $("#message");
const send = $("#send");
const composer = $("#composer");
const clear = $("#clear");
const status = $("#status");

const AI_GET = "https://text.pollinations.ai/";
const AI_OPENAI = "https://text.pollinations.ai/openai";
const TIMEOUT = 18000;
const STORE = "aulacontigo-history-v3";
const MAX = 10;

const SYSTEM = "Eres AulaContigo, un tutor educativo para estudiantes de secundaria. Responde siempre en español. Explica de forma clara, sencilla y paso a paso. Adapta la explicación al nivel del estudiante, usa ejemplos cuando ayuden, no inventes información y reconoce cuando algo no está claro. Mantén el contexto de la conversación.";

let history = [];

try {
  const saved = JSON.parse(localStorage.getItem(STORE) || "[]");
  if (Array.isArray(saved)) {
    history = saved
      .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-MAX);
  }
} catch (e) {
  console.warn("No se pudo cargar el historial:", e);
}

function save() {
  try {
    localStorage.setItem(STORE, JSON.stringify(history.slice(-MAX)));
  } catch (e) {}
}

function statusText(text, type = "") {
  if (!status) return;
  status.textContent = text;
  status.className = "status" + (type ? " " + type : "");
}

function add(role, text, typing = false) {
  const el = document.createElement("div");
  el.className = "msg " + role + (typing ? " typing" : "");
  el.textContent = text;
  messages.appendChild(el);
  requestAnimationFrame(() => {
    messages.scrollTop = messages.scrollHeight;
  });
  return el;
}

function makePrompt(question) {
  const context = history
    .slice(-MAX)
    .map(m => (m.role === "user" ? "Estudiante: " : "AulaContigo: ") + m.content)
    .join("\n");

  return SYSTEM + "\n\n" +
    (context ? "CONTEXTO PREVIO:\n" + context + "\n\n" : "") +
    "NUEVA PREGUNTA DEL ESTUDIANTE:\n" + question +
    "\n\nResponde directamente al estudiante.";
}

async function request(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      cache: "no-store"
    });
  } finally {
    clearTimeout(timer);
  }
}

async function ask(question) {
  const prompt = makePrompt(question);

  // Primero usamos el endpoint de texto simple porque es el más compatible
  // con una página estática de GitHub Pages.
  try {
    const url = AI_GET + encodeURIComponent(prompt) + "?model=openai&seed=" + Date.now();
    const response = await request(url, {
      method: "GET",
      headers: { "Accept": "text/plain" }
    });

    const text = await response.text();

    console.debug("AulaContigo GET:", response.status, text.slice(0, 300));

    if (response.ok && text.trim()) {
      return text.trim();
    }

    throw new Error("GET HTTP " + response.status);
  } catch (error) {
    console.warn("Endpoint GET no disponible:", error);
  }

  // Segundo intento: endpoint compatible con OpenAI.
  try {
    const payload = {
      model: "openai",
      messages: [
        { role: "system", content: SYSTEM },
        ...history.slice(-MAX),
        { role: "user", content: question }
      ],
      temperature: 0.7,
      max_tokens: 800,
      stream: false
    };

    const response = await request(AI_OPENAI, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const raw = await response.text();

    console.debug("AulaContigo OpenAI:", response.status, raw.slice(0, 400));

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("El servicio de IA requiere una clave de API. No se debe colocar esa clave en GitHub Pages.");
      }
      if (response.status === 429) {
        throw new Error("La IA está temporalmente saturada. Intenta de nuevo en unos segundos.");
      }
      throw new Error("El servidor de IA respondió HTTP " + response.status + ".");
    }

    try {
      const data = JSON.parse(raw);
      const answer =
        data?.choices?.[0]?.message?.content ||
        data?.choices?.[0]?.text ||
        data?.output_text ||
        data?.response;

      if (typeof answer === "string" && answer.trim()) {
        return answer.trim();
      }
    } catch (e) {}

    if (raw.trim()) return raw.trim();

    throw new Error("La IA devolvió una respuesta vacía.");
  } catch (error) {
    console.error("AulaContigo IA:", error);

    if (error.name === "AbortError") {
      throw new Error("La IA tardó demasiado en responder. Intenta nuevamente.");
    }

    throw error;
  }
}

async function sendMessage() {
  const question = input.value.trim();

  if (!question || send.disabled) return;

  // El mensaje del estudiante aparece INMEDIATAMENTE.
  add("user", question);

  history.push({
    role: "user",
    content: question
  });
  save();

  input.value = "";
  input.style.height = "";
  send.disabled = true;
  statusText("Consultando al tutor…");

  const thinking = add("assistant", "Pensando…", true);

  try {
    const answer = await ask(question);

    thinking.remove();
    add("assistant", answer);

    history.push({
      role: "assistant",
      content: answer
    });
    save();

    statusText("Respuesta recibida.", "ok");
  } catch (error) {
    thinking.remove();

    add(
      "assistant",
      "⚠️ " + (error.message || "No pude obtener una respuesta.") +
      "\n\nPuedes volver a intentarlo."
    );

    statusText("No se pudo completar la consulta.", "err");
  } finally {
    send.disabled = false;
    input.focus();
  }
}

composer.addEventListener("submit", event => {
  event.preventDefault();
  sendMessage();
});

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 150) + "px";
});

input.addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});

document.querySelectorAll("[data-q]").forEach(button => {
  button.addEventListener("click", () => {
    input.value = button.dataset.q || "";
    sendMessage();
  });
});

clear.addEventListener("click", () => {
  history = [];

  try {
    localStorage.removeItem(STORE);
  } catch (e) {}

  messages.innerHTML = "";
  add("assistant", "¡Nueva conversación! 👋 ¿Qué quieres aprender hoy?");
  statusText("Nueva conversación iniciada.", "ok");
  input.focus();
});

messages.innerHTML = "";

if (history.length) {
  history.forEach(m => add(m.role, m.content));
} else {
  add("assistant", "¡Hola! 👋 Soy AulaContigo. Escribe una pregunta y te ayudaré paso a paso.");
}

statusText("Listo para ayudarte.", "ok");
})();