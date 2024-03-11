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

import { BlobServiceClient } from '@azure/storage-blob'
import { getAzureAccessLibrarySettings, AzureAccessLibrarySettings, getOcspStatus } from '../common/config'
import { setTimeout } from 'timers/promises'
async function getBlobService () {
  const connectionInfo: AzureAccessLibrarySettings = getAzureAccessLibrarySettings()
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionInfo.azure_access_settings.connection_string)
  const isOcspStatus = await getOcspStatus(blobServiceClient.url)
  if (!isOcspStatus) throw new Error('OCSP status not good.')
  const containerClient = blobServiceClient.getContainerClient(connectionInfo.azure_access_settings.container_name)
  return containerClient
}
type getImageFromAzureResult = {
  total_image_count: number,
  images: {
    name: string,
    contents: string
  }[]
}

export async function getImageFromAzure (retryCount: number, deviceId: string, subDirectory: string, orderBy?: string, skip?: number, numberOfImages?: number): Promise<getImageFromAzureResult> {
  const response: getImageFromAzureResult = {
    total_image_count: 0,
    images: []
  }
  const containerClient = await getBlobService()
  const blobNames = []
  const prefix = `${deviceId}/image/${subDirectory}/`
  orderBy = orderBy || 'ASC' // ASC is cal default value
  skip = skip || 0 // 0 is cal default value
  numberOfImages = numberOfImages || 50 // 50 is cal default value
  for await (const blob of containerClient.listBlobsFlat({ prefix })) {
    blobNames.push(blob.name)
  }
  if (orderBy === 'DESC') {
    blobNames.reverse()
  }

  const images = []
  for (let i = 0; i < blobNames.length; i++) {
    if (i === numberOfImages) break
    if (blobNames[i + skip] === undefined) {
      break
    }
    const blockBlobClient = containerClient.getBlockBlobClient(blobNames[i + skip])
    const buffer = await blockBlobClient.downloadToBuffer()
    images.push({
      name: blobNames[i + skip].split('/')[3],
      contents: buffer.toString('base64')
    })
  }

  if (blobNames.length !== 0) {
    response.total_image_count = blobNames.length
    response.images = images
    return response
  }
  if (retryCount > 0) {
    await setTimeout(1000)
    return getImageFromAzure(retryCount - 1, deviceId, subDirectory, orderBy, skip, numberOfImages)
  }
  return response
}

export async function getInferenceFromAzure (retryCount: number, deviceId: string, subDirectory: string, startInferenceTime?: string, endInferenceTime?: string, numberOfInferenceResult?: number): Promise<string[]> {
  const serializeDatas: string[] = []
  const containerClient = await getBlobService()
  const blobs = []
  numberOfInferenceResult = numberOfInferenceResult || 20 // 20 is cal default value
  const prefix = `${deviceId}/metadata/${subDirectory}/`
  for await (const blob of containerClient.listBlobsByHierarchy('/', { prefix })) {
    const filePath = blob.name
    const timestamp = filePath.split('/')[3].replace('.txt', '')
    if ((startInferenceTime === undefined || timestamp >= startInferenceTime) &&
        (endInferenceTime === undefined || timestamp < endInferenceTime)) {
      blobs.push(blob.name)
    } else if (endInferenceTime !== undefined && timestamp > endInferenceTime) {
      break
    }
    if (blobs.length === numberOfInferenceResult) break
  }
  if (blobs.length !== 0) {
    for (let i = 0; i < blobs.length; i++) {
      const blobClient = containerClient.getBlobClient(blobs[i])
      const blobInferenceResponse = await blobClient.download(0)
      const inferenceText = await streamToString(blobInferenceResponse.readableStreamBody)
      const inferenceJson = JSON.parse(inferenceText)
      serializeDatas.push(inferenceJson)
    }
    return serializeDatas
  }

  if (retryCount > 0) {
    await setTimeout(1000)
    return getInferenceFromAzure(retryCount - 1, deviceId, subDirectory, startInferenceTime, endInferenceTime, numberOfInferenceResult)
  }
  return serializeDatas
}

export async function streamToString (readableStream: any) {
  const chunks = []
  for await (const chunk of readableStream) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks).toString('utf8')
}

export async function getSubDirectoryListFromAzure (deviceId: string) {
  const containerClient = await getBlobService()
  const subDirectoryList = []
  const prefix = deviceId + '/image/'
  for await (const blob of containerClient.listBlobsByHierarchy('/', { prefix })) {
    const filePath = blob.name
    const subdir = filePath.split('/')[2]
    subDirectoryList.push(subdir)
  }
  const response = subDirectoryList.filter((value, index, self) => {
    return self.indexOf(value) === index
  })
  return response
}
