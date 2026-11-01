# FormPilot AI

Privacy-first browser extension that explains Indian government forms and suggests
values from your own documents. You review every value; you submit the form.

## Run the extension (dev)

```bash
npm install
npm run dev            # Vite dev server with HMR for the extension
```

1. Open `edge://extensions`, turn on **Developer mode**.
2. **Load unpacked** and choose `extension/dist`.
3. In another terminal run `npm run fixtures` and open http://localhost:5500
4. Click the FormPilot toolbar icon, then **Check this page**.
   You should see 1 form and 6 input fields on the fixture page.

## Production build

```bash
npm run build          # outputs extension/dist
```

## Layout

See `docs/` (to be filled) and the folder structure in the project plan.
