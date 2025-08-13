import { SAMPLING_RATE } from './constants'

export function getMediaStream(deviceId?: MediaDeviceInfo['deviceId']) {
  return navigator.mediaDevices.getUserMedia({
    audio: {
      deviceId: 'default',
      ...(deviceId
        ? {
            deviceId: {
              exact: deviceId
            }
          }
        : {}),
      sampleRate: SAMPLING_RATE,
      channelCount: 1
    }
  })
}

export function getSystemAudio() {
  return navigator.mediaDevices.getDisplayMedia({
    video: false,
    audio: true
  })
}
