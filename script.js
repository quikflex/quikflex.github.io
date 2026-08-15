const video = document.getElementById("camera");
const startButton = document.getElementById("startCamera");
const captureButton = document.getElementById("captureButton");

const canvas = document.getElementById("captureCanvas");

const preview = document.getElementById("preview");
const previewImage = document.getElementById("previewImage");
const retakeButton = document.getElementById("retakeButton");

console.log("QuikScan JavaScript i load pinis.");

startButton.addEventListener("click", async () => {

    console.log("Camera button i press.");

    try {

        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "environment"
            },
            audio: false
        });

        video.srcObject = stream;

        startButton.style.display = "none";

        captureButton.disabled = false;

        console.log("Kamera i wok.");

    } catch (error) {

        console.error("Camera error:", error);

        alert(
            "Kamera i no inap. Plis checkim permission."
        );
    }
});


captureButton.addEventListener("click", () => {

    console.log("Capture button i press.");

    if (!video.videoWidth || !video.videoHeight) {

        alert("Kamera i no redi yet.");

        return;
    }

    /*
     * Capture the current camera frame.
     */

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    context.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
    );

    /*
     * Convert the captured frame into an image.
     */

    const image = canvas.toDataURL(
        "image/jpeg",
        0.95
    );

    previewImage.src = image;

    /*
     * Show preview.
     */

    preview.classList.add("active");

    console.log("Piksa i kisim pinis.");
});


retakeButton.addEventListener("click", () => {

    preview.classList.remove("active");

    previewImage.src = "";

    console.log("Go bek long kamera.");

});
