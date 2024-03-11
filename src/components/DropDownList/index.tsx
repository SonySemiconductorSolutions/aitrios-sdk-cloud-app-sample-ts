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
import React from 'react'
export default function DropDownList (props) {
  return (
    <select defaultValue={''} id={props.id} name={props.name} className={props.className} disabled={props.disabled} onChange={(e) => props.onChange(e)}>
      <option value='' disabled></option>
      {Array.isArray(props.datas) && (
        props.datas.map((data, index) => {
          return (
                  <option key={index} value={data}>{data}</option>
          )
        })
      )}
      {!Array.isArray(props.datas) && (
        Object.keys(props.datas).map((data, index) => {
          return (
              <option key={index} value={data}>{data}</option>
          )
        })
      )}
    </select>
  )
}
