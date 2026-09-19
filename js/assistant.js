(() => {
"use strict";

const $=s=>document.querySelector(s);
const messages=$("#messages"), input=$("#message"), send=$("#send"), composer=$("#composer"), clear=$("#clear"), status=$("#status");

const API="https://text.pollinations.ai/";
const MODELS=["openai/gpt-5.4-nano","openai"];
const TIMEOUT=10000;
const STORE="aulacontigo-history-v5";
const MAX_HISTORY=4;

const SYSTEM="Eres AulaContigo, un tutor escolar en español para estudiantes de secundaria. Responde de forma clara, natural y útil. Para preguntas sencillas responde directamente. Para ejercicios explica los pasos necesarios. No inventes información.";

let history=[];

try{
  const saved=JSON.parse(localStorage.getItem(STORE)||"[]");
  if(Array.isArray(saved)) history=saved
    .filter(m=>(m?.role==="user"||m?.role==="assistant")&&typeof m.content==="string")
    .slice(-MAX_HISTORY);
}catch(e){}

function save(){
  try{localStorage.setItem(STORE,JSON.stringify(history.slice(-MAX_HISTORY)))}catch(e){}
}

function statusText(t,c=""){
  if(status){status.textContent=t;status.className="status"+(c?" "+c:"");}
}

function add(role,text,typing=false){
  const el=document.createElement("div");
  el.className="msg "+role+(typing?" typing":"");
  el.textContent=text;
  messages.appendChild(el);
  requestAnimationFrame(()=>messages.scrollTop=messages.scrollHeight);
  return el;
}

function makePrompt(question){
  const context=history.length
    ? "\nContexto reciente:\n"+history.slice(-MAX_HISTORY)
      .map(m=>(m.role==="user"?"Alumno: ":"Tutor: ")+m.content).join("\n")
    : "";
  return SYSTEM+context+"\n\nPregunta del alumno: "+question+"\nRespuesta:";
}

function fetchWithTimeout(url){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),TIMEOUT);
  return fetch(url,{
    method:"GET",
    headers:{Accept:"text/plain"},
    cache:"no-store",
    signal:controller.signal
  }).finally(()=>clearTimeout(timer));
}

async function ask(question){
  const prompt=makePrompt(question);

  for(const model of MODELS){
    try{
      const url=API+encodeURIComponent(prompt)+"?model="+encodeURIComponent(model)+"&seed=-1";
      const response=await fetchWithTimeout(url);
      const text=await response.text();

      if(response.ok && text.trim()) return text.trim();

      console.warn("AulaContigo HTTP",response.status,text.slice(0,150));
    }catch(error){
      console.warn("AulaContigo request",model,error.name);
    }
  }

  throw new Error("No se pudo obtener respuesta del servidor de IA.");
}

async function sendMessage(){
  const question=input.value.trim();
  if(!question||send.disabled)return;

  add("user",question);
  history.push({role:"user",content:question});
  save();

  input.value="";
  input.style.height="";
  send.disabled=true;
  statusText("Pensando…");
  const thinking=add("assistant","Pensando…",true);

  try{
    const answer=await ask(question);
    thinking.remove();
    add("assistant",answer);
    history.push({role:"assistant",content:answer});
    save();
    statusText("Respuesta recibida.","ok");
  }catch(error){
    thinking.remove();
    add("assistant","⚠️ No pude conectar con la IA en este momento. Intenta nuevamente.");
    statusText("Error temporal de conexión.","err");
  }finally{
    send.disabled=false;
    input.focus();
  }
}

composer.addEventListener("submit",e=>{
  e.preventDefault();
  sendMessage();
});

input.addEventListener("input",()=>{
  input.style.height="auto";
  input.style.height=Math.min(input.scrollHeight,150)+"px";
});

input.addEventListener("keydown",e=>{
  if(e.key==="Enter"&&!e.shiftKey){
    e.preventDefault();
    sendMessage();
  }
});

document.querySelectorAll("[data-q]").forEach(button=>{
  button.addEventListener("click",()=>{
    input.value=button.dataset.q||"";
    sendMessage();
  });
});

clear.addEventListener("click",()=>{
  history=[];
  try{
    localStorage.removeItem(STORE);
    localStorage.removeItem("aulacontigo-history-v4");
  }catch(e){}
  messages.innerHTML="";
  add("assistant","¡Nueva conversación! 👋 ¿Qué quieres aprender hoy?");
  statusText("Nueva conversación iniciada.","ok");
  input.focus();
});

messages.innerHTML="";
if(history.length) history.forEach(m=>add(m.role,m.content));
else add("assistant","¡Hola! 👋 Soy AulaContigo. Escribe una pregunta y te ayudaré paso a paso.");
statusText("Listo para ayudarte.","ok");
})();