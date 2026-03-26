document.body.innerHTML += `
<div style="position:fixed;top:0;left:0;width:100%;background:red;color:white;z-index:9999;font-size:12px;">
DEBUG SESSION: ${sessionStorage.getItem("wfm_user")}
</div>
`;

let session = null;

try {
  session = JSON.parse(sessionStorage.getItem("wfm_user"));
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
          if(window.loadSchedule){
              await loadSchedule();
          } else {
              console.warn("loadSchedule not ready, retry...");
              setTimeout(() => {
                  if(window.loadSchedule) loadSchedule();
              }, 300);
          }
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


window.addEventListener("load", () => {

  setTimeout(() => {
    if(window.loadSchedule){
      console.log("AUTO LOAD SCHEDULE");
      loadSchedule();
    } else {
      console.error("loadSchedule STILL not available");
    }
  }, 500);

});


// ========================
// LOGOUT
// ========================
function logout(){
  sessionStorage.removeItem("wfm_user");;
  window.location.replace("login.html");
}