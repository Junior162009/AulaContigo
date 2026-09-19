const form=document.getElementById("login-form");
const status=document.getElementById("login-status");
const button=document.getElementById("login-button");
const email=document.getElementById("email");
const password=document.getElementById("password");

const DEMO_USERS_KEY="aulacontigo_demo_users";

function getUsers(){
  try{return JSON.parse(localStorage.getItem(DEMO_USERS_KEY)||"[]");}
  catch{return [];}
}

function saveSession(user){
  localStorage.setItem("aulacontigo_session",JSON.stringify(user));
}

document.getElementById("toggle-password")?.addEventListener("click",()=>{
  password.type=password.type==="password"?"text":"password";
});

form?.addEventListener("submit",e=>{
  e.preventDefault();
  status.textContent="Verificando…";
  status.className="form-status";
  button.disabled=true;

  const mail=email.value.trim().toLowerCase();
  const pass=password.value;
  const users=getUsers();
  const user=users.find(u=>u.email===mail && u.password===pass);

  setTimeout(()=>{
    if(!user){
      status.textContent="Correo o contraseña incorrectos.";
      status.className="form-status error";
      button.disabled=false;
      return;
    }

    saveSession({
      email:user.email,
      full_name:user.full_name,
      role:user.role||"student"
    });

    status.textContent="¡Inicio de sesión correcto!";
    status.className="form-status success";

    location.href=(user.role==="teacher"||user.role==="admin"||user.role==="counselor")
      ?"../pages/teacher-dashboard.html"
      :"../pages/student-dashboard.html";
  },250);
});
