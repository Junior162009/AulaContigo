const supabase=window.supabaseClient,api=window.AULA_API,$=s=>document.querySelector(s);
async function callApi(body){
 const {data:{session}}=await supabase.auth.getSession();
 if(!session)throw new Error("Sesión expirada. Vuelve a iniciar sesión.");
 const r=await fetch(api,{method:"POST",headers:{Authorization:"Bearer "+session.access_token,"Content-Type":"application/json"},body:JSON.stringify(body)});
 const j=await r.json().catch(()=>({}));
 if(!r.ok)throw new Error(j.error||"No se pudo completar la operación.");
 return j;
}
async function refresh(){
 const box=$("#attendance-box");box.innerHTML="<p class='muted'>Buscando la clase activa…</p>";
 try{
  const r=await callApi({action:"active"});
  if(!r.session){box.innerHTML="<h3>🕐 No hay una clase activa</h3><p class='muted'>Cuando el docente abra la asistencia aparecerá aquí.</p>";return;}
  const s=r.session.schedule;
  box.innerHTML="<h3>"+(s.subject?.icon||"📚")+" "+(s.subject?.name||"Clase")+"</h3><p>"+s.start_time.slice(0,5)+"–"+s.end_time.slice(0,5)+" · Docente: "+(s.teacher?.profile?.full_name||"—")+"</p><form id='pin-form'><label for='pin'>PIN de 6 dígitos</label><input id='pin' inputmode='numeric' pattern='[0-9]{6}' maxlength='6' required><button class='btn' type='submit'>Confirmar asistencia</button></form><p id='pin-status' class='muted' aria-live='polite'></p>";
  $("#pin-form").onsubmit=async e=>{e.preventDefault();$("#pin-status").textContent="Confirmando…";try{await callApi({action:"mark",session_id:r.session.id,pin:$("#pin").value});$("#pin-status").textContent="✅ Asistencia registrada correctamente.";}catch(err){$("#pin-status").textContent="❌ "+err.message;}};
 }catch(e){box.innerHTML="<p class='error'>❌ "+e.message+"</p>";}
}
const start=async()=>{const {data:{user}}=await supabase.auth.getUser();if(!user){location.href="login.html";return;}refresh();};
document.getElementById("logout").onclick=async()=>{await supabase.auth.signOut();location.href="login.html";};start();