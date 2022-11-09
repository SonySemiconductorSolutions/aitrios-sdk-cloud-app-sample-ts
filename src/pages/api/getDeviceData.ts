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
import { Client } from 'consoleAccessLibrary'
import { ConsoleAccessLibrarySettings } from '../../common/config'

const getDevices = async () => {
  const client = await Client.createInstance(ConsoleAccessLibrarySettings)
  if (!client) {
    throw new Error('Unable to create instance.')
  }

  const queryParams = {
  }
  const res = await client.deviceManagement?.getDevices(queryParams)
  return res.data
}

export default async function handler (req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ message: 'Only GET requests.' })
    return
  }
  await getDevices()
    .then(result => {
      const deviceData = {}
      result.devices.forEach(elm => {
        const modelIds = elm.models.map(model => model.model_version_id.split(':')[0]).filter(modelName => modelName !== '')
        if (modelIds.length === 0) return
        deviceData[elm.device_id] = modelIds
      })
      res.status(200).json(deviceData)
    }).catch(err => {
      if (err.response) {
        res.status(500).json({ message: err.response.data.message })
      } else {
        res.status(500).json({ message: err.message })
      }
    })
}
