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
import { Client } from 'consoleAccessLibrary'
import type { NextApiRequest, NextApiResponse } from 'next'
import { ConsoleAccessLibrarySettings } from '../../common/config'

const stopUpload = async (deviceId: string) => {
  const client = await Client.createInstance(ConsoleAccessLibrarySettings)
  if (!client) {
    throw new Error('Unable to create instance.')
  }

  console.log('deviceId:' + deviceId)
  const res = await client.deviceManagement?.stopUploadInferenceResult(deviceId)
  console.log('stopUploadInferenceResult:' + JSON.stringify(res.data))
  return res.data
}

export default async function handler (req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Only POST requests.' })
    return
  }
  const deviceId = req.body.deviceId ? req.body.deviceId.toString() : ''

  await stopUpload(deviceId)
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
