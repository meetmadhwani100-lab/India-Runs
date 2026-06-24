---
tags:
- sentence-transformers
- sentence-similarity
- feature-extraction
- generated_from_trainer
- dataset_size:80000
- loss:CosineSimilarityLoss
base_model: BAAI/bge-base-en-v1.5
widget:
- source_sentence: Looking for a Senior AI/ML Engineer and LLM Practitioner. Must
    have deep expertise in Python, NLP systems, Vector Databases, and Information
    Retrieval.
  sentences:
  - 'Current Title: Content Writer. Professional Headline: Content Writer | Driving
    business outcomes. Location Details: Kochi, Kerala.'
  - 'Current Title: Civil Engineer. Professional Headline: Civil Engineer | Driving
    business outcomes. Location Details: New York.'
  - 'Current Title: HR Manager. Professional Headline: HR Manager | AI enthusiast
    | Building with LLMs. Location Details: Jaipur, Rajasthan.'
- source_sentence: Looking for a Senior AI/ML Engineer and LLM Practitioner. Must
    have deep expertise in Python, NLP systems, Vector Databases, and Information
    Retrieval.
  sentences:
  - 'Current Title: Project Manager. Professional Headline: Project Manager | Driving
    business outcomes. Location Details: London.'
  - 'Current Title: Sales Executive. Professional Headline: Sales Executive | Helping
    teams scale. Location Details: Kolkata, West Bengal.'
  - 'Current Title: Business Analyst. Professional Headline: Business Analyst | Helping
    teams scale. Location Details: New York.'
- source_sentence: Looking for a Senior AI/ML Engineer and LLM Practitioner. Must
    have deep expertise in Python, NLP systems, Vector Databases, and Information
    Retrieval.
  sentences:
  - 'Current Title: Business Analyst. Professional Headline: Business Analyst | 11.3+
    yrs experience. Location Details: Mumbai, Maharashtra.'
  - 'Current Title: Sales Executive. Professional Headline: Sales Executive | Driving
    business outcomes. Location Details: Singapore.'
  - 'Current Title: .NET Developer. Professional Headline: .NET Developer | Cloud
    & DevOps. Location Details: Vizag, Andhra Pradesh.'
- source_sentence: Looking for a Senior AI/ML Engineer and LLM Practitioner. Must
    have deep expertise in Python, NLP systems, Vector Databases, and Information
    Retrieval.
  sentences:
  - 'Current Title: Mechanical Engineer. Professional Headline: Mechanical Engineer
    | Helping teams scale. Location Details: Chennai, Tamil Nadu.'
  - 'Current Title: Operations Manager. Professional Headline: Operations Manager
    | 1.2+ yrs experience. Location Details: Ahmedabad, Gujarat.'
  - 'Current Title: Civil Engineer. Professional Headline: Civil Engineer | Driving
    business outcomes. Location Details: Austin.'
- source_sentence: Looking for a Senior AI/ML Engineer and LLM Practitioner. Must
    have deep expertise in Python, NLP systems, Vector Databases, and Information
    Retrieval.
  sentences:
  - 'Current Title: Civil Engineer. Professional Headline: Civil Engineer | 8.9+ yrs
    experience. Location Details: Ahmedabad, Gujarat.'
  - 'Current Title: Project Manager. Professional Headline: Project Manager | Driving
    business outcomes. Location Details: Singapore.'
  - 'Current Title: Software Engineer. Professional Headline: Software Engineer |
    Cloud & DevOps. Location Details: Hyderabad, Telangana.'
pipeline_tag: sentence-similarity
library_name: sentence-transformers
metrics:
- pearson_cosine
- spearman_cosine
model-index:
- name: SentenceTransformer based on BAAI/bge-base-en-v1.5
  results:
  - task:
      type: semantic-similarity
      name: Semantic Similarity
    dataset:
      name: Unknown
      type: unknown
    metrics:
    - type: pearson_cosine
      value: 0.4199523094578701
      name: Pearson Cosine
    - type: spearman_cosine
      value: 0.3703514233566504
      name: Spearman Cosine
---

# SentenceTransformer based on BAAI/bge-base-en-v1.5

This is a [sentence-transformers](https://www.SBERT.net) model finetuned from [BAAI/bge-base-en-v1.5](https://huggingface.co/BAAI/bge-base-en-v1.5). It maps sentences & paragraphs to a 768-dimensional dense vector space and can be used for retrieval.

## Model Details

### Model Description
- **Model Type:** Sentence Transformer
- **Base model:** [BAAI/bge-base-en-v1.5](https://huggingface.co/BAAI/bge-base-en-v1.5) <!-- at revision a5beb1e3e68b9ab74eb54cfd186867f64f240e1a -->
- **Maximum Sequence Length:** 512 tokens
- **Output Dimensionality:** 768 dimensions
- **Similarity Function:** Cosine Similarity
- **Supported Modality:** Text
<!-- - **Training Dataset:** Unknown -->
<!-- - **Language:** Unknown -->
<!-- - **License:** Unknown -->

### Model Sources

- **Documentation:** [Sentence Transformers Documentation](https://sbert.net)
- **Repository:** [Sentence Transformers on GitHub](https://github.com/huggingface/sentence-transformers)
- **Hugging Face:** [Sentence Transformers on Hugging Face](https://huggingface.co/models?library=sentence-transformers)

### Full Model Architecture

```
SentenceTransformer(
  (0): Transformer({'transformer_task': 'feature-extraction', 'modality_config': {'text': {'method': 'forward', 'method_output_name': 'last_hidden_state'}}, 'module_output_name': 'token_embeddings', 'architecture': 'BertModel'})
  (1): Pooling({'embedding_dimension': 768, 'pooling_mode': 'cls', 'include_prompt': True})
  (2): Normalize({})
)
```

## Usage

### Direct Usage (Sentence Transformers)

First install the Sentence Transformers library:

```bash
pip install -U sentence-transformers
```
Then you can load this model and run inference.
```python
from sentence_transformers import SentenceTransformer

# Download from the 🤗 Hub
model = SentenceTransformer("sentence_transformers_model_id")
# Run inference
sentences = [
    'Looking for a Senior AI/ML Engineer and LLM Practitioner. Must have deep expertise in Python, NLP systems, Vector Databases, and Information Retrieval.',
    'Current Title: Project Manager. Professional Headline: Project Manager | Driving business outcomes. Location Details: Singapore.',
    'Current Title: Software Engineer. Professional Headline: Software Engineer | Cloud & DevOps. Location Details: Hyderabad, Telangana.',
]
embeddings = model.encode(sentences)
print(embeddings.shape)
# [3, 768]

# Get the similarity scores for the embeddings
similarities = model.similarity(embeddings, embeddings)
print(similarities)
# tensor([[1.0000, 0.2396, 0.2096],
#         [0.2396, 1.0000, 0.9598],
#         [0.2096, 0.9598, 1.0000]])
```
<!--
### Direct Usage (Transformers)

<details><summary>Click to see the direct usage in Transformers</summary>

</details>
-->

<!--
### Downstream Usage (Sentence Transformers)

You can finetune this model on your own dataset.

<details><summary>Click to expand</summary>

</details>
-->

<!--
### Out-of-Scope Use

*List how the model may foreseeably be misused and address what users ought not to do with the model.*
-->

## Evaluation

### Metrics

#### Semantic Similarity

* Evaluated with [<code>EmbeddingSimilarityEvaluator</code>](https://sbert.net/docs/package_reference/sentence_transformer/evaluation.html#sentence_transformers.sentence_transformer.evaluation.EmbeddingSimilarityEvaluator)

| Metric              | Value      |
|:--------------------|:-----------|
| pearson_cosine      | 0.42       |
| **spearman_cosine** | **0.3704** |

<!--
## Bias, Risks and Limitations

*What are the known or foreseeable issues stemming from this model? You could also flag here known failure cases or weaknesses of the model.*
-->

<!--
### Recommendations

*What are recommendations with respect to the foreseeable issues? For example, filtering explicit content.*
-->

## Training Details

### Training Dataset

#### Unnamed Dataset

* Size: 80,000 training samples
* Columns: <code>sentence_0</code>, <code>sentence_1</code>, and <code>label</code>
* Approximate statistics based on the first 1000 samples:
  |         | sentence_0                                                                        | sentence_1                                                                         | label                                                           |
  |:--------|:----------------------------------------------------------------------------------|:-----------------------------------------------------------------------------------|:----------------------------------------------------------------|
  | type    | string                                                                            | string                                                                             | float                                                           |
  | details | <ul><li>min: 33 tokens</li><li>mean: 33.0 tokens</li><li>max: 33 tokens</li></ul> | <ul><li>min: 21 tokens</li><li>mean: 27.43 tokens</li><li>max: 41 tokens</li></ul> | <ul><li>min: 0.0</li><li>mean: 0.26</li><li>max: 0.65</li></ul> |
* Samples:
  | sentence_0                                                                                                                                                           | sentence_1                                                                                                                                             | label                            |
  |:---------------------------------------------------------------------------------------------------------------------------------------------------------------------|:-------------------------------------------------------------------------------------------------------------------------------------------------------|:---------------------------------|
  | <code>Looking for a Senior AI/ML Engineer and LLM Practitioner. Must have deep expertise in Python, NLP systems, Vector Databases, and Information Retrieval.</code> | <code>Current Title: Mechanical Engineer. Professional Headline: Mechanical Engineer \| Driving business outcomes. Location Details: Singapore.</code> | <code>0.23859883844852448</code> |
  | <code>Looking for a Senior AI/ML Engineer and LLM Practitioner. Must have deep expertise in Python, NLP systems, Vector Databases, and Information Retrieval.</code> | <code>Current Title: Frontend Engineer. Professional Headline: Frontend Engineer \| Cloud & DevOps. Location Details: Singapore.</code>                | <code>0.142775297164917</code>   |
  | <code>Looking for a Senior AI/ML Engineer and LLM Practitioner. Must have deep expertise in Python, NLP systems, Vector Databases, and Information Retrieval.</code> | <code>Current Title: QA Engineer. Professional Headline: QA Engineer \| Full-stack development. Location Details: Singapore.</code>                    | <code>0.0</code>                 |
* Loss: [<code>CosineSimilarityLoss</code>](https://sbert.net/docs/package_reference/sentence_transformer/losses.html#cosinesimilarityloss) with these parameters:
  ```json
  {
      "loss_fct": "torch.nn.modules.loss.MSELoss",
      "cos_score_transformation": "torch.nn.modules.linear.Identity"
  }
  ```

### Training Hyperparameters
#### Non-Default Hyperparameters

- `eval_strategy`: steps
- `per_device_train_batch_size`: 16
- `per_device_eval_batch_size`: 16
- `num_train_epochs`: 2
- `multi_dataset_batch_sampler`: round_robin

#### All Hyperparameters
<details><summary>Click to expand</summary>

- `do_predict`: False
- `eval_strategy`: steps
- `prediction_loss_only`: True
- `per_device_train_batch_size`: 16
- `per_device_eval_batch_size`: 16
- `gradient_accumulation_steps`: 1
- `eval_accumulation_steps`: None
- `torch_empty_cache_steps`: None
- `learning_rate`: 5e-05
- `weight_decay`: 0.0
- `adam_beta1`: 0.9
- `adam_beta2`: 0.999
- `adam_epsilon`: 1e-08
- `max_grad_norm`: 1
- `num_train_epochs`: 2
- `max_steps`: -1
- `lr_scheduler_type`: linear
- `lr_scheduler_kwargs`: None
- `warmup_ratio`: None
- `warmup_steps`: 0
- `log_level`: passive
- `log_level_replica`: warning
- `log_on_each_node`: True
- `logging_nan_inf_filter`: True
- `enable_jit_checkpoint`: False
- `save_on_each_node`: False
- `save_only_model`: False
- `restore_callback_states_from_checkpoint`: False
- `use_cpu`: False
- `seed`: 42
- `data_seed`: None
- `bf16`: False
- `fp16`: False
- `bf16_full_eval`: False
- `fp16_full_eval`: False
- `tf32`: None
- `local_rank`: -1
- `ddp_backend`: None
- `debug`: []
- `dataloader_drop_last`: False
- `dataloader_num_workers`: 0
- `dataloader_prefetch_factor`: None
- `disable_tqdm`: False
- `remove_unused_columns`: True
- `label_names`: None
- `load_best_model_at_end`: False
- `ignore_data_skip`: False
- `fsdp`: []
- `fsdp_config`: {'min_num_params': 0, 'xla': False, 'xla_fsdp_v2': False, 'xla_fsdp_grad_ckpt': False}
- `accelerator_config`: {'split_batches': False, 'dispatch_batches': None, 'even_batches': True, 'use_seedable_sampler': True, 'non_blocking': False, 'gradient_accumulation_kwargs': None}
- `parallelism_config`: None
- `deepspeed`: None
- `label_smoothing_factor`: 0.0
- `optim`: adamw_torch_fused
- `optim_args`: None
- `group_by_length`: False
- `length_column_name`: length
- `project`: huggingface
- `trackio_space_id`: trackio
- `ddp_find_unused_parameters`: None
- `ddp_bucket_cap_mb`: None
- `ddp_broadcast_buffers`: False
- `dataloader_pin_memory`: True
- `dataloader_persistent_workers`: False
- `skip_memory_metrics`: True
- `push_to_hub`: False
- `resume_from_checkpoint`: None
- `hub_model_id`: None
- `hub_strategy`: every_save
- `hub_private_repo`: None
- `hub_always_push`: False
- `hub_revision`: None
- `gradient_checkpointing`: False
- `gradient_checkpointing_kwargs`: None
- `include_for_metrics`: []
- `eval_do_concat_batches`: True
- `auto_find_batch_size`: False
- `full_determinism`: False
- `ddp_timeout`: 1800
- `torch_compile`: False
- `torch_compile_backend`: None
- `torch_compile_mode`: None
- `include_num_input_tokens_seen`: no
- `neftune_noise_alpha`: None
- `optim_target_modules`: None
- `batch_eval_metrics`: False
- `eval_on_start`: False
- `use_liger_kernel`: False
- `liger_kernel_config`: None
- `eval_use_gather_object`: False
- `average_tokens_across_devices`: True
- `use_cache`: False
- `prompts`: None
- `batch_sampler`: batch_sampler
- `multi_dataset_batch_sampler`: round_robin
- `router_mapping`: {}
- `learning_rate_mapping`: {}

</details>

### Training Logs
<details><summary>Click to expand</summary>

| Epoch  | Step | Training Loss | spearman_cosine |
|:------:|:----:|:-------------:|:---------------:|
| 0.008  | 20   | -             | 0.0913          |
| 0.016  | 40   | -             | 0.0923          |
| 0.024  | 60   | -             | 0.0979          |
| 0.032  | 80   | -             | 0.1278          |
| 0.04   | 100  | -             | 0.1625          |
| 0.048  | 120  | -             | 0.1933          |
| 0.056  | 140  | -             | 0.2052          |
| 0.064  | 160  | -             | 0.2126          |
| 0.072  | 180  | -             | 0.2195          |
| 0.08   | 200  | -             | 0.2342          |
| 0.088  | 220  | -             | 0.2187          |
| 0.096  | 240  | -             | 0.2385          |
| 0.104  | 260  | -             | 0.2776          |
| 0.112  | 280  | -             | 0.3002          |
| 0.12   | 300  | -             | 0.3131          |
| 0.128  | 320  | -             | 0.3384          |
| 0.136  | 340  | -             | 0.3453          |
| 0.144  | 360  | -             | 0.3348          |
| 0.152  | 380  | -             | 0.3460          |
| 0.16   | 400  | -             | 0.3304          |
| 0.168  | 420  | -             | 0.3542          |
| 0.176  | 440  | -             | 0.3310          |
| 0.184  | 460  | -             | 0.3543          |
| 0.192  | 480  | -             | 0.3564          |
| 0.2    | 500  | 0.0181        | 0.3543          |
| 0.208  | 520  | -             | 0.3167          |
| 0.216  | 540  | -             | 0.3540          |
| 0.224  | 560  | -             | 0.3354          |
| 0.232  | 580  | -             | 0.3467          |
| 0.24   | 600  | -             | 0.3417          |
| 0.248  | 620  | -             | 0.3586          |
| 0.256  | 640  | -             | 0.3597          |
| 0.264  | 660  | -             | 0.3585          |
| 0.272  | 680  | -             | 0.3546          |
| 0.28   | 700  | -             | 0.3611          |
| 0.288  | 720  | -             | 0.3591          |
| 0.296  | 740  | -             | 0.3566          |
| 0.304  | 760  | -             | 0.3536          |
| 0.312  | 780  | -             | 0.3597          |
| 0.32   | 800  | -             | 0.3595          |
| 0.328  | 820  | -             | 0.3518          |
| 0.336  | 840  | -             | 0.3585          |
| 0.344  | 860  | -             | 0.3572          |
| 0.352  | 880  | -             | 0.3561          |
| 0.36   | 900  | -             | 0.3576          |
| 0.368  | 920  | -             | 0.3578          |
| 0.376  | 940  | -             | 0.3564          |
| 0.384  | 960  | -             | 0.3609          |
| 0.392  | 980  | -             | 0.3590          |
| 0.4    | 1000 | 0.0121        | 0.3560          |
| 0.408  | 1020 | -             | 0.3596          |
| 0.416  | 1040 | -             | 0.3583          |
| 0.424  | 1060 | -             | 0.3610          |
| 0.432  | 1080 | -             | 0.3596          |
| 0.44   | 1100 | -             | 0.3606          |
| 0.448  | 1120 | -             | 0.3584          |
| 0.456  | 1140 | -             | 0.3577          |
| 0.464  | 1160 | -             | 0.3564          |
| 0.472  | 1180 | -             | 0.3592          |
| 0.48   | 1200 | -             | 0.3594          |
| 0.488  | 1220 | -             | 0.3627          |
| 0.496  | 1240 | -             | 0.3652          |
| 0.504  | 1260 | -             | 0.3559          |
| 0.512  | 1280 | -             | 0.3612          |
| 0.52   | 1300 | -             | 0.3608          |
| 0.528  | 1320 | -             | 0.3645          |
| 0.536  | 1340 | -             | 0.3643          |
| 0.544  | 1360 | -             | 0.3634          |
| 0.552  | 1380 | -             | 0.3639          |
| 0.56   | 1400 | -             | 0.3626          |
| 0.568  | 1420 | -             | 0.3635          |
| 0.576  | 1440 | -             | 0.3654          |
| 0.584  | 1460 | -             | 0.3649          |
| 0.592  | 1480 | -             | 0.3652          |
| 0.6    | 1500 | 0.0119        | 0.3681          |
| 0.608  | 1520 | -             | 0.3698          |
| 0.616  | 1540 | -             | 0.3692          |
| 0.624  | 1560 | -             | 0.3678          |
| 0.632  | 1580 | -             | 0.3673          |
| 0.64   | 1600 | -             | 0.3671          |
| 0.648  | 1620 | -             | 0.3623          |
| 0.656  | 1640 | -             | 0.3674          |
| 0.664  | 1660 | -             | 0.3665          |
| 0.672  | 1680 | -             | 0.3658          |
| 0.68   | 1700 | -             | 0.3643          |
| 0.688  | 1720 | -             | 0.3586          |
| 0.696  | 1740 | -             | 0.3627          |
| 0.704  | 1760 | -             | 0.3649          |
| 0.712  | 1780 | -             | 0.3666          |
| 0.72   | 1800 | -             | 0.3670          |
| 0.728  | 1820 | -             | 0.3657          |
| 0.736  | 1840 | -             | 0.3656          |
| 0.744  | 1860 | -             | 0.3669          |
| 0.752  | 1880 | -             | 0.3654          |
| 0.76   | 1900 | -             | 0.3654          |
| 0.768  | 1920 | -             | 0.3677          |
| 0.776  | 1940 | -             | 0.3685          |
| 0.784  | 1960 | -             | 0.3685          |
| 0.792  | 1980 | -             | 0.3689          |
| 0.8    | 2000 | 0.0119        | 0.3688          |
| 0.808  | 2020 | -             | 0.3692          |
| 0.816  | 2040 | -             | 0.3690          |
| 0.824  | 2060 | -             | 0.3641          |
| 0.832  | 2080 | -             | 0.3637          |
| 0.84   | 2100 | -             | 0.3650          |
| 0.848  | 2120 | -             | 0.3645          |
| 0.856  | 2140 | -             | 0.3639          |
| 0.864  | 2160 | -             | 0.3630          |
| 0.872  | 2180 | -             | 0.3655          |
| 0.88   | 2200 | -             | 0.3664          |
| 0.888  | 2220 | -             | 0.3674          |
| 0.896  | 2240 | -             | 0.3675          |
| 0.904  | 2260 | -             | 0.3691          |
| 0.912  | 2280 | -             | 0.3701          |
| 0.92   | 2300 | -             | 0.3690          |
| 0.928  | 2320 | -             | 0.3681          |
| 0.936  | 2340 | -             | 0.3688          |
| 0.944  | 2360 | -             | 0.3677          |
| 0.952  | 2380 | -             | 0.3695          |
| 0.96   | 2400 | -             | 0.3699          |
| 0.968  | 2420 | -             | 0.3693          |
| 0.976  | 2440 | -             | 0.3701          |
| 0.984  | 2460 | -             | 0.3683          |
| 0.992  | 2480 | -             | 0.3675          |
| 1.0    | 2500 | 0.0116        | 0.3686          |
| 1.008  | 2520 | -             | 0.3681          |
| 1.016  | 2540 | -             | 0.3678          |
| 1.024  | 2560 | -             | 0.3700          |
| 1.032  | 2580 | -             | 0.3691          |
| 1.04   | 2600 | -             | 0.3685          |
| 1.048  | 2620 | -             | 0.3674          |
| 1.056  | 2640 | -             | 0.3700          |
| 1.064  | 2660 | -             | 0.3685          |
| 1.072  | 2680 | -             | 0.3702          |
| 1.08   | 2700 | -             | 0.3701          |
| 1.088  | 2720 | -             | 0.3687          |
| 1.096  | 2740 | -             | 0.3678          |
| 1.104  | 2760 | -             | 0.3699          |
| 1.112  | 2780 | -             | 0.3692          |
| 1.12   | 2800 | -             | 0.3694          |
| 1.1280 | 2820 | -             | 0.3691          |
| 1.1360 | 2840 | -             | 0.3681          |
| 1.144  | 2860 | -             | 0.3655          |
| 1.152  | 2880 | -             | 0.3677          |
| 1.16   | 2900 | -             | 0.3687          |
| 1.168  | 2920 | -             | 0.3687          |
| 1.176  | 2940 | -             | 0.3679          |
| 1.184  | 2960 | -             | 0.3658          |
| 1.192  | 2980 | -             | 0.3632          |
| 1.2    | 3000 | 0.0115        | 0.3646          |
| 1.208  | 3020 | -             | 0.3638          |
| 1.216  | 3040 | -             | 0.3654          |
| 1.224  | 3060 | -             | 0.3662          |
| 1.232  | 3080 | -             | 0.3655          |
| 1.24   | 3100 | -             | 0.3653          |
| 1.248  | 3120 | -             | 0.3679          |
| 1.256  | 3140 | -             | 0.3667          |
| 1.264  | 3160 | -             | 0.3675          |
| 1.272  | 3180 | -             | 0.3662          |
| 1.28   | 3200 | -             | 0.3662          |
| 1.288  | 3220 | -             | 0.3651          |
| 1.296  | 3240 | -             | 0.3623          |
| 1.304  | 3260 | -             | 0.3643          |
| 1.312  | 3280 | -             | 0.3671          |
| 1.32   | 3300 | -             | 0.3690          |
| 1.328  | 3320 | -             | 0.3694          |
| 1.336  | 3340 | -             | 0.3684          |
| 1.3440 | 3360 | -             | 0.3693          |
| 1.3520 | 3380 | -             | 0.3675          |
| 1.3600 | 3400 | -             | 0.3670          |
| 1.3680 | 3420 | -             | 0.3657          |
| 1.376  | 3440 | -             | 0.3652          |
| 1.384  | 3460 | -             | 0.3689          |
| 1.392  | 3480 | -             | 0.3691          |
| 1.4    | 3500 | 0.0116        | 0.3690          |
| 1.408  | 3520 | -             | 0.3690          |
| 1.416  | 3540 | -             | 0.3699          |
| 1.424  | 3560 | -             | 0.3693          |
| 1.432  | 3580 | -             | 0.3689          |
| 1.44   | 3600 | -             | 0.3691          |
| 1.448  | 3620 | -             | 0.3681          |
| 1.456  | 3640 | -             | 0.3675          |
| 1.464  | 3660 | -             | 0.3645          |
| 1.472  | 3680 | -             | 0.3666          |
| 1.48   | 3700 | -             | 0.3668          |
| 1.488  | 3720 | -             | 0.3666          |
| 1.496  | 3740 | -             | 0.3675          |
| 1.504  | 3760 | -             | 0.3670          |
| 1.512  | 3780 | -             | 0.3686          |
| 1.52   | 3800 | -             | 0.3681          |
| 1.528  | 3820 | -             | 0.3688          |
| 1.536  | 3840 | -             | 0.3683          |
| 1.544  | 3860 | -             | 0.3704          |

</details>

### Training Time
- **Training**: 5.6 hours

### Framework Versions
- Python: 3.12.13
- Sentence Transformers: 5.4.0
- Transformers: 5.0.0
- PyTorch: 2.10.0+cu128
- Accelerate: 1.13.0
- Datasets: 4.8.5
- Tokenizers: 0.22.2

## Citation

### BibTeX

#### Sentence Transformers
```bibtex
@inproceedings{reimers-2019-sentence-bert,
    title = "Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks",
    author = "Reimers, Nils and Gurevych, Iryna",
    booktitle = "Proceedings of the 2019 Conference on Empirical Methods in Natural Language Processing",
    month = "11",
    year = "2019",
    publisher = "Association for Computational Linguistics",
    url = "https://arxiv.org/abs/1908.10084",
}
```

<!--
## Glossary

*Clearly define terms in order to be accessible across audiences.*
-->

<!--
## Model Card Authors

*Lists the people who create the model card, providing recognition and accountability for the detailed work that goes into its construction.*
-->

<!--
## Model Card Contact

*Provides a way for people who have updates to the Model Card, suggestions, or questions, to contact the Model Card authors.*
-->