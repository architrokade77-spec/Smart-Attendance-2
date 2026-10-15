let students = JSON.parse(localStorage.getItem('students')) || [];
let attendance = JSON.parse(localStorage.getItem('attendance')) || [];

document.getElementById('generateBtn').addEventListener('click', () => {
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

    if (!students.some(s => s.roll === roll)) {
        students.push({roll, name});
        localStorage.setItem('students', JSON.stringify(students));
    }

    const qrDispalyContainer = document.getElementById('qrDisplayContainer');
    const userInfo = document.getElementById('userInfo');
    userInfo.innerHTML = `<strong>Name:</strong> ${name} <br> <strong>Roll Number:</strong> ${roll}`;
    qrDispalyContainer.style.display = 'block';

    document.getElementById('name').value = '';
    document.getElementById('roll').value = '';
    displayAttendance();
});

function onScanSuccess(decodedText){
    const [roll, name] = decodedText.split('|');

    if (!roll || !name) {
        alert('Invalid QR Code');
        return;
    }

    attendance.push({roll, name, status: 'Present'});
    localStorage.setItem('attendance', JSON.stringify(attendance));
    displayAttendance();
}

function onScanError(err){
    console.log(err);
}

const html5QrcodeScanner = new Html5QrcodeScanner(
    "reader",
    {fps: 10, qrbox: 250},
    false
);
html5QrcodeScanner.render(onScanSuccess, onScanError);

function displayAttendance(){
    const table = document.querySelector('#attendanceTable tbody');
    table.innerHTML = "";

    const data = JSON.parse(localStorage.getItem('attendance')) || [];

    const countMap = {};
    data.forEach(item => {
        if(!countMap[item.roll]) {
            countMap[item.roll] = {name: item.name, count: 0, status: item.status};
        }
        countMap[item.roll].count++;
    });

    Object.entries(countMap).forEach(([roll, info])=>{
        let row = `
            <tr>
                <td>${roll}</td>
                <td>${info.name}</td>
                <td style="color: green; font-weight: bold;">${info.status}</td>
                <td style="color: green;">${info.count}</td>
            </tr>
        `;
        table.innerHTML += row;
    });
}

displayAttendance();

document.getElementById('downloadQrBtn').addEventListener('click', () => {
    const qrContainer = document.getElementById('qrDisplayContainer');
    html2canvas(qrContainer).then(canvas => {
        let link = document.createElement('a');
        link.download = 'qr_code.png';
        link.href = canvas.toDataURL();
        link.click();
    });
});