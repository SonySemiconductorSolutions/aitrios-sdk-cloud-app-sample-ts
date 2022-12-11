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

import type { NextApiRequest, NextApiResponse } from 'next'
import { ConsoleAccessLibrarySettings } from '../../common/config'
import { Client } from 'consoleAccessLibrary'

const getImageAndInference = async (deviceId: string, outputSubDir: string) => {
  const client = await Client.createInstance(ConsoleAccessLibrarySettings)
  if (!client) {
    throw new Error('Unable to create instance.')
  }

  const imageData = await client.insight?.getImages(deviceId, outputSubDir)
  const latestImage = imageData.data.images[imageData.data.images.length - 1]
  console.log('GetImages response: ', JSON.stringify(latestImage.name))
  const ts = (latestImage.name).replace('.jpg', '')
  const base64Img = `data:image/jpg;base64,${latestImage.contents}`

  const NumberOfInferenceresults = 1
  const filter = ''
  const raw = 1
  const time = ts
  const resInference = await client.insight.getInferenceresults(deviceId, NumberOfInferenceresults, filter, raw, time)

  let inferenceData = {}
  inferenceData = resInference.data[0].inferences[0].O

  console.log('InferenceList response:', JSON.stringify(resInference.data[0].inferences[0]))

  return { imageAndInference: { image: base64Img, inferenceData } }
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
      if (err.response) {
        res.status(500).json({ message: err.response.data.message })
      } else {
        res.status(500).json({ message: err.message })
      }
    })
}
