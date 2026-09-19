const $=s=>document.querySelector(s);
const messages=$("#messages"), input=$("#message"), send=$("#send");

function addMessage(role,text,typing=false){
 const el=document.createElement("div"); el.className="msg "+role+(typing?" typing":""); el.textContent=text; messages.appendChild(el); messages.scrollTop=messages.scrollHeight; return el;
}

function localTutor(q){
 const s=q.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
 if(/\b(hola|hey|buenas)\b/.test(s)) return "¡Hola! 👋 Soy tu tutor de AulaContigo. ¿Qué tema quieres estudiar?";
 if(/(ecuacion|ecuaciones|algebra)/.test(s)) return "Una ecuación es una igualdad con una incógnita. Por ejemplo: 2x + 4 = 10.\n\nPaso 1: restamos 4: 2x = 6.\nPaso 2: dividimos entre 2: x = 3.\n\nLa respuesta es x = 3. Si me das una ecuación concreta, la resolvemos juntos.";
 if(/(fotosintesis|clorofila|plantas)/.test(s)) return "La fotosíntesis es el proceso mediante el cual las plantas producen alimento usando luz solar. Utilizan agua y dióxido de carbono y producen glucosa y oxígeno.\n\nEn forma resumida: luz + agua + CO₂ → glucosa + O₂.";
 if(/(division|dividir|divisiones)/.test(s)) return "Claro. Para ayudarte con una división, escríbeme los números, por ejemplo: “847 ÷ 7”. Te mostraré el procedimiento paso a paso.";
 if(/(reseña|resena|critica|reseña critica)/.test(s)) return "Una reseña crítica es un texto que presenta una obra y además analiza y valora sus ideas. Normalmente incluye: introducción de la obra, resumen breve, análisis de sus aspectos importantes y una conclusión con una valoración argumentada.";
 if(/(fraccion|fracciones)/.test(s)) return "Una fracción representa partes de un todo. En 3/4, el 3 es el numerador y el 4 el denominador. Si quieres sumar fracciones, dime cuáles y te enseño el procedimiento.";
 if(/(porcentaje|porcentajes)/.test(s)) return "Para calcular un porcentaje puedes convertirlo a decimal y multiplicar. Por ejemplo, 20% de 150 = 0,20 × 150 = 30.";
 if(/(newton|fuerza|fisica)/.test(s)) return "La segunda ley de Newton relaciona fuerza, masa y aceleración: F = m × a. Por ejemplo, si una masa de 5 kg acelera a 2 m/s², la fuerza es 10 N.";
 if(/(historia|independencia|revolucion)/.test(s)) return "Puedo ayudarte con historia explicando causas, acontecimientos y consecuencias. Dime el periodo o acontecimiento que estás estudiando y lo organizamos de forma sencilla.";
 if(/(ingles|english|traduc)/.test(s)) return "¡Claro! Puedo ayudarte con inglés. Escríbeme la frase, palabra o ejercicio y te explico su significado y cómo usarlo.";
 if(/(ayuda|no entiendo|explica|que es|como)/.test(s)) return "Claro. 📚 Cuéntame exactamente qué parte no entiendes y te la explicaré paso a paso, con un ejemplo sencillo.";
 return "Entiendo tu pregunta. Para ayudarte mejor, dime el tema o pega aquí el ejercicio completo. Puedo explicarte el procedimiento paso a paso y comprobar la respuesta.";
}

async function sendMessage(){
 const q=input.value.trim(); if(!q)return;
 addMessage("user",q); input.value=""; send.disabled=true;
 const thinking=addMessage("assistant","Pensando…",true);
 await new Promise(r=>setTimeout(r,450));
 thinking.remove(); addMessage("assistant",localTutor(q)); send.disabled=false; input.focus();
}

$("#composer").addEventListener("submit",e=>{e.preventDefault();sendMessage()});
input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage()}});
document.querySelectorAll("[data-q]").forEach(b=>b.onclick=()=>{input.value=b.dataset.q;sendMessage()});
$("#clear").onclick=()=>{messages.innerHTML="";addMessage("assistant","¡Nueva conversación! 👋 ¿Qué quieres aprender hoy?");input.focus()};
