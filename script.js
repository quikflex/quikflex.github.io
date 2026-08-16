import { PaddleOCR } from "@paddleocr/paddleocr-js";


/* =========================
   ELEMENTS
   ========================= */

const video =
    document.getElementById("camera");

const captureButton =
    document.getElementById("captureButton");

const canvas =
    document.getElementById("captureCanvas");

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


async function startCamera() {

    console.log(
        "Statim kamera..."
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


/*
 * Start camera automatically
 * when QuikScan opens.
 */

startCamera();


/* =========================
   CAPTURE
   ========================= */

captureButton.addEventListener(
    "click",
    async () => {

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


        console.log(
            "Piksa i kisim pinis."
        );


        try {

            /*
             * Automatically crop the
             * area inside the viewfinder.
             */

            createFrameCrop();


            /*
             * Hide the capture button
             * while OCR is running.
             */

            captureButton.style.display =
                "none";


            /*
             * Show the OCR/confirmation
             * screen immediately.
             */

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

            /*
             * Worker disabled because it
             * caused "OCR worker failed".
             */

            worker: false,

            ortOptions: {
                backend: "wasm",

            wasmPaths: {
                mjs: "/ocr/wasm/ort-wasm-simd-threaded.mjs",
                wasm: "/ocr/wasm/ort-wasm-simd-threaded.wasm"
},

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
     * Reproduce that calculation
     * against the captured image.
     */


    const videoRect =
        video.getBoundingClientRect();


    const frame =
        document.querySelector(
            ".scan-frame"
        );


    if (!frame) {

        throw new Error(
            "Scan frame i no stap."
        );
    }


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
     * original camera coordinates.
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


        ocrStatus.textContent =
            `${carrier} detected.`;

        confirmButton.disabled =
            true;


        /*
         * # must be URL encoded.
         */

        const telURI =
            `tel:${ussd.replace(
                "#",
                "%23"
            )}`;


        window.location.href =
            telURI;


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
