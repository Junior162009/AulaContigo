const $=s=>document.querySelector(s);
const messages=$("#messages"),input=$("#message"),send=$("#send");
const API="https://text.pollinations.ai/";

let history=[];

function addMessage(role,text,typing=false){
 const el=document.createElement("div");
 el.className="msg "+role+(typing?" typing":"");
 el.textContent=text;
 messages.appendChild(el);
 messages.scrollTop=messages.scrollHeight;
 return el;
}

async function askAI(question){
 const system="Eres AulaContigo, un tutor educativo para estudiantes de secundaria. Responde en español de forma clara, natural y útil. Puedes responder preguntas abiertas de matemáticas, ciencias, historia, español, inglés, tecnología y cultura general. Explica paso a paso cuando sea necesario, usa ejemplos y no inventes datos. Si la pregunta es ambigua, pide una aclaración. No digas que eres una IA de forma innecesaria.";
 const recent=history.slice(-8);
 const prompt=[
   system,
   ...recent.map(m=>(m.role==="user"?"Estudiante: ":"Tutor: ")+m.content),
   "Estudiante: "+question,
   "Tutor:"
 ].join("\n\n");

 const response=await fetch(API,{
   method:"POST",
   headers:{"Content-Type":"application/json"},
   body:JSON.stringify({
     model:"openai-fast",
     messages:[{role:"user",content:prompt}],
     seed:Math.floor(Math.random()*1000000)
   })
 });

 if(!response.ok) throw new Error("La API respondió con HTTP "+response.status);
 const type=response.headers.get("content-type")||"";
 const raw=await response.text();
 if(!raw) throw new Error("La API no devolvió una respuesta.");

 let answer=raw;
 if(type.includes("application/json")){
   try{
     const data=JSON.parse(raw);
     answer=data.choices?.[0]?.message?.content||data.output_text||data.response||"";
   }catch{}
 }
 return String(answer).trim();
}

async function sendMessage(){
 const q=input.value.trim();
 if(!q)return;

 addMessage("user",q);
 history.push({role:"user",content:q});
 input.value="";
 send.disabled=true;
 const thinking=addMessage("assistant","Pensando…",true);

 try{
   const answer=await askAI(q);
   thinking.remove();
   addMessage("assistant",answer||"No recibí una respuesta. Inténtalo de nuevo.");
   history.push({role:"assistant",content:answer});
 }catch(error){
   thinking.remove();
   addMessage("assistant","No pude conectar con el servicio de IA. Revisa tu conexión e inténtalo nuevamente.");
   console.error("AulaContigo AI:",error);
 }
 finally{
   send.disabled=false;
   input.focus();
 }
}

$("#composer").addEventListener("submit",e=>{e.preventDefault();sendMessage()});
input.addEventListener("keydown",e=>{
 if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage()}
});
document.querySelectorAll("[data-q]").forEach(b=>b.onclick=()=>{
 input.value=b.dataset.q;
 sendMessage();
});
$("#clear").onclick=()=>{
 history=[];
 messages.innerHTML="";
 addMessage("assistant","¡Nueva conversación! 👋 ¿Qué quieres aprender hoy?");
 input.focus();
};
