(() => {
"use strict";
const $=s=>document.querySelector(s), messages=$("#messages"), input=$("#message"), send=$("#send"), composer=$("#composer"), clear=$("#clear"), status=$("#status");
const API="https://text.pollinations.ai/openai", LEGACY="https://text.pollinations.ai/", TIMEOUT=30000, STORE="aulacontigo-history-v2", MAX=10;
const SYSTEM="Eres AulaContigo, tutor educativo para estudiantes de secundaria. Responde en español con claridad, adapta el nivel, muestra pasos y ejemplos, no inventes datos y pide aclaración si es necesario. Mantén el contexto.";
let history=[];
try{const x=JSON.parse(localStorage.getItem(STORE)||"[]");if(Array.isArray(x))history=x.filter(m=>m&&(m.role==="user"||m.role==="assistant")&&typeof m.content==="string").slice(-MAX)}catch(e){console.warn(e)}
function save(){try{localStorage.setItem(STORE,JSON.stringify(history.slice(-MAX)))}catch(e){}}
function statusText(t,c=""){if(status){status.textContent=t;status.className="status"+(c?" "+c:"")}}
function add(role,text,typing=false){const e=document.createElement("div");e.className="msg "+role+(typing?" typing":"");e.textContent=text;messages.appendChild(e);requestAnimationFrame(()=>messages.scrollTop=messages.scrollHeight);return e}
function body(q){return{model:"openai",messages:[{role:"system",content:SYSTEM},...history.slice(-MAX),{role:"user",content:q}],temperature:.7,max_tokens:800,stream:false}}
async function req(url,opt){const c=new AbortController(),t=setTimeout(()=>c.abort(),TIMEOUT);try{return await fetch(url,{...opt,signal:c.signal})}finally{clearTimeout(t)}}
async function ask(q){
let r;
try{r=await req(API,{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify(body(q))})}
catch(e){
console.warn("OpenAI endpoint:",e);
try{r=await req(LEGACY,{method:"POST",headers:{"Content-Type":"application/json","Accept":"text/plain"},body:JSON.stringify({model:"openai",messages:body(q).messages})})}
catch(e2){console.error("IA network/CORS",e2);throw new Error(e2.name==="AbortError"?"La IA tardó demasiado.":"No se pudo conectar con la IA (red/CORS).")}
}
const raw=await r.text(); console.debug("AulaContigo API",r.status,raw.slice(0,400));
if(!r.ok){if(r.status===401||r.status===403)throw new Error("La API requiere autenticación (HTTP "+r.status+").");if(r.status===429)throw new Error("La API está temporalmente saturada (HTTP 429).");if(r.status>=500)throw new Error("Error temporal del servidor de IA (HTTP "+r.status+").");throw new Error("La API rechazó la solicitud (HTTP "+r.status+").")}
if(!raw.trim())throw new Error("La IA devolvió una respuesta vacía.");
try{const d=JSON.parse(raw),a=d?.choices?.[0]?.message?.content||d?.choices?.[0]?.text||d?.output_text||d?.response;if(typeof a==="string"&&a.trim())return a.trim()}catch(e){}
return raw.trim();
}
async function sendMessage(){
const q=input.value.trim();if(!q||send.disabled)return;
add("user",q);history.push({role:"user",content:q});save();input.value="";input.style.height="";send.disabled=true;statusText("Consultando al tutor…");
const thinking=add("assistant","Pensando…",true);
try{const a=await ask(q);thinking.remove();add("assistant",a);history.push({role:"assistant",content:a});save();statusText("Respuesta recibida.","ok")}
catch(e){thinking.remove();console.error("AulaContigo:",e);add("assistant","⚠️ "+(e.message||"No pude obtener una respuesta.")+"\n\nPuedes volver a intentarlo.");statusText("No se pudo completar la consulta.","err")}
finally{send.disabled=false;input.focus()}
}
composer.addEventListener("submit",e=>{e.preventDefault();sendMessage()});
input.addEventListener("input",()=>{input.style.height="auto";input.style.height=Math.min(input.scrollHeight,150)+"px"});
input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage()}});
document.querySelectorAll("[data-q]").forEach(b=>b.addEventListener("click",()=>{input.value=b.dataset.q||"";sendMessage()}));
clear.addEventListener("click",()=>{history=[];try{localStorage.removeItem(STORE)}catch(e){}messages.innerHTML="";add("assistant","¡Nueva conversación! 👋 ¿Qué quieres aprender hoy?");statusText("Nueva conversación iniciada.","ok");input.focus()});
messages.innerHTML="";if(history.length)history.forEach(m=>add(m.role,m.content));else add("assistant","¡Hola! 👋 Soy AulaContigo. Escribe una pregunta y te ayudaré paso a paso.");statusText("Listo para ayudarte.","ok");
})();