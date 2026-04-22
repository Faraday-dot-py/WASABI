# Decision logic

All logic lives in `lib/decision-engine/engine.ts`. This document explains the
reasoning behind the scoring and how to modify it safely.

## Shape of the computation

```
answers
  │
  ▼
computeHidden1(answers)                   # 6 concept activations
  │
  ▼
computeHidden2(answers, hidden1)          # 6 approach-family activations
  │
  ▼
computePathScores(answers, h1, h2)        # 8 path scores (raw)
  │
  ├──► normalize for output-layer display
  └──► sort for primary + alternatives
```

## Hidden-1 concepts

| id           | means                                                               |
| ------------ | ------------------------------------------------------------------- |
| `structured` | problem looks like structured / tabular / analytical work           |
| `linguistic` | problem is about language, text, code, or speech                    |
| `generative` | problem requires creative or novel output                           |
| `data-thin`  | data or label situation is weak                                     |
| `constrained`| privacy, interpretability, latency, compute, or stakes constrain us |
| `grounded`   | the answer has to come from specific knowledge, tools, or freshness |

Each raw answer contributes a small amount of evidence to one or more
concepts. Evidence is clamped to `[0, 1]`.

## Hidden-2 approach families

| id                  | means                                           |
| ------------------- | ----------------------------------------------- |
| `rules-lean`        | lean toward no-AI / rules / analytics           |
| `classical-lean`    | lean toward classical ML                        |
| `pretrained-lean`   | lean toward pretrained / prompting              |
| `retrieval-lean`    | lean toward RAG                                 |
| `adapt-lean`        | lean toward fine-tuning / small custom          |
| `orchestrate-lean`  | lean toward tool-using / agentic workflows      |

Hidden-2 is computed from hidden-1 plus a few direct answer signals
(`necessity`, `stage`, etc.).

## Path scoring

`computePathScores` assigns a numeric score to each of the 8 build paths.
It is the source of truth for the recommendation. Scores are the sum of:

1. Baseline contributions from hidden-2.
2. Direct rules for correctness-critical signals (e.g. privacy
   disfavoring hosted LLMs, no-labels disfavoring supervised paths).

The top score is the primary recommendation. The next two are the
alternatives.

## Why both hidden layers and direct rules?

Hidden layers give the visualization a real, continuous story — the user
sees "Language" light up when they pick text, and that shift flows
forward into `pretrained-lean` and `retrieval-lean`. Direct rules give the
recommendation defensibility: some signals (privacy, no labels) must
have a large, auditable impact that does not get averaged away.

## How to modify safely

- **Change question copy:** edit `questions.ts`. No other changes needed.
- **Add a new question:** add it to `QUESTIONS`, then extend
  `computeHidden1` / `computeHidden2` / `computePathScores` with rules for
  its answer values. The network will gain an input node automatically.
- **Add a new path:** add it to `PATHS`, add entries in `computePathScores`,
  and give it a row in `PATH_BY_ID`. The network will gain an output node
  automatically.
- **Tune a recommendation:** edit the relevant `+=` / `-=` lines in
  `computePathScores`. Run the site and answer realistic personas — the
  network responds instantly.

## Extensibility notes

`EngineHooks` in `engine.ts` defines the two V2 hooks. In V1 they are
documentation only; adding an implementation is strictly additive.
