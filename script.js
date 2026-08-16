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

const cropArea =
    document.getElementById("cropArea");

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

        previewImage.src =
            canvas.toDataURL(
                "image/jpeg",
                0.95
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


async function getPaddleOCR() {

    if (paddleOCR) {
        return paddleOCR;
    }

    console.log(
        "PaddleOCR i load..."
    );

    ocrStatus.textContent =
        "OCR i load...";


    paddleOCR =
        await PaddleOCR.create({

            textDetectionModelName:
                "PP-OCRv6_tiny_det",

            textRecognitionModelName:
                "PP-OCRv6_tiny_rec",

            // run WITHOUT a web worker to avoid "OCR worker failed" errors
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

    return paddleOCR;
}


/* =========================
   AUTOMATIC FRAME CROP
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


    const imageRect =
        previewImage.getBoundingClientRect();

    const frameRect =
        cropArea.getBoundingClientRect();


    const scaleX =
        canvas.width /
        imageRect.width;

    const scaleY =
        canvas.height /
        imageRect.height;


    let sourceX =
        (frameRect.left -
            imageRect.left) *
        scaleX;

    let sourceY =
        (frameRect.top -
            imageRect.top) *
        scaleY;

    let sourceWidth =
        frameRect.width *
        scaleX;

    let sourceHeight =
        frameRect.height *
        scaleY;


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
        "Automatic frame crop:",
        `${cropCanvas.width} × ${cropCanvas.height}px`
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

        const ocr =
            await getPaddleOCR();


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
