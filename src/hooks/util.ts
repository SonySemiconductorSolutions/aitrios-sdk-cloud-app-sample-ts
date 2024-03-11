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
import * as path from 'path'
import * as fs from 'fs'

export function isRelativePath (storagePath: string) {
  if (!path.isAbsolute(storagePath)) {
    throw new Error('Only absolute paths are supported.')
  }
  return true
}

export function isSymbolicLinkFile (path: string) {
  if (fs.lstatSync(path).isSymbolicLink()) {
    throw new Error('Can\'t open symbolic link file.')
  }
  return true
}

export function isStoragePathFile (path: string) {
  try {
    fs.statSync(path)
    return true
  } catch (err) {
    throw new Error('Data does not exist.')
  }
}

export function isFile (filePath: string) {
  if (!fs.existsSync(filePath)) {
    const fileName = path.basename(filePath)
    throw new Error(`${fileName} file is not exist.`)
  }
  return true
}
