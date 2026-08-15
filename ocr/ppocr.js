import { PaddleOCR } from "@paddleocr/paddleocr-js";

let paddleOCR = null;

async function getPaddleOCR() {
    if (paddleOCR) {
        return paddleOCR;
    }

    console.log("PaddleOCR: loading...");

    paddleOCR = await PaddleOCR.create({
        textDetectionModelName: "PP-OCRv6_tiny_det",

        textDetectionModelAsset: {
            url: "/ocr/ppocrv6-tiny-det.tar"
        },

        textRecognitionModelName: "PP-OCRv6_tiny_rec",

        textRecognitionModelAsset: {
            url: "/ocr/ppocrv6-tiny-rec.tar"
        },

        ortOptions: {
            backend: "wasm"
        }
    });

    console.log("PaddleOCR: ready.");

    return paddleOCR;
}

export async function runPPOCR(canvas) {
    const ocr = await getPaddleOCR();

    const [result] = await ocr.predict(canvas);

    console.log("PaddleOCR result:", result);

    return result;
}
