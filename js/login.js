console.log("LOGIN JS LOADED");

// =======================================
// AUTO FOCUS
// =======================================
window.addEventListener("load", () => {
  document.getElementById("agent_id").focus();
});

// =======================================
// LOGIN FUNCTION
// =======================================
async function login(){

  console.log("LOGIN FUNCTION RUN");

  const idInput = document.getElementById("agent_id");
  const passInput = document.getElementById("password");
  const errorBox = document.getElementById("error");

  const agent_id = idInput.value.trim();
  const password = passInput.value.trim();

  if (!agent_id || !password){
    errorBox.innerText = "Isi ID dan Password dulu";
    return;
  }

  errorBox.style.color = "black";
  errorBox.innerText = "Checking user...";

  try {

    const { data, error } = await db
      .from("user_master")
      .select("*")
      .eq("agent_id", agent_id)
      .single();

    if (error || !data){
      console.log(error);
      errorBox.innerText = "User tidak ditemukan";
      return;
    }

    // ===============================
    // CEK PASSWORD
    // ===============================
    if (data.password !== password){
      errorBox.innerText = "Password salah";
      return;
    }

    // ===============================
    // LOGIN SUCCESS
    // ===============================
    const sessionUser = {
      agent_id: data.agent_id,
      agent_name: data.agent_name,
      role: data.role
    };

    // 🔥 FIX PENTING (PASTIKAN TERSIMPAN)
    sessionStorage.setItem("wfm_user", JSON.stringify(sessionUser));

    console.log("SESSION SAVED:", sessionUser);

    errorBox.style.color = "green";
    errorBox.innerText = "Login berhasil...";

    setTimeout(()=>{
      window.location.href = "index.html";
    }, 500);

  } catch (err){
    console.error(err);
    errorBox.innerText = "Server error";
  }
}

// =======================================
// HANDLE FORM SUBMIT (WAJIB)
// =======================================
document.getElementById("loginForm").addEventListener("submit", function(e){
  e.preventDefault();
  login();
});

// =======================================
// ENTER KEY SUPPORT (FIXED)
// =======================================
document.addEventListener("keydown", e => {
  if (e.key === "Enter"){
    e.preventDefault(); // 🔥 biar tidak double submit
    login();
  }
});

// =======================================
// AUTO REDIRECT JIKA SUDAH LOGIN
// =======================================
window.addEventListener("DOMContentLoaded", () => {

  const user = sessionStorage.getItem("wfm_user");

  if(user && location.pathname.toLowerCase().includes("login.html")){
    console.log("Already logged in → redirect");
    window.location.replace("index.html");
  }

});