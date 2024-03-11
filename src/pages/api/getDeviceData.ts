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
import { getConsoleService } from '../../hooks/getConsoleStorage'

const getDevices = async () => {
  const calClient = await getConsoleService()
  const response = await calClient.deviceManagement.getDevices()
  if (typeof response.result !== 'undefined' && response.result === 'ERROR') {
    throw new Error(response.message)
  }
  if (typeof response.data.result !== 'undefined' && response.data.result === 'WARNING') {
    throw new Error(response.data.message)
  }
  return response.data
}

export default async function handler (req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ message: 'Only GET requests.' })
    return
  }

  await getDevices()
    .then(result => {
      const deviceList = []
      result.devices.forEach(elm => {
        deviceList.push(elm.device_id)
      })
      const deviceData = { deviceId: deviceList }
      res.status(200).json(deviceData)
    }).catch(err => {
      res.status(500).json(err.message)
    })
}
