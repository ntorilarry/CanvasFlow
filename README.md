# Canvas Studio

A canvas application with **PDF viewing**, a **Pin tool** for attaching and grouping shapes, and a **Camera tool** for cropping and exporting regions as images. Built with Next.js, React 19, and [tldraw](https://tldraw.dev).

---

## Features

- **PDF viewer** – Load and view PDFs in a resizable panel (desktop) or stacked layout (mobile).
- **Drawing canvas** – Full tldraw canvas: shapes, arrows, text, draw, frames, and default tools.
- **Pin tool** – Place a pin on one or more shapes so they move together; the pin moves with them.
- **Camera tool** – Drag to define a crop area, then export that region as PNG or JPEG (download or copy to clipboard).
- **Responsive layout** – Desktop: side-by-side PDF + canvas with resizable divider; mobile: canvas first, optional PDF panel on top.

---

## Tech Stack

| Category        | Technology                          |
|----------------|-------------------------------------|
| Framework      | Next.js 16 (App Router)             |
| UI             | React 19, Tailwind CSS 4            |
| Canvas         | tldraw ^3                           |
| PDF            | react-pdf ^9                        |
| Icons          | react-icons (fi, fa6)               |
| Dialogs        | @headlessui/react                   |
| Toasts         | react-hot-toast                     |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm (or yarn / pnpm / bun)

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app loads with the PDF panel (desktop) or canvas only (mobile); use the top-left button to toggle the PDF panel.

### Build

```bash
npm run build
```

### Production

```bash
npm run start
```

### Lint

```bash
npm run lint
```

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout, metadata, fonts
│   ├── page.tsx             # Home: PDF + canvas layout, mobile detection, resize
│   └── globals.css          # Global styles
├── components/
│   ├── canvas/
│   │   ├── TldrawCanvas.tsx # Tldraw wrapper, custom tools, ExportDialog, shortcuts
│   │   └── CustomToolbar.tsx # Pin + Camera toolbar (top center)
│   ├── pdf/
│   │   ├── PdfViewer.tsx    # PDF document + controls
│   │   ├── PdfControls.tsx  # Zoom, page nav
│   │   └── PdfPage.tsx      # Single page render
│   ├── tools/
│   │   ├── pin/
│   │   │   ├── PinTool.ts         # Tool: place pin, create bindings
│   │   │   ├── PinShapeUtil.tsx   # Pin shape (looks like a pin)
│   │   │   └── PinBindingUtil.ts  # Binding: move group + pin when one shape moves
│   │   └── camera/
│   │       ├── CameraTool.ts      # Tool: drag to create crop rectangle
│   │       ├── CameraShapeUtil.tsx# Camera/crop shape UI
│   │       └── ExportDialog.tsx   # Export crop as PNG/JPEG, download or clipboard
│   └── Toaster.tsx          # react-hot-toast Toaster (used in layout)
├── hooks/
│   └── use-toast.ts         # Re-exports toast from react-hot-toast
└── lib/
    ├── utils.ts             # cn() etc.
    └── slot.tsx             # Slot component (optional)
```

---

## Documentation

### Layout

- **Desktop (≥768px):** PDF panel on the left (resizable 300–600px), canvas on the right. Drag the vertical divider to resize. Button top-left on canvas toggles PDF panel (collapse/expand).
- **Mobile (&lt;768px):** Column layout. Canvas is default; button top-left opens PDF in a top strip (40vh) so both are visible. PDF panel state defaults to collapsed so the canvas is visible first.

### Pin Tool

- **Purpose:** Attach a pin to one or more shapes so that when you move any of them, the rest of the group and the pin move together.
- **Usage:**
  1. Select the Pin tool from the custom toolbar (top center) or press **P**.
  2. Click on the canvas where you want the pin. If there are shapes under the click:
     - **One shape:** A binding links that shape to itself; moving the shape moves the pin.
     - **Two or more overlapping shapes:** Bindings link every pair; moving any shape moves the others and the pin.
  3. The tool switches back to Select after placing the pin.
- **Behavior:**
  - Pin shape is a red “push pin” (PinShapeUtil). It does not resize; it’s visual only.
  - Bindings are `pin-binding` with a shared `pinId`. PinBindingUtil runs when any bound shape moves: it computes the delta and, in a deferred step, updates all other shapes in the group and the pin by the same amount (via `editor.run()` and `requestAnimationFrame` to avoid re-entrancy in store sideEffects).
- **Files:** `PinTool.ts`, `PinShapeUtil.tsx`, `PinBindingUtil.ts`.

### Camera Tool

- **Purpose:** Define a rectangular crop area on the canvas and export that region as an image (PNG or JPEG).
- **Usage:**
  1. Select the Camera tool from the custom toolbar or press **C**.
  2. Drag on the canvas to draw the crop rectangle. Release to confirm.
  3. The Export dialog opens if the rectangle is large enough. Choose format (PNG/JPEG), optional quality (JPEG), and filename, then:
     - **Download** – save the image file.
     - **Copy to Clipboard** – copy the image for pasting elsewhere.
  4. After export (or on cancel), the camera shape is removed and the tool returns to Select.
- **Behavior:**
  - Export uses `editor.toImage()` with the crop `bounds`, so the image matches the selected region (padding 0, background included). If there are no shapes in the crop, the dialog explains that the area is empty.
- **Files:** `CameraTool.ts`, `CameraShapeUtil.tsx`, `ExportDialog.tsx`. TldrawCanvas listens for the `camera-capture-complete` custom event to open the dialog.

### PDF Viewer

- **Purpose:** Load and view a PDF in a side panel (desktop) or top strip (mobile).
- **Behavior:** Uses `react-pdf` to render pages. PdfViewer handles document loading and page list; PdfControls provide zoom and page navigation. The viewer is in a resizable panel (desktop) or fixed-height strip (mobile).

### Custom Toolbar

- Rendered above the canvas (top center), outside tldraw’s default toolbar. Shows only **Pin** and **Camera**.
- Pin icon: red map pin (`FaMapPin` from `react-icons/fa6`). Camera icon: `FiCamera`.
- Uses the editor instance passed from TldrawCanvas (not tldraw context) so clicks reliably switch tools. Current tool is highlighted (blue when selected).

### Toasts

The app uses [react-hot-toast](https://react-hot-toast.com/). The `<Toaster />` is rendered in the root layout (bottom-right). To show a toast from anywhere:

```ts
import toast from 'react-hot-toast'
// or
import { toast } from '@/hooks/use-toast'

toast('Message')
toast.success('Saved')
toast.error('Something went wrong')
```

### Keyboard Shortcuts

| Key | Action              | Note                          |
|-----|---------------------|-------------------------------|
| **P** | Switch to Pin tool   | —                             |
| **C** | Switch to Camera tool| Ignored when focus is in input/textarea |

All other shortcuts are tldraw’s defaults (Select, Draw, shapes, etc.) in the bottom toolbar.

### tldraw Integration

- **Custom tools:** `PinTool`, `CameraTool` (passed as `tools` to `<Tldraw>`).
- **Custom shapes:** `PinShapeUtil`, `CameraShapeUtil` (passed as `shapeUtils`).
- **Custom bindings:** `PinBindingUtil` (passed as `bindingUtils`).
- **Components:** `Toolbar` is overridden to `DefaultToolbar`; the Pin/Camera bar is rendered separately so the default bottom toolbar (and thus the full tldraw UI) is preserved.

---

## Environment

No environment variables are required for basic run/build. Add a `.env.local` if you introduce API keys or feature flags.

---

## License

Private. See repository or team for terms.
