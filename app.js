const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const snapBtn = document.getElementById('snap-btn');
const downloadBtn = document.getElementById('download-btn');
const countdownEl = document.getElementById('countdown');
const photoResult = document.getElementById('photo-result');
const resultContainer = document.getElementById('result-container');

const ctx = canvas.getContext('2d');
let takenPhotos = [];
const maxPhotos = 4;

// 1. Akses Kamera HP (Mengutamakan kamera depan/user)
async function initCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: "user", // "environment" jika ingin kamera belakang
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        });
        video.srcObject = stream;
    } catch (err) {
        alert("Gagal mengakses kamera. Mohon izinkan akses kamera di browser HP kamu!");
        console.error(err);
    }
}

// 2. Event Listener Tombol Ambil Foto
snapBtn.addEventListener('click', () => {
    takenPhotos = []; // Reset foto sebelumnya
    resultContainer.classList.add('hidden');
    downloadBtn.classList.add('hidden');
    snapBtn.disabled = true;
    snapBtn.innerText = "Bersiap...";
    
    startPhotoSession(0);
});

// 3. Loop Sesi Foto dengan Jeda Waktu (Countdown)
function startPhotoSession(currentCount) {
    if (currentCount >= maxPhotos) {
        // Jika sudah 4 foto, gabungkan jadi satu strip
        generatePhotoStrip();
        snapBtn.disabled = false;
        snapBtn.innerText = "AMBIL FOTO LAGI";
        return;
    }

    let timeLeft = 3; // 3 detik countdown
    countdownEl.classList.remove('hidden');
    countdownEl.innerText = timeLeft;

    const timer = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
            clearInterval(timer);
            countdownEl.classList.add('hidden');
            
            // Ambil gambar dari video stream
            captureImage();
            
            // Lanjut ke foto berikutnya setelah jeda 1.5 detik biar ada waktu ganti gaya
            setTimeout(() => {
                startPhotoSession(currentCount + 1);
            }, 1500);
        } else {
            countdownEl.innerText = timeLeft;
        }
    }, 1000);
}

// 4. Capture Gambar dari Video ke Canvas Sementara
function captureImage() {
    // Set ukuran canvas sementara sesuai rasio video
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Gambar efek mirror
    tempCtx.translate(tempCanvas.width, 0);
    tempCtx.scale(-1, 1);
    tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
    
    // Simpan data URL gambar
    takenPhotos.push(tempCanvas.toDataURL('image/jpeg'));
}

// 5. Menggabungkan 4 Foto menjadi Strip Photo Box Estetis
function generatePhotoStrip() {
    // Tentukan ukuran strip akhir (misal: lebar 400px, tinggi otomatis menyesuaikan)
    const stripWidth = 400;
    const padding = 20;
    const photoHeight = 280; // Tinggi tiap frame foto
    const totalHeight = (photoHeight * maxPhotos) + (padding * (maxPhotos + 1)) + 60; // 60px tambahan untuk space logo/footer strip

    canvas.width = stripWidth;
    canvas.height = totalHeight;

    // Background Frame (Warna putih ala photobox klasik, bisa diganti)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, stripWidth, totalHeight);

    let currentY = padding;

    // Gambar satu per satu foto ke dalam canvas utama
    takenPhotos.forEach((photoSrc, index) => {
        const img = new Image();
        img.src = photoSrc;
        img.onload = () => {
            // Gambar foto dengan margin kiri-kanan
            ctx.drawImage(img, padding, currentY, stripWidth - (padding * 2), photoHeight);
            currentY += photoHeight + padding;

            // Jika ini foto terakhir, render hasil akhirnya
            if (index === maxPhotos - 1) {
                // Tambah teks pemanis di bawah strip
                ctx.fillStyle = '#111111';
                ctx.font = 'bold 16px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('✨ GEMAS SNAP 2026 ✨', stripWidth / 2, totalHeight - 25);

                // Tampilkan ke user
                const finalDataUrl = canvas.toDataURL('image/png');
                photoResult.src = finalDataUrl;
                resultContainer.classList.remove('hidden');
                downloadBtn.classList.remove('hidden');
                
                // Setup tombol download
                downloadBtn.onclick = () => {
                    const link = document.createElement('a');
                    link.download = `gemas-snap-${Date.now()}.png`;
                    link.href = finalDataUrl;
                    link.click();
                };
            }
        };
    });
}

// Jalankan kamera saat halaman dimuat
window.addEventListener('DOMContentLoaded', initCamera);
