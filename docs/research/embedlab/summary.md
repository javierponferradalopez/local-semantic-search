## Loaded

| key | dtype | ok | class | dim | maxpos | tokenizer max | warm load ms | error |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| minilm | fp32 | true | BertModel | 384 | 512 | 512 | 44 |  |
| minilm | q8 | true | BertModel | 384 | 512 | 512 | 22 |  |
| bge-small | fp32 | true | BertModel | 384 | 512 | 512 | 55 |  |
| bge-small | q8 | true | BertModel | 384 | 512 | 512 | 47 |  |
| bge-base | fp32 | true | BertModel | 768 | 512 | 512 | 143 |  |
| bge-base | q8 | true | BertModel | 768 | 512 | 512 | 95 |  |
| gte-small | fp32 | true | BertModel | 384 | 512 | 512 | 56 |  |
| gte-small | q8 | true | BertModel | 384 | 512 | 512 | 44 |  |
| gte-base | fp32 | true | BertModel | 768 | 512 | 512 | 137 |  |
| gte-base | q8 | true | BertModel | 768 | 512 | 512 | 96 |  |
| e5-small-v2 | fp32 | true | BertModel | 384 | 512 | 512 | 65 |  |
| e5-small-v2 | q8 | true | BertModel | 384 | 512 | 512 | 45 |  |
| me5-small | fp32 | true | BertModel | 384 | 512 | 512 | 189 |  |
| me5-small | q8 | true | BertModel | 384 | 512 | 512 | 55 |  |
| me5-base | fp32 | true | XLMRobertaModel | 768 | 514 | 512 | 548 |  |
| me5-base | q8 | true | XLMRobertaModel | 768 | 514 | 512 | 131 |  |
| nomic-1.5 | fp32 | true | NomicBertModel | 768 | 2048 | 8192 | 180 |  |
| nomic-1.5 | q8 | true | NomicBertModel | 768 | 2048 | 8192 | 126 |  |
| arctic-s | fp32 | true | BertModel | 384 | 512 | 512 | 53 |  |
| arctic-s | q8 | true | BertModel | 384 | 512 | 512 | 48 |  |
| arctic-m-1.5 | fp32 | true | BertModel | 768 | 512 | 512 | 142 |  |
| arctic-m-1.5 | q8 | true | BertModel | 768 | 512 | 512 | 106 |  |
| arctic-m-2.0 | q8 | true | PreTrainedModel | 768 | 8192 | 32768 | 153 |  |
| arctic-l-2.0 | q8 | true | XLMRobertaModel | 1024 | 8194 | 8192 | 321 |  |
| pmlm-l12 | fp32 | true | BertModel | 384 | 512 | 512 | 103 |  |
| pmlm-l12 | q8 | true | BertModel | 384 | 512 | 512 | 82 |  |
| jina-v2-es | fp32 | true | BertModel | 768 | 8192 | 512 | 221 |  |
| jina-v2-es | q8 | true | BertModel | 768 | 8192 | 512 | 138 |  |
| jina-v2-small-en | fp32 | false |  |  |  | 2147483648 |  | Could not locate file: "https://huggingface.co/jinaai/jina-embeddings-v2-small-en/resolve/ |
| jina-v3 | fp32 | false |  |  |  | 8194 |  | External data path validation failed for initializer: roberta.embeddings.word_embeddings.p |
| static-en | fp32 | false |  |  |  |  |  | Cannot read properties of undefined (reading 'tokenizer_class') |
| static-en | q8 | false |  |  |  |  |  | Cannot read properties of undefined (reading 'tokenizer_class') |
| static-multi | fp32 | false |  |  |  |  |  | Cannot read properties of undefined (reading 'tokenizer_class') |
| static-multi | q8 | false |  |  |  |  |  | Cannot read properties of undefined (reading 'tokenizer_class') |
| embgemma | fp32 | true | Gemma3Model | 768 | 2048 | 2048 | 136 |  |
| embgemma | q8 | true | Gemma3Model | 768 | 2048 | 2048 | 87 |  |
| qwen3-0.6b | q8 | true | Qwen3Model | 1024 | 32768 | 131072 | 364 |  |
| mxbai-large | q8 | true | BertModel | 1024 | 512 | 512 | 300 |  |
| granite-107m | fp32 | false |  |  |  | 512 |  | Could not locate file: "https://huggingface.co/ibm-granite/granite-embedding-107m-multilin |
| granite-r2-97m | fp32 | true | ModernBertModel | 384 | 32768 | 32768 | 125 |  |
| granite-r2-97m | q8 | false |  |  |  | 32768 |  | Could not locate file: "https://huggingface.co/ibm-granite/granite-embedding-97m-multiling |
| gte-multi | fp32 | false |  |  |  | 32768 |  | Could not locate file: "https://huggingface.co/Alibaba-NLP/gte-multilingual-base/resolve/m |
| potion-multi | fp32 | false | PreTrainedModel |  |  | 1e+30 |  | An error occurred during model execution: "Missing the following inputs: offsets. |
| granite-r2-311m | fp32 | true | ModernBertModel | 768 | 32768 | 32768 | 417 |  |
| granite-r2-311m | q8 | false |  |  |  | 32768 |  | Could not locate file: "https://huggingface.co/ibm-granite/granite-embedding-311m-multilin |
| me5-large | q8 | true | XLMRobertaModel | 1024 | 514 | 512 | 473 |  |

## Speed

| key | dtype | tokens/chunk | forward @1 | forward @32 | forward per chunk | embed per chunk | chunks/s | query fwd | query embed | RSS MB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| minilm | fp32 | 190 | 5.7 | 203.8 | 6.37 | 7.47 | 157 | 1.4 | 1.2 | 262 |
| minilm | q8 | 190 | 6.6 | 221.4 | 6.92 | 8.68 | 145 | 0.9 | 1.2 | 169 |
| bge-small | fp32 | 190 | 14.3 | 415.3 | 12.98 | 14.45 | 77 | 2.5 | 2.4 | 306 |
| bge-small | q8 | 190 | 14.9 | 454.8 | 14.21 | 15.89 | 70 | 1.9 | 2.3 | 187 |
| bge-base | fp32 | 190 | 26.3 | 1069.7 | 33.43 | 36.81 | 30 | 5.8 | 7.1 | 692 |
| bge-base | q8 | 190 | 31 | 1001.5 | 31.3 | 32.86 | 32 | 4.5 | 4.8 | 317 |
| gte-small | fp32 | 190 | 13 | 431.7 | 13.49 | 14.91 | 74 | 2 | 2.2 | 317 |
| gte-small | q8 | 190 | 13.5 | 461.1 | 14.41 | 15.86 | 69 | 1.6 | 1.4 | 187 |
| gte-base | fp32 | 190 | 27.9 | 1038.3 | 32.45 | 35.89 | 31 | 5.6 | 5.5 | 693 |
| gte-base | q8 | 190 | 30.8 | 999.6 | 31.24 | 34.63 | 32 | 2.5 | 2.6 | 318 |
| e5-small-v2 | fp32 | 192 | 12 | 426 | 13.31 | 15.18 | 75 | 2.1 | 2.3 | 306 |
| e5-small-v2 | q8 | 192 | 13.6 | 465.1 | 14.53 | 15.97 | 69 | 1.5 | 1.7 | 187 |
| me5-small | fp32 | 207 | 16.7 | 485.9 | 15.18 | 16.99 | 66 | 2 | 2.6 | 1601 |
| me5-small | q8 | 207 | 18 | 518.5 | 16.2 | 18.3 | 62 | 2.4 | 2.1 | 714 |
| me5-base | fp32 | 207 | 34.4 | 1145.3 | 35.79 | 38.48 | 28 | 5.6 | 5.6 | 2959 |
| me5-base | q8 | 207 | 34.3 | 1077.4 | 33.67 | 36.24 | 30 | 3.2 | 3.4 | 1103 |
| nomic-1.5 | fp32 | 194 | 42.1 | 1322.5 | 41.33 | 44.36 | 24 | 7.6 | 7.4 | 807 |
| nomic-1.5 | q8 | 194 | 42.7 | 1356.7 | 42.4 | 45.49 | 24 | 4.3 | 4.3 | 409 |
| arctic-s | fp32 | 190 | 13 | 417.6 | 13.05 | 14.12 | 77 | 2.6 | 2.5 | 319 |
| arctic-s | q8 | 190 | 13.2 | 444.4 | 13.89 | 14.97 | 72 | 2 | 2.1 | 187 |
| arctic-m-1.5 | fp32 | 190 | 28.3 | 1000.8 | 31.27 | 31.4 | 32 | 5.6 | 5.9 | 694 |
| arctic-m-1.5 | q8 | 190 | 30 | 936 | 29.25 | 29.5 | 34 | 4.1 | 3.7 | 319 |
| arctic-m-2.0 | q8 | 205 | 39.6 | 1297.3 | 40.54 | 40.38 | 25 | 3.9 | 3.4 | 1161 |
| arctic-l-2.0 | q8 | 205 | 108.3 | 3023.3 | 94.48 | 94 | 11 | 8.3 | 9 | 1842 |
| pmlm-l12 | fp32 | 205 | 15.1 | 475.7 | 14.87 | 16.22 | 67 | 2.2 | 2.3 | 1606 |
| pmlm-l12 | q8 | 205 | 16.4 | 510.9 | 15.97 | 17.47 | 63 | 1.5 | 1.5 | 716 |
| jina-v2-es | fp32 | 189 | 37.1 | 1397.2 | 43.66 | 45.61 | 23 | 7.1 | 7.2 | 1351 |
| jina-v2-es | q8 | 189 | 46.7 | 1298.3 | 40.57 | 42.99 | 25 | 3.1 | 3.2 | 456 |
| embgemma | fp32 | 190 | 39.9 | 1315.8 | 41.12 | 41.57 | 24 | 7.9 | 7.8 | 850 |
| embgemma | q8 | 190 | 69.1 | 1382.9 | 43.22 | 43.03 | 23 | 41.9 | 41.7 | 437 |
| qwen3-0.6b | q8 | 184 | 157.3 | 4926.6 | 153.96 | 156.8 | 6 | 26.7 | 27.1 | 1573 |
| mxbai-large | q8 | 190 | 90.3 | 2747.1 | 85.85 | 89.08 | 12 | 12.6 | 13.4 | 744 |
| granite-r2-97m | fp32 | 183 | 15 | 501.4 | 15.67 | 16.56 | 64 | 2.3 | 2.4 | 1386 |
| granite-r2-311m | fp32 | 183 | 46.5 | 1522.2 | 47.57 | 50.05 | 21 | 7.4 | 7.5 | 3959 |
| me5-large | q8 | 207 | 101.9 | 3180.6 | 99.39 | 100.82 | 10 | 9.3 | 9.5 | 1838 |

## Token window


### minilm fp32 (Xenova/all-MiniLM-L6-v2)
model_max_length=512 max_position_embeddings=512
paragraph=200 tok, long text=4874 tok
tokenizer: {"default":4874,"truncation:true":512,"truncation+max_length:512":512,"padding:max_length+truncation":512}
graph: {"32":"ok dims=1,32,384 finite=true","64":"ok dims=1,64,384 finite=true","128":"ok dims=1,128,384 finite=true","256":"ok dims=1,256,384 finite=true","512":"ok dims=1,512,384 finite=true","513":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 513 ","1024":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 1024 ","2048":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 2048 ","4096":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 4096 ","8192":"text too short to test"}

### minilm q8 (Xenova/all-MiniLM-L6-v2)
model_max_length=512 max_position_embeddings=512
paragraph=200 tok, long text=4874 tok
tokenizer: {"default":4874,"truncation:true":512,"truncation+max_length:512":512,"padding:max_length+truncation":512}
graph: {"32":"ok dims=1,32,384 finite=true","64":"ok dims=1,64,384 finite=true","128":"ok dims=1,128,384 finite=true","256":"ok dims=1,256,384 finite=true","512":"ok dims=1,512,384 finite=true","513":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 513 ","1024":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 1024 ","2048":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 2048 ","4096":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 4096 ","8192":"text too short to test"}

### bge-small fp32 (Xenova/bge-small-en-v1.5)
model_max_length=512 max_position_embeddings=512
paragraph=200 tok, long text=4874 tok
tokenizer: {"default":4874,"truncation:true":512,"truncation+max_length:512":512,"padding:max_length+truncation":512}
graph: {"32":"ok dims=1,32,384 finite=true","64":"ok dims=1,64,384 finite=true","128":"ok dims=1,128,384 finite=true","256":"ok dims=1,256,384 finite=true","512":"ok dims=1,512,384 finite=true","513":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 513 ","1024":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 1024 ","2048":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 2048 ","4096":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 4096 ","8192":"text too short to test"}

### bge-small q8 (Xenova/bge-small-en-v1.5)
model_max_length=512 max_position_embeddings=512
paragraph=200 tok, long text=4874 tok
tokenizer: {"default":4874,"truncation:true":512,"truncation+max_length:512":512,"padding:max_length+truncation":512}
graph: {"32":"ok dims=1,32,384 finite=true","64":"ok dims=1,64,384 finite=true","128":"ok dims=1,128,384 finite=true","256":"ok dims=1,256,384 finite=true","512":"ok dims=1,512,384 finite=true","513":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 513 ","1024":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 1024 ","2048":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 2048 ","4096":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 4096 ","8192":"text too short to test"}

### bge-base fp32 (Xenova/bge-base-en-v1.5)
model_max_length=512 max_position_embeddings=512
paragraph=200 tok, long text=4874 tok
tokenizer: {"default":4874,"truncation:true":512,"truncation+max_length:512":512,"padding:max_length+truncation":512}
graph: {"32":"ok dims=1,32,768 finite=true","64":"ok dims=1,64,768 finite=true","128":"ok dims=1,128,768 finite=true","256":"ok dims=1,256,768 finite=true","512":"ok dims=1,512,768 finite=true","513":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 513 ","1024":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 1024 ","2048":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 2048 ","4096":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 4096 ","8192":"text too short to test"}

### bge-base q8 (Xenova/bge-base-en-v1.5)
model_max_length=512 max_position_embeddings=512
paragraph=200 tok, long text=4874 tok
tokenizer: {"default":4874,"truncation:true":512,"truncation+max_length:512":512,"padding:max_length+truncation":512}
graph: {"32":"ok dims=1,32,768 finite=true","64":"ok dims=1,64,768 finite=true","128":"ok dims=1,128,768 finite=true","256":"ok dims=1,256,768 finite=true","512":"ok dims=1,512,768 finite=true","513":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 513 ","1024":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 1024 ","2048":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 2048 ","4096":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 4096 ","8192":"text too short to test"}

### gte-small fp32 (Xenova/gte-small)
model_max_length=512 max_position_embeddings=512
paragraph=200 tok, long text=4874 tok
tokenizer: {"default":4874,"truncation:true":512,"truncation+max_length:512":512,"padding:max_length+truncation":512}
graph: {"32":"ok dims=1,32,384 finite=true","64":"ok dims=1,64,384 finite=true","128":"ok dims=1,128,384 finite=true","256":"ok dims=1,256,384 finite=true","512":"ok dims=1,512,384 finite=true","513":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 513 ","1024":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 1024 ","2048":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 2048 ","4096":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 4096 ","8192":"text too short to test"}

### gte-small q8 (Xenova/gte-small)
model_max_length=512 max_position_embeddings=512
paragraph=200 tok, long text=4874 tok
tokenizer: {"default":4874,"truncation:true":512,"truncation+max_length:512":512,"padding:max_length+truncation":512}
graph: {"32":"ok dims=1,32,384 finite=true","64":"ok dims=1,64,384 finite=true","128":"ok dims=1,128,384 finite=true","256":"ok dims=1,256,384 finite=true","512":"ok dims=1,512,384 finite=true","513":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 513 ","1024":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 1024 ","2048":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 2048 ","4096":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 4096 ","8192":"text too short to test"}

### gte-base fp32 (Xenova/gte-base)
model_max_length=512 max_position_embeddings=512
paragraph=200 tok, long text=4874 tok
tokenizer: {"default":4874,"truncation:true":512,"truncation+max_length:512":512,"padding:max_length+truncation":512}
graph: {"32":"ok dims=1,32,768 finite=true","64":"ok dims=1,64,768 finite=true","128":"ok dims=1,128,768 finite=true","256":"ok dims=1,256,768 finite=true","512":"ok dims=1,512,768 finite=true","513":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 513 ","1024":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 1024 ","2048":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 2048 ","4096":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 4096 ","8192":"text too short to test"}

### gte-base q8 (Xenova/gte-base)
model_max_length=512 max_position_embeddings=512
paragraph=200 tok, long text=4874 tok
tokenizer: {"default":4874,"truncation:true":512,"truncation+max_length:512":512,"padding:max_length+truncation":512}
graph: {"32":"ok dims=1,32,768 finite=true","64":"ok dims=1,64,768 finite=true","128":"ok dims=1,128,768 finite=true","256":"ok dims=1,256,768 finite=true","512":"ok dims=1,512,768 finite=true","513":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 513 ","1024":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 1024 ","2048":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 2048 ","4096":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 4096 ","8192":"text too short to test"}

### e5-small-v2 fp32 (Xenova/e5-small-v2)
model_max_length=512 max_position_embeddings=512
paragraph=200 tok, long text=4874 tok
tokenizer: {"default":4874,"truncation:true":512,"truncation+max_length:512":512,"padding:max_length+truncation":512}
graph: {"32":"ok dims=1,32,384 finite=true","64":"ok dims=1,64,384 finite=true","128":"ok dims=1,128,384 finite=true","256":"ok dims=1,256,384 finite=true","512":"ok dims=1,512,384 finite=true","513":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 513 ","1024":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 1024 ","2048":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 2048 ","4096":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 4096 ","8192":"text too short to test"}

### e5-small-v2 q8 (Xenova/e5-small-v2)
model_max_length=512 max_position_embeddings=512
paragraph=200 tok, long text=4874 tok
tokenizer: {"default":4874,"truncation:true":512,"truncation+max_length:512":512,"padding:max_length+truncation":512}
graph: {"32":"ok dims=1,32,384 finite=true","64":"ok dims=1,64,384 finite=true","128":"ok dims=1,128,384 finite=true","256":"ok dims=1,256,384 finite=true","512":"ok dims=1,512,384 finite=true","513":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 513 ","1024":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 1024 ","2048":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 2048 ","4096":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 4096 ","8192":"text too short to test"}

### me5-small fp32 (Xenova/multilingual-e5-small)
model_max_length=512 max_position_embeddings=512
paragraph=216 tok, long text=5306 tok
tokenizer: {"default":5306,"truncation:true":512,"truncation+max_length:512":512,"padding:max_length+truncation":512}
graph: {"32":"ok dims=1,32,384 finite=true","64":"ok dims=1,64,384 finite=true","128":"ok dims=1,128,384 finite=true","256":"ok dims=1,256,384 finite=true","512":"ok dims=1,512,384 finite=true","513":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 513 ","1024":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 1024 ","2048":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 2048 ","4096":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 4096 ","8192":"text too short to test"}

### me5-small q8 (Xenova/multilingual-e5-small)
model_max_length=512 max_position_embeddings=512
paragraph=216 tok, long text=5306 tok
tokenizer: {"default":5306,"truncation:true":512,"truncation+max_length:512":512,"padding:max_length+truncation":512}
graph: {"32":"ok dims=1,32,384 finite=true","64":"ok dims=1,64,384 finite=true","128":"ok dims=1,128,384 finite=true","256":"ok dims=1,256,384 finite=true","512":"ok dims=1,512,384 finite=true","513":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 513 ","1024":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 1024 ","2048":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 2048 ","4096":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 4096 ","8192":"text too short to test"}

### me5-base fp32 (Xenova/multilingual-e5-base)
model_max_length=512 max_position_embeddings=514
paragraph=216 tok, long text=5306 tok
tokenizer: {"default":5306,"truncation:true":512,"truncation+max_length:512":512,"padding:max_length+truncation":512}
graph: {"32":"ok dims=1,32,768 finite=true","64":"ok dims=1,64,768 finite=true","128":"ok dims=1,128,768 finite=true","256":"ok dims=1,256,768 finite=true","512":"ok dims=1,512,768 finite=true","513":"FAIL Non-zero status code returned while running Gather node. Name:'/embeddings/position_embeddings/Gather' Status Message: indices element out of data bounds, idx=514 must be within the inclusive range [-514,513]","1024":"FAIL Non-zero status code returned while running Gather node. Name:'/embeddings/position_embeddings/Gather' Status Message: indices element out of data bounds, idx=514 must be within the inclusive range [-514,513]","2048":"FAIL Non-zero status code returned while running Gather node. Name:'/embeddings/position_embeddings/Gather' Status Message: indices element out of data bounds, idx=514 must be within the inclusive range [-514,513]","4096":"FAIL Non-zero status code returned while running Gather node. Name:'/embeddings/position_embeddings/Gather' Status Message: indices element out of data bounds, idx=514 must be within the inclusive range [-514,513]","8192":"text too short to test"}

### me5-base q8 (Xenova/multilingual-e5-base)
model_max_length=512 max_position_embeddings=514
paragraph=216 tok, long text=5306 tok
tokenizer: {"default":5306,"truncation:true":512,"truncation+max_length:512":512,"padding:max_length+truncation":512}
graph: {"32":"ok dims=1,32,768 finite=true","64":"ok dims=1,64,768 finite=true","128":"ok dims=1,128,768 finite=true","256":"ok dims=1,256,768 finite=true","512":"ok dims=1,512,768 finite=true","513":"FAIL Non-zero status code returned while running Gather node. Name:'/embeddings/position_embeddings/Gather' Status Message: indices element out of data bounds, idx=514 must be within the inclusive range [-514,513]","1024":"FAIL Non-zero status code returned while running Expand node. Name:'/Expand' Status Message: invalid expand shape","2048":"FAIL Non-zero status code returned while running Expand node. Name:'/Expand' Status Message: invalid expand shape","4096":"FAIL Non-zero status code returned while running Expand node. Name:'/Expand' Status Message: invalid expand shape","8192":"text too short to test"}

### nomic-1.5 fp32 (nomic-ai/nomic-embed-text-v1.5)
model_max_length=8192 max_position_embeddings=2048
paragraph=200 tok, long text=4874 tok
tokenizer: {"default":4874,"truncation:true":4874,"truncation+max_length:512":512,"padding:max_length+truncation":8192}
graph: {"32":"ok dims=1,32,768 finite=true","64":"ok dims=1,64,768 finite=true","128":"ok dims=1,128,768 finite=true","256":"ok dims=1,256,768 finite=true","512":"ok dims=1,512,768 finite=true","513":"ok dims=1,513,768 finite=true","1024":"ok dims=1,1024,768 finite=true","2048":"ok dims=1,2048,768 finite=true","4096":"ok dims=1,4096,768 finite=true","8192":"text too short to test"}

### nomic-1.5 q8 (nomic-ai/nomic-embed-text-v1.5)
model_max_length=8192 max_position_embeddings=2048
paragraph=200 tok, long text=4874 tok
tokenizer: {"default":4874,"truncation:true":4874,"truncation+max_length:512":512,"padding:max_length+truncation":8192}
graph: {"32":"ok dims=1,32,768 finite=true","64":"ok dims=1,64,768 finite=true","128":"ok dims=1,128,768 finite=true","256":"ok dims=1,256,768 finite=true","512":"ok dims=1,512,768 finite=true","513":"ok dims=1,513,768 finite=true","1024":"ok dims=1,1024,768 finite=true","2048":"ok dims=1,2048,768 finite=true","4096":"ok dims=1,4096,768 finite=true","8192":"text too short to test"}

### arctic-s fp32 (Snowflake/snowflake-arctic-embed-s)
model_max_length=512 max_position_embeddings=512
paragraph=200 tok, long text=4874 tok
tokenizer: {"default":4874,"truncation:true":512,"truncation+max_length:512":512,"padding:max_length+truncation":512}
graph: {"32":"ok dims=1,32,384 finite=true","64":"ok dims=1,64,384 finite=true","128":"ok dims=1,128,384 finite=true","256":"ok dims=1,256,384 finite=true","512":"ok dims=1,512,384 finite=true","513":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 513 ","1024":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 1024 ","2048":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 2048 ","4096":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 4096 ","8192":"text too short to test"}

### arctic-s q8 (Snowflake/snowflake-arctic-embed-s)
model_max_length=512 max_position_embeddings=512
paragraph=200 tok, long text=4874 tok
tokenizer: {"default":4874,"truncation:true":512,"truncation+max_length:512":512,"padding:max_length+truncation":512}
graph: {"32":"ok dims=1,32,384 finite=true","64":"ok dims=1,64,384 finite=true","128":"ok dims=1,128,384 finite=true","256":"ok dims=1,256,384 finite=true","512":"ok dims=1,512,384 finite=true","513":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 513 ","1024":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 1024 ","2048":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 2048 ","4096":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 4096 ","8192":"text too short to test"}

### arctic-m-1.5 fp32 (Snowflake/snowflake-arctic-embed-m-v1.5)
model_max_length=512 max_position_embeddings=512
paragraph=200 tok, long text=4874 tok
tokenizer: {"default":4874,"truncation:true":512,"truncation+max_length:512":512,"padding:max_length+truncation":512}
graph: {"32":"ok dims=1,32,768 finite=true","64":"ok dims=1,64,768 finite=true","128":"ok dims=1,128,768 finite=true","256":"ok dims=1,256,768 finite=true","512":"ok dims=1,512,768 finite=true","513":"FAIL Non-zero status code returned while running Expand node. Name:'/0/auto_model/Expand' Status Message: invalid expand shape","1024":"FAIL Non-zero status code returned while running Expand node. Name:'/0/auto_model/Expand' Status Message: invalid expand shape","2048":"FAIL Non-zero status code returned while running Expand node. Name:'/0/auto_model/Expand' Status Message: invalid expand shape","4096":"FAIL Non-zero status code returned while running Expand node. Name:'/0/auto_model/Expand' Status Message: invalid expand shape","8192":"text too short to test"}

### arctic-m-1.5 q8 (Snowflake/snowflake-arctic-embed-m-v1.5)
model_max_length=512 max_position_embeddings=512
paragraph=200 tok, long text=4874 tok
tokenizer: {"default":4874,"truncation:true":512,"truncation+max_length:512":512,"padding:max_length+truncation":512}
graph: {"32":"ok dims=1,32,768 finite=true","64":"ok dims=1,64,768 finite=true","128":"ok dims=1,128,768 finite=true","256":"ok dims=1,256,768 finite=true","512":"ok dims=1,512,768 finite=true","513":"FAIL Non-zero status code returned while running Expand node. Name:'/0/auto_model/Expand' Status Message: invalid expand shape","1024":"FAIL Non-zero status code returned while running Expand node. Name:'/0/auto_model/Expand' Status Message: invalid expand shape","2048":"FAIL Non-zero status code returned while running Expand node. Name:'/0/auto_model/Expand' Status Message: invalid expand shape","4096":"FAIL Non-zero status code returned while running Expand node. Name:'/0/auto_model/Expand' Status Message: invalid expand shape","8192":"text too short to test"}

### arctic-m-2.0 q8 (Snowflake/snowflake-arctic-embed-m-v2.0)
model_max_length=32768 max_position_embeddings=8192
paragraph=216 tok, long text=5306 tok
tokenizer: {"default":5306,"truncation:true":5306,"truncation+max_length:512":512,"padding:max_length+truncation":32768}
graph: {"32":"ok dims=1,32,768 finite=true","64":"ok dims=1,64,768 finite=true","128":"ok dims=1,128,768 finite=true","256":"ok dims=1,256,768 finite=true","512":"ok dims=1,512,768 finite=true","513":"ok dims=1,513,768 finite=true","1024":"ok dims=1,1024,768 finite=true","2048":"ok dims=1,2048,768 finite=true","4096":"ok dims=1,4096,768 finite=true","8192":"text too short to test"}

### arctic-l-2.0 q8 (Snowflake/snowflake-arctic-embed-l-v2.0)
model_max_length=8192 max_position_embeddings=8194
paragraph=216 tok, long text=5306 tok
tokenizer: {"default":5306,"truncation:true":5306,"truncation+max_length:512":512,"padding:max_length+truncation":8192}
graph: {"32":"ok dims=1,32,1024 finite=true","64":"ok dims=1,64,1024 finite=true","128":"ok dims=1,128,1024 finite=true","256":"ok dims=1,256,1024 finite=true","512":"ok dims=1,512,1024 finite=true","513":"ok dims=1,513,1024 finite=true","1024":"ok dims=1,1024,1024 finite=true","2048":"ok dims=1,2048,1024 finite=true","4096":"ok dims=1,4096,1024 finite=true","8192":"text too short to test"}

### pmlm-l12 fp32 (Xenova/paraphrase-multilingual-MiniLM-L12-v2)
model_max_length=512 max_position_embeddings=512
paragraph=216 tok, long text=5306 tok
tokenizer: {"default":5306,"truncation:true":512,"truncation+max_length:512":512,"padding:max_length+truncation":512}
graph: {"32":"ok dims=1,32,384 finite=true","64":"ok dims=1,64,384 finite=true","128":"ok dims=1,128,384 finite=true","256":"ok dims=1,256,384 finite=true","512":"ok dims=1,512,384 finite=true","513":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 513 ","1024":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 1024 ","2048":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 2048 ","4096":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 4096 ","8192":"text too short to test"}

### pmlm-l12 q8 (Xenova/paraphrase-multilingual-MiniLM-L12-v2)
model_max_length=512 max_position_embeddings=512
paragraph=216 tok, long text=5306 tok
tokenizer: {"default":5306,"truncation:true":512,"truncation+max_length:512":512,"padding:max_length+truncation":512}
graph: {"32":"ok dims=1,32,384 finite=true","64":"ok dims=1,64,384 finite=true","128":"ok dims=1,128,384 finite=true","256":"ok dims=1,256,384 finite=true","512":"ok dims=1,512,384 finite=true","513":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 513 ","1024":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 1024 ","2048":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 2048 ","4096":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 4096 ","8192":"text too short to test"}

### jina-v2-es fp32 (jinaai/jina-embeddings-v2-base-es)
model_max_length=512 max_position_embeddings=8192
paragraph=198 tok, long text=4851 tok
tokenizer: {"default":4851,"truncation:true":512,"truncation+max_length:512":512,"padding:max_length+truncation":512}
graph: {"32":"ok dims=1,32,768 finite=true","64":"ok dims=1,64,768 finite=true","128":"ok dims=1,128,768 finite=true","256":"ok dims=1,256,768 finite=true","512":"ok dims=1,512,768 finite=true","513":"ok dims=1,513,768 finite=true","1024":"ok dims=1,1024,768 finite=true","2048":"ok dims=1,2048,768 finite=true","4096":"ok dims=1,4096,768 finite=true","8192":"text too short to test"}

### jina-v2-es q8 (jinaai/jina-embeddings-v2-base-es)
model_max_length=512 max_position_embeddings=8192
paragraph=198 tok, long text=4851 tok
tokenizer: {"default":4851,"truncation:true":512,"truncation+max_length:512":512,"padding:max_length+truncation":512}
graph: {"32":"ok dims=1,32,768 finite=true","64":"ok dims=1,64,768 finite=true","128":"ok dims=1,128,768 finite=true","256":"ok dims=1,256,768 finite=true","512":"ok dims=1,512,768 finite=true","513":"ok dims=1,513,768 finite=true","1024":"ok dims=1,1024,768 finite=true","2048":"ok dims=1,2048,768 finite=true","4096":"ok dims=1,4096,768 finite=true","8192":"text too short to test"}

### embgemma fp32 (onnx-community/embeddinggemma-300m-ONNX)
model_max_length=2048 max_position_embeddings=2048
paragraph=194 tok, long text=4769 tok
tokenizer: {"default":4769,"truncation:true":2048,"truncation+max_length:512":512,"padding:max_length+truncation":2048}
graph: {"32":"ok dims=1,32,768 finite=true","64":"ok dims=1,64,768 finite=true","128":"ok dims=1,128,768 finite=true","256":"ok dims=1,256,768 finite=true","512":"ok dims=1,512,768 finite=true","513":"ok dims=1,513,768 finite=true","1024":"ok dims=1,1024,768 finite=true","2048":"ok dims=1,2048,768 finite=true","4096":"FAIL Non-zero status code returned while running RotaryEmbedding node. Name:'/model/layers.0/attn/k_rotary/RotaryEmbedding' Status Message: Updating cos_cache and sin_cache in RotaryEmbedding is not currently supported","8192":"text too short to test"}

### embgemma q8 (onnx-community/embeddinggemma-300m-ONNX)
model_max_length=2048 max_position_embeddings=2048
paragraph=194 tok, long text=4769 tok
tokenizer: {"default":4769,"truncation:true":2048,"truncation+max_length:512":512,"padding:max_length+truncation":2048}
graph: {"32":"ok dims=1,32,768 finite=true","64":"ok dims=1,64,768 finite=true","128":"ok dims=1,128,768 finite=true","256":"ok dims=1,256,768 finite=true","512":"ok dims=1,512,768 finite=true","513":"ok dims=1,513,768 finite=true","1024":"ok dims=1,1024,768 finite=true","2048":"ok dims=1,2048,768 finite=true","4096":"FAIL Non-zero status code returned while running RotaryEmbedding node. Name:'/model/layers.0/attn/k_rotary/RotaryEmbedding' Status Message: Updating cos_cache and sin_cache in RotaryEmbedding is not currently supported","8192":"text too short to test"}

### qwen3-0.6b q8 (onnx-community/Qwen3-Embedding-0.6B-ONNX)
model_max_length=131072 max_position_embeddings=32768
paragraph=194 tok, long text=4792 tok
tokenizer: {"default":4792,"truncation:true":4792,"truncation+max_length:512":512,"padding:max_length+truncation":131072}
graph: {"32":"ok dims=1,32,1024 finite=true","64":"ok dims=1,64,1024 finite=true","128":"ok dims=1,128,1024 finite=true","256":"ok dims=1,256,1024 finite=true","512":"ok dims=1,512,1024 finite=true","513":"ok dims=1,513,1024 finite=true","1024":"ok dims=1,1024,1024 finite=true","2048":"ok dims=1,2048,1024 finite=true","4096":"ok dims=1,4096,1024 finite=true","8192":"text too short to test"}

### mxbai-large q8 (mixedbread-ai/mxbai-embed-large-v1)
model_max_length=512 max_position_embeddings=512
paragraph=200 tok, long text=4874 tok
tokenizer: {"default":4874,"truncation:true":512,"truncation+max_length:512":512,"padding:max_length+truncation":512}
graph: {"32":"ok dims=1,32,1024 finite=true","64":"ok dims=1,64,1024 finite=true","128":"ok dims=1,128,1024 finite=true","256":"ok dims=1,256,1024 finite=true","512":"ok dims=1,512,1024 finite=true","513":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 513 ","1024":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 1024 ","2048":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 2048 ","4096":"FAIL Non-zero status code returned while running Add node. Name:'/embeddings/Add_1' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/providers/cpu/math/element_wise_ops.h:583 void onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t) axis == 1 || axis == largest was false. Attempting to broadcast an axis by a dimension other than 1. 512 by 4096 ","8192":"text too short to test"}

### granite-r2-97m fp32 (ibm-granite/granite-embedding-97m-multilingual-r2)
model_max_length=32768 max_position_embeddings=32768
paragraph=193 tok, long text=4730 tok
tokenizer: {"default":4730,"truncation:true":4730,"truncation+max_length:512":512,"padding:max_length+truncation":32768}
graph: {"32":"ok dims=1,32,384 finite=true","64":"ok dims=1,64,384 finite=true","128":"ok dims=1,128,384 finite=true","256":"ok dims=1,256,384 finite=true","512":"ok dims=1,512,384 finite=true","513":"ok dims=1,513,384 finite=true","1024":"ok dims=1,1024,384 finite=true","2048":"ok dims=1,2048,384 finite=true","4096":"ok dims=1,4096,384 finite=true","8192":"text too short to test"}

### granite-r2-311m fp32 (ibm-granite/granite-embedding-311m-multilingual-r2)
model_max_length=32768 max_position_embeddings=32768
paragraph=193 tok, long text=4768 tok
tokenizer: {"default":4768,"truncation:true":4768,"truncation+max_length:512":512,"padding:max_length+truncation":32768}
graph: {"32":"ok dims=1,32,768 finite=true","64":"ok dims=1,64,768 finite=true","128":"ok dims=1,128,768 finite=true","256":"ok dims=1,256,768 finite=true","512":"ok dims=1,512,768 finite=true","513":"ok dims=1,513,768 finite=true","1024":"ok dims=1,1024,768 finite=true","2048":"ok dims=1,2048,768 finite=true","4096":"ok dims=1,4096,768 finite=true","8192":"text too short to test"}

### me5-large q8 (Xenova/multilingual-e5-large)
model_max_length=512 max_position_embeddings=514
paragraph=216 tok, long text=5306 tok
tokenizer: {"default":5306,"truncation:true":512,"truncation+max_length:512":512,"padding:max_length+truncation":512}
graph: {"32":"ok dims=1,32,1024 finite=true","64":"ok dims=1,64,1024 finite=true","128":"ok dims=1,128,1024 finite=true","256":"ok dims=1,256,1024 finite=true","512":"ok dims=1,512,1024 finite=true","513":"FAIL Non-zero status code returned while running Gather node. Name:'/embeddings/position_embeddings/Gather' Status Message: indices element out of data bounds, idx=514 must be within the inclusive range [-514,513]","1024":"FAIL Non-zero status code returned while running Expand node. Name:'/Expand' Status Message: invalid expand shape","2048":"FAIL Non-zero status code returned while running Expand node. Name:'/Expand' Status Message: invalid expand shape","4096":"FAIL Non-zero status code returned while running Expand node. Name:'/Expand' Status Message: invalid expand shape","8192":"text too short to test"}

## Language probe

| key | dtype | mode | dim | hits@1 | ranks of the wanted passage | ranks of the other-language twin |
| --- | --- | --- | --- | --- | --- | --- |
| minilm | fp32 | | | FAILED | | |
| minilm | q8 | | | FAILED | | |
| bge-small | fp32 | | | FAILED | | |
| bge-small | q8 | | | FAILED | | |
| bge-base | fp32 | | | FAILED | | |
| bge-base | q8 | | | FAILED | | |
| gte-small | fp32 | | | FAILED | | |
| gte-small | q8 | | | FAILED | | |
| gte-base | fp32 | | | FAILED | | |
| gte-base | q8 | | | FAILED | | |
| e5-small-v2 | fp32 | | | FAILED | | |
| e5-small-v2 | q8 | | | FAILED | | |
| me5-small | fp32 | | | FAILED | | |
| me5-small | q8 | | | FAILED | | |
| me5-base | fp32 | | | FAILED | | |
| me5-base | q8 | | | FAILED | | |
| nomic-1.5 | fp32 | | | FAILED | | |
| nomic-1.5 | q8 | | | FAILED | | |
| arctic-s | fp32 | | | FAILED | | |
| arctic-s | q8 | | | FAILED | | |
| arctic-m-1.5 | fp32 | | | FAILED | | |
| arctic-m-1.5 | q8 | | | FAILED | | |
| arctic-m-2.0 | q8 | | | FAILED | | |
| arctic-l-2.0 | q8 | | | FAILED | | |
| pmlm-l12 | fp32 | | | FAILED | | |
| pmlm-l12 | q8 | | | FAILED | | |
| jina-v2-es | fp32 | | | FAILED | | |
| jina-v2-es | q8 | | | FAILED | | |
| embgemma | fp32 | | | FAILED | | |
| embgemma | q8 | | | FAILED | | |
| qwen3-0.6b | q8 | | | FAILED | | |
| mxbai-large | q8 | | | FAILED | | |
| granite-r2-97m | fp32 | | | FAILED | | |
| granite-r2-311m | fp32 | | | FAILED | | |
| me5-large | q8 | | | FAILED | | |

## Matryoshka


### minilm fp32 full=384 claimed=null
| width | identical ranking | same top-1 | mean score shift | hits@1 |
| --- | --- | --- | --- | --- |
| 64 | 0/20 | 14/20 | 0.0846 | 13/20 |
| 128 | 0/20 | 15/20 | 0.054 | 13/20 |
| 256 | 0/20 | 18/20 | 0.0231 | 16/20 |
| 384 | 20/20 | 20/20 | 0 | 17/20 |

### minilm q8 full=384 claimed=null
| width | identical ranking | same top-1 | mean score shift | hits@1 |
| --- | --- | --- | --- | --- |
| 64 | 0/20 | 15/20 | 0.0836 | 14/20 |
| 128 | 0/20 | 16/20 | 0.0534 | 14/20 |
| 256 | 0/20 | 18/20 | 0.0228 | 16/20 |
| 384 | 20/20 | 20/20 | 0 | 17/20 |

### bge-small fp32 full=384 claimed=null
| width | identical ranking | same top-1 | mean score shift | hits@1 |
| --- | --- | --- | --- | --- |
| 64 | 0/20 | 14/20 | 0.083 | 14/20 |
| 128 | 0/20 | 16/20 | 0.0564 | 14/20 |
| 256 | 0/20 | 18/20 | 0.0205 | 15/20 |
| 384 | 20/20 | 20/20 | 0 | 16/20 |

### bge-small q8 full=384 claimed=null
| width | identical ranking | same top-1 | mean score shift | hits@1 |
| --- | --- | --- | --- | --- |
| 64 | 0/20 | 14/20 | 0.0834 | 14/20 |
| 128 | 0/20 | 17/20 | 0.0573 | 15/20 |
| 256 | 0/20 | 17/20 | 0.0206 | 14/20 |
| 384 | 20/20 | 20/20 | 0 | 16/20 |

### bge-base fp32 full=768 claimed=null
| width | identical ranking | same top-1 | mean score shift | hits@1 |
| --- | --- | --- | --- | --- |
| 64 | 0/20 | 16/20 | 0.087 | 14/20 |
| 128 | 0/20 | 18/20 | 0.0596 | 17/20 |
| 256 | 0/20 | 19/20 | 0.039 | 17/20 |
| 512 | 0/20 | 19/20 | 0.0143 | 17/20 |
| 768 | 20/20 | 20/20 | 0 | 18/20 |

### bge-base q8 full=768 claimed=null
| width | identical ranking | same top-1 | mean score shift | hits@1 |
| --- | --- | --- | --- | --- |
| 64 | 0/20 | 15/20 | 0.0868 | 13/20 |
| 128 | 0/20 | 17/20 | 0.06 | 17/20 |
| 256 | 0/20 | 19/20 | 0.0384 | 18/20 |
| 512 | 0/20 | 20/20 | 0.0145 | 17/20 |
| 768 | 20/20 | 20/20 | 0 | 17/20 |

### gte-small fp32 full=384 claimed=null
| width | identical ranking | same top-1 | mean score shift | hits@1 |
| --- | --- | --- | --- | --- |
| 64 | 0/20 | 15/20 | 0.0389 | 16/20 |
| 128 | 0/20 | 17/20 | 0.0211 | 17/20 |
| 256 | 0/20 | 19/20 | 0.0097 | 17/20 |
| 384 | 20/20 | 20/20 | 0 | 18/20 |

### gte-small q8 full=384 claimed=null
| width | identical ranking | same top-1 | mean score shift | hits@1 |
| --- | --- | --- | --- | --- |
| 64 | 0/20 | 15/20 | 0.0385 | 16/20 |
| 128 | 0/20 | 16/20 | 0.0211 | 16/20 |
| 256 | 0/20 | 19/20 | 0.0095 | 17/20 |
| 384 | 20/20 | 20/20 | 0 | 18/20 |

### gte-base fp32 full=768 claimed=null
| width | identical ranking | same top-1 | mean score shift | hits@1 |
| --- | --- | --- | --- | --- |
| 64 | 0/20 | 15/20 | 0.0427 | 15/20 |
| 128 | 0/20 | 18/20 | 0.0236 | 17/20 |
| 256 | 0/20 | 18/20 | 0.014 | 17/20 |
| 512 | 0/20 | 18/20 | 0.0056 | 18/20 |
| 768 | 20/20 | 20/20 | 0 | 19/20 |

### gte-base q8 full=768 claimed=null
| width | identical ranking | same top-1 | mean score shift | hits@1 |
| --- | --- | --- | --- | --- |
| 64 | 0/20 | 16/20 | 0.0426 | 16/20 |
| 128 | 0/20 | 18/20 | 0.0235 | 17/20 |
| 256 | 0/20 | 18/20 | 0.0136 | 17/20 |
| 512 | 0/20 | 17/20 | 0.0056 | 18/20 |
| 768 | 20/20 | 20/20 | 0 | 19/20 |

### e5-small-v2 fp32 full=384 claimed=null
| width | identical ranking | same top-1 | mean score shift | hits@1 |
| --- | --- | --- | --- | --- |
| 64 | 0/20 | 11/20 | 0.0494 | 11/20 |
| 128 | 0/20 | 15/20 | 0.0181 | 16/20 |
| 256 | 0/20 | 18/20 | 0.0086 | 17/20 |
| 384 | 20/20 | 20/20 | 0 | 16/20 |

### e5-small-v2 q8 full=384 claimed=null
| width | identical ranking | same top-1 | mean score shift | hits@1 |
| --- | --- | --- | --- | --- |
| 64 | 0/20 | 11/20 | 0.0491 | 11/20 |
| 128 | 0/20 | 15/20 | 0.0182 | 16/20 |
| 256 | 0/20 | 18/20 | 0.0085 | 18/20 |
| 384 | 20/20 | 20/20 | 0 | 17/20 |

### me5-small fp32 full=384 claimed=null
| width | identical ranking | same top-1 | mean score shift | hits@1 |
| --- | --- | --- | --- | --- |
| 64 | 0/20 | 16/20 | 0.0285 | 16/20 |
| 128 | 0/20 | 19/20 | 0.0181 | 19/20 |
| 256 | 0/20 | 20/20 | 0.0081 | 20/20 |
| 384 | 20/20 | 20/20 | 0 | 20/20 |

### me5-small q8 full=384 claimed=null
| width | identical ranking | same top-1 | mean score shift | hits@1 |
| --- | --- | --- | --- | --- |
| 64 | 0/20 | 16/20 | 0.0281 | 16/20 |
| 128 | 0/20 | 18/20 | 0.0182 | 18/20 |
| 256 | 0/20 | 20/20 | 0.008 | 20/20 |
| 384 | 20/20 | 20/20 | 0 | 20/20 |

### me5-base fp32 full=768 claimed=null
| width | identical ranking | same top-1 | mean score shift | hits@1 |
| --- | --- | --- | --- | --- |
| 64 | 0/20 | 14/20 | 0.0329 | 14/20 |
| 128 | 0/20 | 18/20 | 0.0209 | 18/20 |
| 256 | 0/20 | 19/20 | 0.0143 | 19/20 |
| 512 | 0/20 | 20/20 | 0.0073 | 20/20 |
| 768 | 20/20 | 20/20 | 0 | 20/20 |

### me5-base q8 full=768 claimed=null
| width | identical ranking | same top-1 | mean score shift | hits@1 |
| --- | --- | --- | --- | --- |
| 64 | 0/20 | 15/20 | 0.0337 | 15/20 |
| 128 | 0/20 | 18/20 | 0.0219 | 18/20 |
| 256 | 0/20 | 19/20 | 0.0149 | 19/20 |
| 512 | 0/20 | 20/20 | 0.0076 | 20/20 |
| 768 | 20/20 | 20/20 | 0 | 20/20 |

### nomic-1.5 fp32 full=768 claimed=[64,128,256,512,768]
| width | identical ranking | same top-1 | mean score shift | hits@1 |
| --- | --- | --- | --- | --- |
| 64 | 0/20 | 18/20 | 0.0863 | 15/20 |
| 128 | 0/20 | 18/20 | 0.0499 | 15/20 |
| 256 | 0/20 | 16/20 | 0.0293 | 14/20 |
| 512 | 0/20 | 18/20 | 0.0118 | 15/20 |
| 768 | 20/20 | 20/20 | 0 | 17/20 |

### nomic-1.5 q8 full=768 claimed=[64,128,256,512,768]
| width | identical ranking | same top-1 | mean score shift | hits@1 |
| --- | --- | --- | --- | --- |
| 64 | 0/20 | 18/20 | 0.0869 | 15/20 |
| 128 | 0/20 | 20/20 | 0.0453 | 15/20 |
| 256 | 0/20 | 17/20 | 0.0279 | 14/20 |
| 512 | 0/20 | 20/20 | 0.0107 | 15/20 |
| 768 | 20/20 | 20/20 | 0 | 15/20 |

### arctic-s fp32 full=384 claimed=null
| width | identical ranking | same top-1 | mean score shift | hits@1 |
| --- | --- | --- | --- | --- |
| 64 | 0/20 | 13/20 | 0.1244 | 13/20 |
| 128 | 0/20 | 18/20 | 0.1303 | 15/20 |
| 256 | 0/20 | 20/20 | 0.0513 | 17/20 |
| 384 | 20/20 | 20/20 | 0 | 17/20 |

### arctic-s q8 full=384 claimed=null
| width | identical ranking | same top-1 | mean score shift | hits@1 |
| --- | --- | --- | --- | --- |
| 64 | 0/20 | 13/20 | 0.1319 | 13/20 |
| 128 | 0/20 | 18/20 | 0.135 | 15/20 |
| 256 | 0/20 | 19/20 | 0.0503 | 16/20 |
| 384 | 20/20 | 20/20 | 0 | 17/20 |

### arctic-m-1.5 fp32 full=768 claimed=[256,768]
| width | identical ranking | same top-1 | mean score shift | hits@1 |
| --- | --- | --- | --- | --- |
| 256 | 0/20 | 19/20 | 0.0459 | 16/20 |
| 768 | 20/20 | 20/20 | 0 | 16/20 |

### arctic-m-1.5 q8 full=768 claimed=[256,768]
| width | identical ranking | same top-1 | mean score shift | hits@1 |
| --- | --- | --- | --- | --- |
| 256 | 0/20 | 19/20 | 0.0456 | 16/20 |
| 768 | 20/20 | 20/20 | 0 | 16/20 |

### arctic-m-2.0 q8 full=768 claimed=null
| width | identical ranking | same top-1 | mean score shift | hits@1 |
| --- | --- | --- | --- | --- |
| 64 | 0/20 | 15/20 | 0.0877 | 14/20 |
| 128 | 0/20 | 18/20 | 0.049 | 15/20 |
| 256 | 0/20 | 18/20 | 0.0142 | 15/20 |
| 512 | 0/20 | 18/20 | 0.0131 | 15/20 |
| 768 | 20/20 | 20/20 | 0 | 17/20 |

### arctic-l-2.0 q8 full=1024 claimed=[256,1024]
| width | identical ranking | same top-1 | mean score shift | hits@1 |
| --- | --- | --- | --- | --- |
| 256 | 0/20 | 18/20 | 0.0151 | 18/20 |
| 1024 | 20/20 | 20/20 | 0 | 16/20 |

### pmlm-l12 fp32 full=384 claimed=null
| width | identical ranking | same top-1 | mean score shift | hits@1 |
| --- | --- | --- | --- | --- |
| 64 | 0/20 | 13/20 | 0.09 | 9/20 |
| 128 | 0/20 | 17/20 | 0.0528 | 11/20 |
| 256 | 0/20 | 19/20 | 0.027 | 13/20 |
| 384 | 20/20 | 20/20 | 0 | 12/20 |

### pmlm-l12 q8 full=384 claimed=null
| width | identical ranking | same top-1 | mean score shift | hits@1 |
| --- | --- | --- | --- | --- |
| 64 | 0/20 | 16/20 | 0.0903 | 11/20 |
| 128 | 0/20 | 16/20 | 0.0529 | 11/20 |
| 256 | 0/20 | 19/20 | 0.0272 | 12/20 |
| 384 | 20/20 | 20/20 | 0 | 11/20 |

### jina-v2-es fp32 full=768 claimed=null
| width | identical ranking | same top-1 | mean score shift | hits@1 |
| --- | --- | --- | --- | --- |
| 64 | 0/20 | 13/20 | 0.0996 | 11/20 |
| 128 | 0/20 | 17/20 | 0.0599 | 14/20 |
| 256 | 0/20 | 19/20 | 0.038 | 15/20 |
| 512 | 0/20 | 20/20 | 0.0201 | 14/20 |
| 768 | 20/20 | 20/20 | 0 | 14/20 |

### jina-v2-es q8 full=768 claimed=null
| width | identical ranking | same top-1 | mean score shift | hits@1 |
| --- | --- | --- | --- | --- |
| 64 | 0/20 | 12/20 | 0.1038 | 12/20 |
| 128 | 0/20 | 15/20 | 0.0642 | 14/20 |
| 256 | 0/20 | 18/20 | 0.0384 | 14/20 |
| 512 | 0/20 | 20/20 | 0.0201 | 14/20 |
| 768 | 20/20 | 20/20 | 0 | 14/20 |

### embgemma fp32 full=768 claimed=[128,256,512,768]
| width | identical ranking | same top-1 | mean score shift | hits@1 |
| --- | --- | --- | --- | --- |
| 128 | 0/20 | 18/20 | 0.0994 | 18/20 |
| 256 | 0/20 | 18/20 | 0.0499 | 18/20 |
| 512 | 0/20 | 19/20 | 0.02 | 19/20 |
| 768 | 20/20 | 20/20 | 0 | 18/20 |

### embgemma q8 full=768 claimed=[128,256,512,768]
| width | identical ranking | same top-1 | mean score shift | hits@1 |
| --- | --- | --- | --- | --- |
| 128 | 0/20 | 18/20 | 0.0945 | 18/20 |
| 256 | 0/20 | 17/20 | 0.0475 | 17/20 |
| 512 | 0/20 | 19/20 | 0.0195 | 19/20 |
| 768 | 20/20 | 20/20 | 0 | 18/20 |

### qwen3-0.6b q8 full=1024 claimed=null
| width | identical ranking | same top-1 | mean score shift | hits@1 |
| --- | --- | --- | --- | --- |
| 64 | 0/20 | 13/20 | 0.1011 | 13/20 |
| 128 | 0/20 | 16/20 | 0.0679 | 14/20 |
| 256 | 0/20 | 19/20 | 0.0456 | 16/20 |
| 512 | 0/20 | 18/20 | 0.0259 | 15/20 |
| 1024 | 20/20 | 20/20 | 0 | 15/20 |

### mxbai-large q8 full=1024 claimed=null
| width | identical ranking | same top-1 | mean score shift | hits@1 |
| --- | --- | --- | --- | --- |
| 64 | 0/20 | 11/20 | 0.0717 | 14/20 |
| 128 | 0/20 | 16/20 | 0.058 | 16/20 |
| 256 | 0/20 | 17/20 | 0.0454 | 17/20 |
| 512 | 0/20 | 18/20 | 0.0386 | 15/20 |
| 1024 | 20/20 | 20/20 | 0 | 15/20 |

### granite-r2-97m fp32 full=384 claimed=[128,256,384]
| width | identical ranking | same top-1 | mean score shift | hits@1 |
| --- | --- | --- | --- | --- |
| 128 | 0/20 | 16/20 | 0.3545 | 14/20 |
| 256 | 0/20 | 19/20 | 0.2759 | 17/20 |
| 384 | 20/20 | 20/20 | 0 | 18/20 |

### granite-r2-311m fp32 full=768 claimed=[128,256,512,768]
| width | identical ranking | same top-1 | mean score shift | hits@1 |
| --- | --- | --- | --- | --- |
| 128 | 0/20 | 19/20 | 0.0125 | 13/20 |
| 256 | 0/20 | 19/20 | 0.0067 | 13/20 |
| 512 | 0/20 | 19/20 | 0.0043 | 13/20 |
| 768 | 20/20 | 20/20 | 0 | 14/20 |

### me5-large q8 full=1024 claimed=null
| width | identical ranking | same top-1 | mean score shift | hits@1 |
| --- | --- | --- | --- | --- |
| 64 | 0/20 | 14/20 | 0.0339 | 14/20 |
| 128 | 0/20 | 18/20 | 0.0299 | 18/20 |
| 256 | 0/20 | 20/20 | 0.0209 | 20/20 |
| 512 | 0/20 | 20/20 | 0.0119 | 20/20 |
| 1024 | 20/20 | 20/20 | 0 | 20/20 |

## fp32 against q8

| key | dim | long-text cos | identical ranking | same top-1 | hits@1 fp32 | hits@1 q8 |
| --- | --- | --- | --- | --- | --- | --- |
| minilm | 384 | 0.9948 | 1/20 | 20/20 | 17/20 | 17/20 |
| bge-small | 384 | 0.9979 | 0/20 | 20/20 | 16/20 | 16/20 |
| bge-base | 768 | 0.9797 | 0/20 | 19/20 | 18/20 | 17/20 |
| gte-small | 384 | 0.9986 | 0/20 | 20/20 | 18/20 | 18/20 |
| gte-base | 768 | 0.9905 | 0/20 | 20/20 | 19/20 | 19/20 |
| e5-small-v2 | 384 | 0.9976 | 1/20 | 19/20 | 16/20 | 17/20 |
| me5-small | 384 | 0.9991 | 2/20 | 20/20 | 20/20 | 20/20 |
| me5-base | 768 | 0.9878 | 0/20 | 20/20 | 20/20 | 20/20 |
| nomic-1.5 | 768 | 0.9638 | 0/20 | 18/20 | 17/20 | 15/20 |
| arctic-s | 384 | 0.9857 | 0/20 | 20/20 | 17/20 | 17/20 |
| arctic-m-1.5 | 768 | 0.9942 | 0/20 | 19/20 | 16/20 | 16/20 |
| pmlm-l12 | 384 | 0.9968 | 8/20 | 19/20 | 12/20 | 11/20 |
| jina-v2-es | 768 | 0.9478 | 0/20 | 20/20 | 14/20 | 14/20 |
| embgemma | 768 | 0.982 | 0/20 | 20/20 | 18/20 | 18/20 |

## Long window wall


### arctic-m-2.0 q8 tokenizer=32768 maxpos=8192
  2048: ok in 779 ms, dims=1,768, finite=true
  4096: ok in 2343 ms, dims=1,768, finite=true
  8192: ok in 8803 ms, dims=1,768, finite=true
  8193: FAIL Non-zero status code returned while running Gather node. Name:'/0/auto_model/embeddings/word_embeddings/Gather' Status Message: /Users/cloudtest/vss/_work/1/s/onnxruntime/core/framework/op_kernel.cc:83 virtual OrtValue *

### embgemma q8 tokenizer=2048 maxpos=2048
  2048: ok in 1021 ms, dims=1,768, finite=true
  4096: FAIL Non-zero status code returned while running RotaryEmbedding node. Name:'/model/layers.0/attn/k_rotary/RotaryEmbedding' Status Message: Updating cos_cache and sin_cache in RotaryEmbedding is not currently supported
