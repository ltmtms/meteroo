# meteroo

Warm, simple **Mentimeter-style** live interactions for the classroom — word clouds, short answers, and multiple-choice votes. Static React app on **GitHub Pages** with **Firebase Realtime Database** for multi-device sync.

**Live site:** [https://ltmtms.github.io/meteroo/](https://ltmtms.github.io/meteroo/)

| Route | Purpose |
|-------|---------|
| [`/`](https://ltmtms.github.io/meteroo/) | Home — links to all modes |
| [`/admin`](https://ltmtms.github.io/meteroo/admin) | Presenter — create room, edit slides, advance, preview results |
| [`/start`](https://ltmtms.github.io/meteroo/start) | Participants — join with room code, answer current slide |
| [`/show`](https://ltmtms.github.io/meteroo/show) | Projector — fullscreen live results for the current slide |

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in Firebase web config (not committed)
npm run dev
```

Open [http://localhost:5173/meteroo/](http://localhost:5173/meteroo/) (Vite uses the `/meteroo/` base path).

```bash
npm run build   # output in dist/
npm run preview # serve production build locally
```

## Firebase setup (required for phones + projector on different devices)

Without Firebase env vars, the app runs in **demo mode**: session data is stored in **localStorage** in one browser only.

1. Create a [Firebase](https://console.firebase.google.com/) project.
2. Enable **Anonymous** sign-in: Authentication → Sign-in method → Anonymous → Enable.
3. Create a **Realtime Database** (not Firestore), region as needed (e.g. Singapore).
4. Register a **Web app** and add the config as **GitHub Actions secrets** (for Pages deploy) and/or a local **`.env.local`** (gitignored).

| Variable | Example |
|----------|---------|
| `VITE_FIREBASE_API_KEY` | `AIza…` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` |
| `VITE_FIREBASE_DATABASE_URL` | `https://your-project-default-rtdb…firebasedatabase.app` |
| `VITE_FIREBASE_PROJECT_ID` | `your-project` |
| `VITE_FIREBASE_APP_ID` | `1:123…:web:abc…` |

**GitHub Pages:** add all five names under repo **Settings → Secrets and variables → Actions**. The deploy workflow requires them (no committed `.env.production`).

**Optional — push secrets from your machine:**

```bash
cp .env.example .env.local   # fill values locally, never commit
./scripts/set-github-firebase-secrets.sh
```

The Firebase **web API key is public** in the built JS — protect data with **Security Rules** (below), not by hiding the key. In [Google Cloud Console](https://console.cloud.google.com/), restrict the Browser key by HTTP referrer to your Pages origin(s) (e.g. `https://ltmtms.github.io/*`).

### Deploy Realtime Database rules

Rules live in [`database.rules.json`](database.rules.json). They must be **published to Firebase** or the console defaults may still allow hijacking.

**Stephen / ops — deploy after every rules change:**

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only database --project meteroo-6be7e
```

Or add repository secret `FIREBASE_TOKEN` from `firebase login:ci`, then run the **Deploy Firebase RTDB rules** workflow (`.github/workflows/deploy-firebase-rules.yml`).

### Security model (rules summary)

- **Read:** `sessions/{code}` is world-readable so Show/Start/Admin can subscribe without extra auth (see residual risk below).
- **Session control** (`slides`, `currentSlideIndex`, `createdAt`, initial create): only `auth.uid == adminUid` (set when the teacher creates the room via anonymous auth).
- **Responses:** participants may **create** their own word/short entries (`uid` must match); **votes** only under `votes/{theirUid}`; presenters may **delete** response entries when resetting a slide (same `adminUid`).
- **Anonymous auth** stays enabled for audience join; strangers cannot overwrite session structure or others’ votes.

**Residual risk:** Room codes are short (~33M combinations) — guessing a active code still allows **reading** that session’s data. Writes are protected by rules above. For higher secrecy, use longer codes or authenticated presenters only (future work).

### Data shape

```
/sessions/{ROOMCODE}/
  adminUid, currentSlideIndex, createdAt
  slides: [ { id, type, prompt, options? } ]
  responses/{slideIndex}/
    words/{pushId}: { text, nickname?, uid, at }
    shorts/{pushId}: { text, nickname?, uid, at }
    votes/{uid}: { optionIndex, at }
```

Room codes are 5 characters from `23456789ABCDEFGHJKLMNPQRSTUVWXYZ` (no `O` / `I`).

## How to run a session (teacher flow)

1. Open **[Admin](https://ltmtms.github.io/meteroo/admin)** → add slides → **Create new room** (same browser keeps your anonymous `adminUid`). Note the **room code**.
2. Open **Show** on the projector (`/show?code=…`).
3. Students use **Start** with the code (QR on Show).
4. **Prev / Next** or slide tabs change `currentSlideIndex` for everyone.
5. **Reset responses (this slide)** clears answers for the current slide only.

## Tech

- Vite + React + TypeScript, `react-router-dom` with `basename="/meteroo"`
- Firebase Realtime Database + anonymous auth
- GitHub Actions → deploy Pages + optional rules deploy

## License

MIT (or your choice — add a LICENSE file if needed).
