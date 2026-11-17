# Deployment Guide — Backend: Render, Frontend: Firebase (dono free)

| Part | Kahan | Free limit |
|---|---|---|
| Backend (Express + Socket.IO) | Render Web Service | 750 hrs/month; 15 min idle ke baad so jata hai |
| Frontend (Vite React) | Firebase Hosting (Spark plan) | 10 GB storage, 360 MB/day transfer |
| Database | MongoDB Atlas M0 | 512 MB |
| Images | Cloudinary | 25 credits/month |
| AI Assistant | Google Gemini API | Free tier, rate-limited |

**Order zaroori hai:** pehle backend deploy karo (uska URL frontend ko chahiye), phir frontend,
phir backend me frontend ka URL daalo.

---

## Step 0 — Accounts aur keys taiyar karo

### MongoDB Atlas
1. https://cloud.mongodb.com → free **M0** cluster banao (region: Mumbai/Singapore).
2. **Database Access** → naya user (username + strong password).
3. **Network Access** → **Add IP Address** → `0.0.0.0/0` (Render ke IP fixed nahi hote).
4. **Connect → Drivers** → connection string copy karo aur `<password>` replace karo, DB name add karo:
   `mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/aptitudeDB?retryWrites=true&w=majority`

> AWS wala purana Atlas cluster abhi bhi hai to wahi string use kar sakte ho — data waisa hi rahega.

**Local data Atlas par le jana ho to** (MongoDB Database Tools install karke):
```bash
mongodump --uri="mongodb://127.0.0.1:27017/aptitudeDB" --out=./dump
mongorestore --uri="mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net" ./dump
```

### Cloudinary
https://cloudinary.com → Dashboard se **Cloud name**, **API key**, **API secret** copy karo.
> Render free tier ki disk har restart/deploy par saaf hoti hai. Cloudinary ke bina uploaded
> question/profile images gayab ho jayengi.

### Gemini
https://aistudio.google.com/apikey → **Create API key**. (Purani key jo `test-*.js` files me
hardcoded thi, use mat lagao — nayi banao.)

---

## Step 1 — Code GitHub par push karo

Render GitHub se code uthata hai. Project root me:

```bash
# Sirf project ke tracked changes + nayi deployment files add karo
git add -u
git add render.yaml DEPLOYMENT.md backend/.env.example frontend/firebase.json
git status          # check: koi .env ya test-*.js file staged na ho
git commit -m "Prepare for Render (backend) + Firebase (frontend) deployment"
git push origin feature/phase3-express-server
```

> **`git add .` mat chalana** — folder me adhoori Google-login files aur API-key wali
> scratch files hain jo repo me nahi jaani chahiye.

Chaho to GitHub par PR banakar `main` me merge kar do aur Render me `main` branch chuno.

---

## Step 2 — Backend: Render par deploy

### Option A: Blueprint (aasaan)
1. https://dashboard.render.com → **New + → Blueprint**.
2. GitHub repo connect karo → branch chuno → Render `render.yaml` padh lega.
3. Ye values puchega:

   | Key | Value |
   |---|---|
   | `MONGO_URI` | Step 0 wali Atlas string |
   | `CLIENT_URL` | Abhi `http://localhost:5173` daal do — Step 4 me update karenge |
   | `GEMINI_API_KEY` | Gemini key |
   | `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | Cloudinary values |

   `JWT_SECRET` Render khud generate karega.
4. **Apply** → build ~3-5 min.

### Option B: Manual Web Service
**New + → Web Service** → repo chuno, phir:

| Setting | Value |
|---|---|
| Root Directory | `backend` |
| Runtime | Node |
| Build Command | `npm ci --include=dev && npm run build` |
| Start Command | `npm start` |
| Instance Type | **Free** |
| Health Check Path (Advanced) | `/health` |

**Environment** me upar wali table ki keys daalo, plus:
`NODE_ENV=production`, `NODE_VERSION=22`, aur `JWT_SECRET` = lamba random string
(`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`).

### Check karo
Deploy hone par URL milega, jaise `https://aptitude-backend.onrender.com`. Browser me kholo:
```
https://aptitude-backend.onrender.com/health
```
`"success": true` aana chahiye. Logs me `MongoDB Connected Successfully!` dikhna chahiye.

**Common errors:**
- `MongoDB Connection Error` → Atlas Network Access me `0.0.0.0/0` nahi hai, ya password me
  `@ # %` jaise characters hain (URL-encode karo).
- Build me `tsc: not found` → Build Command me `--include=dev` bhool gaye.

---

## Step 3 — Frontend: Firebase Hosting par deploy

### 3.1 Firebase project banao
1. https://console.firebase.google.com → **Add project** → naam do (Google Analytics off kar sakte ho).
2. Plan **Spark (free)** hi rehne do. Billing ki zaroorat nahi.

### 3.2 Firebase CLI install aur login
```bash
npm install -g firebase-tools
firebase login
```
> Windows PowerShell me `running scripts is disabled` error aaye to ek baar chalao:
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` (ya Git Bash / cmd use karo).

### 3.3 Project link karo
```bash
cd frontend
firebase use --add
```
List se apna project chuno, alias me `default` likho. Isse `frontend/.firebaserc` banegi
(`firebase.json` pehle se taiyar hai — **`firebase init` mat chalana**, wo config overwrite kar sakta hai).

### 3.4 Backend URL set karo
`frontend/.env.production` file banao (git me nahi jayegi):
```
VITE_API_BASE_URL=https://aptitude-backend.onrender.com/api
```
> Apna actual Render URL daalo, end me `/api` zaroor lagao. Vite ye value **build time** par
> bake karta hai — URL badle to dobara deploy karna padega.

### 3.5 Deploy
```bash
npm run deploy
```
(Ye `npm run build` + `firebase deploy --only hosting` chalata hai.)

End me URL milega:
```
Hosting URL: https://your-project-id.web.app
```

---

## Step 4 — Backend me frontend ka URL daalo (CORS)

Render Dashboard → backend service → **Environment** → `CLIENT_URL` edit karo:
```
https://your-project-id.web.app,https://your-project-id.firebaseapp.com
```
(Comma se dono Firebase domains, end me `/` nahi.) **Save Changes** → service apne aap redeploy hogi.

> Ye nahi kiya to frontend par login karte waqt **Network Error / CORS error** aayega.

---

## Step 5 — Final testing

1. `https://your-project-id.web.app` kholo. Pehli request par backend jagne me ~50 sec lag sakte hain.
2. Register/login karo.
3. Koi page refresh karo (jaise `/dashboard`) — 404 nahi aana chahiye.
4. Test start karo → camera permission → submit → result.
5. AI Assistant me message bhejo.
6. Admin se question image upload karo → image ka URL `res.cloudinary.com` wala hona chahiye.
7. Admin → Live Proctoring page connect ho raha hai ya nahi.

Pehla admin chahiye to app me register karo, phir Atlas → **Browse Collections → users** me us
user ka `role` `"admin"` kar do.

---

## Aage update kaise karein

| Kya badla | Kya karo |
|---|---|
| Backend code | `git push` — Render auto-deploy karega |
| Frontend code | `cd frontend && npm run deploy` |
| Backend URL | `frontend/.env.production` update → `npm run deploy` |
| Frontend domain | Render me `CLIENT_URL` update |

## Free tier ki limitations

- **Cold start:** backend 15 min idle ke baad so jata hai; pehli request ~50 sec. Frontend ka
  timeout 60 sec rakha hai. Chaho to https://uptimerobot.com se `/health` ko har 10 min ping
  karwa sakte ho (750 hrs/month ek service ke liye kaafi hai).
- **Live proctoring ki active-students list memory me hai** — backend restart par reset hoti hai
  (violations DB me save rehte hain).
- College lab me bahut students ek hi IP se hon aur "Too many requests" aaye to Render me
  `RATE_LIMIT_MAX` badha do (default 500 per 15 min per IP).

## AWS band karna

Sab theek chalne ke baad AWS ka EC2 / Elastic Beanstalk, Elastic IP, Load Balancer aur S3
buckets delete kar do — warna billing chalti rahegi.
