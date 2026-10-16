// ---------- Firebase setup ----------
const firebaseConfig = {
  apiKey: "AIzaSyDSPkX4bgHcGJPS-ueiTQxH-tBa4Suzuw4",
  authDomain: "smart-attendance-2-e8093.firebaseapp.com",
  projectId: "smart-attendance-2-e8093",
  storageBucket: "smart-attendance-2-e8093.firebasestorage.app",
  messagingSenderId: "277520093986",
  appId: "1:277520093986:web:ba451a74641b58b8fa0b7b"
};

let db, fs;

async function initFirebase() {
  const base = "https://www.gstatic.com/firebasejs/10.12.0/";
  const appMod = await import(base + "firebase-app.js");
  fs = await import(base + "firebase-firestore.js");
  const app = appMod.initializeApp(firebaseConfig);
  db = fs.getFirestore(app);

  // Live table: kisi bhi device se scan ho, yahan turant dikhega
  fs.onSnapshot(fs.collection(db, "attendance"), (snap) => {
    const data = [];
    snap.forEach(d => data.push(d.data()));
    displayAttendance(data);
  });
}

// ---------- Student + QR generate ----------
document.getElementById('generateBtn').addEventListener('click', async () => {
    let name = document.getElementById('name').value.trim();
    let roll = document.getElementById('roll').value.trim();
    let qrDispaly = document.getElementById('qrcode');
    qrDispaly.innerHTML = '';

    if(!name || !roll){
        alert('Please enter both roll number and name');
        return;
    }

    const qrData = `${roll}|${name}`;
    new QRCode(qrDispaly, {
        text: qrData,
        width: 180,
        height: 180,
    });

    try {
        await fs.setDoc(fs.doc(db, "students", roll), { roll, name });
    } catch (e) {
        console.log(e);
    }

    const qrDispalyContainer = document.getElementById('qrDisplayContainer');
    const userInfo = document.getElementById('userInfo');
    userInfo.innerHTML = `<strong>Name:</strong> ${name} <br> <strong>Roll Number:</strong> ${roll}`;
    qrDispalyContainer.style.display = 'block';

    document.getElementById('name').value = '';
    document.getElementById('roll').value = '';
});

// ---------- Scan ----------
let lastScan = "";
let lastScanTime = 0;

async function onScanSuccess(decodedText){
    // ek hi QR baar-baar na ginne ke liye 5 second ka gap
    const now = Date.now();
    if (decodedText === lastScan && now - lastScanTime < 5000) return;
    lastScan = decodedText;
    lastScanTime = now;

    const [roll, name] = decodedText.split('|');
    if (!roll || !name) {
        alert('Invalid QR Code');
        return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const id = `${today}_${roll}`;   // ek student ki ek din mein ek hi entry

    try {
        await fs.setDoc(fs.doc(db, "attendance", id), {
            roll, name, date: today, status: 'Present',
            time: new Date().toLocaleTimeString()
        });
        alert(`${name} - Present ✅`);
    } catch (e) {
        alert('Error: attendance save nahi hui');
        console.log(e);
    }
}

function onScanError(err){
    // scanning errors ignore
}

const html5QrcodeScanner = new Html5QrcodeScanner(
    "reader",
    {fps: 10, qrbox: 250},
    false
);
html5QrcodeScanner.render(onScanSuccess, onScanError);

// ---------- Table ----------
function displayAttendance(data){
    const table = document.querySelector('#attendanceTable tbody');
    table.innerHTML = "";

    const countMap = {};
    data.forEach(item => {
        if(!countMap[item.roll]) {
            countMap[item.roll] = {name: item.name, count: 0, status: item.status};
        }
        countMap[item.roll].count++;
    });

    Object.entries(countMap).forEach(([roll, info]) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td></td>
            <td></td>
            <td style="color: green; font-weight: bold;"></td>
            <td style="color: green;"></td>`;
        const cells = tr.querySelectorAll('td');
        cells[0].textContent = roll;
        cells[1].textContent = info.name;
        cells[2].textContent = info.status;
        cells[3].textContent = info.count;
        table.appendChild(tr);
    });
}

// ---------- Download QR ----------
document.getElementById('downloadQrBtn').addEventListener('click', () => {
    const qrContainer = document.getElementById('qrDisplayContainer');
    html2canvas(qrContainer).then(canvas => {
        let link = document.createElement('a');
        link.download = 'qr_code.png';
        link.href = canvas.toDataURL();
        link.click();
    });
});

initFirebase();