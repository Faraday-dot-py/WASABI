import type { BuildPath, PathId } from "./types"

export const PATHS: BuildPath[] = [
  {
    id: "no-ai",
    name: "No AI needed",
    tagline: "Rules, analytics, or plain software",
    summary:
      "Your problem has enough structure that you can write down the logic. A rule-based or analytical solution will be cheaper, faster, and easier to trust than any ML system.",
    whenItFits: [
      "The decision logic can be written down as explicit rules",
      "Inputs are structured and behave predictably",
      "You need to explain every decision",
    ],
    avoidWhen: [
      "The pattern is genuinely complex or varies too much to write down",
      "The rule list keeps growing and nobody can maintain it",
    ],
    dataImplications:
      "You need correct, well-modeled data — not training data. A clean schema and accurate records are more valuable than any model here.",
    effort: "low",
    risk: "low",
    firstPrototype:
      "Write the decision logic by hand in a notebook or small script. Test it on real examples and count how often it's right.",
    evaluation:
      "Track accuracy and failure cases on a held-out sample. Every case the rules miss is a data point for whether you eventually need ML.",
    nextSteps: [
      "Write down the five most common cases and how you'd handle each one by hand",
      "Reach for ML only after rules become impossible to maintain",
    ],
  },
  {
    id: "classical-ml",
    name: "Classical ML",
    tagline: "Gradient boosting, logistic regression, clustering",
    summary:
      "For tabular data with labels and predictable inputs, a classical model is often the strongest choice. It is faster to train, easier to explain, and cheaper to run than most deep learning alternatives.",
    whenItFits: [
      "Tabular or structured inputs",
      "You have labels or can create them",
      "Speed, explainability, or low-cost inference matter",
    ],
    avoidWhen: [
      "Inputs are long text, images, audio, or mixed modalities",
      "You have essentially no labeled data",
    ],
    dataImplications:
      "Invest in feature engineering and clean joins. Data quality will matter more than model choice at this scale.",
    effort: "low",
    risk: "low",
    firstPrototype:
      "Fit a gradient boosting or logistic regression model on your cleanest features. Compare it to a simple heuristic — if the heuristic wins, go back to rules.",
    evaluation:
      "Cross-validated accuracy, calibration, and slices by important subgroups. Always report against a trivial baseline so you know what you actually gained.",
    nextSteps: [
      "Pick a metric that reflects the real cost of errors in your domain",
      "Set up a reproducible training script before you tune anything",
    ],
  },
  {
    id: "pretrained",
    name: "Off-the-shelf model",
    tagline: "Use an existing model without training anything",
    summary:
      "Skip training entirely. Use an existing model for embeddings, zero-shot classification, transcription, or captioning, and wrap it with light logic. This is underused — many people jump to fine-tuning before trying this.",
    whenItFits: [
      "Your task is common enough that strong models already exist",
      "You don't have enough data to train competitively",
      "You need something working quickly",
    ],
    avoidWhen: [
      "Your domain language or images are very different from general training data",
      "Privacy rules prevent sending data to external APIs",
    ],
    dataImplications:
      "Your data feeds inference, not training. Focus on cleaning inputs and building a solid evaluation set.",
    effort: "low",
    risk: "moderate",
    firstPrototype:
      "Run 50 real examples through a pretrained model. Compare outputs to ground truth. Decide whether the gap is closeable with light post-processing.",
    evaluation:
      "Task-specific metrics plus a qualitative look at failure modes. Capture every failure — they're your fine-tuning dataset if you need one later.",
    nextSteps: [
      "Pick one well-supported model in your modality and wrap it in the thinnest possible interface",
      "Evaluate before you optimize — you may not need to go further",
    ],
  },
  {
    id: "prompting",
    name: "Prompting",
    tagline: "Write good prompts, add a schema, validate outputs",
    summary:
      "Use a capable language model with careful prompts and structured output schemas. The model stays generic — your prompts, validators, and fallbacks do the actual work. This is often underestimated.",
    whenItFits: [
      "Language-heavy tasks with few or no labeled examples",
      "You need to iterate quickly",
      "Outputs can be checked or corrected downstream",
    ],
    avoidWhen: [
      "Strict privacy means no external API calls",
      "You need hard guarantees on latency or cost at scale",
    ],
    dataImplications:
      "You need representative example inputs and a small evaluation set. You do not need a training set.",
    effort: "low",
    risk: "moderate",
    firstPrototype:
      "Write 10 realistic examples. Draft a prompt that handles them. Add a strict output schema and a validator that catches format failures.",
    evaluation:
      "A held-out set with human-checked outputs. Track format failures separately from content failures — they have different root causes.",
    nextSteps: [
      "Freeze your output schema early — it pays for itself when you want to improve later",
      "Log every input and output so you can improve prompts systematically",
    ],
  },
  {
    id: "rag",
    name: "RAG",
    tagline: "Retrieve the right context, then generate",
    summary:
      "Ground a language model in your own documents or data by retrieving relevant passages at query time and passing them into the prompt. The model doesn't memorize your data — it reads it on each request.",
    whenItFits: [
      "Answers must come from a specific corpus of documents",
      "The knowledge base changes over time",
      "You need citations or traceability",
    ],
    avoidWhen: [
      "There is no meaningful corpus to retrieve from",
      "The task is pure reasoning, not knowledge lookup",
    ],
    dataImplications:
      "Your corpus is the product. Invest in chunking, deduplication, and metadata before you touch the model.",
    effort: "moderate",
    risk: "moderate",
    firstPrototype:
      "Embed a small slice of your corpus, wire up a simple retriever, and pass the top-k results into a prompting workflow.",
    evaluation:
      "Measure retrieval quality separately from generation quality — these are different problems with different fixes.",
    nextSteps: [
      "Start with the smallest corpus that can answer 10 real questions",
      "Get retrieval working well before optimizing generation",
    ],
  },
  {
    id: "fine-tuning",
    name: "Fine-tuning",
    tagline: "Adapt an existing model to your domain",
    summary:
      "Take a pretrained model and teach it your domain-specific behavior, format, or style using labeled examples. This gives you a smaller, cheaper, more consistent model — but only if prompting isn't already good enough.",
    whenItFits: [
      "You have reliable labeled input–output pairs",
      "Prompting is close but not consistent enough at scale",
      "You need a smaller or self-hosted model",
    ],
    avoidWhen: [
      "You have very few examples — fine-tuning needs enough data to generalize",
      "The underlying model keeps changing, making your fine-tuned version stale",
    ],
    dataImplications:
      "You need carefully curated, consistently formatted examples. Quality matters more than quantity — 500 clean examples beats 5,000 noisy ones.",
    effort: "moderate",
    risk: "moderate",
    firstPrototype:
      "Curate a small, high-quality dataset of input/output pairs. Fine-tune a small open model. Run a head-to-head against a strong prompting baseline — if prompting wins, stop.",
    evaluation:
      "Held-out evaluation plus a direct comparison to prompting. If prompting wins, stop fine-tuning.",
    nextSteps: [
      "Lock the output format before collecting training data — format inconsistencies will hurt you",
      "Always keep a prompting baseline to compare against",
    ],
  },
  {
    id: "custom-small",
    name: "Custom small model",
    tagline: "Train something small and specific for your constraints",
    summary:
      "Train a lightweight, task-specific model. This makes sense when you need on-device or low-latency inference, strict privacy, or a narrowly scoped task where large models are overkill.",
    whenItFits: [
      "On-device or very low-latency requirements",
      "Strict privacy or regulatory constraints",
      "A narrow, well-defined task with enough labeled data",
    ],
    avoidWhen: [
      "You have no labels and no distillation signal from a larger model",
      "A pretrained model already solves it well enough",
    ],
    dataImplications:
      "You need either real labeled data or a larger model to distill from. Data engineering will take longer than modeling.",
    effort: "high",
    risk: "high",
    firstPrototype:
      "Build a pretrained or prompting baseline first. Only replace it with a custom model once you can beat that baseline on a real metric.",
    evaluation:
      "Latency, memory, and accuracy measured under realistic conditions — not just on the training distribution.",
    nextSteps: [
      "Define the smallest useful task before picking an architecture",
      "Plan more time for data work than for modeling — that's usually where the project lives or dies",
    ],
  },
  {
    id: "agentic",
    name: "Tool-using agent",
    tagline: "A model that decides which tools to call, in what order",
    summary:
      "A language model orchestrates calls to tools, APIs, or sub-systems to complete a multi-step task. The model is one component in a larger system — not the whole thing.",
    whenItFits: [
      "The task requires multiple steps with real-world side effects",
      "Tools or APIs already exist for the sub-steps",
      "Humans can review or undo actions if something goes wrong",
    ],
    avoidWhen: [
      "A single model call solves it directly — don't add orchestration you don't need",
      "You can't tolerate unpredictable or unrecoverable action sequences",
    ],
    dataImplications:
      "Less about training data, more about clean tool interfaces, reliable traces, and guardrails for when the model gets it wrong.",
    effort: "high",
    risk: "high",
    firstPrototype:
      "Script the happy path manually first. Only let the model decide what to call once the deterministic version works end-to-end.",
    evaluation:
      "Measure per-step success, overall task completion, and how the system recovers from tool failures.",
    nextSteps: [
      "Start with a scripted pipeline, not an autonomous loop",
      "Design tool interfaces as if a junior developer had to call them by hand — clear inputs, clear outputs, no ambiguity",
    ],
  },
]

export const PATH_BY_ID: Record<PathId, BuildPath> = Object.fromEntries(
  PATHS.map((p) => [p.id, p]),
) as Record<PathId, BuildPath>
