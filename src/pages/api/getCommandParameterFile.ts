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

const getCommandParameterFile = async (deviceId: string) => {
  const client = await Client.createInstance(ConsoleAccessLibrarySettings)
  if (!client) {
    throw new Error('Unable to create instance.')
  }

  const response = await client.deviceManagement?.getCommandParameterFile()

  const matchData = response.data.parameter_list.filter(function (value: any) {
    return value.device_ids.indexOf(deviceId) !== -1
  })

  let mode
  let uploadMethodIR

  if ('Mode' in matchData[0].parameter.commands[0].parameters) {
    mode = matchData[0].parameter.commands[0].parameters.Mode
  } else {
    mode = 0
  }

  if ('UploadMethodIR' in matchData[0].parameter.commands[0].parameters) {
    uploadMethodIR = matchData[0].parameter.commands[0].parameters.UploadMethodIR
  } else {
    uploadMethodIR = 'MQTT'
  }

  const result = { Mode: mode, UploadMethodIR: uploadMethodIR }

  return result
}

export default async function handler (req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ message: 'Only GET requests.' })
    return
  }
  const deviceId = req.query.deviceId.toString()

  await getCommandParameterFile(deviceId)
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
