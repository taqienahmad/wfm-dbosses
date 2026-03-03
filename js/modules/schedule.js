let scheduleData = [];

// ============================================
// LOAD SCHEDULE FROM SUPABASE
// ============================================
window.loadSchedule = async function(){

const session = JSON.parse(localStorage.getItem("wfm_user"));
if(!session) return;

const tbody = document.getElementById("scheduleBody");
const cardBox = document.getElementById("scheduleCards");

if(tbody) tbody.innerHTML = "<tr><td colspan='9'>Loading schedule...</td></tr>";
if(cardBox) cardBox.innerHTML = "Loading schedule...";

try {

const { data, error } = await window.db
.from("agent_roster")
.select(`
shift_date,
planned_shift,
actual_shift,
break_start,
break_end,
planned_hours,
actual_hours,
volume,
handlingtime_seconds,
planned:master_shift!fk_planned_shift(shift_code,start_time,end_time),
actual:master_shift!fk_actual_shift(shift_code,start_time,end_time)
`)
.eq("agent_id", session.agent_id)
.order("shift_date",{ascending:true});

if(error){
console.error(error);
if(tbody) tbody.innerHTML = "<tr><td colspan='9'>Failed load data</td></tr>";
if(cardBox) cardBox.innerHTML = "Failed load data";
return;
}

scheduleData = data || [];
renderTable(scheduleData);
updateSummary(scheduleData);

} catch(err){
console.error(err);
}

};

// ============================================
// MAIN RENDER SWITCH
// ============================================
function renderTable(rows){
if(window.innerWidth <= 768){
renderMobile(rows);
}else{
renderDesktop(rows);  
}
}

// ============================================
// DESKTOP TABLE
// ============================================
function renderDesktop(rows){

const tbody = document.getElementById("scheduleBody");
if(!tbody) return;

if(!rows.length){
tbody.innerHTML = "<tr><td colspan='9'>No schedule</td></tr>";
return;
}

let html="";

rows.forEach(row=>{

const shift = row.actual?.shift_code || row.planned?.shift_code || row.actual_shift || row.planned_shift || "-";

const start = row.actual?.start_time || row.planned?.start_time || "-";
const end   = row.actual?.end_time || row.planned?.end_time || "-";

let status="Planned",cls="status-planned";
if(row.actual_shift) {status="Actual";cls="status-actual";}
if(shift==="OFF"||shift==="Day Off"){status="OFF";cls="status-off";}
if(shift==="CT"||shift==="Leave"){status="LEAVE";cls="status-leave";}

const date=new Date(row.shift_date).toLocaleDateString("id-ID");

html+=`
<tr>
<td>${date}</td>
<td>${shift}</td>
<td>${start}</td>
<td>${end}</td>
<td>${row.break_start??"-"}</td>
<td>${row.break_end??"-"}</td>
<td>${row.planned_hours??"-"}</td>
<td>${row.actual_hours??"-"}</td>
<td>${row.volume??"-"}</td>
<td>${row.handlingtime_seconds??"-"}</td>
<td class="${cls}">${status}</td>
</tr>`;
});

tbody.innerHTML=html;
}

// ============================================
// MOBILE CARD RENDER (REAL CARD, NO TABLE)
// ============================================
function renderMobile(rows){

const container=document.getElementById("scheduleCards");
if(!container) return;

if(!rows.length){
container.innerHTML="No schedule";
return;
}

let html="";

rows.forEach(row=>{

const shift = row.actual?.shift_code || row.planned?.shift_code || row.actual_shift || row.planned_shift || "-";

const start = row.actual?.start_time || row.planned?.start_time || "-";
const end   = row.actual?.end_time || row.planned?.end_time || "-";

let status="Planned",cls="status-planned";
if(row.actual_shift){status="Actual";cls="status-actual";}
if(shift==="OFF"||shift==="Day Off"){status="OFF";cls="status-off";}

const date=new Date(row.shift_date).toLocaleDateString("id-ID",{day:"2-digit",month:"short"});

html+=`
<div class="shift-card">

<div class="sc-date">${date}</div>
<div class="sc-shift">${shift}</div>
<div class="sc-time">${start} - ${end}</div>

<div class="sc-status ${cls}">Status : ${status}</div>

<div class="sc-grid">
<div><label>Break Start </label><span>${row.break_start??"-"}</span></div>
<div><label>Break End </label><span>${row.break_end??"-"}</span></div>

<div><label>Planned </label><span>${row.planned_hours ? formatHoursToHMS(row.planned_hours) : "-"}</span></div>
<div><label>Actual </label><span>${row.actual_hours ? formatHoursToHMS(row.actual_hours) : "-"}</span></div>

<div><label>Volume </label><span>${row.volume}</span></div>
<div>
  <label>Handling Time </label>
  <span>${formatToHMS(row.handlingtime_seconds)}</span>
</div>
</div>

</div>`;
});

container.innerHTML=html;
}

// ============================================
// FILTERS
// ============================================
function filterToday(){
const t=new Date().toDateString();
const filtered = scheduleData.filter(r=>new Date(r.shift_date).toDateString()===t);

renderTable(filtered);
updateSummary(filtered); // 🔥 TAMBAHKAN
}

function filterWeek(){
const now=new Date();
const start=new Date(now);
start.setDate(now.getDate()-(now.getDay()||7)+1);
const end=new Date(start); end.setDate(start.getDate()+6);
renderTable(scheduleData.filter(r=>{
const d=new Date(r.shift_date);
return d>=start&&d<=end;
}));

renderTable(filtered);
updateSummary(filtered); // 🔥 TAMBAHKAN
}

function filterMonth(){
const now=new Date();
renderTable(scheduleData.filter(r=>{
const d=new Date(r.shift_date);
return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
}));

renderTable(filtered);
updateSummary(filtered); // 🔥 TAMBAHKAN
}

function filterRange(){

  const s = document.getElementById("startDate").value;
  const e = document.getElementById("endDate").value;

  if(!s || !e) return alert("Pilih tanggal dulu");

  const start = new Date(s);
  const end   = new Date(e);
  end.setHours(23,59,59,999);

  const filtered = scheduleData.filter(r => {
    const d = new Date(r.shift_date);
    return d >= start && d <= end;
  });

  renderTable(filtered);
  updateSummary(filtered); // 🔥 penting
}

// ============================================
// FIX MOBILE RENDER
// ============================================
let lastMode = null;

function detectMode(){
    return window.matchMedia("(max-width: 768px)").matches ? "mobile" : "desktop";
}

function rerenderIfNeeded(){
    const current = detectMode();

    if(lastMode === null){
        lastMode = current;
        return;
    }

    if(current !== lastMode){
        console.log("Viewport changed → rerender schedule");
        lastMode = current;
        renderTable(scheduleData);
    }
}


// jalan saat pertama load
window.addEventListener("load", () => {
    lastMode = detectMode();
});

// jalan saat hp rotate / safari adjust viewport
window.addEventListener("resize", rerenderIfNeeded);
window.addEventListener("orientationchange", rerenderIfNeeded);




function updateSummary(data) {

  console.log("DATA SUMMARY:", data);

  const totalVolume = data.reduce((sum, r) => 
    sum + Number(r.volume || 0), 0);

  const totalPlanned = data.reduce((sum, r) => 
    sum + Number(r.planned_hours || 0), 0);

  const totalActual = data.reduce((sum, r) => 
    sum + Number(r.actual_hours || 0), 0);

  const totalHandling = data.reduce((sum, r) => 
    sum + Number(r.handlingtime_seconds || 0), 0);

  console.log("volume", totalVolume);
  console.log("planned_hours", totalPlanned);
  console.log("actual_hours", totalActual);
  console.log("handlingtime_seconds", totalHandling);

  const ratioActual = totalPlanned > 0 
    ? (totalActual / totalPlanned) * 100 
    : 0;

  const ahtSec = totalVolume > 0 
    ? totalHandling / totalVolume 
    : 0;

  const occupancy = totalActual > 0 
    ? (totalHandling / (totalActual * 3600)) * 100 
    : 0;

  document.getElementById("sumVolume").innerText = totalVolume;
  document.getElementById("ratioActual").innerText = ratioActual.toFixed(1) + "%";
  document.getElementById("avgAHT").innerText = formatTime(ahtSec);
  document.getElementById("occupancy").innerText = occupancy.toFixed(1) + "%";
}

function formatTime(seconds) {

  if (!seconds || isNaN(seconds)) return "00:00";

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  return `${mins}:${secs.toString().padStart(2, '0')}`;
}


function formatToHMS(seconds) {

  if (!seconds || isNaN(seconds)) return "00:00:00";

  const hrs  = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return `${hrs.toString().padStart(2,'0')}:` +
         `${mins.toString().padStart(2,'0')}:` +
         `${secs.toString().padStart(2,'0')}`;
}

function formatHoursToHMS(hours){

  if(!hours || isNaN(hours)) return "00:00:00";

  const totalSeconds = Number(hours) * 3600;

  const hrs  = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);

  return `${hrs.toString().padStart(2,'0')}:` +
         `${mins.toString().padStart(2,'0')}:` +
         `${secs.toString().padStart(2,'0')}`;
}   