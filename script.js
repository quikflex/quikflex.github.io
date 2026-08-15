const video = document.getElementById("camera");
const startButton = document.getElementById("startCamera");
const captureButton = document.getElementById("captureButton");
const canvas = document.getElementById("captureCanvas");

let cameraStream = null;

console.log("QuikScan JS loaded");

startButton.addEventListener("click", async () => {

    console.log("Start camera button pressed");

    try {

        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "environment"
            },
            audio: false
        });

        console.log("Camera permission granted");

        video.srcObject = cameraStream;

        startButton.style.display = "none";
        captureButton.style.display = "block";

        console.log("Capture button shown");

    } catch (error) {

        console.error("Camera error:", error);

        alert(
            "Kamera i no inap.\n\n" +
            "Plis checkim camera permission."
        );
    }
});


captureButton.addEventListener("click", () => {

    console.log("Capture button pressed");

    if (!video.videoWidth || !video.videoHeight) {
        alert("Kamera i no redi yet.");
        return;
    }

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

    console.log(
        `Piksa i kisim: ${canvas.width} × ${canvas.height}`
    );

    /*
     * Temporary test:
     * open the captured image in a new tab.
     *
     * OCR will replace this later.
     */

    const image = canvas.toDataURL("image/jpeg", 0.95);

    const newWindow = window.open();

    if (newWindow) {
        newWindow.document.write(
            `<img src="${image}" style="max-width:100%;">`
        );
    }

});
