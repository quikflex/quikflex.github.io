const video = document.getElementById("camera");

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

const cropArea =
    document.getElementById("cropArea");

const cropSelection =
    document.getElementById("cropSelection");

const cropCanvas =
    document.getElementById("cropCanvas");

const croppedPreview =
    document.getElementById("croppedPreview");

const croppedImage =
    document.getElementById("croppedImage");

const backToCropButton =
    document.getElementById("backToCropButton");

const ocrButton =
    document.getElementById("ocrButton");

const ocrStatus =
    document.getElementById("ocrStatus");

const ocrResult =
    document.getElementById("ocrResult");

const confirmButton =
    document.getElementById("confirmButton");


/* =========================
   RAPIDOCR
   ========================= */

let rapidOCR = null;
let rapidOCRReady = false;


/* =========================
   CAMERA
   ========================= */

let cameraStream = null;

let dragging = false;

let dragMode = "move";

let startX = 0;
let startY = 0;

let startLeft = 0;
let startTop = 0;

let startWidth = 0;
let startHeight = 0;


/* =========================
   CAMERA
   ========================= */

startButton.addEventListener("click", async () => {

    console.log("Camera button i press.");

    try {

        cameraStream =
            await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "environment"
                },
                audio: false
            });

        video.srcObject = cameraStream;

        startButton.style.display = "none";
        captureButton.disabled = false;
        captureButton.style.display = "block";

        console.log("Kamera i wok.");

    } catch (error) {

        console.error(
            "Camera error:",
            error
        );

        alert(
            "Kamera i no inap. Plis checkim permission."
        );
    }
});


/* =========================
   CAPTURE
   ========================= */

captureButton.addEventListener("click", () => {

    console.log("Capture button i press.");

    if (!video.videoWidth) {

        alert(
            "Kamera i no redi yet."
        );

        return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context =
        canvas.getContext("2d");

    context.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
    );

    const image =
        canvas.toDataURL(
            "image/jpeg",
            0.95
        );

    previewImage.src = image;

    preview.classList.add("active");

    captureButton.style.display = "none";

    console.log(
        "Piksa i kisim pinis."
    );
});


/* =========================
   RETAKE
   ========================= */

retakeButton.addEventListener("click", () => {

    preview.classList.remove("active");

    previewImage.src = "";

    captureButton.style.display = "block";

    console.log(
        "Go bek long kamera."
    );
});


/* =========================
   CROP SELECTION
   ========================= */

function getPointerPosition(event) {

    const rect =
        cropArea.getBoundingClientRect();

    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}


function beginCrop(event) {

    event.preventDefault();

    const target =
        event.target;

    if (
        target.classList.contains(
            "crop-handle"
        )
    ) {

        dragMode =
            target.classList.contains(
                "top-left"
            )
                ? "top-left"
                : target.classList.contains(
                    "top-right"
                )
                    ? "top-right"
                    : target.classList.contains(
                        "bottom-left"
                    )
                        ? "bottom-left"
                        : "bottom-right";

    } else {

        dragMode = "move";
    }

    const position =
        getPointerPosition(event);

    const selection =
        cropSelection.getBoundingClientRect();

    const area =
        cropArea.getBoundingClientRect();

    startX = position.x;
    startY = position.y;

    startLeft =
        selection.left - area.left;

    startTop =
        selection.top - area.top;

    startWidth =
        selection.width;

    startHeight =
        selection.height;

    dragging = true;

    cropSelection.setPointerCapture(
        event.pointerId
    );
}


function moveCrop(event) {

    if (!dragging) {
        return;
    }

    event.preventDefault();

    const position =
        getPointerPosition(event);

    const dx =
        position.x - startX;

    const dy =
        position.y - startY;

    const areaWidth =
        cropArea.clientWidth;

    const areaHeight =
        cropArea.clientHeight;

    const minimumSize = 40;

    let left = startLeft;
    let top = startTop;

    let width = startWidth;
    let height = startHeight;


    if (dragMode === "move") {

        left =
            Math.max(
                0,
                Math.min(
                    areaWidth - width,
                    startLeft + dx
                )
            );

        top =
            Math.max(
                0,
                Math.min(
                    areaHeight - height,
                    startTop + dy
                )
            );
    }


    if (dragMode === "top-left") {

        left =
            Math.max(
                0,
                Math.min(
                    startLeft + startWidth - minimumSize,
                    startLeft + dx
                )
            );

        top =
            Math.max(
                0,
                Math.min(
                    startTop + startHeight - minimumSize,
                    startTop + dy
                )
            );

        width =
            startWidth +
            (startLeft - left);

        height =
            startHeight +
            (startTop - top);
    }


    if (dragMode === "top-right") {

        top =
            Math.max(
                0,
                Math.min(
                    startTop + startHeight - minimumSize,
                    startTop + dy
                )
            );

        width =
            Math.max(
                minimumSize,
                Math.min(
                    areaWidth - startLeft,
                    startWidth + dx
                )
            );

        height =
            startHeight +
            (startTop - top);
    }


    if (dragMode === "bottom-left") {

        left =
            Math.max(
                0,
                Math.min(
                    startLeft + startWidth - minimumSize,
                    startLeft + dx
                )
            );

        width =
            startWidth +
            (startLeft - left);

        height =
            Math.max(
                minimumSize,
                Math.min(
                    areaHeight - startTop,
                    startHeight + dy
                )
            );
    }


    if (dragMode === "bottom-right") {

        width =
            Math.max(
                minimumSize,
                Math.min(
                    areaWidth - startLeft,
                    startWidth + dx
                )
            );

        height =
            Math.max(
                minimumSize,
                Math.min(
                    areaHeight - startTop,
                    startHeight + dy
                )
            );
    }


    cropSelection.style.left =
        `${left}px`;

    cropSelection.style.top =
        `${top}px`;

    cropSelection.style.width =
        `${width}px`;

    cropSelection.style.height =
        `${height}px`;
}


function endCrop() {

    dragging = false;
}


cropSelection.addEventListener(
    "pointerdown",
    beginCrop
);

cropSelection.addEventListener(
    "pointermove",
    moveCrop
);

cropSelection.addEventListener(
    "pointerup",
    endCrop
);

cropSelection.addEventListener(
    "pointercancel",
    endCrop
);


/* =========================
   CREATE CROPPED IMAGE
   ========================= */

cropButton.addEventListener("click", () => {

    const image =
        previewImage;

    if (!image.naturalWidth) {

        alert(
            "Piksa i no redi yet."
        );

        return;
    }

    const imageRect =
        image.getBoundingClientRect();

    const selectionRect =
        cropSelection.getBoundingClientRect();


    const scaleX =
        image.naturalWidth /
        imageRect.width;

    const scaleY =
        image.naturalHeight /
        imageRect.height;


    let sourceX =
        (selectionRect.left -
            imageRect.left) *
        scaleX;

    let sourceY =
        (selectionRect.top -
            imageRect.top) *
        scaleY;

    let sourceWidth =
        selectionRect.width *
        scaleX;

    let sourceHeight =
        selectionRect.height *
        scaleY;


    sourceX =
        Math.max(
            0,
            Math.min(
                sourceX,
                image.naturalWidth
            )
        );

    sourceY =
        Math.max(
            0,
            Math.min(
                sourceY,
                image.naturalHeight
            )
        );

    sourceWidth =
        Math.min(
            sourceWidth,
            image.naturalWidth - sourceX
        );

    sourceHeight =
        Math.min(
            sourceHeight,
            image.naturalHeight - sourceY
        );


    cropCanvas.width =
        Math.round(sourceWidth);

    cropCanvas.height =
        Math.round(sourceHeight);


    const context =
        cropCanvas.getContext("2d");

    context.drawImage(
        image,
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


    preview.classList.remove(
        "active"
    );

    croppedPreview.classList.add(
        "active"
    );


    console.log(
        "Code i crop pinis."
    );
});


/* =========================
   CROP AGAIN
   ========================= */

backToCropButton.addEventListener(
    "click",
    () => {

        croppedPreview.classList.remove(
            "active"
        );

        preview.classList.add(
            "active"
        );

        console.log(
            "Go bek long crop."
        );
    }
);


/* =========================
   RAPIDOCR INITIALIZATION
   ========================= */

function dumpErrorDetails(err) {
    try {
        console.error("---- begin error dump ----");
        console.error("Error constructor name:", err?.constructor?.name);
        console.error("Error name:", err?.name);
        console.error("Error message:", err?.message);
        console.error("Error stack:", err?.stack);
        try {
            console.error("JSON.stringify(err):", JSON.stringify(err));
        } catch (e) {
            console.error("Could not stringify err:", e);
        }
        const props = Object.getOwnPropertyNames(err || {}).concat(Object.keys(err || {}));
        for (const p of [...new Set(props)]) {
            try {
                console.error(`err[${p}] =`, err[p]);
            } catch (e) {
                console.error(`err[${p}] read failed:`, e);
            }
        }
        console.error("---- end error dump ----");
    } catch (e) {
        console.error("Failed to dump error details:", e);
    }
}

async function initializeOCR() {
    if (rapidOCRReady) return;

    console.log("RapidOCR i load...");
    ocrStatus.textContent = "RapidOCR i load...";

    try {
        if (typeof window.createRapidOCREngine !== "function") {
            // Try multiple CDNs (prefer jsDelivr which usually provides CORS headers for modules)
            async function loadRapidOCRModule() {
                const candidates = [
                    "https://cdn.jsdelivr.net/npm/client-side-ocr@2.1.0/dist/index.mjs",
                    "https://unpkg.com/client-side-ocr@2.1.0/dist/index.mjs"
                ];

                const timeoutMs = 30000;

                for (const url of candidates) {
                    try {
                        const module = await Promise.race([
                            import(url),
                            new Promise((_, reject) =>
                                setTimeout(() => reject(new Error(`Module import timed out after ${timeoutMs}ms: ${url}`)), timeoutMs)
                            )
                        ]);

                        if (module && typeof module.createRapidOCREngine === "function") {
                            return module.createRapidOCREngine;
                        } else {
                            console.warn(`Module loaded from ${url} but did not export createRapidOCREngine`);
                        }
                    } catch (err) {
                        console.warn(`Import from ${url} failed:`, err);
                        // try next candidate
                    }
                }

                throw new Error("All RapidOCR module import attempts failed (CORS/network). Consider vendoring the library or hosting it same-origin.");
            }

            try {
                const createFn = await loadRapidOCRModule();
                window.createRapidOCREngine = createFn;
            } catch (impErr) {
                dumpErrorDetails(impErr);
                throw new Error("RapidOCR module import failed: " + (impErr?.message || String(impErr)));
            }
        }

        console.log("RapidOCR module loaded.");

        rapidOCR = window.createRapidOCREngine({
            language: "en",
            modelVersion: "PP-OCRv4",
            modelType: "mobile"
        });

        console.log("RapidOCR engine created, calling initialize()...");

        try {
            await rapidOCR.initialize();
        } catch (initErr) {
            // This is the important failure: likely failed to fetch/instantiate models or WASM
            dumpErrorDetails(initErr);
            throw new Error("RapidOCR initialize failed: " + (initErr?.message || String(initErr)));
        }

        rapidOCRReady = true;
        console.log("RapidOCR i redi.");
        ocrStatus.textContent = "RapidOCR i redi.";

    } catch (error) {
        console.error("RapidOCR initialization error:", error);
        dumpErrorDetails(error);
        ocrStatus.textContent = "RapidOCR i no inap load: " + (error?.message || String(error));
        throw error;
    }
}


/* =========================
   OCR - TESSERACT
   ========================= */

/*
 * Upscale the cropped image before OCR.
 *
 * Tesseract performs much better when small digits
 * have more pixels to work with.
 */

function upscaleCanvas(sourceCanvas, scale = 3) {

    const canvas =
        document.createElement("canvas");

    canvas.width =
        sourceCanvas.width * scale;

    canvas.height =
        sourceCanvas.height * scale;

    const context =
        canvas.getContext("2d");

    /*
     * Keep the original pixels sharp.
     */

    context.imageSmoothingEnabled = false;

    context.drawImage(
        sourceCanvas,
        0,
        0,
        canvas.width,
        canvas.height
    );

    return canvas;
}


ocrButton.addEventListener(
    "click",
    async () => {

        console.log("OCR i stat.");

        if (
            !cropCanvas.width ||
            !cropCanvas.height
        ) {

            alert(
                "No gat crop image."
            );

            return;
        }

        ocrButton.disabled = true;

        ocrStatus.textContent =
            "OCR i wok...";

        ocrResult.value = "";

        console.log(
            "Original OCR input:",
            `${cropCanvas.width} × ${cropCanvas.height}px`
        );

        try {

            /*
             * Upscale the image 3×.
             */

            const ocrImage =
                upscaleCanvas(
                    cropCanvas,
                    3
                );

            console.log(
                "Upscaled OCR input:",
                `${ocrImage.width} × ${ocrImage.height}px`
            );

            /*
             * Send the enlarged image to Tesseract.
             */

            const result =
                await Tesseract.recognize(
                    ocrImage,
                    "eng",
                    {
                        logger: message => {

                            console.log(
                                "OCR:",
                                message
                            );

                            if (
                                message.status ===
                                "recognizing text"
                            ) {

                                const percent =
                                    Math.round(
                                        message.progress * 100
                                    );

                                ocrStatus.textContent =
                                    `OCR i wok... ${percent}%`;
                            }
                        }
                    }
                );


            /*
             * Get the raw OCR result.
             */

            const rawText =
                result.data.text;

            console.log(
                "OCR raw result:",
                rawText
            );


            /*
             * Flex codes are numbers.
             *
             * Remove everything except digits.
             */

            const text =
                rawText.replace(
                    /\D/g,
                    ""
                );

            console.log(
                "Cleaned OCR result:",
                text
            );


            if (!text) {

                ocrStatus.textContent =
                    "OCR i no painim code.";

                console.warn(
                    "OCR completed but found no digits."
                );

                return;
            }


            /*
             * Put the cleaned number into
             * the result field.
             */

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
                "OCR error:",
                error
            );

            ocrStatus.textContent =
                "OCR i gat problem.";

            alert(
                "OCR i no inap wok."
            );

        } finally {

            ocrButton.disabled = false;
        }
    }
);


/* =========================
   CONFIRM OCR
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


        console.log(
            "Confirmed Flex code:",
            code
        );


        /*
         * USSD will eventually happen here.
         */

        alert(
            `Flex code: ${code}`
        );
    }
);
