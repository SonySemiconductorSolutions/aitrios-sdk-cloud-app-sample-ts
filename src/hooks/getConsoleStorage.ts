/*
 * Copyright 2023 Sony Semiconductor Solutions Corp. All rights reserved.
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

import { Client, Config } from 'consoleaccesslibrary'
import { getConsoleAccessLibrarySettings } from '../common/config'

export async function getConsoleService () {
  let calClient
  try {
    const consoleSettings = getConsoleAccessLibrarySettings()
    const config = new Config(
      consoleSettings.console_access_settings.console_endpoint,
      consoleSettings.console_access_settings.portal_authorization_endpoint,
      consoleSettings.console_access_settings.client_id,
      consoleSettings.console_access_settings.client_secret,
      consoleSettings.console_access_settings.application_id
    )
    calClient = await Client.createInstance(config)
  } catch (err) {
    throw new Error('Wrong setting. Check the settings.')
  }
  if (!calClient) {
    throw new Error('Unable to create instance.')
  }
  return calClient
}

export async function getImageFromConsole (deviceId: string, subDirectory: string, orderBy?: string, skip?: number, numberOfImages?: number) {
  const client = await getConsoleService()
  const imageData = await client.insight.getImageData(deviceId, subDirectory, numberOfImages, skip, orderBy)
  const response = {
    total_image_count: imageData.total_image_count,
    images: imageData.images
  }
  return response
}

export async function getInferenceFromConsole (deviceId: string, startTime?: string, endTime?: string, numberOfInferenceResult?: number) {
  const client = await getConsoleService()
  const filter = `EXISTS(SELECT VALUE i FROM i IN c.Inferences WHERE i.T >= "${startTime}" AND i.T <= "${endTime}")`
  const raw = 1
  const time = undefined
  const resInference = await client.insight.getInferenceResults(deviceId, filter, numberOfInferenceResult, raw, time)

  const inferences = []
  for (let i = 0; i < resInference.data.length; i++) {
    inferences.push(resInference.data[i])
  }
  console.log('InferenceList response:', JSON.stringify(resInference.data[0].inference_result.Inferences[0]))
  return inferences
}

export async function getSubDirectoryListFromConsole (deviceId: string) {
  const client = await getConsoleService()
  const response = await client.insight.getImageDirectories(deviceId)
  return response.data[0].devices[0].Image
}
