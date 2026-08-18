"""
High-Performance NLP Model Trainer for SkillSwap AI.
Loads 'training_dataset.json', trains multi-class Intent Classifier & N-Gram Matcher,
evaluates test accuracy, and serializes the production model.
"""

import os
import json
import pickle
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, accuracy_score
from app.ml.build_dataset import generate_dataset
from app.ml.train_model import SUBJECT_KNOWLEDGE

def train_nlp_pipeline():
    dataset_path = os.path.join(os.path.dirname(__file__), "training_dataset.json")
    if not os.path.exists(dataset_path):
        generate_dataset(dataset_path, total_samples=25000)

    print(f">>> Loading training dataset from: {dataset_path}")
    with open(dataset_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    texts = [item["text"] for item in data]
    labels = [item["intent"] for item in data]

    print(f"Total samples: {len(texts)}")

    # Train / Test Split (80% / 20%)
    X_train, X_test, y_train, y_test = train_test_split(
        texts, labels, test_size=0.2, random_state=42, stratify=labels
    )

    print(f"Training on {len(X_train)} samples, testing on {len(X_test)} samples...")

    # Build Pipeline with Character and Sub-word TF-IDF
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(
            analyzer='char_wb',
            ngram_range=(2, 5),
            lowercase=True,
            sublinear_tf=True,
            min_df=2
        )),
        ('clf', LogisticRegression(
            C=10.0,
            max_iter=1000,
            solver='lbfgs',
            class_weight='balanced',
            random_state=42
        ))
    ])

    pipeline.fit(X_train, y_train)

    # Evaluate
    y_pred = pipeline.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print("=" * 60)
    print(f"🏆 MODEL TEST ACCURACY: {acc * 100:.2f}%")
    print("=" * 60)
    print(classification_report(y_test, y_pred, digits=4))

    # Save to trained_nlp_engine.pkl
    output_model_path = os.path.join(os.path.dirname(__file__), "trained_nlp_engine.pkl")
    save_package = {
        "pipeline": pipeline,
        "subject_knowledge": SUBJECT_KNOWLEDGE,
        "accuracy": acc
    }

    with open(output_model_path, "wb") as f:
        pickle.dump(save_package, f)

    print(f"[SUCCESS] High-accuracy production NLP model saved to: {output_model_path}")
    return output_model_path

if __name__ == "__main__":
    train_nlp_pipeline()
