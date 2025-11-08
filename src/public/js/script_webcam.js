const video = document.getElementById('inputVideo');
const canvas = document.getElementById('overlay');

// Flag para evitar recargar modelos repetidamente
let modelsLoaded = false;

// Inicia la cámara cuando el usuario pulsa el botón
async function startScan() {
    const btn = document.getElementById('startScanBtn');
    try {
        if (video.srcObject) return;
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        video.srcObject = stream;
        // Espera a que el video empiece a reproducirse
        await video.play();
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Escaneando...';
        }
        onPlay();
    } catch (err) {
        console.error('Error accediendo a la cámara:', err);
        alert('No se pudo acceder a la cámara. Comprueba permisos y que el dispositivo tiene cámara.');
    }
}

// Bucle de detección
async function onPlay() {
    const MODEL_URL = './public/models';

    if (!modelsLoaded) {
        // Cargar modelos una sola vez
        await faceapi.loadSsdMobilenetv1Model(MODEL_URL)
        await faceapi.loadFaceLandmarkModel(MODEL_URL)
        await faceapi.loadFaceRecognitionModel(MODEL_URL)
        await faceapi.loadFaceExpressionModel(MODEL_URL)
        modelsLoaded = true;
    }

    // Ajustar canvas al tamaño del vídeo
    canvas.width = video.videoWidth || video.clientWidth;
    canvas.height = video.videoHeight || video.clientHeight;

    // Detectar caras y dibujar sobre el canvas
    try {
        let fullFaceDescriptions = await faceapi.detectAllFaces(video)
            .withFaceLandmarks()
            .withFaceDescriptors()
            .withFaceExpressions();

        const dims = faceapi.matchDimensions(canvas, video, true);
        const resizedResults = faceapi.resizeResults(fullFaceDescriptions, dims);

        // Limpiar canvas y dibujar
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        faceapi.draw.drawDetections(canvas, resizedResults);
        faceapi.draw.drawFaceLandmarks(canvas, resizedResults);
        faceapi.draw.drawFaceExpressions(canvas, resizedResults, 0.05);
    } catch (e) {
        console.error('Error en detección:', e);
    }

    // Repetir ciclo
    setTimeout(() => onPlay(), 50);
}

// Conectar botón
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('startScanBtn');
    if (btn) btn.addEventListener('click', startScan);
});

