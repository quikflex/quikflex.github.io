import { PaddleOCR } from "@paddleocr/paddleocr-js";


/* =========================
   ELEMENTS
   ========================= */

const video =
    document.getElementById("camera");

const startButton =
    document.getElementById("startCamera");

const captureButton =
    document.getElementById("captureButton");

const canvas =
    document.getElementById("captureCanvas");

const preview =
    document.getElementById("preview");

const previewImage =
    document.getElementById("previewImage");

const retakeButton =
    document.getElementById("retakeButton");

const cropButton =
    document.getElementById("cropButton");

const cropCanvas =
    document.getElementById("cropCanvas");

const croppedPreview =
    document.getElementById("croppedPreview");

const croppedImage =
    document.getElementById("croppedImage");

const ocrStatus =
    document.getElementById("ocrStatus");

const ocrResult =
    document.getElementById("ocrResult");

const confirmButton =
    document.getElementById("confirmButton");

const backToCropButton =
    document.getElementById("backToCropButton");

/* =========================
   CAMERA
   ========================= */

let cameraStream = null;


startButton.addEventListener(
    "click",
    async () => {

        console.log(
            "Camera button i press."
        );

        try {

            cameraStream =
                await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: "environment"
                    },
                    audio: false
                });

            video.srcObject =
                cameraStream;

            startButton.style.display =
                "none";

            captureButton.disabled =
                false;

            captureButton.style.display =
                "block";

            console.log(
                "Kamera i wok."
            );

        } catch (error) {

            console.error(
                "Camera error:",
                error
            );

            alert(
                "Kamera i no inap. Plis checkim permission."
            );
        }
    }
);


/* =========================
   CAPTURE
   ========================= */

captureButton.addEventListener(
    "click",
    () => {

        console.log(
            "Capture button i press."
        );

        if (!video.videoWidth) {

            alert(
                "Kamera i no redi yet."
            );

            return;
        }


        canvas.width =
            video.videoWidth;

        canvas.height =
            video.videoHeight;


        const context =
            canvas.getContext("2d");


        context.drawImage(
            video,
            0,
            0,
            canvas.width,
            canvas.height
        );


        previewImage.onload =
            () => {

                preview.classList.add(
                    "active"
                );

                captureButton.style.display =
                    "none";

                console.log(
                    "Piksa i kisim pinis."
                );
            };


        previewImage.src =
            canvas.toDataURL(
                "image/jpeg",
                0.95
            );
    }
);


/* =========================
   RETAKE
   ========================= */

retakeButton.addEventListener(
    "click",
    () => {

        preview.classList.remove(
            "active"
        );

        croppedPreview.classList.remove(
            "active"
        );

        previewImage.src =
            "";

        croppedImage.src =
            "";

        ocrResult.value =
            "";

        ocrStatus.textContent =
            "";

        captureButton.style.display =
            "block";

        console.log(
            "Go bek long kamera."
        );
    }
);


/* =========================
   PADDLEOCR
   ========================= */

let paddleOCR = null;
let paddleOCRCreating = false; // guard to prevent parallel create() calls

// Loading UI helper: create a simple overlay element at runtime so we don't need
// to modify HTML. The overlay is lightweight (no heavy assets) and is only
// shown while preload/warm-up runs. This keeps the existing architecture
// intact for offline/weak edge devices.
function ensureOCRLoadingUI() {
    if (document.getElementById("ocrLoadingOverlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "ocrLoadingOverlay";

    // Basic inline styles so it works without external CSS.
    overlay.style.position = "fixed";
    overlay.style.left = "0";
    overlay.style.top = "0";
    overlay.style.right = "0";
    overlay.style.bottom = "0";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.background = "rgba(0,0,0,0.6)";
    overlay.style.color = "#fff";
    overlay.style.fontFamily = "sans-serif";
    overlay.style.fontSize = "16px";
    overlay.style.zIndex = "9999";
    overlay.style.backdropFilter = "blur(2px)";

    const box = document.createElement("div");
    box.style.display = "flex";
    box.style.flexDirection = "column";
    box.style.alignItems = "center";
    box.style.gap = "10px";
    box.style.padding = "18px 22px";
    box.style.borderRadius = "8px";
    box.style.background = "rgba(0,0,0,0.45)";

    const spinner = document.createElement("div");
    // small CSS spinner using borders
    spinner.style.width = "36px";
    spinner.style.height = "36px";
    spinner.style.border = "4px solid rgba(255,255,255,0.15)";
    spinner.style.borderTop = "4px solid #fff";
    spinner.style.borderRadius = "50%";
    spinner.style.animation = "ocr-spin 1s linear infinite";

    // Keyframes — inject into a style tag if not present
    if (!document.getElementById("ocrLoadingStyles")) {
        const style = document.createElement("style");
        style.id = "ocrLoadingStyles";
        style.textContent = `@keyframes ocr-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
        document.head.appendChild(style);
    }

    const label = document.createElement("div");
    label.id = "ocrLoadingLabel";
    label.textContent = "Loading OCR — please wait...";

    box.appendChild(spinner);
    box.appendChild(label);
    overlay.appendChild(box);
    overlay.style.display = "none";

    document.body.appendChild(overlay);
}

function showOCRLoading(text) {
    ensureOCRLoadingUI();
    const overlay = document.getElementById("ocrLoadingOverlay");
    const label = document.getElementById("ocrLoadingLabel");
    if (label && text) label.textContent = text;
    overlay.style.display = "flex";
}

function hideOCRLoading() {
    const overlay = document.getElementById("ocrLoadingOverlay");
    if (overlay) overlay.style.display = "none";
}

async function getPaddleOCR() {

    if (paddleOCR) {
        return paddleOCR;
    }

    // If a create() call is already in progress, wait for it instead of
    // starting another one. This keeps parallel attempts from competing.
    if (paddleOCRCreating) {
        // poll until created or failed
        for (let i = 0; i < 40; i++) { // ~4s max wait
            if (paddleOCR) return paddleOCR;
            await new Promise(r => setTimeout(r, 100));
        }
        // if still not available fall through and attempt create again
    }


    console.log(
        "PaddleOCR i load..."
    );


    ocrStatus.textContent =
        "OCR i load...";

    // Show a small loading UI while models and runtime initialize.
    // We intentionally auto-hide the overlay after a short time so users aren't
    // blocked by long downloads on weak connections. The download/initialization
    // continues in the background.
    try {
        showOCRLoading("Loading OCR models — this happens once");
    } catch (e) {
        console.warn("Could not show OCR loading UI:", e);
    }

    paddleOCRCreating = true;
    let createErr = null;

    // auto-hide overlay quickly so it doesn't block the app on slow networks
    const autoHideTimer = setTimeout(() => {
        try { hideOCRLoading(); } catch (e) {}
    }, 2500);

    try {
        paddleOCR =
            await PaddleOCR.create({

                textDetectionModelName:
                    "PP-OCRv6_tiny_det",

                textRecognitionModelName:
                    "PP-OCRv6_tiny_rec",

                /*
                 * Worker disabled because it
                 * caused "OCR worker failed" and
                 * to keep compatibility with
                 * GitHub Pages / weak edge devices.
                 */

                worker: false,

                ortOptions: {
                    backend: "wasm",

                    wasmPaths:
                        "https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/",

                    numThreads: 2,

                    simd: true
                }
            });

        console.log(
            "PaddleOCR i redi."
        );

        // Warm-up: run a tiny prediction to initialize the runtime and JIT layers.
        // This reduces the latency of the first real OCR pass. Failures are
        // non-fatal.
        try {
            const warmupCanvas = document.createElement("canvas");
            warmupCanvas.width = 32;
            warmupCanvas.height = 32;
            const ctx = warmupCanvas.getContext("2d");
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, warmupCanvas.width, warmupCanvas.height);

            await paddleOCR.predict(warmupCanvas);
            console.log("PaddleOCR warmup done");
        } catch (e) {
            console.warn("PaddleOCR warmup failed (non-fatal):", e);
        }

        // success
        clearTimeout(autoHideTimer);
        hideOCRLoading();
        ocrStatus.textContent = "OCR i redi.";
        paddleOCRCreating = false;
        return paddleOCR;

    } catch (error) {
        console.error("PaddleOCR create() failed:", error);
        createErr = error;
        // Hide overlay and set a non-fatal status — don't throw so the app stays usable.
        clearTimeout(autoHideTimer);
        hideOCRLoading();
        ocrStatus.textContent = "OCR i no redi — will try when you scan.";
        paddleOCRCreating = false;
        // Keep paddleOCR null; future calls will retry.
        return null;
    }
}


/* =========================
   AUTOMATIC VIEWFINDER CROP
   ========================= */

function createFrameCrop() {

    if (
        !canvas.width ||
        !canvas.height
    ) {

        throw new Error(
            "Capture image i no stap."
        );
    }


    /*
     * The camera uses:
     *
     * object-fit: cover
     *
     * Therefore the visible camera
     * image may be cropped on the
     * sides or top/bottom.
     *
     * We reproduce that calculation
     * against the captured image.
     */


    const videoRect =
        video.getBoundingClientRect();


    const frame =
        document.querySelector(
            ".scan-frame"
        );


    const frameRect =
        frame.getBoundingClientRect();


    const videoWidth =
        video.videoWidth;

    const videoHeight =
        video.videoHeight;


    const containerWidth =
        videoRect.width;

    const containerHeight =
        videoRect.height;


    /*
     * Scale used by object-fit: cover.
     */

    const scale =
        Math.max(
            containerWidth / videoWidth,
            containerHeight / videoHeight
        );


    /*
     * Size of the complete camera
     * image after scaling.
     */

    const displayedWidth =
        videoWidth * scale;

    const displayedHeight =
        videoHeight * scale;


    /*
     * object-position is center,
     * so calculate the hidden area.
     */

    const offsetX =
        (displayedWidth -
            containerWidth) / 2;

    const offsetY =
        (displayedHeight -
            containerHeight) / 2;


    /*
     * Convert the viewfinder's
     * screen coordinates into
     * coordinates on the original
     * camera frame.
     */

    let sourceX =
        (
            frameRect.left -
            videoRect.left +
            offsetX
        ) / scale;


    let sourceY =
        (
            frameRect.top -
            videoRect.top +
            offsetY
        ) / scale;


    let sourceWidth =
        frameRect.width / scale;


    let sourceHeight =
        frameRect.height / scale;


    /*
     * Keep everything inside
     * the captured image.
     */

    sourceX =
        Math.max(
            0,
            Math.min(
                sourceX,
                canvas.width
            )
        );


    sourceY =
        Math.max(
            0,
            Math.min(
                sourceY,
                canvas.height
            )
        );


    sourceWidth =
        Math.min(
            sourceWidth,
            canvas.width - sourceX
        );


    sourceHeight =
        Math.min(
            sourceHeight,
            canvas.height - sourceY
        );


    /*
     * Create cropped image.
     */

    cropCanvas.width =
        Math.round(sourceWidth);


    cropCanvas.height =
        Math.round(sourceHeight);


    const context =
        cropCanvas.getContext("2d");


    context.drawImage(
        canvas,

        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,

        0,
        0,
        cropCanvas.width,
        cropCanvas.height
    );


    croppedImage.src =
        cropCanvas.toDataURL(
            "image/jpeg",
            0.95
        );


    console.log(
        "Viewfinder crop:",
        `${cropCanvas.width} × ${cropCanvas.height}px`
    );


    console.log(
        "Crop source:",
        {
            x: sourceX,
            y: sourceY,
            width: sourceWidth,
            height: sourceHeight
        }
    );
}


/* =========================
   OCR
   ========================= */

async function runOCR() {

    console.log(
        "PaddleOCR i stat."
    );


    if (
        !cropCanvas.width ||
        !cropCanvas.height
    ) {

        alert(
            "No gat crop image."
        );

        return;
    }


    ocrStatus.textContent =
        "OCR i wok...";


    ocrResult.value =
        "";


    try {

        // Try to get an initialized OCR instance. If preload previously failed
        // this will attempt to create it again. If getPaddleOCR returns null it
        // means the preload/create failed — show the loading UI and retry once
        // more while the user waits.
        let ocr = await getPaddleOCR();

        if (!ocr) {
            // Show loading UI and attempt a foreground retry.
            showOCRLoading("Loading OCR — please wait...");
            ocr = await getPaddleOCR();
            hideOCRLoading();

            if (!ocr) {
                // Still no OCR — inform the user and abort gracefully.
                ocrStatus.textContent = "OCR i no inap wok.";
                alert("OCR i no redi yet. Plis try again or check network.");
                return;
            }
        }

        console.log(
            "Running PaddleOCR..."
        );


        const [result] =
            await ocr.predict(
                cropCanvas
            );


        console.log(
            "PaddleOCR result:",
            result
        );


        const items =
            result?.items || [];


        const rawText =
            items
                .map(
                    item =>
                        item.text || ""
                )
                .join("");


        console.log(
            "OCR raw result:",
            JSON.stringify(
                rawText
            )
        );


        /*
         * QuikScan only needs numbers.
         */

        const text =
            rawText.replace(
                /\D/g,
                ""
            );


        console.log(
            "Cleaned OCR result:",
            JSON.stringify(
                text
            )
        );


        if (!text) {

            ocrStatus.textContent =
                "OCR i no painim code.";

            return;
        }


        ocrResult.value =
            text;


        ocrStatus.textContent =
            "Checkim code na stret.";


        console.log(
            "Final Flex code:",
            text
        );


    } catch (error) {

        console.error(
            "PaddleOCR error:",
            error
        );

        console.error(
            "PaddleOCR error name:",
            error?.name
        );

        console.error(
            "PaddleOCR error message:",
            error?.message
        );

        console.error(
            "PaddleOCR error stack:",
            error?.stack
        );


        ocrStatus.textContent =
            "OCR i no inap wok.";
    }
}


/* =========================
   AUTOMATIC OCR AFTER CAPTURE
   ========================= */

cropButton.addEventListener(
    "click",
    async () => {

        console.log(
            "Automatic frame crop i stat."
        );


        if (!previewImage.naturalWidth) {

            alert(
                "Piksa i no redi yet."
            );

            return;
        }


        try {

            createFrameCrop();


            preview.classList.remove(
                "active"
            );


            croppedPreview.classList.add(
                "active"
            );


            console.log(
                "Code i crop pinis."
            );


            await runOCR();


        } catch (error) {

            console.error(
                "Automatic OCR error:",
                error
            );


            ocrStatus.textContent =
                "OCR i no inap wok.";
        }
    }
);


/* =========================
   CONFIRM OCR / USSD
   ========================= */

confirmButton.addEventListener(
    "click",
    () => {

        const code =
            ocrResult.value
                .replace(
                    /\D/g,
                    ""
                );


        if (!code) {

            alert(
                "Plis putim Flex code pastaim."
            );

            return;
        }


        let ussd = "";
        let carrier = "";


        /*
         * Digicel PNG Flex cards
         * have 13-digit voucher numbers.
         */

        if (code.length === 13) {

            carrier =
                "Digicel";

            ussd =
                `*121*${code}#`;

        }


        /*
         * Vodafone PNG TopUp cards
         * have 15-digit voucher numbers.
         */

        else if (code.length === 15) {

            carrier =
                "Vodafone";

            ussd =
                `*121*${code}#`;

        }


        /*
         * Anything else is probably
         * an OCR mistake.
         */

        else {

            alert(
                "Code i mas 13 digits (Digicel) or 15 digits (Vodafone)."
            );

            return;
        }


        console.log(
            "Carrier:",
            carrier
        );

        console.log(
            "USSD:",
            ussd
        );


        /*
         * Show what QuikScan detected
         * before opening the dialer.
         */

        ocrStatus.textContent =
            `${carrier} detected.`;

        confirmButton.disabled =
            true;


        /*
         * Open the phone dialer with
         * the USSD code.
         *
         * # must be URL encoded as %23.
         */

        const telURI =
            `tel:${ussd.replace(
                "#",
                "%23"
            )}`;


        window.location.href =
            telURI;


        /*
         * Re-enable the button shortly
         * afterward in case the phone
         * does not open the dialer.
         */

        setTimeout(
            () => {

                confirmButton.disabled =
                    false;

            },
            2000
        );


        console.log(
            "Opening USSD:",
            telURI
        );
    }
);
/* =========================
   RETAKE FROM OCR SCREEN
   ========================= */

backToCropButton.addEventListener(
    "click",
    () => {

        croppedPreview.classList.remove(
            "active"
        );

        preview.classList.remove(
            "active"
        );

        previewImage.src =
            "";

        croppedImage.src =
            "";

        ocrResult.value =
            "";

        ocrStatus.textContent =
            "";

        cropCanvas.width =
            0;

        cropCanvas.height =
            0;

        captureButton.style.display =
            "block";

        console.log(
            "Kisim gen — go bek long kamera."
        );
    }
);

// Preload OCR on page load so the first user-initiated scan is fast.
// We intentionally keep the same runtime options (worker: false, wasm)
// to preserve compatibility with offline/weak edge devices.
window.addEventListener("load", () => {
    // Kick off model/download/initialization in background. The loading
    // UI is shown from getPaddleOCR(). Any failures are logged but don't
    // block the app.
    getPaddleOCR().catch(err => {
        console.warn("PaddleOCR preload failed:", err);
    });
});
