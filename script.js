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
