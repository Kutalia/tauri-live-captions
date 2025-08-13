import { PretrainedModelOptions } from '@huggingface/transformers'
import { CaptionsConfig } from './types'

export const SAMPLING_RATE = 16000

export type WhisperRuntimeTypes = 'whisper.cpp' | 'transformers.js'

interface Runtime {
  name: WhisperRuntimeTypes
  description: string
  descriptionGPU: string
  descriptionCPU: string
}

export const WHISPER_RUNTIMES: Runtime[] = [
  {
    name: 'whisper.cpp',
    description: 'whisper.cpp - fast native implementation based on C++',
    descriptionGPU:
      'GPU acceleration with Vulkan API on supported Windows and Linux machines, Apple Metal on MacOS (if supported)',
    descriptionCPU:
      'CPU inference works best for high-end processors and in scenarios where GPU availability is limited (gaming). Using OpenBLAS is possible on Windows and MacOS.'
  },
  {
    name: 'transformers.js',
    description: 'transformers.js - cross-platform runtime based on web technologies',
    descriptionGPU: 'GPU acceleration with WebGPU - a cutting-edge browser technology',
    descriptionCPU:
      'CPU inference with WebAssembly - highly optimized browser technology for heavy computations'
  }
]

export enum WhisperModelSizeOptions {
  TINY = 'tiny',
  BASE = 'base',
  SMALL = 'small',
  SMALL_FR = 'small_fr',
  MEDIUM = 'medium',
  LARGE = 'large'
}

export type WhisperModelSizes = `${WhisperModelSizeOptions}`

type STT_MODEL_OPTIONS_TYPE = {
  [k in WhisperModelSizes]: {
    id: string
    nodeWorkerModel: string
    options: PretrainedModelOptions
  }
}

export const STT_MODEL_OPTIONS: STT_MODEL_OPTIONS_TYPE = {
  tiny: {
    id: 'onnx-community/whisper-tiny-ONNX',
    nodeWorkerModel: 'tiny',
    options: {
      // device: 'webgpu',
      device: 'wasm',
      dtype: 'fp32'
    }
  },
  base: {
    id: 'onnx-community/whisper-base',
    nodeWorkerModel: 'base',
    options: {
      // device: 'webgpu',
      device: 'wasm',
      dtype: 'fp32'
    }
  },
  small: {
    id: 'onnx-community/whisper-small',
    nodeWorkerModel: 'small',
    options: {
      // device: 'webgpu',
      device: 'wasm',
      dtype: 'fp32'
    }
  },
  // TODO: add more specialized Whisper models that are tested to work
  small_fr: {
    id: 'onnx-community/whisper-small-cv11-french-ONNX',
    nodeWorkerModel:
      'https://huggingface.co/Kutalia/ggml-models/resolve/main/whisper-small-cv11-french.bin',
    options: {
      // device: 'webgpu',
      device: 'wasm',
      dtype: 'fp32'
    }
  },
  medium: {
    id: 'onnx-community/whisper-medium-ONNX',
    nodeWorkerModel: 'medium',
    options: {
      // https://github.com/huggingface/transformers.js/issues/989#issuecomment-2439457733
      // https://github.com/huggingface/transformers.js/issues/1317
      // device: 'webgpu',
      device: 'wasm',
      dtype: {
        encoder_id: 'fp32', // 'fp16' works too (if supported by GPU)
        decoder_model_merged: 'q4' // or 'fp32' ('fp16' is broken)
      }
    }
  },
  large: {
    id: 'onnx-community/whisper-large-v3-turbo',
    nodeWorkerModel: 'large-v3-turbo',
    options: {
      // device: 'webgpu',
      device: 'wasm',
      dtype: {
        encoder_id: 'q4',
        decoder_model_merged: 'q4'
      }
    }
  }
}

export const DEFAULT_STT_MODEL_OPTION: WhisperModelSizes = 'small'

export const MAX_AUDIO_LENGTH = 30 // seconds
export const MIN_AUDIO_LENGTH = 0.5
export const MAX_SAMPLES = SAMPLING_RATE * MAX_AUDIO_LENGTH

export const DEFAULT_CAPTIONS_CONFIG: CaptionsConfig = {
  modelSize: WhisperModelSizeOptions.SMALL,
  task: 'translate',
  runtime: 'transformers.js',
  usingGPU: false,
  language: 'en',
  inputDeviceId: null,
  position: 'top'
}
