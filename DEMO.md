# Beacon — Data Flow & Demo Playbook

Two loops, so you can both **explain** Beacon and **demo** it cold.

- **Part 1 — Data Flow Loop:** how a number becomes a decision becomes a purchase order. This is your answer to *"how does it actually work?"*
- **Part 2 — User Testing Loop:** the click-by-click demo script, the lines to say, and how to recover when the live demo misbehaves.

The one sentence that ties it all together, and the only thing you must never get wrong on stage:

> **TypeScript decides *what* to reorder and *when*. The AI only explains *why*, in plain English.**

---

## Part 1 — The Data Flow Loop

### The loop in one picture

```
        ┌──────────────────────────────────────────────────────────────┐
        │                                                              │
        ▼                                                              │
  ┌───────────┐   ┌──────────────┐   ┌───────────────┐   ┌──────────────┐   ┌───────────────┐
  │ 1. STOCK  │──▶│ 2. MATH      │──▶│ 3. FLAG       │──▶│ 4. NARRATE   │──▶│ 5. BUNDLE     │
  │ on hand,  │   │ days left =  │   │ urgent /     │   │ local LLM    │   │ group by     │
  │ velocity, │   │ onHand /     │   │ watch /      │   │ writes ONE   │   │ supplier,    │
  │ lead time │   │ velocity     │   │ healthy      │   │ sentence /   │   │ draft POs,   │
  │ (10 SKUs) │   │ (pure TS)    │   │ (threshold)  │   │ flagged item │   │ total $      │
  └───────────┘   └──────────────┘   └───────────────┘   └──────────────┘   ┌──────┬────────┘
        ▲                                                                          │
        │                                                                          ▼
        │                                                                  ┌───────────────┐
        └──────────────────────────────────────────────────────────────── │ 6. SUBMIT     │
                  Orders arrive → stock goes back up → loop repeats         │ (1-click POs) │
                                                                            └───────────────┘
```

The loop **closes** at step 6: submitting POs is what eventually refills stock, which resets the math, which is why this is a co-pilot you run on a cadence (e.g. every Monday), not a one-time report.

### Stage by stage (with the files, so you can show code if asked)

| # | Stage | Where it lives | Data in → out | Who does it |
|---|-------|----------------|---------------|-------------|
| 1 | **Stock** | [lib/inventory.ts](lib/inventory.ts) | 10 hardcoded SKUs for Han's Kombucha (on-hand, daily velocity, lead time, supplier, cost, reorder qty) | Static mock (a POC stand-in for live inventory) |
| 2 | **Math** | [lib/reorder.ts](lib/reorder.ts) → `daysRemaining()` | `onHand / dailyVelocity` → days of cover, e.g. 48 lbs ÷ 9.2/day = **5.2 days** | **Pure TypeScript. No AI.** |
| 3 | **Flag** | [lib/reorder.ts](lib/reorder.ts) → `urgencyStatus()` | days vs lead time → `urgent` / `watch` / `healthy` | **Pure TypeScript. No AI.** |
| 4 | **Narrate** | [components/BeaconPanel.tsx](components/BeaconPanel.tsx) → POST [app/api/beacon/route.ts](app/api/beacon/route.ts) → [lib/ollama.ts](lib/ollama.ts) | flagged items' numbers → one founder-readable sentence each | **Local LLM (`qwen3:8b` via Ollama)** |
| 5 | **Bundle** | [components/POBundle.tsx](components/POBundle.tsx) using `groupBySupplier()` + `calcPOValue()` | flagged items → POs grouped by supplier + totals | **Pure TypeScript. No AI.** |
| 6 | **Submit** | [components/POBundle.tsx](components/POBundle.tsx) | one click → simulated submit (1.5s) → "syncing to QuickBooks" | Simulated (logs to console) |

### The flagging rule — memorize this, founders will ask

For each item, compute days of stock left, then compare it to the supplier's lead time:

- **Urgent** (red, "Order now") — `daysRemaining ≤ leadTime + 3`
  *You will stock out within 3 days of when an order placed today would even arrive.*
- **Watch** (amber) — `daysRemaining ≤ leadTime + 10`
  *Cushion is shrinking; order this cycle, not next.*
- **Healthy** (green) — everything else.

> The insight to say out loud: *"A 14-day lead time means a SKU with 16 days of stock is already a problem — you have 2 days of real slack, not 16. Beacon does that subtraction for every SKU, every time."*

### What the AI sees and what it returns (the trust boundary)

The browser **never** talks to the model. The flow is:

```
BeaconPanel (browser)
  │  POST /api/beacon  { items: [{ name, daysRemaining, leadTimeDays, reorderQty, unit, supplier }] }
  ▼
route.ts (server)  ── for each item, in parallel (Promise.all) ──▶  Ollama /api/chat (localhost:11434)
  │                                                                   model: qwen3:8b
  ◀── { rationales: { "Organic cane sugar": "…one sentence…", … } } ──┘
```

- The model receives **numbers we already computed** and is asked for exactly one sentence. It does **no arithmetic** — that's the whole point.
- If the model is down or one call fails, that item falls back to `"Order now to avoid stockout."` — **the demo never hard-fails.**
- Runs **on your machine** via Ollama — no API key, no data leaving the laptop. (Good story for a CPG startup handling customer inventory data.)

### Today's dataset produces (so your numbers match the screen)

- **8 items flagged** — **6 urgent, 2 on watch** (2 healthy).
- Grouped into **4 purchase orders** across 4 suppliers.
- **~$4,520** estimated PO value.

These are computed live by the code — if you edit [lib/inventory.ts](lib/inventory.ts), every number above updates automatically.

---

## Part 2 — The User Testing / Demo Loop

A repeatable loop: **set up → run the 3 acts → reset → repeat.** Run it twice yourself before showing anyone.

### Pre-flight (60 seconds, do this before they walk in)

```bash
ollama serve          # if not already running
ollama list           # confirm qwen3:8b is there
npm run dev           # starts on http://localhost:3000
```

Then in the browser, **click "Run Beacon analysis" once yourself** to warm the model (first generation is the slowest). Refresh back to step 1 before the real demo so it's fast when they watch.

✅ Ollama running ✅ `qwen3:8b` pulled ✅ `npm run dev` up ✅ warmed once ✅ browser at step 1, full screen.

### The 3-act demo (≈ 3 minutes)

**ACT 1 — Review (the problem).** *Screen: metric cards + inventory table.*
- **Do:** Point at the orange banner: *"Beacon spotted 8 items that need attention — 6 urgent, 2 on watch."*
- **Say:** *"This is Han's Kombucha's inventory. They're not out of anything yet. But look —"* click the **Urgent** filter tab.
- **Point at** a red row, e.g. cane sugar: *"5 days of stock, 14-day lead time. If they order today it arrives in 14 days — they're dark for 9 days. That's a stockout that was completely avoidable."*
- **Land the line:** *"The failure isn't running out of sugar. It's forgetting to order 14 days ago. That's the gap Beacon watches."*

**ACT 2 — Beacon analysis (the AI value).** *Click "Run Beacon analysis."*
- **Do:** All flagged cards appear instantly with their numbers; the AI sentence streams into each one as it finishes (~10s for the first, then one at a time). *"It's calling a model running locally on this laptop — no cloud, no API key — and you can watch each rationale land as it's written."*
- **Say, and this is the key differentiator:** *"Notice the app already knew which items and how much to order before the AI said a word. The math is plain code. The AI's only job is to turn '5.2 days, 14-day lead' into a sentence a founder reads in two seconds."*
- **Point at** a rationale card's right side: *"It even tells you exactly what to order — 200 lbs, ~$240."*
- **Why it matters:** *"This is the right way to use AI in ops. You don't let a language model do your purchasing math — you'd never trust the numbers. You let it do the explaining, which is the part humans actually find tedious."*

**ACT 3 — Submit (the payoff).** *Click "Build PO bundle," then look at the grouped POs.*
- **Say:** *"Beacon grouped all 8 items into 4 purchase orders — one per supplier — because that's how you actually buy. $4,520 total."*
- **Do:** Click **"Submit all POs."** Watch the spinner → green *"4 POs submitted — syncing to QuickBooks."*
- **Land it:** *"From 'everything looks fine' to four POs out the door in three clicks. The buyer didn't open a spreadsheet."*

### The 60-second elevator version (if you only get a minute)

> *"CPG brands stock out because they forget to reorder before the lead time runs out, not because they run out of ingredients. Beacon tracks days-of-stock for every SKU, flags the ones that'll go dark before a new order could arrive, and drafts the purchase orders grouped by supplier — one click to send. The math is all deterministic code; we only use a local AI model to explain each reorder in one plain sentence. Here it caught 8 at-risk items and built $4,520 of POs across 4 suppliers."*

### Founder Q&A — anticipated questions + crisp answers

| They ask | You say |
|----------|---------|
| *"Is the AI doing the math?"* | *"No — and that's deliberate. TypeScript computes every number. The model only writes the explanation sentence. You should never trust an LLM with purchasing arithmetic."* |
| *"Why a local model?"* | *"Runs on the laptop via Ollama — no API key, no inventory data leaving the building. Easy to swap for a hosted model later; it's one config line."* |
| *"How do you decide what's urgent?"* | *"Days of stock vs. supplier lead time. Urgent = you'd stock out within 3 days of a new order even arriving. Watch = within 10. Simple, explainable, no black box."* |
| *"Is this real or faked?"* | *"The inventory is mock data and the PO submit is simulated — it's a POC. Everything in between — the risk math, the supplier grouping, the AI rationales — is real and runs live."* |
| *"What would it take in production?"* | *"Swap the mock inventory for your real feed (the calc layer doesn't change), and wire the submit button to your actual PO / QuickBooks integration. The decision engine is already done."* |
| *"How fast / does it scale?"* | *"The math is instant for thousands of SKUs. Only the flagged items hit the model, and they run in parallel — so cost and latency scale with problems, not catalog size."* |

### Demo gremlins — recover gracefully

| If… | What happens | What you say |
|-----|--------------|--------------|
| Ollama is down / not started | Cards still render with `"Order now to avoid stockout."` | *"That's the built-in fallback — even if the model's unavailable, the reorder logic still works. The AI is the narration layer, not the brain."* (then start Ollama and re-run) |
| First analysis is slow | Skeletons show a few seconds | *"First call wakes the model — it's running locally."* (You warmed it pre-flight, so this shouldn't happen live.) |
| You need to demo again | Step 3 has no "back" button | Just **refresh the page** — it resets to step 1. The analysis re-runs fresh. |
| Someone wants to see it break | Edit a number in [lib/inventory.ts](lib/inventory.ts) | Change `onHand` on a healthy item to a tiny number, save — it flips to urgent live. Great for showing the rule is real. |

### The testing loop itself

```
  run demo ──▶ watch where attention goes / what confuses ──▶ tweak a talking point
     ▲                                                              │
     └──────────────────── refresh, run again ─────────────────────┘
```

Do 2–3 dry runs before the real audience. The most common stumble is **rushing Act 2** — slow down and say the "code does the math, AI does the words" line clearly. That's the line that makes you sound like you understand AI in ops, not just bolting a chatbot onto a dashboard.
