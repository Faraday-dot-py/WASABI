import type { BuildPath, PathId } from "./types"

// Build paths = output layer. Their vertical ordering in the network
// is the order in this array.
export const PATHS: BuildPath[] = [
  {
    id: "no-ai",
    name: "No AI needed",
    tagline: "Rules, analytics, or plain software",
    summary:
      "Your problem likely has a deterministic, well-understood structure. A rule-based or analytical solution will be cheaper, faster, and easier to trust.",
    whenItFits: [
      "The logic can be written down as rules",
      "Inputs are structured and predictable",
      "Interpretability matters more than raw accuracy",
    ],
    avoidWhen: [
      "The pattern is genuinely complex or fuzzy",
      "Rules multiply beyond what a team can maintain",
    ],
    dataImplications:
      "You mostly need correct, well-modeled data. A good schema beats a good model here.",
    effort: "low",
    risk: "low",
    firstPrototype:
      "Write the rules by hand in a notebook or a small script. Measure how often they are right on real examples.",
    evaluation:
      "Track accuracy and edge cases on a held-out sample. Record every case the rules miss as a future training set.",
    nextSteps: [
      "Write down the 5 most common cases and how you'd solve each one",
      "Only reach for ML once rules become unmaintainable",
    ],
  },
  {
    id: "classical-ml",
    name: "Classical ML baseline",
    tagline: "Gradient boosting, logistic regression, clustering",
    summary:
      "A well-built classical model is often the strongest choice for tabular data, clear labels, and tight latency or interpretability requirements.",
    whenItFits: [
      "Tabular or structured inputs",
      "You have labels or can create them",
      "You need speed, explainability, and cheap inference",
    ],
    avoidWhen: [
      "Inputs are long text, images, audio, or multimodal",
      "You have essentially no labeled data",
    ],
    dataImplications:
      "Invest heavily in feature engineering and clean joins. Data quality will dominate model choice.",
    effort: "low",
    risk: "low",
    firstPrototype:
      "Build a baseline with gradient boosting or logistic regression on your cleanest features. Compare to a simple heuristic.",
    evaluation:
      "Cross-validated accuracy, calibration, and fairness slices. Always report against a trivial baseline.",
    nextSteps: [
      "Pick a metric that reflects the real-world cost of errors",
      "Set up a reproducible training script before tuning anything",
    ],
  },
  {
    id: "pretrained",
    name: "Use a pretrained model as-is",
    tagline: "Off-the-shelf embeddings, classifiers, or vision models",
    summary:
      "Skip training. Use an existing model for embeddings, zero-shot classification, transcription, or captioning, and wrap it with light logic.",
    whenItFits: [
      "Common task with strong existing models",
      "Not enough data to train competitively",
      "You want a working prototype fast",
    ],
    avoidWhen: [
      "Your domain language or images are very unusual",
      "Strict privacy prevents sending data to hosted models",
    ],
    dataImplications:
      "Your data mostly feeds inference, not training. Focus on input cleanup and evaluation data.",
    effort: "low",
    risk: "moderate",
    firstPrototype:
      "Run 50 real inputs through a pretrained model, compare outputs to ground truth, and decide if the gap is closeable with light post-processing.",
    evaluation:
      "Task-specific metrics plus a qualitative review of failure modes. Capture every failure as a future fine-tuning candidate.",
    nextSteps: [
      "Pick one well-supported pretrained model in your modality",
      "Build the thinnest possible wrapper around it",
    ],
  },
  {
    id: "prompting",
    name: "Prompting workflow",
    tagline: "Structured LLM calls with careful inputs and outputs",
    summary:
      "Use a capable language model with careful prompting and output schemas. The model stays generic; your prompts, validators, and fallbacks do the real work.",
    whenItFits: [
      "Language-heavy tasks with few or no labels",
      "You need flexibility and fast iteration",
      "Quality can be checked or corrected downstream",
    ],
    avoidWhen: [
      "Strict privacy requires no external inference",
      "You need strong guarantees on latency or cost at scale",
    ],
    dataImplications:
      "You need representative example inputs and a small evaluation set, not a training set.",
    effort: "low",
    risk: "moderate",
    firstPrototype:
      "Write 10 realistic examples. Draft a prompt that solves them. Add a strict output schema and a validator.",
    evaluation:
      "Held-out example set with human-checked outputs. Track format failures separately from content failures.",
    nextSteps: [
      "Freeze an output schema early, it pays for itself",
      "Log every input and output so you can improve prompts later",
    ],
  },
  {
    id: "rag",
    name: "Retrieval-augmented generation",
    tagline: "Retrieve relevant context, then generate",
    summary:
      "Ground a language model in your own documents or data by retrieving relevant passages at query time and passing them into the prompt.",
    whenItFits: [
      "Answers must come from a specific corpus",
      "Knowledge changes over time and should stay current",
      "You need citations or traceability",
    ],
    avoidWhen: [
      "There is no meaningful corpus to retrieve from",
      "The task is pure reasoning, not knowledge lookup",
    ],
    dataImplications:
      "Your corpus becomes the product. Invest in chunking, deduplication, and metadata before tuning the model.",
    effort: "moderate",
    risk: "moderate",
    firstPrototype:
      "Embed a small slice of your corpus, wire up a simple retriever, and send top-k passages into a prompting workflow.",
    evaluation:
      "Separate retrieval quality (did it find the right passage) from generation quality (did it use the passage correctly).",
    nextSteps: [
      "Start with the smallest corpus that can answer 10 real questions",
      "Measure retrieval hit rate before tuning generation",
    ],
  },
  {
    id: "fine-tuning",
    name: "Fine-tuning or adapter tuning",
    tagline: "Adapt an existing model to your domain",
    summary:
      "Take a pretrained model and teach it your domain-specific behavior, format, or style using supervised fine-tuning or lightweight adapters.",
    whenItFits: [
      "You have reliable labeled examples",
      "Prompting is close but not consistent enough",
      "You need a smaller, cheaper, more predictable model",
    ],
    avoidWhen: [
      "You have very few labels",
      "The underlying model keeps changing under you",
    ],
    dataImplications:
      "You need carefully curated, consistently formatted training examples. Quality matters more than quantity.",
    effort: "moderate",
    risk: "moderate",
    firstPrototype:
      "Curate a small, high-quality dataset of input / ideal-output pairs. Fine-tune a small open model. Compare to a strong prompting baseline.",
    evaluation:
      "Held-out evaluation plus a head-to-head comparison against prompting. If prompting wins, stop fine-tuning.",
    nextSteps: [
      "Lock the output format before collecting training data",
      "Always keep a prompting baseline for comparison",
    ],
  },
  {
    id: "custom-small",
    name: "Small custom model",
    tagline: "Distillation or purpose-built lightweight model",
    summary:
      "Train a small, focused model. Useful when you need on-device or low-latency inference, strong privacy, or a narrowly scoped task.",
    whenItFits: [
      "Low-latency or on-device requirements",
      "Strict privacy or regulatory constraints",
      "A narrow, well-defined task with enough data",
    ],
    avoidWhen: [
      "You have no labels and no distillation signal",
      "A pretrained model already solves it well enough",
    ],
    dataImplications:
      "You likely need either real labeled data or a larger model to distill from. Plan for meaningful data engineering.",
    effort: "high",
    risk: "high",
    firstPrototype:
      "Build a pretrained or prompting baseline first. Only replace it with a custom model once you can beat it on a real metric.",
    evaluation:
      "Latency, memory, and task accuracy measured under realistic conditions, not just on the training distribution.",
    nextSteps: [
      "Define the smallest useful task before choosing an architecture",
      "Budget time for data work, not just modeling",
    ],
  },
  {
    id: "agentic",
    name: "Tool-using workflow",
    tagline: "An orchestrated system that calls tools or APIs",
    summary:
      "A language model orchestrates calls to tools, APIs, or sub-systems to complete a multi-step task. The model is one component in a larger system.",
    whenItFits: [
      "The task requires multiple steps with real-world side effects",
      "Tools or APIs already exist for the sub-steps",
      "Humans can review or undo actions",
    ],
    avoidWhen: [
      "A single model call can solve it directly",
      "You cannot tolerate unpredictable action sequences",
    ],
    dataImplications:
      "Less about training data, more about clean tool interfaces, traces, and guardrails.",
    effort: "high",
    risk: "high",
    firstPrototype:
      "Hand-script the happy path first. Only introduce model-driven tool choice once the deterministic version works end-to-end.",
    evaluation:
      "Measure per-step success, overall task completion, and recovery from tool failures.",
    nextSteps: [
      "Start with a scripted pipeline, not an autonomous loop",
      "Design tool interfaces as if a junior engineer had to use them",
    ],
  },
]

export const PATH_BY_ID: Record<PathId, BuildPath> = Object.fromEntries(
  PATHS.map((p) => [p.id, p]),
) as Record<PathId, BuildPath>
