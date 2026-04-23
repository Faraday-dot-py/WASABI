export const GLOSSARY: Record<string, string> = {
  "classical ml":
    "Models like logistic regression, random forests, and gradient boosting. Usually the right answer for structured data when you have labels.",
  "fine-tuning":
    "Continuing training on a pretrained model using your own labeled examples so it behaves the way you need.",
  "pretrained":
    "A model already trained on a large general dataset. You can use it directly or adapt it — no training required.",
  "rag":
    "Retrieval-augmented generation. Retrieve relevant documents first, then pass them to a language model as context. The model reads your data on each request instead of memorizing it.",
  "prompting":
    "Guiding a model using written instructions and examples, without changing its weights.",
  "agentic":
    "A workflow where a model decides which tools or APIs to call across multiple steps to complete a task.",
  "interpretability":
    "How easy it is to explain why the system made a specific decision. High interpretability matters in regulated domains.",
  "labels":
    "Ground-truth answers attached to training examples. Most supervised learning requires them.",
  "modality":
    "The type of input: text, tables, images, audio, video, or code.",
  "inference":
    "Running a model on new inputs to get predictions. Distinct from training.",
  "retrieval":
    "Finding the most relevant items from a corpus or database for a given query.",
  "grounded":
    "Constrained to specific source material or live data, rather than relying on what the model memorized during training.",
  "latent":
    "An internal representation the model uses while processing, not directly visible in the input or output.",
  "adapter":
    "A small trainable module added to a pretrained model. Lets you adapt the model without updating all its parameters.",
}

export const GLOSSARY_TERMS = Object.keys(GLOSSARY).sort(
  (a, b) => b.length - a.length,
)
