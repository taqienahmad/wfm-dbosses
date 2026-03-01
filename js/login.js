

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
async function login() {
    console.log("LOGIN FUNCTION RUN");
    const idInput = document.getElementById("agent_id");
    const passInput = document.getElementById("password");
    const errorBox = document.getElementById("error");

    const agent_id = idInput.value.trim();
    const password = passInput.value.trim();

    if (!agent_id || !password) {
        errorBox.innerText = "Isi ID dan Password dulu";
        return;
    }

    errorBox.innerText = "Checking user...";

    try {

        // ===============================
        // AMBIL USER DARI DATABASE
        // ===============================
        const { data, error } = await db
            .from("user_master")
            .select("*")
            .eq("agent_id", agent_id)
            .single();

        if (error) {
            console.log(error);
            errorBox.innerText = "User tidak ditemukan";
            return;
        }

        // ===============================
        // CEK PASSWORD
        // ===============================
        if (data.password !== password) {
            errorBox.innerText = "Password salah";
            return;
        }

        // ===============================
        // LOGIN BERHASIL
        // ===============================
        const sessionUser = {
            agent_id: data.agent_id,
            agent_name: data.agent_name,
            role: data.role
        };

        localStorage.setItem("wfm_user", JSON.stringify(sessionUser));

        errorBox.style.color = "limegreen";
        errorBox.innerText = "Login berhasil...";

        setTimeout(() => {
            window.location.href = "index.html";
        }, 700);

    } catch (err) {
        console.error(err);
        errorBox.innerText = "Server error";
    }
}

// =======================================
// ENTER = LOGIN
// =======================================
document.addEventListener("keydown", e => {
    if (e.key === "Enter") login();
});

// =======================================
// AUTO SKIP LOGIN (SAFE)
// =======================================
window.addEventListener("DOMContentLoaded", () => {

    const user = localStorage.getItem("wfm_user");

    // hanya redirect kalau benar2 di halaman login
    if(user && location.pathname.toLowerCase().includes("login.html")){
        window.location.replace("index.html");
    }

});

// CEK JIKA SUDAH LOGIN
window.addEventListener("DOMContentLoaded", () => {
    const user = localStorage.getItem("wfm_user");

    // hanya redirect kalau memang dari login page
    if(user && location.pathname.includes("login.html")){
        window.location.replace("index.html");
    }
});

// =======================================
// HANDLE FORM SUBMIT (WAJIB ADA)
// =======================================
document.getElementById("loginForm").addEventListener("submit", function(e){
    e.preventDefault(); // STOP REFRESH HALAMAN
    login();
});
