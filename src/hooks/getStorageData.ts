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

import * as getAzureBlob from './getAzureStorage'
import * as getConsoleStorage from './getConsoleStorage'
import * as getLocalStorage from './getLocalStorage'
import fs from 'fs'
import { getConsoleAccessLibrarySettings, ConsoleAccessLibrarySettings, getAzureAccessLibrarySettings, AzureAccessLibrarySettings } from '../common/config'
import { CONNECTION_DESTINATION, LOCAL_ROOT, SERVICE } from '../common/settings'
export type images = {
  name: string,
  contents: string
}
export type getImageResult = {
  total_image_count: number,
  images: images[]
}
const RETRY_COUNT = 5
export async function getImage (deviceId: string, subDirectory: string, orderBy?: string, skip?: number, numberOfImages?: number) {
  let response
  if (CONNECTION_DESTINATION.toString() === SERVICE.Azure && checkAzureSettings()) {
    response = await getAzureBlob.getImageFromAzure(RETRY_COUNT, deviceId, subDirectory, orderBy, skip, numberOfImages)
  } else if (CONNECTION_DESTINATION.toString() === SERVICE.Local && checkLocalSettings(LOCAL_ROOT)) {
    response = await getLocalStorage.getImageFromLocal(RETRY_COUNT, deviceId, subDirectory, orderBy, skip, numberOfImages)
  } else if (CONNECTION_DESTINATION.toString() === SERVICE.Console && checkConsoleSettings()) {
    response = await getConsoleStorage.getImageFromConsole(deviceId, subDirectory, orderBy, skip, numberOfImages)
  }
  return response
}

export async function getInference (deviceId: string, subDirectory: string, startInferenceTime?: string, endInferenceTime?: string, numberOfInferenceResult?: number) {
  let response
  if (startInferenceTime === undefined && endInferenceTime === undefined) throw new Error('Call with unexpected arguments')
  if (CONNECTION_DESTINATION.toString() === SERVICE.Azure && checkAzureSettings()) {
    response = await getAzureBlob.getInferenceFromAzure(RETRY_COUNT, deviceId, subDirectory, startInferenceTime, endInferenceTime, numberOfInferenceResult)
  } else if (CONNECTION_DESTINATION.toString() === SERVICE.Local && checkLocalSettings(LOCAL_ROOT)) {
    response = await getLocalStorage.getInferenceFromLocal(RETRY_COUNT, deviceId, subDirectory, startInferenceTime, endInferenceTime, numberOfInferenceResult)
  } else if (CONNECTION_DESTINATION.toString() === SERVICE.Console && checkConsoleSettings()) {
    response = await getConsoleStorage.getInferenceFromConsole(deviceId, startInferenceTime, endInferenceTime, numberOfInferenceResult)
  }
  return response
}

export async function getSubDirectoryList (deviceId: string) {
  let response
  if (CONNECTION_DESTINATION.toString() === SERVICE.Azure && checkAzureSettings()) {
    response = await getAzureBlob.getSubDirectoryListFromAzure(deviceId)
  } else if (CONNECTION_DESTINATION.toString() === SERVICE.Local && checkLocalSettings(LOCAL_ROOT)) {
    response = getLocalStorage.getSubDirectoryListFromLocal(deviceId)
  } else if (CONNECTION_DESTINATION.toString() === SERVICE.Console && checkConsoleSettings()) {
    response = await getConsoleStorage.getSubDirectoryListFromConsole(deviceId)
  }
  return response
}

function checkAzureSettings () {
  if (!fs.existsSync('common/azure_access_settings.yaml')) {
    throw new Error('connection settings file does not exist.')
  }
  const connectionInfo: AzureAccessLibrarySettings = getAzureAccessLibrarySettings()
  if (connectionInfo.azure_access_settings.connection_string === undefined || connectionInfo.azure_access_settings.connection_string === '' ||
    connectionInfo.azure_access_settings.container_name === undefined || connectionInfo.azure_access_settings.container_name === '') {
    throw new Error('connection settings file is incorrect.')
  }
  return true
}

function checkLocalSettings (path: string) {
  if (path === '') {
    throw new Error('LOCAL_ROOT is not set.')
  }
  return true
}

function checkConsoleSettings () {
  if (!fs.existsSync('common/console_access_settings.yaml')) {
    throw new Error('connection settings file does not exist.')
  }
  const connectionInfo: ConsoleAccessLibrarySettings = getConsoleAccessLibrarySettings()
  if (connectionInfo.console_access_settings.console_endpoint === undefined ||
    connectionInfo.console_access_settings.console_endpoint === '' ||
    connectionInfo.console_access_settings.portal_authorization_endpoint === undefined ||
    connectionInfo.console_access_settings.portal_authorization_endpoint === '' ||
    connectionInfo.console_access_settings.client_secret === undefined ||
    connectionInfo.console_access_settings.client_secret === '' ||
    connectionInfo.console_access_settings.client_id === undefined ||
    connectionInfo.console_access_settings.client_id === '') {
    throw new Error('connection settings file is incorrect.')
  }
  return true
}
