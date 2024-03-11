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
import { CONNECTION_DESTINATION, LOCAL_ROOT, SERVICE } from '../../common/settings'
import * as fs from 'fs'
import * as path from 'path'
import { isRelativePath, isStoragePathFile } from '../../hooks/util'
import { getConsoleService } from '../../hooks/getConsoleStorage'

const stopUpload = async (deviceId: string, subDirectory: string) => {
  if (CONNECTION_DESTINATION.toString() === SERVICE.Local) {
    isStoragePathFile(LOCAL_ROOT)
    const checkImageDir = path.join(LOCAL_ROOT, 'image')
    const checkMetaDir = path.join(LOCAL_ROOT, 'meta')
    if (!fs.existsSync(checkImageDir) || !fs.existsSync(checkMetaDir)) {
      throw new Error('No data in LocalStorage.')
    }
  }

  const calClient = await getConsoleService()
  console.log('deviceId:' + deviceId)
  const res = await calClient.deviceManagement.stopUploadInferenceResult(deviceId)
  if (typeof res.result !== 'undefined' && res.result === 'ERROR') {
    throw new Error(res.message)
  }
  if (typeof res.data.result !== 'undefined' && res.data.result === 'WARNING') {
    throw new Error(res.data.message)
  }

  console.log('stopUploadInferenceResult:' + JSON.stringify(res.data))

  if (CONNECTION_DESTINATION.toString() === SERVICE.Local) {
    isRelativePath(LOCAL_ROOT)
    const imageSourceDir = path.join(LOCAL_ROOT, 'image')
    const inferenceSourceDir = path.join(LOCAL_ROOT, 'meta')
    const imageTargetDir = path.join(LOCAL_ROOT, deviceId, 'image', subDirectory)
    const inferenceTargetDir = path.join(LOCAL_ROOT, deviceId, 'meta', subDirectory)
    fs.mkdirSync(imageTargetDir, { recursive: true })
    fs.mkdirSync(inferenceTargetDir, { recursive: true })

    const imagesFiles = fs.readdirSync(imageSourceDir)
    for (const fileName of imagesFiles) {
      const sourceFilePath = path.join(imageSourceDir, fileName)
      const targetFileDir = path.join(imageTargetDir, fileName)
      fs.renameSync(sourceFilePath, targetFileDir)
    }

    const inferenceFiles = fs.readdirSync(inferenceSourceDir)
    for (const fileName of inferenceFiles) {
      const sourceFilePath = path.join(inferenceSourceDir, fileName)
      const targetFileDir = path.join(inferenceTargetDir, fileName)
      fs.renameSync(sourceFilePath, targetFileDir)
    }
  }

  return res.data
}

export default async function handler (req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Only POST requests.' })
    return
  }
  const deviceId: string | undefined = req.body.deviceId?.toString()
  const subDirectory: string = req.body.subDirectory.toString()
  if (deviceId === undefined || subDirectory === undefined) {
    throw new Error(JSON.stringify({ message: 'Some parameter is undefined.' }))
  } else {
    await stopUpload(deviceId, subDirectory)
      .then(result => {
        res.status(200).json(result)
      }).catch(err => {
        console.log(err)
        res.status(500).json(err.message)
      })
  }
}
