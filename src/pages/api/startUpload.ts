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
import { CONNECTION_DESTINATION, SERVICE } from '../../common/settings'
import { format } from 'date-fns'
import { utcToZonedTime } from 'date-fns-tz'
import { getConsoleService } from '../../hooks/getConsoleStorage'

const startUpload = async (deviceId: string) => {
  const calClient = await getConsoleService()
  console.log('deviceId:' + deviceId)
  const res = await calClient.deviceManagement?.startUploadInferenceResult(deviceId)
  console.log('startUploadInferenceResult:' + JSON.stringify(res.data))

  if (typeof res.result !== 'undefined' && (res.result === 'ERROR')) {
    throw new Error(res.message)
  }
  if (typeof res.data.result !== 'undefined' && res.data.result === 'WARNING') {
    throw new Error(res.data.message)
  }

  const response = res.data
  if (CONNECTION_DESTINATION.toString() === SERVICE.Local && response.result === 'SUCCESS') {
    const currentDate = new Date()
    const utcDate = utcToZonedTime(currentDate, 'UTC')
    const dateFormat = 'yyyyMMddHHmmssSSS'
    const outputSubDirectory = format(utcDate, dateFormat)
    response.outputSubDirectory = `local/deviceId/image/${outputSubDirectory}`
  }
  return response
}

export default async function handler (req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Only POST requests.' })
    return
  }
  const deviceId = req.body.deviceId ? req.body.deviceId.toString() : ''

  await startUpload(deviceId)
    .then(result => {
      res.status(200).json(result)
    }).catch(err => {
      res.status(500).json(err.message)
    })
}
