let scheduleData = [];

// ================= LOAD =================
window.loadSchedule = async function(){

  const session = JSON.parse(localStorage.getItem("wfm_user"));
  if(!session) return;

  const tbody = document.getElementById("scheduleBody");

  if(tbody) tbody.innerHTML = "<tr><td colspan='11'>Loading...</td></tr>";

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
      return;
    }

    scheduleData = data || [];

    renderTable(scheduleData);
    updateSummary(scheduleData);

  } catch(err){
    console.error(err);
  }
};

// ================= RENDER =================
function renderTable(rows){
  if(window.innerWidth <= 768){
    renderMobile(rows);
  }else{
    renderDesktop(rows);  
  }
}

// ================= DESKTOP =================
function renderDesktop(rows){

  const tbody = document.getElementById("scheduleBody");
  if(!tbody) return;

  if(!rows.length){
    tbody.innerHTML = "<tr><td colspan='11'>No schedule</td></tr>";
    return;
  }

  let html="";

  rows.forEach(row=>{

    const shift = row.actual?.shift_code || row.planned?.shift_code || "-";
    const start = row.actual?.start_time || row.planned?.start_time || "-";
    const end   = row.actual?.end_time || row.planned?.end_time || "-";

    let status="Planned";
    if(row.actual_shift) status="Actual";
    if(shift==="OFF"||shift==="Day Off") status="OFF";
    if(shift==="CT"||shift==="Leave") status="LEAVE";

    const date=new Date(row.shift_date).toLocaleDateString("id-ID");

    html+=`
    <tr>
      <td>${date}</td>
      <td>${shift}</td>
      <td>${start}</td>
      <td>${end}</td>
      <td>${row.break_start??"-"}</td>
      <td>${row.break_end??"-"}</td>
      <td>${row.planned_hours??0}</td>
      <td>${row.actual_hours??0}</td>
      <td><strong>${row.volume ?? 0}</strong></td>
      <td>${formatToHMS(row.handlingtime_seconds)}</td>
      <td>${formatStatus(status)}</td>
    </tr>`;
  });

  tbody.innerHTML=html;
}

// ================= MOBILE =================
function renderMobile(rows){

  const container=document.getElementById("scheduleCards");
  if(!container) return;

  if(!rows.length){
    container.innerHTML="No schedule";
    return;
  }

  let html="";

  rows.forEach(row=>{

    const shift = row.actual?.shift_code || row.planned?.shift_code || "-";
    const start = row.actual?.start_time || row.planned?.start_time || "-";
    const end   = row.actual?.end_time || row.planned?.end_time || "-";

    let status="Planned";
    if(row.actual_shift) status="Actual";
    if(shift==="OFF"||shift==="Day Off") status="OFF";

    const date=new Date(row.shift_date).toLocaleDateString("id-ID",{day:"2-digit",month:"short"});

    html+=`
    <div class="card mb-2 p-2">
      <strong>${date}</strong><br>
      ${shift} (${start} - ${end})<br>
      Volume: ${row.volume ?? 0}<br>
      AHT: ${formatToHMS(row.handlingtime_seconds)}<br>
      ${formatStatus(status)}
    </div>`;
  });

  container.innerHTML=html;
}

// ================= FILTER =================
function filterToday(){
  const t=new Date().toDateString();
  const filtered = scheduleData.filter(r=>new Date(r.shift_date).toDateString()===t);

  renderTable(filtered);
  updateSummary(filtered);
}

function filterWeek(){
  const now=new Date();
  const start=new Date(now);
  start.setDate(now.getDate()-(now.getDay()||7)+1);
  const end=new Date(start); end.setDate(start.getDate()+6);

  const filtered = scheduleData.filter(r=>{
    const d=new Date(r.shift_date);
    return d>=start&&d<=end;
  });

  renderTable(filtered);
  updateSummary(filtered);
}

function filterMonth(){
  const now=new Date();

  const filtered = scheduleData.filter(r=>{
    const d=new Date(r.shift_date);
    return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
  });

  renderTable(filtered);
  updateSummary(filtered);
}

function filterRange(){
  const s=document.getElementById("startDate").value;
  const e=document.getElementById("endDate").value;

  if(!s||!e) return alert("Pilih tanggal dulu");

  const start=new Date(s);
  const end=new Date(e); end.setHours(23,59,59,999);

  const filtered = scheduleData.filter(r=>{
    const d=new Date(r.shift_date);
    return d>=start&&d<=end;
  });

  renderTable(filtered);
  updateSummary(filtered);
}

// ================= KPI =================
function updateSummary(data){

  const totalVolume = data.reduce((sum,r)=>sum+Number(r.volume||0),0);
  const totalPlanned = data.reduce((sum,r)=>sum+Number(r.planned_hours||0),0);
  const totalActual = data.reduce((sum,r)=>sum+Number(r.actual_hours||0),0);
  const totalHandling = data.reduce((sum,r)=>sum+Number(r.handlingtime_seconds||0),0);

  const ratioActual = totalPlanned > 0 ? (totalActual/totalPlanned)*100 : 0;
  const ahtSec = totalVolume > 0 ? totalHandling/totalVolume : 0;
  const occupancy = totalActual > 0 ? (totalHandling/(totalActual*3600))*100 : 0;

  document.getElementById("sumVolume").innerText = totalVolume;
  document.getElementById("ratioActual").innerText = ratioActual.toFixed(1)+"%";
  document.getElementById("avgAHT").innerText = formatTime(ahtSec);
  document.getElementById("occupancy").innerText = occupancy.toFixed(1)+"%";
}

// ================= HELPER =================
function formatStatus(status){
  if(status==="OFF") return `<span class="badge bg-danger">OFF</span>`;
  if(status==="Actual") return `<span class="badge bg-primary">Actual</span>`;
  if(status==="LEAVE") return `<span class="badge bg-warning text-dark">Leave</span>`;
  return `<span class="badge bg-secondary">Planned</span>`;
}

function formatTime(seconds){
  if(!seconds||isNaN(seconds)) return "00:00";
  const m=Math.floor(seconds/60);
  const s=Math.floor(seconds%60);
  return `${m}:${s.toString().padStart(2,'0')}`;
}

function formatToHMS(seconds){
  if(!seconds||isNaN(seconds)) return "00:00:00";
  const h=Math.floor(seconds/3600);
  const m=Math.floor((seconds%3600)/60);
  const s=Math.floor(seconds%60);
  return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}