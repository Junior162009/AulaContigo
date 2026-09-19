const supabase=window.supabaseClient;
const form=document.getElementById("register-form");
const status=document.getElementById("register-status");
const button=document.getElementById("register-button");
const password=document.getElementById("password");

document.getElementById("toggle-password")?.addEventListener("click",()=>{
  password.type=password.type==="password"?"text":"password";
});

form?.addEventListener("submit",async(e)=>{
  e.preventDefault();
  const name=document.getElementById("name").value.trim();
  const email=document.getElementById("email").value.trim().toLowerCase();

  if(name.length<2 || password.value.length<8){
    status.textContent="Escribe tu nombre y una contraseña de mínimo 8 caracteres.";
    status.className="form-status error";
    return;
  }

  status.textContent="Creando cuenta…";
  status.className="form-status";
  button.disabled=true;

  try{
    const {data,error}=await supabase.auth.signUp({
      email,
      password:password.value,
      options:{data:{full_name:name}}
    });
    if(error) throw error;

    if(data.session){
      status.textContent="Cuenta creada. Entrando…";
      status.className="form-status success";
      location.href="student-dashboard.html";
      return;
    }

    status.textContent="Cuenta creada. Revisa tu correo si aparece una solicitud de confirmación y después inicia sesión.";
    status.className="form-status success";
    form.reset();
  }catch(err){
    const msg=err?.message||"No se pudo crear la cuenta.";
    status.textContent=/already registered|already exists/i.test(msg)
      ?"Ese correo ya está registrado. Inicia sesión."
      :msg;
    status.className="form-status error";
  }finally{
    button.disabled=false;
  }
});