/*
 * Copyright 2022, 2023 Sony Semiconductor Solutions Corp. All rights reserved.
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
import * as flatbuffers from 'flatbuffers'
import { BoundingBox } from './bounding-box'
import { BoundingBox2d } from './bounding-box2d'
import { ObjectDetectionTop } from './object-detection-top'
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
    'class_id': number,
    'score': number,
    'left': number,
    'top': number,
    'right': number,
    'bottom': number
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
  const pplOut = ObjectDetectionTop.getRootAsObjectDetectionTop(new flatbuffers.ByteBuffer(decodedData))
  const readObjData = pplOut.perception()
  const resNum = readObjData.objectDetectionListLength()
  console.log('NumOfDetections:' + String(resNum))

  // generate JSON
  const deserializedInferenceData: outputResult = { Inferences: [{}] }
  for (let i = 0; i < resNum; i++) {
    const objList = readObjData.objectDetectionList(i)
    const unionType = objList.boundingBoxType()
    if (unionType === BoundingBox.BoundingBox2d) {
      const bbox2d = objList.boundingBox(new BoundingBox2d())
      const res: Inference = {
        class_id: Number(objList.classId()),
        score: Math.round(Number(objList.score()) * 1000000) / 1000000,
        left: Number(bbox2d.left()),
        top: Number(bbox2d.top()),
        right: Number(bbox2d.right()),
        bottom: Number(bbox2d.bottom())
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
        context.strokeRect(v.left, v.top, Math.abs(v.left - v.right), Math.abs(v.top - v.bottom))
        const labelPointX = (v.right > 270 ? v.right - 70 : v.right)
        const labelPointY = (v.bottom > 300 ? v.bottom - 10 : v.bottom)
        context.font = '20px Arial'
        context.fillStyle = 'rgba(255, 255, 0)'
        context.fillText(`${labels[v.class_id]} ${Math.round(v.score * 100)}%`, labelPointX, labelPointY)
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

export const handleOnClickStartBtn = (selectedDeviceId, setDeviceIdListDisableFlg, setStartBtnFlg, setStopBtnFlg, setOutputSubDirctory, setIsPolling, handleResponseErr) => {
  setStartBtnFlg(false)
  setDeviceIdListDisableFlg(true)
  const body = {
    deviceId: selectedDeviceId
  }

  axios.get('/api/getCommandParameterFile', {
    params: {
      deviceId: selectedDeviceId
    }
  })
    .then(response => {
      console.log(`getCommandParameterFile response: ${JSON.stringify(response)}`)
      if (!response.data) {
        setStartBtnFlg(true)
        setDeviceIdListDisableFlg(false)
        return window.alert('Command param not found.')
      } else if (response.data.mode !== 1) {
        setStartBtnFlg(true)
        setDeviceIdListDisableFlg(false)
        return window.alert('Set CommandParameter Mode to 1(Image&Inference Result)')
      } else if (response.data.uploadMethodIR.toUpperCase() !== 'MQTT' &&
        response.data.uploadMethodIR !== 'BlobStorage' &&
        response.data.uploadMethodIR !== 'HTTPStorage') {
        setStartBtnFlg(true)
        setDeviceIdListDisableFlg(false)
        return window.alert('Set CommandParameter Mode to "Mqtt" or "BlobStorage" or "HTTPStorage".')
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
            setDeviceIdListDisableFlg(false)
            window.alert('startUpload : ERROR')
          }
        })
        .catch(err => {
          setStartBtnFlg(true)
          setDeviceIdListDisableFlg(false)
          handleResponseErr(err)
        })
    })
    .catch(err => {
      setStartBtnFlg(true)
      setDeviceIdListDisableFlg(false)
      handleResponseErr(err)
    })
}

export const handleOnClickStopBtn = (selectedDeviceId, outputSubDirctory, setIsPolling, setDeviceIdListDisableFlg, setStartBtnFlg, setStopBtnFlg, handleResponseErr) => {
  setStopBtnFlg(false)
  const body = {
    deviceId: selectedDeviceId,
    subDirectory: outputSubDirctory
  }
  axios.post('/api/stopUpload', body)
    .then(response => {
      setStartBtnFlg(true)
      setDeviceIdListDisableFlg(false)
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
  } else if (err.response.data && err.response.data.message) {
    window.alert(err.response.data.message)
  } else if (err.response.data && !err.response.data.message) {
    window.alert(err.response.data)
  }
}
