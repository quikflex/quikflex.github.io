const video = document.getElementById("camera");
const startButton = document.getElementById("startCamera");

async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: {
                    ideal: "environment"
                }
            },
            audio: false
        });

        video.srcObject = stream;
        startButton.style.display = "none";

    } catch (error) {
        console.error("Camera error:", error);
        alert("Could not access the camera.");
    }
}

startButton.addEventListener("click", startCamera);
