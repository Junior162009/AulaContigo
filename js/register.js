const form=document.getElementById("register-form");
const status=document.getElementById("register-status");
const button=document.getElementById("register-button");
const password=document.getElementById("password");
const USERS_KEY="aulacontigo_demo_users";

function getUsers(){
  try{return JSON.parse(localStorage.getItem(USERS_KEY)||"[]");}
  catch{return [];}
}

document.getElementById("toggle-password")?.addEventListener("click",()=>{
  password.type=password.type==="password"?"text":"password";
});

form?.addEventListener("submit",e=>{
  e.preventDefault();

  const name=document.getElementById("name").value.trim();
  const email=document.getElementById("email").value.trim().toLowerCase();
  const pass=password.value;

  if(name.length<2 || pass.length<6){
    status.textContent="Escribe tu nombre y una contraseña de mínimo 6 caracteres.";
    status.className="form-status error";
    return;
  }

  const users=getUsers();
  if(users.some(u=>u.email===email)){
    status.textContent="Ese correo ya está registrado. Inicia sesión.";
    status.className="form-status error";
    return;
  }

  button.disabled=true;
  const user={full_name:name,email,password:pass,role:"student"};
  users.push(user);
  localStorage.setItem(USERS_KEY,JSON.stringify(users));
  localStorage.setItem("aulacontigo_session",JSON.stringify({full_name:name,email,role:"student"}));

  status.textContent="¡Cuenta creada! Entrando…";
  status.className="form-status success";
  setTimeout(()=>location.href="student-dashboard.html",300);
});