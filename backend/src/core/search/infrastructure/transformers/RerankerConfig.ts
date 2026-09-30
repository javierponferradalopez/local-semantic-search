import {AutoConfig, PretrainedConfig} from '@huggingface/transformers';
import {RERANKER_MODEL} from './RerankerModel';

export const RerankerConfig = {
  async load(): Promise<PretrainedConfig> {
    return new PretrainedConfig({
      ...(await AutoConfig.from_pretrained(RERANKER_MODEL.repository)),
      ...RERANKER_MODEL.config
    });
  }
};
