const video = document.getElementById("camera");
const startButton = document.getElementById("startCamera");
const captureButton = document.getElementById("captureButton");
const canvas = document.getElementById("captureCanvas");

let stream = null;

async function startCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: {
                    ideal: "environment"
                }
            },
            audio: false
        });

        video.srcObject = stream;

        await video.play();

        // Hide start button
        startButton.hidden = true;

        // Show capture button
        captureButton.hidden = false;

    } catch (error) {
        console.error(error);

        alert(
            "Kamera i no inap.\n\n" +
            "Plis givim QuikScan permission long yusim kamera."
        );
    }
}

function captureImage() {
    if (!video.videoWidth || !video.videoHeight) {
        return;
    }

    const context = canvas.getContext("2d");

    /*
     * For now, capture the entire camera frame.
     *
     * We'll add precise scan-frame cropping
     * when we connect the OCR engine.
     */

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
    );

    console.log(
        "Image i kisim:",
        canvas.width,
        "x",
        canvas.height
    );

    // Temporary feedback
    captureButton.textContent = "✓ Kisim Pinis";

    setTimeout(() => {
        captureButton.textContent = "📷 Skanim";
    }, 1000);
}

startButton.addEventListener(
    "click",
    startCamera
);

captureButton.addEventListener(
    "click",
    captureImage
);
