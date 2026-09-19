(() => {
"use strict";

const $=s=>document.querySelector(s);
const messages=$("#messages"), input=$("#message"), send=$("#send"), composer=$("#composer"), clear=$("#clear"), status=$("#status");

const API="https://xdszveoxdrdnwwzzvkav.supabase.co/functions/v1/aulacontigo-ai";
const STORE="aulacontigo-history-v6";
const MAX_HISTORY=6;

let history=[];
try{
  const saved=JSON.parse(localStorage.getItem(STORE)||"[]");
  if(Array.isArray(saved)) history=saved.filter(m=>(m?.role==="user"||m?.role==="assistant")&&typeof m.content==="string").slice(-MAX_HISTORY);
}catch(e){}

function save(){try{localStorage.setItem(STORE,JSON.stringify(history.slice(-MAX_HISTORY)))}catch(e){}}
function statusText(t,c=""){if(status){status.textContent=t;status.className="status"+(c?" "+c:"")}}
function add(role,text,typing=false){
  const el=document.createElement("div");
  el.className="msg "+role+(typing?" typing":"");
  el.textContent=text;
  messages.appendChild(el);
  requestAnimationFrame(()=>messages.scrollTop=messages.scrollHeight);
  return el;
}

async function ask(){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),20000);
  try{
    const response=await fetch(API,{
      method:"POST",
      headers:{"Content-Type":"application/json","Accept":"text/event-stream"},
      body:JSON.stringify({messages:history.slice(-MAX_HISTORY)}),
      signal:controller.signal
    });

    if(!response.ok){
      let detail="";
      try{const data=await response.json();detail=data.error||""}catch(e){}
      throw new Error(detail||"El servidor de IA rechazó la solicitud.");
    }
    if(!response.body)throw new Error("El servidor no devolvió streaming.");

    const reader=response.body.getReader();
    const decoder=new TextDecoder();
    let buffer="",answer="";

    const bubble=add("assistant","",false);
    statusText("AulaContigo está respondiendo…","ok");

    while(true){
      const {value,done}=await reader.read();
      if(done)break;
      buffer+=decoder.decode(value,{stream:true});

      const lines=buffer.split("\n");
      buffer=lines.pop()||"";

      for(const line of lines){
        const trimmed=line.trim();
        if(!trimmed.startsWith("data:"))continue;
        const payload=trimmed.slice(5).trim();
        if(payload==="[DONE]")continue;
        try{
          const chunk=JSON.parse(payload);
          const piece=chunk?.choices?.[0]?.delta?.content;
          if(piece){
            answer+=piece;
            bubble.textContent=answer;
            messages.scrollTop=messages.scrollHeight;
          }
        }catch(e){}
      }
    }

    if(!answer.trim()){bubble.remove();throw new Error("La IA devolvió una respuesta vacía.");}
    return answer.trim();
  }finally{clearTimeout(timer)}
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
  statusText("Conectando con AulaContigo…");
  const thinking=add("assistant","Pensando…",true);

  try{
    thinking.remove();
    const answer=await ask();
    history.push({role:"assistant",content:answer});
    save();
    statusText("Respuesta recibida.","ok");
  }catch(error){
    thinking.remove();
    console.error("AulaContigo:",error);
    add("assistant","⚠️ "+(error.name==="AbortError"?"La respuesta tardó demasiado.":error.message||"No se pudo conectar con la IA.")+"\n\nIntenta nuevamente.");
    statusText("Error temporal de IA.","err");
  }finally{
    send.disabled=false;
    input.focus();
  }
}

composer.addEventListener("submit",e=>{e.preventDefault();sendMessage()});
input.addEventListener("input",()=>{input.style.height="auto";input.style.height=Math.min(input.scrollHeight,150)+"px"});
input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage()}});
document.querySelectorAll("[data-q]").forEach(b=>b.addEventListener("click",()=>{input.value=b.dataset.q||"";sendMessage()}));

clear.addEventListener("click",()=>{
  history=[];
  try{localStorage.removeItem(STORE);localStorage.removeItem("aulacontigo-history-v5")}catch(e){}
  messages.innerHTML="";
  add("assistant","¡Nueva conversación! 👋 ¿Qué quieres aprender hoy?");
  statusText("Nueva conversación iniciada.","ok");
  input.focus();
});

messages.innerHTML="";
if(history.length)history.forEach(m=>add(m.role,m.content));
else add("assistant","¡Hola! 👋 Soy AulaContigo. Escribe tu pregunta y te responderé rápidamente.");
statusText("Listo para ayudarte.","ok");
})();