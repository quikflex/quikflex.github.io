const video = document.getElementById("camera");
const startButton = document.getElementById("startCamera");
const captureButton = document.getElementById("captureButton");
const canvas = document.getElementById("captureCanvas");

let cameraStream = null;

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

        video.srcObject = cameraStream;

        startButton.style.display = "none";
        captureButton.disabled = false;

    } catch (error) {
        console.error("Camera error:", error);

        alert(
            "Could not access the camera.\n\n" +
            "Please check your camera permission."
        );
    }
}

function captureImage() {
    if (!video.videoWidth || !video.videoHeight) {
        return;
    }

    /*
     * The scan frame occupies approximately:
     *
     * 85% of the screen width
     * 120px in height
     *
     * We convert that screen area into the
     * actual camera-image coordinates.
     */

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    const screenWidth = video.clientWidth;
    const screenHeight = video.clientHeight;

    const frameWidth = screenWidth * 0.85;
    const frameHeight = 120;

    const frameLeft = (screenWidth - frameWidth) / 2;
    const frameTop = (screenHeight - frameHeight) / 2;

    /*
     * Because object-fit: cover is being used,
     * the visible camera image may be cropped.
     *
     * Calculate the scale used to fill the screen.
     */

    const scale = Math.max(
        screenWidth / videoWidth,
        screenHeight / videoHeight
    );

    const displayedWidth = videoWidth * scale;
    const displayedHeight = videoHeight * scale;

    const cropX = (displayedWidth - screenWidth) / 2;
    const cropY = (displayedHeight - screenHeight) / 2;

    const sourceX = (frameLeft + cropX) / scale;
    const sourceY = (frameTop + cropY) / scale;

    const sourceWidth = frameWidth / scale;
    const sourceHeight = frameHeight / scale;

    /*
     * Render the captured scan area.
     *
     * We upscale it 2x to give OCR more pixels
     * to work with.
     */

    canvas.width = sourceWidth * 2;
    canvas.height = sourceHeight * 2;

    const context = canvas.getContext("2d");

    context.drawImage(
        video,

        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,

        0,
        0,
        canvas.width,
        canvas.height
    );

    /*
     * This is where OCR will go.
     */

    const imageData = canvas.toDataURL("image/jpeg", 0.95);

    console.log("Captured image:");
    console.log(imageData);

    /*
     * For now, download/show nothing.
     * The next step will feed this image
     * directly into offline OCR.
     */

    alert("Captured! OCR is the next step.");
}

startButton.addEventListener("click", startCamera);

captureButton.addEventListener("click", captureImage);
