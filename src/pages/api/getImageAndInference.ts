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

import type { NextApiRequest, NextApiResponse } from 'next'
import { getImage, getInference } from '../../hooks/getStorageData'
import { CONNECTION_DESTINATION, SERVICE } from '../../common/settings'

const getImageAndInference = async (deviceId: string, outputSubDir: string) => {
  if (CONNECTION_DESTINATION.toString() === SERVICE.Local) {
    deviceId = ''
    outputSubDir = ''
  }
  let ts: string
  let base64Img: string
  const orderBy = 'DESC'
  const numberOfImages = 1
  const skip = 0
  const errorMsgImage = 'Cannot get images.'
  const imageData = await getImage(deviceId, outputSubDir, orderBy, skip, numberOfImages)
  try {
    if (!imageData || imageData.images.length === 0) {
      throw new Error(errorMsgImage)
    }
    const latestImage = imageData?.images[0]
    console.log('GetImages response: ', JSON.stringify(latestImage.name))
    ts = (latestImage.name).replace('.jpg', '')
    base64Img = `data:image/jpg;base64,${latestImage.contents}`
  } catch (e) {
    throw new Error(errorMsgImage)
  }
  const resInference = await getInference(deviceId, outputSubDir, ts, undefined, 1)
  let inferenceData = {}
  const errorMsgInference = 'Cannot get inferences.'
  try {
    if (resInference?.length === 0 || !resInference) {
      throw new Error(errorMsgInference)
    }

    if (resInference && resInference[0].inference_result) {
      inferenceData = resInference[0].inference_result.Inferences[0].O
    } else {
      inferenceData = resInference[0].Inferences[0].O
    }
    console.log(`InferenceList response: ${JSON.stringify(inferenceData)}`)
    return { imageAndInference: { image: base64Img, inferenceData } }
  } catch (e) {
    throw new Error(errorMsgInference)
  }
}

export default async function handler (req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ message: 'Only GET requests.' })
    return
  }

  if (!req.query.deviceId) {
    res.status(400).json({ message: 'Device ID is not specified.' })
    return
  }
  const deviceId = req.query.deviceId.toString()
  const outputSubDir = req.query.outputSubDir ? req.query.outputSubDir.toString() : ''
  await getImageAndInference(deviceId, outputSubDir)
    .then(result => {
      res.status(200).json(result)
    }).catch(err => {
      res.status(500).json(err.message)
    })
}
