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
import { S3Client, GetObjectCommand, ListObjectsV2Command, ListObjectsCommandInput } from '@aws-sdk/client-s3'
import { AwsAccessLibrarySettings, getAwsAccessLibrarySettings, getOcspStatus, getProxyEnv } from '../common/config'
import { NodeHttpHandler } from '@smithy/node-http-handler'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { setTimeout } from 'timers/promises'
import * as path from 'path'

async function getS3Client () {
  const connectionInfo: AwsAccessLibrarySettings = getAwsAccessLibrarySettings()
  const bucket = connectionInfo.aws_access_settings.bucket_name
  const proxy = getProxyEnv()
  const agent = proxy !== undefined ? new HttpsProxyAgent(proxy) : undefined
  const region = connectionInfo.aws_access_settings.region
  const client = new S3Client({
    requestHandler: agent !== undefined ? new NodeHttpHandler({ httpAgent: agent }) : undefined,
    region,
    credentials: {
      accessKeyId: connectionInfo.aws_access_settings.access_key_id,
      secretAccessKey: connectionInfo.aws_access_settings.secret_access_key
    }
  })

  const command = new ListObjectsV2Command({ Bucket: bucket })
  const signedUrl = await getSignedUrl(client, command, { expiresIn: 3600 })
  const url = new URL(signedUrl)
  const isOcspStatus = await getOcspStatus(url.origin)
  if (!isOcspStatus) throw new Error('OCSP status not good.')
  return { client, bucket }
}

type getImageFromAwsResult = {
  total_image_count: number,
  images: {
    name: string,
    contents: string
  }[]
}

export async function getImageFromAws (retryCount: number, deviceId: string, subDirectory: string, orderBy?: string, skip?: number, numberOfImages?: number): Promise<getImageFromAwsResult> {
  const response: getImageFromAwsResult = {
    total_image_count: 0,
    images: []
  }
  const { client, bucket } = await getS3Client()
  const listObjInput = {
    Bucket: bucket,
    Prefix: `${deviceId}/image/${subDirectory}`
  }
  orderBy = orderBy || 'ASC' // ASC is default value
  skip = skip || 0 // 0 is default value
  numberOfImages = numberOfImages || 50

  const listObjData = await getListObjects(client, bucket, listObjInput)
  const images: getImageFromAwsResult['images'] = []
  if (listObjData.length !== 0) {
    if (orderBy === 'DESC') {
      listObjData.reverse()
    }
    for (let i = 0; i < listObjData.length; i++) {
      if (listObjData[i + skip] === undefined || listObjData[i + skip].Key === undefined) break
      const fileName = listObjData[i + skip].Key
      const getObjInput = {
        Bucket: bucket,
        Key: fileName
      }
      const command = new GetObjectCommand(getObjInput)
      const imageData = await client.send(command)
      if (fileName !== undefined && imageData !== undefined && imageData.Body !== undefined) {
        images.push({
          name: fileName.split('/')[3],
          contents: await imageData.Body.transformToString('base64')
        })
      }
      if (images.length >= numberOfImages) break
    }
    if (images.length !== 0) {
      response.total_image_count = listObjData.length
      response.images = images
      return response
    }
  }
  if (retryCount > 0) {
    await setTimeout(1000)
    return getImageFromAws(retryCount - 1, deviceId, subDirectory, orderBy, skip, numberOfImages)
  }
  return response
}

export async function getInferenceFromAws (retryCount: number, deviceId: string, subDirectory: string, startInferenceTime?: string, endInferenceTime?: string, numberOfInferenceResult?: number): Promise<string[]> {
  const { client, bucket } = await getS3Client()
  const serializeData: string[] = []
  const listObjInput = {
    Bucket: bucket,
    Prefix: `${deviceId}/metadata/${subDirectory}`
  }
  numberOfInferenceResult = numberOfInferenceResult || 20
  const listObjData = await getListObjects(client, bucket, listObjInput)
  if (listObjData.length !== 0) {
    for (let i = 0; i < listObjData.length; i++) {
      const key = listObjData[i].Key
      if (key !== undefined) {
        const timestamp = path.parse(key).name
        if ((startInferenceTime === undefined || timestamp >= startInferenceTime) &&
          (endInferenceTime === undefined || timestamp < endInferenceTime)) {
          const getObjInput = {
            Bucket: bucket,
            Key: key
          }
          const command = new GetObjectCommand(getObjInput)
          const inferenceData = await client.send(command)
          if (key !== undefined && inferenceData !== undefined && inferenceData.Body !== undefined) {
            const inferenceText = await inferenceData.Body.transformToString()
            if (inferenceText !== undefined) {
              const inferenceJson = JSON.parse(inferenceText)
              serializeData.push(inferenceJson)
            }
            if (serializeData.length >= numberOfInferenceResult) break
          }
        } else if (endInferenceTime !== undefined && timestamp > endInferenceTime) {
          break
        }
      }
    }
  }
  if (serializeData.length !== 0) {
    return serializeData
  }
  if (retryCount > 0) {
    await setTimeout(1000)
    return getInferenceFromAws(retryCount - 1, deviceId, subDirectory, startInferenceTime, endInferenceTime, numberOfInferenceResult)
  }
  return serializeData
}

export async function getSubDirectoryListFromAws (deviceId: string) {
  const { client, bucket } = await getS3Client()
  const subDirectoryList = []
  const prefix = deviceId + '/image/'

  const listObjInput = {
    Bucket: bucket,
    Prefix: prefix
  }
  const listObjData = await getListObjects(client, bucket, listObjInput)
  if (listObjData.length !== 0) {
    for (let i = 0; i < listObjData.length; i++) {
      const subDir = listObjData[i].Key
      if (subDir !== undefined) {
        subDirectoryList.push(subDir.split('/')[2])
      }
    }
  }
  const response = subDirectoryList.filter((value, index, self) => {
    return self.indexOf(value) === index
  })
  return response
}

async function getListObjects (
  client: S3Client,
  bucket: string,
  listObjInput: ListObjectsCommandInput,
  resultList?: string[]): Promise<any> {
  const listObjCommand = new ListObjectsV2Command(listObjInput)
  const listObjData = await client.send(listObjCommand)
  const returnList = resultList || []
  const prefix = listObjInput.Prefix
  if (listObjData !== undefined && listObjData.Contents !== undefined) {
    const contents = listObjData.Contents
    for (let i = 0; i < contents.length; i++) {
      const key = JSON.stringify(contents[i])
      if (key !== undefined) {
        returnList.push(JSON.parse(key))
      }
    }
    if (listObjData.IsTruncated === true) {
      const listObjInput = {
        Bucket: bucket,
        Prefix: prefix,
        StartAfter: contents[contents.length - 1].Key
      }
      return getListObjects(client, bucket, listObjInput, returnList)
    }
  }
  return returnList
}
