<img width="250" height="250" alt="QuikFlex PNG" src="https://github.com/user-attachments/assets/6d03f8b6-2765-470f-acc2-e3dcc307342f" />

# QuikFlex PNG

[Visit the app here](https://quikflex.github.io)

QuikFlex is an offline-first Progressive Web App (PWA) for scanning mobile recharge vouchers in Papua New Guinea.

It uses camera-based image capture, Optical Character Recognition (OCR), automatic carrier detection, and automatic USSD to make voucher recharging faster and easier.

***QuikFlex does not store any voucher codes in the app or on our servers. The app uses on-device AI technologies to read the digits, and no voucher codes are sent anywhere.***

## Features

- Camera-based voucher scanning
- Automatic viewfinder cropping
- PaddleOCR-powered voucher number recognition
- Automatic Digicel and Vodafone detection
- Automatic OCR cleanup for numeric voucher codes
- USSD dialer integration
- Progressive Web App support
- Offline OCR support
- Locally hosted OCR models
- Locally hosted ONNX Runtime WebAssembly files
- No account required
- No backend server required

## How It Works

1. Open QuikFlex.
2. Allow camera access.
3. Point the camera at the voucher.
4. Capture the voucher.
5. QuikFlex automatically crops the viewfinder area.
6. PaddleOCR extracts the voucher number.
7. QuikFlex determines the carrier from the voucher length.
8. Confirm the detected number.
9. QuikFlex opens the phone's dialer with the appropriate USSD code.

## Offline Support

QuikFlex is designed to work without an internet connection after its required assets have been cached.

A service worker caches the application's required files, including:

- Application files
- JavaScript bundle
- PaddleOCR models
- ONNX Runtime WebAssembly files
- PWA assets

The OCR models and ONNX Runtime files are hosted directly by QuikFlex rather than being loaded from an external CDN.

Once the application has been loaded and cached, the scanning and OCR process can operate without an internet connection.

The final USSD request is handled by the device's cellular network and does not require QuikFlex to have an internet connection.

## Technologies

- HTML
- CSS
- JavaScript
- PaddleOCR.js
- PP-OCRv6
- ONNX Runtime Web
- WebAssembly
- Progressive Web App APIs
- Service Workers
- GitHub Pages
- GitHub Actions
- esbuild

## OCR

QuikFlex uses PaddleOCR with the PP-OCRv6 tiny detection and recognition models.

The OCR models are hosted locally within the repository:

```text
ocr/
├── ppocrv6-tiny-det.tar
├── ppocrv6-tiny-rec.tar
├── det/
│   ├── inference.onnx
│   └── inference.yml
└── rec/
    ├── inference.onnx
    └── inference.yml
```

ONNX Runtime WebAssembly files are also hosted locally:

```text
ocr/wasm/
├── ort-wasm-simd-threaded.mjs
└── ort-wasm-simd-threaded.wasm
```

This removes the runtime dependency on an external CDN for OCR execution.

## Supported Vouchers

QuikFlex currently identifies carriers based on voucher number length.

| Carrier | Voucher Length |
| --- | ---: |
| Digicel | 13 digits |
| Vodafone | 15 digits |

The detected voucher number is then passed to the appropriate USSD flow.

## Project Structure

```text
/
├── index.html
├── style.css
├── script.js
├── script.bundle.js
├── service-worker.js
├── package.json
├── ocr/
│   ├── ppocrv6-tiny-det.tar
│   ├── ppocrv6-tiny-rec.tar
│   ├── ppocr.js
│   ├── det/
│   │   ├── inference.onnx
│   │   └── inference.yml
│   ├── rec/
│   │   ├── inference.onnx
│   │   └── inference.yml
│   └── wasm/
│       ├── ort-wasm-simd-threaded.mjs
│       └── ort-wasm-simd-threaded.wasm
└── images/
    ├── favicon-96x96.png
    ├── favicon.svg
    ├── favicon.ico
    ├── apple-touch-icon.png
    └── site.webmanifest
```

## Development

Install dependencies:

```bash
npm install
```

Build the JavaScript bundle:

```bash
npx esbuild script.js --bundle --format=esm --outfile=script.bundle.js
```

The generated `script.bundle.js` is deployed to GitHub Pages.

## Roadmap

- [x] Implement Camera
- [x] Implement Image Capture
- [x] Implement Automatic Viewfinder Cropping
- [x] Implement OCR
- [x] Clean up OCR
- [x] Implement Automatic Vodafone & Digicel Detection
- [x] Implement USSD
- [x] Make more convenient (minimize amount of clicks)
- [x] Local OCR Models
- [x] Local ONNX Runtime
- [x] Offline Support
- [x] PWA Support
- [ ] Bmobile support
- [ ] Easipay support
- [ ] Optimize for PNG budget phones
- [ ] Make app prettier

## Version

**QuikFlex v1.0**

QuikFlex v1 focuses on making voucher scanning and recharging as fast and simple as possible while remaining functional offline.


