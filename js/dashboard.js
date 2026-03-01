// ========================
// SESSION CHECK
// ========================
const session = JSON.parse(localStorage.getItem("wfm_user"));
if(!session) location.href = "login.html";

// tampilkan nama user
document.getElementById("welcome").innerText =
  `Welcome, ${session.agent_name} (${session.role})`;


// ========================
// ROLE MENU FILTER
// ========================
document.querySelectorAll("#menuBar button").forEach(btn=>{
  if(session.role !== 'admin' && btn.dataset.page === 'admin'){
    btn.style.display='none';
  }
});


// ========================
// NAVIGATION (CONTROLLER)
// ========================
document.querySelectorAll("#menuBar button").forEach(btn=>{
  btn.onclick = async ()=>{

    // active button
    document.querySelectorAll('#menuBar button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');

    // show page
    document.querySelectorAll('.card').forEach(c=>c.classList.add('hidden'));
    document.getElementById(btn.dataset.page).classList.remove('hidden');

    // call module
    switch(btn.dataset.page){

        case "schedule":
            if(window.loadSchedule) await loadSchedule();
        break;

        case "swap":
            if(window.loadSwap) await loadSwap();
        break;

        case "attendance":
            if(window.loadAttendance) await loadAttendance();
        break;

        case "productivity":
            if(window.loadProductivity) await loadProductivity();
        break;

        case "admin":
            if(window.loadAdmin) await loadAdmin();
        break;
    }
  }
});


// ==============================
// AUTO OPEN DEFAULT TAB (SAFE)
// ==============================
window.addEventListener("load", async () => {

  // tunggu schedule module siap
  let retry = 0;
  while(!window.loadSchedule && retry < 50){
      await new Promise(r => setTimeout(r,100));
      retry++;
  }

  const firstBtn = document.querySelector('#menuBar button[data-page="schedule"]');
  if(firstBtn){
      firstBtn.click();
  }

});


// ========================
// LOGOUT
// ========================
function logout(){
    localStorage.removeItem("wfm_user");
    location.href="login.html";
}