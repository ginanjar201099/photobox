const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const snapBtn = document.getElementById('snap-btn');
const downloadBtn = document.getElementById('download-btn');
const countdownEl = document.getElementById('countdown');
const photoResult = document.getElementById('photo-result');
const resultContainer = document.getElementById('result-container');
const templateBtns = document.querySelectorAll('.template-btn');

const ctx = canvas.getContext('2d');
let takenPhotos = [];
let maxPhotos = 3; // Default awal 3 foto

// 1. Logika Pilihan Template
templateBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        templateBtns.forEach(b => {
            b.classList.remove('bg-pink-500', 'text-white', 'border-pink-400');
            b.classList.add('bg-zinc-800', 'text-zinc-400', 'border-zinc-700');
        });
        btn.classList.remove('bg-zinc-800', 'text-zinc-400', 'border-zinc-700');
        btn.classList.add('bg-pink-500', 'text-white', 'border-pink-400');
        
        maxPhotos = parseInt(btn.getAttribute('data-photos'));
        snapBtn.innerText = `MULAI SNAP (${maxPhotos} FOTO)`;
    });
});

// 2. FUNGSI KAMERA BARU (Lebih Stabil untuk HP)
async function initCamera() {
    // Memastikan browser mendukung fitur kamera
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Browser kamu tidak mendukung akses kamera. Coba gunakan Chrome atau Safari versi terbaru.");
        return;
    }

    const constraints = {
        video: {
            facingMode: "user", // Mengunci ke kamera depan HP
            width: { ideal: 640 }, // Diturunkan sedikit agar loading kamera di HP lebih ringan & cepat
            height: { ideal: 480 }
        },
        audio: false
    };

    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        
        // Memaksa video untuk play setelah stream didapatkan (mengatasi bug layar hitam)
        video.onloadedmetadata = () => {
            video.play().catch(e => console.error("Gagal auto-play video:", e));
        };
    } catch (err) {
        console.error("Error akses kamera: ", err);
        alert("Gagal memuat kamera. Pastikan tidak ada aplikasi lain (seperti WhatsApp/Instagram) yang sedang memakai kamera belakang/depan kamu.");
    }
}

// 3. Trigger Sesi Foto
snapBtn.addEventListener('click', () => {
    takenPhotos = []; 
    resultContainer.classList.add('hidden');
    downloadBtn.classList.add('hidden');
    snapBtn.disabled = true;
    snapBtn.innerText = "Bersiap...";
    
    startPhotoSession(0);
});

// 4. Loop Hitung Mundur per Foto
function startPhotoSession(currentCount) {
    if (currentCount >= maxPhotos) {
        generatePhotoStrip();
        snapBtn.disabled = false;
        snapBtn.innerText = `MULAI SNAP (${maxPhotos} FOTO)`;
        return;
    }

    let timeLeft = 3;
    countdownEl.classList.remove('hidden');
    countdownEl.innerText = timeLeft;

    const timer = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
            clearInterval(timer);
            countdownEl.classList.add('hidden');
            captureImage();
            
            setTimeout(() => {
                startPhotoSession(currentCount + 1);
            }, 1200);
        } else {
            countdownEl.innerText = timeLeft;
        }
    }, 1000);
}

// 5. Ambil Gambar dari Kamera
function captureImage() {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth || 640;
    tempCanvas.height = video.videoHeight || 480;
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCtx.translate(tempCanvas.width, 0);
    tempCtx.scale(-1, 1);
    tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
    
    takenPhotos.push(tempCanvas.toDataURL('image/jpeg'));
}

// 6. Generate Template Sesuai Pilihan
function generatePhotoStrip() {
    const padding = 20;
    let stripWidth = 400;
    let photoHeight = 270;
    let totalHeight = 0;

    if (maxPhotos === 6) {
        stripWidth = 540; 
        photoHeight = 240;
        totalHeight = (photoHeight * 3) + (padding * 4) + 60; 
    } else {
        totalHeight = (photoHeight * maxPhotos) + (padding * (maxPhotos + 1)) + 60;
    }

    canvas.width = stripWidth;
    canvas.height = totalHeight;

    ctx.fillStyle = '#FFE4E6'; 
    ctx.fillRect(0, 0, stripWidth, totalHeight);

    let loadedCount = 0;

    takenPhotos.forEach((photoSrc, index) => {
        const img = new Image();
        img.src = photoSrc;
        img.onload = () => {
            loadedCount++;

            if (maxPhotos === 6) {
                const col = index % 2; 
                const row = Math.floor(index / 2); 
                const singlePhotoWidth = (stripWidth - (padding * 3)) / 2;
                
                const x = padding + col * (singlePhotoWidth + padding);
                const y = padding + row * (photoHeight + padding);
                
                ctx.drawImage(img, x, y, singlePhotoWidth, photoHeight);
            } else {
                const x = padding;
                const y = padding + index * (photoHeight + padding);
                const singlePhotoWidth = stripWidth - (padding * 2);
                
                ctx.drawImage(img, x, y, singlePhotoWidth, photoHeight);
            }

            if (loadedCount === maxPhotos) {
                ctx.fillStyle = '#DB2777'; 
                ctx.font = 'bold 18px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('✨ GEMAS SNAP 2026 ✨', stripWidth / 2, totalHeight - 25);

                const finalDataUrl = canvas.toDataURL('image/png');
                photoResult.src = finalDataUrl;
                resultContainer.classList.remove('hidden');
                downloadBtn.classList.remove('hidden');
                
                downloadBtn.onclick = () => {
                    const link = document.createElement('a');
                    link.download = `gemas-snap-${maxPhotos}grid-${Date.now()}.png`;
                    link.href = finalDataUrl;
                    link.click();
                };

                resultContainer.scrollIntoView({ behavior: 'smooth' });
            }
        };
    });
}

// Nyalakan Kamera otomatis saat halaman siap
window.addEventListener('load', initCamera);
