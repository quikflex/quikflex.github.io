const cameraView = document.getElementById("cameraView");
const previewView = document.getElementById("previewView");

const camera = document.getElementById("camera");

const startButton = document.getElementById("startButton");
const captureButton = document.getElementById("captureButton");

const retakeButton = document.getElementById("retakeButton");
const scanButton = document.getElementById("scanButton");

const canvas = document.getElementById("captureCanvas");
const previewImage = document.getElementById("previewImage");

let cameraStream = null;


/* =========================
   Camera
   ========================= */

async function startCamera() {
    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: {
                    ideal: "environment"
                }
            },

            audio: false
        });

        camera.srcObject = cameraStream;

        await camera.play();

        startButton.classList.add("hidden");
        captureButton.classList.remove("hidden");

        console.log("Kamera i stat.");

    } catch (error) {

        console.error("Camera error:", error);

        alert(
            "Kamera i no inap.\n\n" +
            "Plis givim QuikScan permission long yusim kamera."
        );
    }
}


/* =========================
   Capture
   ========================= */

function captureImage() {

    if (
        !camera.videoWidth ||
        !camera.videoHeight
    ) {
        alert("Kamera i no redi yet.");
        return;
    }

    /*
     * Capture the current camera frame.
     */

    canvas.width = camera.videoWidth;
    canvas.height = camera.videoHeight;

    const context = canvas.getContext("2d");

    context.drawImage(
        camera,
        0,
        0,
        canvas.width,
        canvas.height
    );

    /*
     * Convert the canvas into an image.
     */

    const image = canvas.toDataURL(
        "image/jpeg",
        0.95
    );

    previewImage.src = image;

    /*
     * Switch from camera to preview.
     */

    cameraView.classList.remove("active");
    previewView.classList.add("active");

    console.log(
        `Piksa i kisim: ${canvas.width} × ${canvas.height}`
    );
}


/* =========================
   Retake
   ========================= */

function retakeImage() {

    previewImage.src = "";

    previewView.classList.remove("active");
    cameraView.classList.add("active");

}


/* =========================
   OCR placeholder
   ========================= */

function scanImage() {

    /*
     * OCR will be added here.
     */

    alert(
        "OCR bai kam long hia. 🔍"
    );
}


/* =========================
   Events
   ========================= */

startButton.addEventListener(
    "click",
    startCamera
);

captureButton.addEventListener(
    "click",
    captureImage
);

retakeButton.addEventListener(
    "click",
    retakeImage
);

scanButton.addEventListener(
    "click",
    scanImage
);
