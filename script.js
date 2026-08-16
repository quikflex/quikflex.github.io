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

            // Start background preload after camera permission — doesn't block UI.
            getPaddleOCR({ foreground: false }).catch(err => {
                console.warn("Background PaddleOCR preload failed:", err);
            });

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

// getPaddleOCR: supports foreground=true to show a blocking loading UI (used
// when the user explicitly tries to scan and background preload hasn't finished).
// Background preload calls should pass { foreground: false } (or omit options)
// so they don't block the UI on slow networks.
async function getPaddleOCR(options = { foreground: false }) {

    if (paddleOCR) return paddleOCR;

    // If a create() call is already in progress, wait briefly for it.
    if (paddleOCRCreating) {
        for (let i = 0; i < 50; i++) { // ~5s max wait
            if (paddleOCR) return paddleOCR;
            await new Promise(r => setTimeout(r, 100));
        }
    }

    const foreground = !!options.foreground;

    if (foreground) {
        try { showOCRLoading("Loading OCR — please wait..."); } catch (e) { /* ignore */ }
        ocrStatus.textContent = "OCR i load...";
    } else {
        // background attempt: keep UI neutral
        ocrStatus.textContent = "";
    }

    paddleOCRCreating = true;

    try {
        const instance = await PaddleOCR.create({
            textDetectionModelName: "PP-OCRv6_tiny_det",
            textRecognitionModelName: "PP-OCRv6_tiny_rec",
            worker: false,
            ortOptions: {
                backend: "wasm",
                // Use local hosted assets under /ocr/ per repo setup
                wasmPaths: "/ocr/",
                numThreads: 2,
                simd: true
            }
        });

        // Warm-up — non-fatal
        try {
            const warmupCanvas = document.createElement("canvas");
            warmupCanvas.width = 32; warmupCanvas.height = 32;
            const ctx = warmupCanvas.getContext("2d");
            ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, 32, 32);
            await instance.predict(warmupCanvas);
        } catch (e) {
            console.warn("PaddleOCR warmup failed (non-fatal):", e);
        }

        paddleOCR = instance;
        ocrStatus.textContent = "OCR i redi.";
        return paddleOCR;

    } catch (err) {
        console.error("PaddleOCR.create() failed:", err);
        if (foreground) {
            // foreground failure: rethrow so caller can show error/alert
            throw err;
        }
        // background failure: keep app usable and allow future retries
        ocrStatus.textContent = "OCR i no redi — will try when you scan.";
        return null;

    } finally {
        paddleOCRCreating = false;
        if (foreground) {
            try { hideOCRLoading(); } catch (e) {}
        }
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

        // Try background instance first; if not available do a foreground retry
        let ocr = await getPaddleOCR({ foreground: false }).catch(() => null);

        if (!ocr) {
            try {
                // Foreground attempt — show overlay and wait for create()
                showOCRLoading("Loading OCR — please wait...");
                ocr = await getPaddleOCR({ foreground: true });
            } catch (err) {
                console.error("Foreground PaddleOCR create failed:", err);
                ocrStatus.textContent = "OCR i no inap wok.";
                hideOCRLoading();
                alert("OCR i no redi yet. Plis try again or check network.");
                return;
            } finally {
                hideOCRLoading();
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
