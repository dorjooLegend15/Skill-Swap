# Private survey data

Never commit the original respondent CSV or another row-level survey export.
`skillswap_data.csv` is ignored by Git. Keep the original in private storage
outside the repository and mount it read-only into the backend at runtime.

Set `SKILLSWAP_DATASET_PATH` to the absolute path of that mounted CSV, for example:

```text
SKILLSWAP_DATASET_PATH=/run/private/skillswap_data.csv
```

When the variable is unset, the app uses `skillswap_demo_data.csv`, a small
fully synthetic dataset with no respondent IDs, contact details, or real survey
responses. The app does not silently fall back to the demo file if a configured
private path is missing; it fails at startup with the missing path.

The private CSV must contain the questionnaire fields used by the recommender:
`age`, `main_skill`, `second_skill`, `skill_level`, `want_to_learn`,
`target_level`, `interest`, `goal`, `learning_style`, `availability`, and
`preferred_partner_level`. Other source columns are ignored. API responses
contain ranked skills and non-counted explanations only; respondent rows, IDs,
source ages, and row-level answers are never returned.