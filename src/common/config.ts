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

import * as yaml from 'js-yaml'
import * as fs from 'fs'
import { isSymbolicLinkFile, isFile } from '../hooks/util'
import { getOCSPStatus } from '../thirdParty/ocspChecker'

export type ConsoleAccessLibrarySettings = {
  console_access_settings: {
    console_endpoint: string
    portal_authorization_endpoint: string
    client_secret: string
    client_id: string,
    application_id?: string
  }
}

export type AzureAccessLibrarySettings = {
  azure_access_settings: {
    connection_string: string
    container_name: string
  }
}

const ConsoleSettingsFile = './common/console_access_settings.yaml'

export function getConsoleAccessLibrarySettings () {
  let consoleAccessSettings: ConsoleAccessLibrarySettings = {
    console_access_settings: {
      console_endpoint: '',
      portal_authorization_endpoint: '',
      client_secret: '',
      client_id: ''
    }
  }

  isFile(ConsoleSettingsFile)
  isSymbolicLinkFile(ConsoleSettingsFile)

  const consoleAccessSettingFileData = yaml.load(fs.readFileSync(ConsoleSettingsFile, { encoding: 'utf8', flag: 'r' })) as ConsoleAccessLibrarySettings
  try {
    consoleAccessSettings = {
      console_access_settings: {
        console_endpoint: consoleAccessSettingFileData.console_access_settings.console_endpoint,
        portal_authorization_endpoint: consoleAccessSettingFileData.console_access_settings.portal_authorization_endpoint,
        client_secret: consoleAccessSettingFileData.console_access_settings.client_secret,
        client_id: consoleAccessSettingFileData.console_access_settings.client_id,
        application_id: consoleAccessSettingFileData.console_access_settings.application_id
      }
    }
    return consoleAccessSettings
  } catch (e) {
    throw new Error('Wrong setting. Check the settings.')
  }
}

const AzureAccessLibrarySettingsFile = './common/azure_access_settings.yaml'

export function getAzureAccessLibrarySettings () {
  let azureAccessSettings: AzureAccessLibrarySettings = {
    azure_access_settings: {
      connection_string: '',
      container_name: ''
    }
  }

  isFile(AzureAccessLibrarySettingsFile)
  isSymbolicLinkFile(AzureAccessLibrarySettingsFile)
  try {
    const azureAccessSettingFileData = yaml.load(fs.readFileSync(AzureAccessLibrarySettingsFile, { encoding: 'utf8', flag: 'r' })) as AzureAccessLibrarySettings
    azureAccessSettings = {
      azure_access_settings: {
        connection_string: azureAccessSettingFileData.azure_access_settings.connection_string,
        container_name: azureAccessSettingFileData.azure_access_settings.container_name
      }
    }
    return azureAccessSettings
  } catch (e) {
    throw new Error('Wrong setting. Check the settings.')
  }
}

export async function getOcspStatus (url: string) {
  try {
    const proxy = getProxyEnv()
    const response: any = await getOCSPStatus(url, proxy, {
      port: 443,
      method: 'GET'
    })
    const { status = 'unknown' } = response || {}
    if (status.toLowerCase() === 'good') {
      console.info(`OCSP Status: ${status}`)
      return true
    } else {
      return false
    }
  } catch (e) {
    console.error('Certificate Expired or Invalid certificate')
    return false
  }
}

function getProxyEnv () {
  const envKeys = ['https_proxy', 'HTTPS_PROXY']
  for (const key of envKeys) {
    const val = process.env[key]
    if (val) {
      return val
    }
  }
}
