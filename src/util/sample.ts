/*
 * Copyright 2022 Sony Semiconductor Solutions Corp. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import axios from 'axios'
import { InferenceItem } from '../pages'
import { flatbuffers } from 'flatbuffers'
import { SmartCamera } from './ObjectdetectionGenerated'
/* global HTMLCanvasElement */

export const getImageAndInference = (setContext, selectedDeviceId, outputSubDirctory, context, labels, deserialize, drawBoundingBox, handleResponseErr) => {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement
  const canvasContext = canvas.getContext('2d')
  setContext(canvasContext)

  axios.get('/api/getImageAndInference', {
    params: {
      deviceId: selectedDeviceId,
      outputSubDir: outputSubDirctory
    }
  })
    .then(response => {
      if (Object.keys(response.data).length === 0) {
        return console.log('Waiting for image upload.')
      }

      const inferenceData = response.data.imageAndInference.inferenceData
      const deserializedInferenceData = deserialize(inferenceData)
      drawBoundingBox(response.data.imageAndInference.image, deserializedInferenceData.Inferences[0], context, labels)
    })

    .catch(err => {
      handleResponseErr(err)
    })
}

export function deserialize (inferenceData) {
  type InferencesResult = {
    [prop: string]: any
  }

  type outputResult = {
    'Inferences': InferencesResult[]
  }

  type Inference = {
    'C': number,
    'P': number,
    'X': number,
    'Y': number,
    'x': number,
    'y': number
  }
  // Base64 decode
  let decodedData: Buffer
  if (inferenceData) {
    decodedData = Buffer.from(inferenceData, 'base64')
  } else {
    console.log('not inference result in this data')
    return
  }

  // Deserialize
  const pplOut = SmartCamera.ObjectDetectionTop.getRootAsObjectDetectionTop(new flatbuffers.ByteBuffer(decodedData))
  const readObjData = pplOut.perception()
  const resNum = readObjData.objectDetectionListLength()
  console.log('NumOfDetections:' + String(resNum))

  // generate JSON
  const deserializedInferenceData: outputResult = { Inferences: [{}] }
  for (let i = 0; i < resNum; i++) {
    const objList = readObjData.objectDetectionList(i)
    const unionType = objList.boundingBoxType()
    if (unionType === SmartCamera.BoundingBox.BoundingBox2d) {
      const bbox2d = objList.boundingBox(new SmartCamera.BoundingBox2d())
      const res: Inference = {
        C: Number(objList.classId()),
        P: Number(objList.score()),
        X: Number(bbox2d.left()),
        Y: Number(bbox2d.top()),
        x: Number(bbox2d.right()),
        y: Number(bbox2d.bottom())
      }
      const inferenceKey = String(i + 1)
      deserializedInferenceData.Inferences[0][inferenceKey] = res
    }
  }
  delete deserializedInferenceData.Inferences[0][0]
  return deserializedInferenceData
}

export const drawBoundingBox = (image, inferenceData, context, labels) => {
  if (context !== null) {
    const img = new window.Image()
    img.src = image
    img.onload = () => {
      const canvas = document.getElementById('canvas') as HTMLCanvasElement
      canvas.width = img.width
      canvas.height = img.height
      context.drawImage(img, 0, 0)
      for (const [key, value] of Object.entries(inferenceData)) {
        if (key === 'T') continue
        const v = value as InferenceItem
        context.lineWidth = 3
        context.strokeStyle = 'rgb(255, 255, 0)'
        context.strokeRect(v.X, v.Y, Math.abs(v.X - v.x), Math.abs(v.Y - v.y))
        const labelPointX = (v.x > 270 ? v.x - 70 : v.x)
        const labelPointY = (v.y > 300 ? v.y - 10 : v.y)
        context.font = '20px Arial'
        context.fillStyle = 'rgba(255, 255, 0)'
        context.fillText(`${labels[v.C]} ${Math.round(v.P * 100)}%`, labelPointX, labelPointY)
      }
    }
  }
}

export const handleOnChangeDeviceId = (event, stopBtnFlg, setSelectedDeviceId, deviceData, setVisibility) => {
  if (stopBtnFlg === true) {
    return window.alert('Press the STOP button before making changes.')
  }
  setSelectedDeviceId(event.target.value)
  setVisibility(true)
}

export const handleOnClickStartBtn = (selectedDeviceId, setStartBtnFlg, setStopBtnFlg, setOutputSubDirctory, setIsPolling, handleResponseErr) => {
  setStartBtnFlg(false)
  const body = {
    deviceId: selectedDeviceId
  }

  axios.get('/api/getCommandParameterFile', {
    params: {
      deviceId: selectedDeviceId
    }
  })
    .then(response => {
      console.log(response)
      if (!response.data) {
        setStartBtnFlg(true)
        return window.alert('Command param not found.')
      } else if (response.data.Mode !== 1) {
        setStartBtnFlg(true)
        return window.alert('Set CommandParameter Mode to 1(Image&Inference Result)')
      } else if (response.data.UploadMethodIR.toUpperCase() !== 'MQTT') {
        setStartBtnFlg(true)
        return window.alert('Set CommandParameter Mode to "Mqtt".')
      }

      axios.post('/api/startUpload', body)
        .then(response => {
          if (response.data.result === 'SUCCESS') {
            setStopBtnFlg(true)
            const fullSubDir = response.data.outputSubDirectory
            const subDirList = fullSubDir.split('/')
            const subDir = subDirList[subDirList.length - 1]
            setOutputSubDirctory(subDir)
            setIsPolling(true)
          } else if (response.data.result === 'ERROR') {
            setStartBtnFlg(true)
            window.alert('startUpload : ERROR')
          }
        })
        .catch(err => {
          setStartBtnFlg(true)
          handleResponseErr(err)
        })
    })
    .catch(err => {
      setStartBtnFlg(true)
      handleResponseErr(err)
    })
}

export const handleOnClickStopBtn = (selectedDeviceId, setIsPolling, setStartBtnFlg, setStopBtnFlg, handleResponseErr) => {
  setStopBtnFlg(false)
  const body = {
    deviceId: selectedDeviceId
  }
  axios.post('/api/stopUpload', body)
    .then(response => {
      setStartBtnFlg(true)
      console.log(response)
      setIsPolling(false)
    })
    .catch(err => {
      setStopBtnFlg(true)
      handleResponseErr(err)
      setIsPolling(false)
    })
}

export const handleResponseErr = (err) => {
  if (err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK') {
    window.alert('Communication with server failed.')
  } else if (err.response.data) {
    window.alert(err.response.data.message)
  }
}
