const video = document.getElementById("camera");
const startButton = document.getElementById("startCamera");
const captureButton = document.getElementById("captureButton");
const canvas = document.getElementById("captureCanvas");

let stream = null;

startButton.addEventListener("click", async () => {
    console.log("Start camera button pressed");

    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "environment"
            },
            audio: false
        });

        console.log("Camera permission granted");

        video.srcObject = stream;

        /*
         * Do NOT wait for video.play().
         * The Capture button should appear regardless.
         */
        startButton.style.display = "none";
        captureButton.style.display = "block";

        console.log("Capture button enabled");

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
        `Image i kisim: ${canvas.width} × ${canvas.height}`
    );

    captureButton.textContent = "✓ Kisim pinis";

    setTimeout(() => {
        captureButton.textContent = "📷 Skanim";
    }, 1000);
});
