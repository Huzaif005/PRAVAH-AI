# GridMind AI (PRAVAAH) — Smart Energy Microgrid & Demand Forecasting Engine
> **HackSphere 3.0 Official Submission** · Powered by **Zoho Catalyst** & **Zoho Catalyst QuickML**

---

## 1. Project Overview & Architecture

**GridMind AI** is an intelligent microgrid management and demand forecasting platform engineered to predict 24-hour hourly load demands, balance renewable energy distribution, prevent grid collapses, and optimize battery storage (BESS) dispatch schedules.

### Zoho Catalyst Infrastructure Stack:
- **Zoho Catalyst QuickML**: Trains, evaluates, and deploys the demand forecasting regression pipeline (`Pipeline ID: 8481000000002046`).
- **Zoho Catalyst Web Client / AppSail**: Hosts the reactive SCADA operator dashboard and full-stack decision engine.
- **Dynamic Transition Controller**: Evaluates hourly predictions to seamlessly switch between **Main Grid Mode** and **Renewable Storage Mode**, and issues instant **Critical Overload Alerts**.

---

## 2. Zoho Catalyst & QuickML Pipeline Details

| Parameter | Configuration Value |
|---|---|
| **Zoho Catalyst Org ID** | `60093684405` |
| **Project ID** | `99558000000013050` |
| **Environment** | `Development` |
| **QuickML Pipeline ID** | `8481000000002046` |
| **Pipeline Console URL** | [Zoho QuickML Pipeline Details](https://console.catalyst.zoho.in/baas/60093684405/project/99558000000013050/Development#/quickml/pipelines/details/8481000000002046) |
| **QuickML Predict Endpoint** | `https://api.catalyst.zoho.in/baas/v1/project/99558000000013050/quickml/pipelines/8481000000002046/predict` |

---

## 3. Deployment Instructions (Live Catalyst App)

The application includes pre-configured deployment artifacts and scripts for Zoho Catalyst:

### Option A: 1-Click Console Upload (Fastest)

#### 1. Deploy Frontend to Catalyst Web Client Hosting:
1. Open the [Zoho Catalyst Console](https://console.catalyst.zoho.in/baas/60093684405/project/99558000000013050/Development#/hosting).
2. Go to **Hosting** (or **Web Client Hosting**) in the left sidebar.
3. Click **Upload** and upload `catalyst-webclient-deploy.zip` (located in the project root, generated from `dist/`).
4. Catalyst activates your live link:
   ```
   https://<project-domain>.development.catalystserverless.in/app/
   ```

#### 2. Deploy Full-Stack Node.js App to Catalyst AppSail (Alternative):
1. Go to **AppSail** in the left sidebar of the Catalyst Console.
2. Click **Create AppSail**, name it `gridmind`, and choose runtime `Node.js 20`.
3. Upload `catalyst-appsail-deploy.zip` (pre-bundled with `app-config.json` and `server.js`).
4. Catalyst builds and provisions your live AppSail URL:
   ```
   https://gridmind-99558000000013050.development.appsail.run
   ```

---

### Option B: Deploy via Catalyst CLI

```bash
# 1. Install Catalyst CLI
npm install -g zcatalyst-cli

# 2. Login to your Zoho account
catalyst login

# 3. Deploy using the included catalyst.json configuration
catalyst deploy
```

The CLI outputs the live public application URL upon completion.

---

## 4. How to Publish & Link the QuickML Pipeline

1. Open your [QuickML Pipeline Console](https://console.catalyst.zoho.in/baas/60093684405/project/99558000000013050/Development#/quickml/pipelines/details/8481000000002046).
2. If not already published, click **Deploy** / **Publish** on the pipeline details page (or navigate to **Endpoints** → **Create Endpoint** → select Pipeline `8481000000002046`).
3. Copy the generated **Endpoint Key** (`X-QUICKML-ENDPOINT-KEY`).
4. Paste it into `.env` and `quickml_config.json`:
   ```env
   QUICKML_ENDPOINT_KEY=your_copied_endpoint_key_here
   ```
5. Run the evaluation script to verify:
   ```bash
   python test_eval.py
   ```

---

## 5. Transition Controller Logic (HackSphere 3.0 Specs)

The transition controller evaluates hourly forecasted values against microgrid limits:

| Condition | Microgrid State | Action Taken |
|---|---|---|
| Demand **> 160 kW** OR timestamp hour in **18:00 – 22:00** (inclusive) | **Renewable Storage Mode** | BESS discharge initiated, shaving peak grid strain. |
| Demand **$\le$ 160 kW** AND outside 18:00 – 22:00 window | **Main Grid Mode** | Baseload imported from primary feeder lines. |
| Demand **$\ge$ 200 kW** | **Critical Overload Alert** | Independent SCADA alert triggered; automated load shedding recommended. |

---

## 6. Pre-Submission Self-Test (`test_eval.py`)

Run the mandatory contract verification:

```bash
python test_eval.py
```

Expected output:
```
  HACKSPHERE 3.0 - Pre-Submission Self-Tester    
 Found 'predict.py'.
 Found 'sample_test_input.csv'.
 Successfully imported 'predict(input_df)' function.
Loaded 1000 test rows from 'sample_test_input.csv'.
Your predict.py script is completely valid!
SUCCESS
```

Generate predictions for test inputs:
```bash
python predict.py --input sample_test_input.csv --output predictions.csv
```
Output saved to `predictions.csv` with exactly 1,000 valid predictions matching the required schema.

---

## 7. Local Development

```bash
# Install dependencies
npm install

# Run full development server (Express API + Vite React UI on port 3000)
npm run dev

# Re-build for production
npm run build
```
## 8. Final Deployed Link 

https://pravah-ai-xugarssy.onslate.in/
