const form=document.getElementById("login-form");
const status=document.getElementById("login-status");
const supabase=window.supabaseClient;
async function redirectByRole(){
 const {data:{user}}=await supabase.auth.getUser();
 if(!user){location.href="../pages/login.html";return;}
 const {data:profile}=await supabase.from("school_profiles").select("role,full_name,active").eq("auth_user_id",user.id).maybeSingle();
 if(!profile?.active){await supabase.auth.signOut();throw new Error("Tu cuenta escolar está inactiva o aún no ha sido configurada.");}
 location.href=(profile.role==="teacher"||profile.role==="admin")?"../pages/teacher-dashboard.html":"../pages/student-dashboard.html";
}
if(form)form.addEventListener("submit",async e=>{
 e.preventDefault();status.textContent="Iniciando sesión…";
 const {error}=await supabase.auth.signInWithPassword({email:document.getElementById("email").value.trim(),password:document.getElementById("password").value});
 if(error){status.textContent=error.message||"No se pudo iniciar sesión.";return;}
 try{await redirectByRole();}catch(err){status.textContent=err.message;await supabase.auth.signOut();}
});