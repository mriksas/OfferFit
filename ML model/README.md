# ML experiment

This directory contains the Colab training experiment for the ATS score regressor.
The dataset is intentionally not stored in this Git repository.

## Dataset

- Source: [0xnbk/resume-ats-score-v1-en](https://huggingface.co/datasets/0xnbk/resume-ats-score-v1-en)
- License: Apache 2.0
- Splits: 5,099 training examples and 1,275 validation examples

The training script loads the dataset from Hugging Face automatically. Install the
additional loader before running it in a fresh environment:

```bash
pip install datasets
```

For an offline run, place `train.csv` and `validation.csv` in the current working
directory. Local CSV files, model outputs, and checkpoints are excluded by the
repository's `.gitignore`.

