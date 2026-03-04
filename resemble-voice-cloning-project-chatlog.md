# Resemble Voice Cloning Project — Full Chat Log

Complete transcript of the conversation between **you (Chen Kai)** and **me (AI assistant)** regarding the voice cloning project with Liam (client). All context, questions, and answers in full.

---

## PART 1: Initial Context You Shared

### Chen Kai's Original Proposal to Liam
> I got your point.
> You are exactly right, commercial voice providers can change models or weights over time, and it will cause output drift.
>
> Here's how I'd execute, with timeline + milestone pricing:
>
> **phase 1: dedicated host**
> - provision test host (GPU if needed)
> - install + configure Resemble offline stack + dependencies
> - expose a stable internal API endpoint for your team to test (and also healthcheck api)
> - basic logs/monitoring
> - smoke tests + repeatability checks
>
> timeline: 2-3 days
> milestone: 750$
>
> **phase 2 local machine setup ( after test passes)**
> scope:
> - install same stack locally
> - match configs with test host so results are consistent
> - make setup repeatable ( docker or install scripts)
> - validate with your real multilingual dubbing workload
> timeline: 2days
> mileston: 500$
>
> **optional phase 3 frontend integration and quality guardrails**
> - auth/access control into your existing frontend
> - queue for longer renders + storage
> - quality checks
>
> total for what you asked (phase 1 + phase 2): 1250$
>
> and few quick questions
> so where should I deploy the test host ? (aws or what?)
> what GPU do you have locally ? ( for your local setup)
>
> once confirmed, I can immediately start with phase 1 and deliver a working test endpoint first.
> Thank you

### Liam's First Reply (from your earlier messages)
> Hi Chen, thanks for applying and making a proposal for my project.
>
> To help you better understand our situation... We're currently using a commercially available voice cloning software on our multilingual content as we dub our own internal videos into a few different languages. This software is set up in our web-based front end. Recently we've discovered some issues with said software that make it inconsistent and unpredictable as it relies on the commercially available model which changes and is updated. For consistency we've decided to attempt setting up Resemble AI's offline open-source software to test if this alleviates our current constraints.
>
> Should Resemble's open-source software be suitable for our needs we'd be looking at setting up our own local machine version (we have the hardware and don't mind paying for more if needed) and then connecting it in through our existing front-end for delegating access and use.
>
> We have a few improvements we have in mind for our front end and some additional expansions for our use-case on top of the local version of Resemble, but these can be discussed afterwards. These include some safety nets and automated detections to help us unsure our audio outputs are consistent and high-quality.
>
> From you:
> - Based on the details above how long would it take you to set up Resemble AI's software to a dedicated host for testing
> - Following a successful test of Resembles software, how long would it take you to setup the software on a local machine
> - Given the above for both what would you charge for the work (we prefer a milestone based system)

### Chen Kai's Follow-up Message to Liam (that you sent)
> Hi Liam.
> I've been exploring Resemble AI's website, GitHub repository, and the Hugging Face model to understand their open-source stack and how it might fit your use case.
>
> Based on my review, Resemble AI fits well with your multilingual dubbing workflow.
>
> First, model stability. Because it's open source under the MIT license, you can precisely manage weights and versions after deployment. This eliminates the unexpected updates and output variance issues you're experiencing with commercial APIs.
>
> Second, multilingual support. Chatterbox Multilingual supports 23 languages and offers cross-language voice transfer. By cloning a voice once, you can generate voices in multiple supported languages while maintaining consistent speaker characteristics. This is ideal for your internal video dubbing use case.
>
> Third, offline deployment is possible. It supports pip installation, Docker, and on-premise deployment. This means you can host it completely on your own hardware without relying on external APIs or regular SaaS costs.
>
> In terms of quality, it demonstrates excellent performance in published evaluation results, and its fixed model version ensures predictability and reproducibility and it's critical for production dubbing.
>
> I am confident I can support you in transitioning from a vendor-dependent environment to a stable and controllable self-hosted pipeline.

### Liam's Reply
> I appreciate the thorough message and details for the work. Before we begin any of the fundamental work i'd like to discuss with you over a call sometime this week to understand if you're the right fit for us.
>
> As mentioned, on top of the local software we're looking to implement some extra features to help with audit usage of the software and some automatic proofchecking technology to help us identify issues before they become a problem.
>
> We have some Nvidia GPUs around spare for usage but what is your suggest minimum setup for us to have to run the AI locally under stable conditions. For your reference we intend to use it to clone over audio that is anywhere from 30mins to 4hrs in length with our existing front-end capable of "splycing" the audio into chunks if needed. The file sizes can be 400MB + in size.
>
> Do you suggest any other local AI voice cloning technology that might be a better fit keeping in mind the need for multilingual support and consistency & quality of audio as key factors?
>
> Our "target audio" (the voice we're trying to replicate and clone) has 3+hr worth of samples so a trained model can work if it gives more reliable outputs and we don't NEED to use an RVC model

---

## PART 2: You Asked — "please check this chat logs as you can see client just replied and i need to understand what he mean and reply to him professionally"

### My Full Answer

**What Liam is actually asking (4 things):**

1. **He wants a call before committing** — This is a vetting step, not a brush-off. He's interested but wants to confirm you're the right fit, especially because the scope is bigger than just "install Resemble."

2. **The scope is bigger than Phase 1+2** — He's hinting at:
   - **Audit/usage tracking** — Who used the tool, when, what they generated
   - **Automated quality/proof-checking** — Detecting bad outputs before they ship (e.g., pitch analysis, duration drift, silence detection, maybe ASR-based verification)

3. **Hardware recommendation** — He has spare Nvidia GPUs and wants your opinion on minimum specs. Key context: they're generating long-form audio (30 min to 4 hrs, 400MB+ files), and their frontend already handles chunking/splicing.

4. **Should we even use Resemble, or is something else better?** — He's open-minded. He specifically mentions:
   - They have **3+ hours of target voice samples** (enough to fine-tune, not just zero-shot)
   - They **don't need RVC** specifically
   - A **trained/fine-tuned model is acceptable** if it gives more reliable outputs
   - Key priorities: **multilingual, consistency, quality**

---

**Draft reply I suggested:**

> **Hi Liam,**
>
> Absolutely happy to schedule a call this week. I'm available [insert your times] — let me know what works for you.
>
> In the meantime, let me address your questions so we can make the call productive:
>
> **GPU recommendation**
>
> For Chatterbox Multilingual (500M parameters), I'd recommend at minimum an **NVIDIA RTX 3090 or 4090 (24GB VRAM)** for stable local inference. Given your workload — long-form audio (30 min to 4 hrs), chunked processing, and potentially concurrent users — a **48GB card like an RTX A6000** would give you comfortable headroom and avoid memory pressure during extended generation sessions. If you already have spare Nvidia cards, let me know the model and VRAM and I can confirm whether they'll handle the load.
>
> On the long-form side: TTS models generate audio in chunks (typically sentence or paragraph level), so a 4-hour video doesn't mean 4 hours of continuous GPU memory. Your frontend's splicing approach is exactly right. The pipeline would process segment by segment and stitch the output.
>
> **On whether Resemble is the best fit — or if there's something better**
>
> Since you have **3+ hours of high-quality target voice samples**, you're in a strong position to go beyond zero-shot cloning and actually **fine-tune a model** on your speaker. This typically gives noticeably more consistent and reliable output than zero-shot, which matters for production dubbing.
>
> Two strong contenders worth evaluating:
>
> 1. **Resemble Chatterbox Multilingual** — 23 languages, zero-shot cloning, MIT licensed, solid quality. The main advantage is ease of deployment and broad language coverage out of the box. However, fine-tuning support for Chatterbox is less mature compared to some alternatives.
>
> 2. **Coqui XTTS-v2** — 17 languages, well-documented fine-tuning pipeline, and your 3+ hours of samples is more than enough to train a strong custom voice model. Fine-tuned XTTS tends to produce very consistent output for a known speaker. The trade-off: Coqui (the company) shut down in late 2024, so the model is now community-maintained. The model itself is stable and widely deployed, but there won't be official updates.
>
> **My suggestion:** We test both during Phase 1. I deploy Chatterbox Multilingual (zero-shot) and XTTS-v2 (fine-tuned on your samples) side by side on the test host, and your team evaluates which produces better results for your specific languages and voice. This way you make the decision based on actual output quality rather than spec sheets.
>
> **On the audit and quality guardrails**
>
> Happy to discuss this in detail on the call. At a high level, I'm thinking:
> - Usage logging (user, timestamp, input/output metadata)
> - Automated QA checks post-generation (e.g., ASR verification, pitch/duration drift detection, silence/artifact detection)
> - Dashboard or report for your team to review flagged outputs
>
> This fits naturally into Phase 3, but I'd like to understand your workflow better on the call so I can scope it properly.
>
> Looking forward to connecting.
>
> Best,
> Chen Kai

---

## PART 3: Liam's Clarification

### Liam's Message
> To clarify right now the head room we need is only for 1 user processing about 8-10 of those files per day (over the span of 6-8hrs) so there isn't a lot of concurrent processing happening at one time.
>
> Additionally we're aiming to exclusively use the Speech to Speech models and not the TTS model

---

## PART 4: You Asked — "So how can i answer to his last question what it means?"

### My Full Answer

**What he's telling you:**

**1. Workload is light — single user, sequential processing**

Only 1 person using it at a time, doing 8-10 files per day spread over 6-8 hours. No concurrency. This is good news — it means GPU requirements are much lower. An **RTX 3090 (24GB VRAM)** would be plenty. No need for an A6000 or multi-GPU setup.

**2. He wants Speech-to-Speech (STS), NOT Text-to-Speech (TTS) — this is the critical point**

This changes the technical picture significantly. Here's the difference:

- **TTS (Text-to-Speech):** You type text in, speech comes out. Chatterbox, XTTS, etc. are all TTS models.
- **STS (Speech-to-Speech):** You feed in real audio (an actual human performance), and the model re-voices it — changing the voice/language while **preserving the original timing, emotion, pacing, and prosody**. The input is audio, not text.

For dubbing, STS is the right approach because:
- Timing stays synced with video (lip sync)
- The original actor's delivery (emotion, pace, pauses) is preserved
- You don't lose information through a transcription step

**This means Chatterbox and XTTS are not what he needs.** Those are TTS models. He needs a **voice conversion / speech-to-speech pipeline.**

---

**What this means for your proposal**

Your earlier recommendation of Chatterbox/XTTS was based on a TTS assumption. Now you need to pivot. Here's the landscape for open-source STS:

- **Resemble AI's Speech-to-Speech engine** — exists and is great (149+ languages, preserves emotion/prosody, 48kHz output), but it's **proprietary, not open-source**. Their open-source offerings (Chatterbox) are TTS only.
- **RVC (Retrieval-based Voice Conversion)** — popular open-source voice conversion, but Liam already said he doesn't need RVC specifically, and RVC is mainly single-language voice swap (same language, different voice), not multilingual dubbing.
- **MulliVC** — a research project for multilingual voice conversion that preserves prosody and emotion across languages. Promising but not production-ready.
- **Cascaded pipeline approach** — ASR (Whisper) → Translation → TTS (Chatterbox/XTTS) with timing alignment. This is how most open-source dubbing pipelines work, but it's technically TTS-based, not true STS.

---

**Honest assessment you should communicate**

The reality is: **true open-source STS for multilingual dubbing with prosody preservation is still immature.** The commercial tool Liam is currently using likely does exactly this (STS), which is why it worked for them despite the drift issues.

Resemble's STS engine would be the closest match, but it's their **paid on-prem product**, not the open-source Chatterbox.

---

**Suggested reply:**

> **Hi Liam,**
>
> Thanks for the clarification — that helps a lot on both points.
>
> On the hardware side, with a single-user sequential workload (8-10 files/day), an RTX 3090 (24GB VRAM) would handle this comfortably. No need for anything larger.
>
> On Speech-to-Speech vs TTS — this is an important distinction I want to make sure we're aligned on. The open-source models I mentioned earlier (Chatterbox, XTTS) are TTS models — they take text input and generate speech. For your dubbing workflow, you want **Speech-to-Speech**: audio in, re-voiced audio out, preserving the original performance's timing, emotion, and prosody.
>
> Resemble AI does offer a Speech-to-Speech engine that fits this exactly (supports 149+ languages, preserves prosody, real-time conversion). However, that product is part of their **commercial/on-prem offering**, not the open-source Chatterbox stack. So if STS is the requirement, we'd be looking at either:
>
> 1. **Resemble's on-prem STS product** — purpose-built for this, best quality, but involves licensing costs.
> 2. **A hybrid open-source pipeline** — using Whisper for transcription + translation + TTS with timing alignment. This is technically a cascaded approach rather than true STS, but it can produce good results for dubbing, especially with fine-tuned voice models and your frontend's chunking capability.
>
> I think this is worth discussing on the call to understand exactly how your current commercial tool handles the pipeline, and what level of prosody/timing preservation you need. That will help us determine whether Resemble's on-prem STS is the right path, or whether a well-built open-source pipeline can meet your quality bar.
>
> Happy to jump on a call whenever works for you this week.
>
> Best,
> Chen Kai

---

## PART 5: You Asked — "so you mean resemble ai doesn't have opensource TTS model right?"

### My Full Answer

No, the opposite actually — let me clarify:

- Resemble AI **does** have open-source **TTS** models. That's the Chatterbox family (Chatterbox, Chatterbox-Turbo, Chatterbox-Multilingual). All MIT-licensed, free, on GitHub/HuggingFace. These take **text in, speech out**.

- What Resemble AI does **NOT** have as open-source is their **Speech-to-Speech (STS)** engine. That's their commercial/on-prem product. STS takes **audio in, re-voiced audio out** — preserving timing, emotion, prosody.

So the problem is:

| | Open-Source? | What Liam wants? |
|---|---|---|
| Chatterbox (TTS) | Yes | No — Liam said he wants STS, not TTS |
| Resemble STS (voice conversion) | No — commercial/on-prem | Yes — this is what fits his dubbing workflow |

Liam's clarification that he wants **Speech-to-Speech exclusively** means the open-source Chatterbox stack isn't the right tool for his use case. His options for STS are either Resemble's paid on-prem product, or building a hybrid pipeline from open-source components.

---

## PART 6: You Asked — "so then what is good opensource model for STS?"

### My Full Answer

Honest answer: **the open-source STS landscape for production multilingual dubbing is thin.** There's no single model that does everything Liam needs out of the box the way a commercial product does. But here are the realistic options, ranked:

---

**Tier 1: Best available open-source voice conversion**

**1. Seed-VC**
- **What it does:** Zero-shot speech-to-speech voice conversion. Audio in, re-voiced audio out.
- **Strengths:** Best speaker similarity (0.87 SECS score), lowest error rates among open-source VC models, real-time capable (~400ms latency), needs only 1-30 seconds of reference audio
- **Multilingual:** Works across languages (content-language agnostic — it converts the voice, not the language)
- **License:** GPL v3 (open source but copyleft — important for commercial use)
- **Limitation:** Doesn't translate. It swaps the voice but keeps the same language. For multilingual dubbing (changing language), you still need a translation step.
- GitHub: https://github.com/Plachtaa/seed-vc

**2. OpenVoice V2 (MyShell)**
- **What it does:** Zero-shot voice cloning + style/tone transfer
- **Strengths:** Cross-lingual voice cloning, flexible control over emotion/rhythm/pauses, native support for English, Spanish, French, Chinese, Japanese, Korean
- **License:** MIT (commercially friendly)
- **Limitation:** Lower speaker similarity and higher error rates than Seed-VC. Quality is decent but not top-tier.
- GitHub: https://github.com/myshell-ai/OpenVoice

**3. FreeVC**
- **What it does:** Text-free one-shot voice conversion
- **Strengths:** High quality waveform output, no text/transcription needed, MIT license
- **Limitation:** Primarily English-focused, limited multilingual documentation. More of a research project than production tool.

---

**Tier 2: Hybrid pipeline approach (most realistic for Liam's use case)**

Since Liam needs **multilingual dubbing** (changing both voice AND language), pure voice conversion alone won't cut it. Voice conversion models swap the voice but keep the same language content.

For actual dubbing you'd build a pipeline:

```
Source audio (Language A)
  → Whisper (ASR/transcription)
  → Translation (Language B)
  → TTS with cloned voice (Chatterbox Multilingual / XTTS)
  → Timing alignment to match original
  → Output audio (Language B, cloned voice)
```

This is technically TTS-based, not pure STS — but it's how most open-source dubbing pipelines work today. There's even an open-source project for this: **Open Dubbing** (https://github.com/Softcatala/open-dubbing).

---

**The honest takeaway**

You need to clarify with Liam exactly what his current commercial tool does, because "Speech to Speech" can mean two different things in his context:

**Scenario A — Same language, different voice:** Source audio in English → Output audio in English but with a different (cloned) voice. This is pure voice conversion. **Seed-VC or OpenVoice V2** can do this.

**Scenario B — Different language, cloned voice (actual dubbing):** Source audio in English → Output audio in Spanish/French/etc. with the cloned voice. This requires translation + generation. **No single open-source model does this end-to-end.** You'd need a pipeline, or Resemble's commercial on-prem product.

I'd suggest asking Liam to clarify this on the call — it determines the entire technical approach.

---

## PART 7: You Asked — "for the perfect and best quality what you recommend?"

### My Full Answer

For the **absolute best quality** in Liam's specific situation (multilingual dubbing, STS, self-hosted, consistency is king), here's my honest recommendation:

---

**Best quality path: Resemble AI On-Prem (commercial license)**

This is the real answer. If quality and consistency are the top priorities — and Liam has already named Resemble as the company he wants to use — their **on-prem product** is purpose-built for exactly this:

- Speech-to-Speech engine (audio in, re-voiced audio out)
- 149+ languages
- Preserves emotion, pacing, prosody
- 48kHz output quality
- Self-hosted on their own hardware (no cloud dependency, no model drift)
- No per-minute fees — it's a software license
- Pip install or Kubernetes deployment
- 200ms response time

The pricing isn't public (you have to contact their sales team), but it's a flat license fee, not per-use. For a team doing 8-10 files a day long-term, a license pays for itself quickly vs. per-minute cloud pricing.

**This is what Liam was originally asking about when he said "Resemble AI's offline open-source software."** He may not have realized the STS engine is their commercial product, not the open-source Chatterbox. It's worth clarifying this on the call.

---

**Why not open-source for best quality?**

| Factor | Resemble On-Prem | Best open-source (Seed-VC + pipeline) |
|---|---|---|
| Quality | Production-grade, battle-tested | Good but inconsistent across languages |
| Multilingual STS | Native, 149+ languages | Requires stitching multiple tools together |
| Prosody preservation | Built-in | Varies, often lossy |
| Maintenance | Supported product with updates | You maintain everything yourself |
| Setup complexity | Pip install or K8s, documented | Custom pipeline, lots of glue code |
| Long-form audio | Designed for it | You build the chunking/stitching yourself |

Open-source can work, but you'd be assembling 3-4 tools (Whisper + translation + TTS/VC + timing alignment), tuning each one, and handling edge cases yourself. For a production dubbing workflow where quality and consistency are the priorities, that's a lot of risk.

---

**What I'd recommend you say to Liam**

Position it like this on the call:

> "After researching Resemble's stack in detail, their open-source model (Chatterbox) is TTS, not Speech-to-Speech. For your STS requirement, the right product is Resemble's on-prem licensed solution — it's self-hosted on your hardware, no cloud dependency, flat license fee, and purpose-built for the exact workflow you described. I can handle the full deployment, API setup, and integration into your frontend. I'd recommend we get on a call with Resemble's sales team to understand the licensing, and I'll scope the deployment work around that."

---

## PART 8: You Shared — Resemble Knowledge Base Link

**Link you shared:** https://knowledge.resemble.ai/is-it-possible-to-speech-to-speech-via-api

### My Full Answer

This changes things. Here's what I found from the docs:

**Resemble's STS is available on their cloud API too, not just on-prem**

The `<resemble:convert>` SSML tag lets you do Speech-to-Speech via their standard API. You pass in a source audio URL and it converts it to the target voice:

```xml
<speak>
  <resemble:convert src="https://your-audio-file.wav" />
</speak>
```

**Constraints:**
- Max file size: 50 MB
- Max duration: 300 seconds (5 minutes) per request
- Source must be a WAV file with a single speaker via HTTPS URL

You can also steer the output with a `prompt` attribute (e.g. `"Speak in a British accent."`).

**Pricing for STS on the Flex Plan**

Looking at their pricing page, the relevant line item is:
- **AI Voice Changer** (their STS product): **$0.0005/second**
- That's $0.03/minute. For Liam's workload (let's say 8-10 files/day, each 30 min to 4 hrs):
  - Low end: 8 files x 30 min = 240 min/day = **$7.20/day**
  - High end: 10 files x 4 hrs = 2,400 min/day = **$72/day**
  - Over a month (20 working days) that's roughly **$144 to $1,440/month** depending on actual volume.

**What this means for your proposal**

This actually opens up a **third path** you didn't have before:

| Option | Pros | Cons |
|---|---|---|
| **Resemble Cloud API (Flex)** | No hardware needed, no setup, STS works today, pay-as-you-go | 5-min chunk limit per request, per-second costs add up, data leaves their network |
| **Resemble On-Prem (Enterprise)** | Flat license, no per-use cost, data stays local, no chunk limits | Custom pricing (contact sales), higher upfront cost |
| **Open-source pipeline** | Free, full control | No true STS model, lower quality, heavy integration work |

The 5-minute / 50MB limit per request isn't a dealbreaker since Liam's frontend already splices audio into chunks. But it does mean they'd be making a lot of API calls for a 4-hour file.

**What I'd suggest you tell Liam**

> "I've dug into Resemble's documentation and pricing in detail. Their STS capability is available both via cloud API (Flex plan, pay-per-second) and as an on-prem enterprise deployment. For your use case, there are two realistic paths:
>
> **Option A — Start on Flex API:** Get STS running immediately through their cloud API at $0.0005/sec. Your frontend already handles chunking, so the 5-min per-request limit is manageable. This lets you validate quality fast with zero hardware setup. Estimated monthly cost depends on volume but roughly $150–$1,400/month.
>
> **Option B — On-prem license:** If the cloud API validates well and you want to eliminate recurring per-use costs and keep data fully local, we move to an on-prem deployment on your Nvidia hardware. This requires a conversation with Resemble's sales team for licensing.
>
> I'd recommend Option A first as a low-risk test — we can have it running in a day or two. If quality checks out, we scope the on-prem migration as Phase 2."

---

## PART 9: You Asked — "hey give me info links for him to be sure i am correct"

### My Full Answer

Here are the key links you can share with Liam to back up your points:

**Resemble AI STS via API (the `<resemble:convert>` SSML tag)**
- Documentation: https://docs.resemble.ai/getting-started/ssml
- Knowledge Base confirming STS is available via API: https://knowledge.resemble.ai/is-it-possible-to-speech-to-speech-via-api

**Resemble AI STS product page**
- https://www.resemble.ai/speech-to-speech/

**Resemble AI Pricing (Flex plan — includes "AI Voice Changer" which is STS at $0.0005/sec)**
- https://www.resemble.ai/pricing/

**Resemble AI On-Prem deployment (Enterprise — for local machine setup)**
- https://www.resemble.ai/on-prem/

**Resemble AI Open-Source models (Chatterbox — TTS only, NOT STS)**
- GitHub: https://github.com/resemble-ai/chatterbox
- Hugging Face: https://huggingface.co/ResembleAI/chatterbox
- Chatterbox Multilingual announcement: https://www.resemble.ai/introducing-chatterbox-multilingual-open-source-tts-for-23-languages/

The last group of links (Chatterbox) is useful to show Liam you understand the distinction: Resemble's open-source offering is TTS, while STS is part of their commercial product (available via cloud API on the Flex plan, or self-hosted via Enterprise on-prem licensing).

---

## PART 10: You Asked — "like referlinks: for sts only"

### My Full Answer

Here are the STS-only reference links:

1. **STS API docs (the `<resemble:convert>` tag):** https://docs.resemble.ai/getting-started/ssml
2. **STS product page:** https://www.resemble.ai/speech-to-speech/
3. **STS enhancements page:** https://www.resemble.ai/speech-to-speech-enhancements
4. **KB article confirming STS via API:** https://knowledge.resemble.ai/is-it-possible-to-speech-to-speech-via-api
5. **Pricing (STS listed as "AI Voice Changer" at $0.0005/sec):** https://www.resemble.ai/pricing/
6. **On-prem deployment (includes STS):** https://www.resemble.ai/on-prem/

---

## Reference Links Table (STS Only)

| Purpose | Link |
|---------|------|
| STS API docs (`<resemble:convert>` tag) | https://docs.resemble.ai/getting-started/ssml |
| STS product page | https://www.resemble.ai/speech-to-speech/ |
| STS enhancements | https://www.resemble.ai/speech-to-speech-enhancements |
| KB: STS via API | https://knowledge.resemble.ai/is-it-possible-to-speech-to-speech-via-api |
| Pricing (AI Voice Changer = STS @ $0.0005/sec) | https://www.resemble.ai/pricing/ |
| On-prem deployment (includes STS) | https://www.resemble.ai/on-prem/ |
