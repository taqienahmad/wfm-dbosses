let session = null;

try {
  session = JSON.parse(localStorage.getItem("wfm_user"));
} catch(e){
  console.error("Session error", e);
}

if(!session){
  window.location.replace("login.html");
}

// ========================
// USER INFO
// ========================
const welcomeEl = document.getElementById("welcome");
if(welcomeEl && session){
  welcomeEl.innerText = `Welcome, ${session.agent_name} (${session.role})`;
}

// ========================
// ROLE MENU
// ========================
document.querySelectorAll("#menuBar button").forEach(btn=>{
  if(session.role !== 'admin' && btn.dataset.page === 'admin'){
    btn.style.display='none';
  }
});

// ========================
// NAVIGATION
// ========================
document.querySelectorAll("#menuBar button").forEach(btn=>{
  btn.addEventListener("click", async ()=>{

    document.querySelectorAll('#menuBar button')
      .forEach(b=>b.classList.remove('active'));

    btn.classList.add('active');

    document.querySelectorAll('.card')
      .forEach(c=>c.classList.add('d-none'));

    document.getElementById(btn.dataset.page)
      .classList.remove('d-none');

    switch(btn.dataset.page){
      case "schedule":
        if(window.loadSchedule) await loadSchedule();
      break;
    }

  });
});

// ========================
// DEFAULT LOAD
// ========================
window.addEventListener("load", () => {
  const btn = document.querySelector('[data-page="schedule"]');
  if(btn){
    setTimeout(()=>btn.click(), 200);
  }
});

// ========================
// LOGOUT
// ========================
function logout(){
  localStorage.removeItem("wfm_user");
  window.location.replace("login.html");
}