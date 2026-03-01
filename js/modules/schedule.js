let scheduleData = [];

// ============================================
// LOAD SCHEDULE FROM SUPABASE
// ============================================
window.loadSchedule = async function(){


const session = JSON.parse(localStorage.getItem("wfm_user"));
if(!session) return;

const tbody = document.getElementById("scheduleBody");
if(!tbody) return;

tbody.innerHTML = "<tr><td colspan='9'>Loading schedule...</td></tr>";

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
    planned:master_shift!fk_planned_shift(start_time,end_time),
    actual:master_shift!fk_actual_shift(start_time,end_time)
    `)
    .eq("agent_id", session.agent_id)
    .order("shift_date",{ascending:true});

    if(error){
        console.error("Supabase error:", error);
        tbody.innerHTML = "<tr><td colspan='9'>Failed load data</td></tr>";
        return;
    }

    if(!data || data.length === 0){
        tbody.innerHTML = "<tr><td colspan='9'>No schedule available</td></tr>";
        return;
    }

    scheduleData = data;
    console.log("DATA FROM SUPABASE:", data);

    renderTable(scheduleData);

} catch(err){
    console.error("JS error:", err);
    tbody.innerHTML = "<tr><td colspan='9'>Unexpected error load schedule</td></tr>";
}


};

// ============================================
// RENDER TABLE
// ============================================
function renderTable(rows){


const tbody = document.getElementById("scheduleBody");
if(!rows || rows.length === 0){
    tbody.innerHTML = "<tr><td colspan='9'>No schedule</td></tr>";
    return;
}

const isMobile = window.innerWidth <= 768;
let html = "";

rows.forEach(row => {

    if(!row) return;

    // ==== SHIFT SAFE READ ====
    const plannedShift = row.planned?.shift_code ?? row.planned_shift ?? "-";
    const actualShift  = row.actual?.shift_code ?? row.actual_shift ?? null;
    const shift = actualShift || plannedShift;

    // ==== TIME SAFE READ ====
    const plannedStart = row.planned?.start_time ?? "-";
    const plannedEnd   = row.planned?.end_time ?? "-";

    const actualStart  = row.actual?.start_time ?? plannedStart;
    const actualEnd    = row.actual?.end_time ?? plannedEnd;

    const shiftTime = plannedStart === "-" ? "-" : `${plannedStart} - ${plannedEnd}`;

    // ==== DATE ====
    const dateObj = new Date(row.shift_date);
    const date = dateObj.toLocaleDateString("id-ID",{day:"2-digit",month:"short"});

    // ==== STATUS ====
    let status = "Planned";
    let cls = "status-planned";

    if(actualShift) { status="Actual"; cls="status-actual"; }
    if(shift==="OFF" || shift==="Day Off"){ status="OFF"; cls="status-off"; }

    // ================= MOBILE =================
    if(isMobile){
        html += `
        <tr class="mobile-row">
          <td colspan="9">
            <div class="shift-card">
              <div class="sc-date">${date}</div>

              <div class="sc-shift">${shift}</div>
              <div class="sc-time">${shiftTime}</div>

              <div class="sc-status ${cls}">
                Status : ${status}
              </div>

              <div class="sc-grid">
                <div>
                  <label>Break Start</label>
                  <span>${row.break_start ?? "-"}</span>
                </div>

                <div>
                  <label>Break End</label>
                  <span>${row.break_end ?? "-"}</span>
                </div>

                <div>
                  <label>Planned</label>
                  <span>${row.planned_hours ?? 0}h</span>
                </div>

                <div>
                  <label>Actual</label>
                  <span>${row.actual_hours ?? 0}h</span>
                </div>
              </div>
            </div>
          </td>
        </tr>`;
    }

    // ================= DESKTOP =================
    else{
        html += `
        <tr>
            <td>${dateObj.toLocaleDateString("id-ID")}</td>
            <td>${shift}</td>
            <td>${plannedStart}</td>
            <td>${plannedEnd}</td>
            <td>${row.break_start ?? "-"}</td>
            <td>${row.break_end ?? "-"}</td>
            <td>${row.planned_hours ?? "-"}</td>
            <td>${row.actual_hours ?? "-"}</td>
            <td class="${cls}">${status}</td>
        </tr>`;
    }
});

tbody.innerHTML = html;


}

// ============================================
// FILTERS
// ============================================
function filterToday(){
const today = new Date().toDateString();
renderTable(scheduleData.filter(r =>
new Date(r.shift_date).toDateString() === today
));
}

function filterWeek(){
const now = new Date();
const start = new Date(now);
const day = now.getDay() || 7;
start.setDate(now.getDate() - day + 1);


const end = new Date(start);
end.setDate(start.getDate()+6);

renderTable(scheduleData.filter(r=>{
    const d = new Date(r.shift_date);
    return d>=start && d<=end;
}));


}

function filterMonth(){
const now = new Date();
renderTable(scheduleData.filter(r=>{
const d=new Date(r.shift_date);
return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear();
}));
}

function filterRange(){
const start = document.getElementById("startDate").value;
const end = document.getElementById("endDate").value;


if(!start || !end){
    alert("Pilih tanggal awal dan akhir dulu");
    return;
}

const startDate = new Date(start);
const endDate = new Date(end);
endDate.setHours(23,59,59,999);

renderTable(scheduleData.filter(row=>{
    const d = new Date(row.shift_date);
    return d >= startDate && d <= endDate;
}));


}
