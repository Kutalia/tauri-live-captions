import {
  AutoProcessor,
  AutoTokenizer,
  full,
  PreTrainedModel,
  PreTrainedTokenizer,
  Processor,
  ProgressCallback,
  TextStreamer,
  WhisperForConditionalGeneration
} from '@huggingface/transformers'
import {
  DEFAULT_CAPTIONS_CONFIG,
  DEFAULT_STT_MODEL_OPTION,
  STT_MODEL_OPTIONS,
  WhisperModelSizeOptions
} from '../utils/constants'

const MAX_NEW_TOKENS = 64

/**
 * This class uses the Singleton pattern to ensure that only one instance of the model is loaded.
 */
class AutomaticSpeechRecognitionPipeline {
  static model_size = DEFAULT_STT_MODEL_OPTION
  static language: string | null = null
  static task: 'translate' | 'transcribe' = 'translate'
  static tokenizer: Promise<PreTrainedTokenizer> | null = null
  static processor: Promise<Processor> | null = null
  static model: Promise<PreTrainedModel> | null = null
  static usingGPU = false

  static async getInstance(progress_callback?: ProgressCallback) {
    const model_id = STT_MODEL_OPTIONS[this.model_size].id

    this.tokenizer ??= AutoTokenizer.from_pretrained(model_id, {
      progress_callback
    })
    this.processor ??= AutoProcessor.from_pretrained(model_id, {
      progress_callback
    })

    this.model ??= WhisperForConditionalGeneration.from_pretrained(model_id, {
      ...STT_MODEL_OPTIONS[this.model_size].options,
      device: 'webgpu',
      progress_callback
    })

    return Promise.all([this.tokenizer, this.processor, this.model])
  }

  static configure(
    config: Partial<{
      task: (typeof AutomaticSpeechRecognitionPipeline)['task']
      language: (typeof AutomaticSpeechRecognitionPipeline)['language']
      modelSize: WhisperModelSizeOptions
      usingGPU: boolean
    }>
  ) {
    if (Object.prototype.hasOwnProperty.call(config, 'language')) {
      AutomaticSpeechRecognitionPipeline.language = config.language as Exclude<
        typeof config.language,
        undefined
      >
    }
    if (Object.prototype.hasOwnProperty.call(config, 'task')) {
      AutomaticSpeechRecognitionPipeline.task = config.task as Exclude<
        typeof config.task,
        undefined
      >
    }
    if (Object.prototype.hasOwnProperty.call(config, 'modelSize') && config['modelSize']) {
      AutomaticSpeechRecognitionPipeline.model_size = config.modelSize as Exclude<
        typeof config.modelSize,
        undefined
      >
    }
    if (
      Object.prototype.hasOwnProperty.call(config, 'usingGPU') &&
      typeof config['usingGPU'] === 'boolean'
    ) {
      AutomaticSpeechRecognitionPipeline.usingGPU = config.usingGPU
    }
  }
}

let processing = false
async function generate({ audio }: { audio: Float32Array }) {
  if (processing) return
  processing = true

  // Tell the main thread we are starting
  self.postMessage({ status: 'start' })

  // Retrieve the text-generation pipeline.
  const [tokenizer, processor, model] = await AutomaticSpeechRecognitionPipeline.getInstance()

  let startTime: number
  let numTokens = 0
  let tps: number
  const token_callback_function = () => {
    startTime ??= performance.now()

    if (numTokens++ > 0) {
      tps = (numTokens / (performance.now() - startTime)) * 1000
    }
  }
  const callback_function = () => {
    self.postMessage({
      status: 'update',
      tps,
      numTokens
    })
  }

  const streamer = new TextStreamer(tokenizer, {
    skip_prompt: true,
    skip_special_tokens: true,
    callback_function,
    token_callback_function
  })

  const inputs = await processor(audio)

  const outputs = await model.generate({
    ...inputs,
    max_new_tokens: MAX_NEW_TOKENS,
    language: AutomaticSpeechRecognitionPipeline.language,
    streamer,
    task: AutomaticSpeechRecognitionPipeline.task
  })

  const decoded = tokenizer.batch_decode(outputs as number[][], {
    skip_special_tokens: true
  })

  // Send the output back to the main thread
  self.postMessage({
    status: 'complete',
    output: decoded.join('')
  })
  processing = false
}

async function load() {
  self.postMessage({
    status: 'loading',
    data: 'Loading model...'
  })

  // Load the pipeline and save it for future use.
  const [, , model] = await AutomaticSpeechRecognitionPipeline.getInstance((x) => {
    // We also add a progress callback to the pipeline so that we can
    // track model loading.
    self.postMessage(x)
  })

  self.postMessage({
    status: 'loading',
    data: 'Compiling shaders and warming up model...'
  })

  // Run model with dummy input to compile shaders
  await model.generate({
    // @ts-ignore potentially transformers.js side missed type declaration
    input_features: full([1, 80, 3000], 0.0),
    max_new_tokens: 1
  })
  self.postMessage({ status: 'ready' })
}

// Listen for messages from the main thread
self.addEventListener('message', (e) => {
  const { type, data } = e.data

  switch (type) {
    case 'load':
      load()
      break

    case 'generate':
      generate(data)
      break

    case 'config': {
      AutomaticSpeechRecognitionPipeline.configure(data)
      self.postMessage({ status: 'configured' })
      break
    }

    default:
      break
  }
})

AutomaticSpeechRecognitionPipeline.configure({
  ...DEFAULT_CAPTIONS_CONFIG,
  modelSize: WhisperModelSizeOptions.SMALL
})
self.postMessage({ status: 'configured' })
