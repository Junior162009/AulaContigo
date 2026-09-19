(() => {
"use strict";

const $=s=>document.querySelector(s);
const messages=$("#messages"), input=$("#message"), send=$("#send"), composer=$("#composer"), clear=$("#clear"), status=$("#status");

const API="https://text.pollinations.ai/";
const FAST_MODEL="openai/gpt-5.4-nano";
const FALLBACK_MODEL="openai";
const TIMEOUT=14000;
const STORE="aulacontigo-history-v4";
const MAX_HISTORY=6;

const SYSTEM="Eres AulaContigo, tutor escolar. Responde en español, claro y breve. Explica paso a paso solo cuando haga falta. Adapta la respuesta a secundaria. No inventes datos.";

let history=[];

try{
  const saved=JSON.parse(localStorage.getItem(STORE)||"[]");
  if(Array.isArray(saved)) history=saved
    .filter(m=>m&&(m.role==="user"||m.role==="assistant")&&typeof m.content==="string")
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
  let context="";
  if(history.length){
    context="\nContexto reciente:\n"+history.slice(-MAX_HISTORY)
      .map(m=>(m.role==="user"?"Alumno: ":"Tutor: ")+m.content)
      .join("\n");
  }
  return SYSTEM+context+"\n\nPregunta: "+question+"\nResponde directamente:";
}

async function request(url){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),TIMEOUT);
  try{
    return await fetch(url,{
      method:"GET",
      headers:{Accept:"text/plain"},
      cache:"no-store",
      signal:controller.signal
    });
  }finally{clearTimeout(timer);}
}

async function ask(question){
  const prompt=makePrompt(question);

  // Modelo rápido: menos contexto y generación más ligera para responder antes.
  for(const model of [FAST_MODEL,FALLBACK_MODEL]){
    try{
      const url=API+encodeURIComponent(prompt)+"?model="+encodeURIComponent(model)+"&seed=-1";
      const response=await request(url);
      const text=await response.text();

      if(response.ok&&text.trim()) return text.trim();

      // Si hay saturación, cambia inmediatamente al siguiente modelo.
      if(response.status===429) continue;

      console.warn("IA HTTP",response.status,text.slice(0,200));
    }catch(error){
      console.warn("IA intento fallido",model,error);
      if(error.name==="AbortError") continue;
    }
  }

  throw new Error("La IA está ocupada. Intenta nuevamente en unos segundos.");
}

async function sendMessage(){
  const question=input.value.trim();
  if(!question||send.disabled)return;

  // Mostrar el mensaje sin esperar a la API.
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
    add("assistant","⚠️ "+error.message+"\n\nVuelve a intentarlo.");
    statusText("La IA está ocupada.","err");
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
  try{localStorage.removeItem(STORE)}catch(e){}
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