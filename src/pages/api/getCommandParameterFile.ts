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
import { getConsoleService } from '../../hooks/getConsoleStorage'

const getCommandParameterFile = async (deviceId: string) => {
  const calClient = await getConsoleService()
  const response = await calClient.deviceManagement.getCommandParameterFile()
  if (typeof response.result !== 'undefined' && response.result === 'ERROR') {
    throw new Error(response.message)
  }
  if (typeof response.data.result !== 'undefined' && response.data.result === 'WARNING') {
    throw new Error(response.data.message)
  }
  const matchData = response.data.parameter_list.filter(function (value: any) {
    return value.device_ids.indexOf(deviceId) !== -1
  })

  const mode = 'Mode' in matchData[0].parameter.commands[0].parameters ? matchData[0].parameter.commands[0].parameters.Mode : 0
  const uploadMethodIR = 'UploadMethodIR' in matchData[0].parameter.commands[0].parameters ? matchData[0].parameter.commands[0].parameters.UploadMethodIR : 'MQTT'

  if (!((uploadMethodIR === 'MQTT' && CONNECTION_DESTINATION === SERVICE.Console) ||
      (uploadMethodIR === 'BlobStorage' && CONNECTION_DESTINATION === SERVICE.Azure) ||
      (uploadMethodIR === 'HTTPStorage' && CONNECTION_DESTINATION === SERVICE.Local))) {
    throw new Error('Command parameters and CONNECTION_DESTINATION do not match.')
  }

  const result = { mode, uploadMethodIR }
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
      res.status(500).json(err.message)
    })
}
