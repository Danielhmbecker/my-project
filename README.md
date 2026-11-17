# Taproom — pub stock management

A phone-first stock-take app for a pub back bar, built with Expo + React Native (TypeScript).

## What it does
- **Count** — go bottle by bottle through the back bar (32 bottles, 4 shelves). Drag the brass line on the gauge to set how full the bottle is (0–10); the readout shows tenths and approx ml remaining. **Lock In** saves the count and moves to the next bottle.
- **Log waste** — record spillage, breakage, over-pours, out-of-date or comps, with the amount in ml.
- **Overview** (list icon, top right) — counted progress, litres on hand, stock value at cost, a reorder list (bottles at 2/10 or below) and the waste log. "New stock-take" clears counts.
- **Works offline** — everything is saved on the device (AsyncStorage).

## Run it
```
npm install
npm start          # scan the QR code with Expo Go
npm run web        # or open in the browser
```

## Where things are
- `App.tsx` – entry, renders `src/pub/PubApp`
- `src/pub/data.ts` – the bottle list (edit this to match your own back bar)
- `src/pub/` – gauge, bottle drawing, screens, storage
- `ArenaApp.tsx` + `src/screens`, … – the earlier ARENA STUDIO app, kept but unused
