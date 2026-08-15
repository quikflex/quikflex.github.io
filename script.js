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


    /*
     * Work out where the selection
     * sits relative to the displayed image.
     */

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


    /*
     * Keep crop inside the image.
     */

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
