const supabase=window.supabaseClient;
const $=s=>document.querySelector(s);
async function loadDashboard(){
 const {data:{user}}=await supabase.auth.getUser();
 if(!user){location.href="login.html";return;}
 const {data:p}=await supabase.from("school_profiles").select("id,full_name,role,grade,group_name,active").eq("auth_user_id",user.id).maybeSingle();
 if(!p?.active){await supabase.auth.signOut();location.href="login.html";return;}
 if(p.role!=="student"){location.href="teacher-dashboard.html";return;}
 $("#student-name").textContent=p.full_name||"Estudiante";
 $("#role-note").textContent=(p.grade||"Curso")+(p.group_name?" · "+p.group_name:"");
 const {data:student}=await supabase.from("school_students").select("id").eq("profile_id",p.id).maybeSingle();
 if(student){
  const {data:records}=await supabase.from("school_attendance_records").select("status").eq("student_id",student.id).limit(200);
  const total=(records||[]).length,present=(records||[]).filter(r=>r.status==="present").length;
  $("#attendance-value").textContent=total?Math.round(present*100/total)+"%":"—";
 }
 const {data:schedules}=await supabase.from("school_class_schedules").select("weekday,start_time,end_time,class_number,subject:school_subjects(name,icon)").eq("grade",p.grade).eq("group_name",p.group_name).eq("active",true).order("weekday").order("class_number");
 const day=new Date().getDay()||7, time=new Date().toTimeString().slice(0,8);
 const today=(schedules||[]).filter(s=>s.weekday===day);
 const next=today.find(s=>s.start_time>time)||today.find(s=>s.start_time<=time&&s.end_time>time);
 $("#next-class").textContent=next?((next.subject?.icon||"📚")+" "+(next.subject?.name||"Clase")+" · "+next.start_time.slice(0,5)):"Sin más clases hoy";
}
document.getElementById("logout").onclick=async()=>{await supabase.auth.signOut();location.href="login.html";};
loadDashboard();