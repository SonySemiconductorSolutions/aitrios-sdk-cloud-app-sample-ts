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
import Head from 'next/head'
import { useEffect, useState } from 'react'
import axios from 'axios'
import styles from '../styles/Home.module.css'
import Button from '../components/Button'
import DropDownList from '../components/DropDownList'
import useInterval from '../hooks/useInterval'
import { getImageAndInference, deserialize, drawBoundingBox, handleOnChangeDeviceId, handleOnClickStartBtn, handleOnClickStopBtn, handleResponseErr } from '../util/sample'

export type InferenceItem = {
  C: number,
  P: number,
  X: number,
  Y: number,
  x: number,
  y: number
}
const TIME_OUT = 20000
export default function Home () {
  const [deviceData, setDeviceData] = useState({})
  const [visibility, setVisibility] = useState(false)
  const [selectedDeviceId, setSelectedDeviceId] = useState('')
  const [outputSubDirctory, setOutputSubDirctory] = useState('')
  const [labels, setLabels] = useState([])
  const [context, setContext] = useState(null)
  const [startBtnFlg, setStartBtnFlg] = useState(true)
  const [stopBtnFlg, setStopBtnFlg] = useState(false)
  const [isPolling, setIsPolling] = useState<boolean>(false)

  useEffect(() => {
    axios.get('/label.json')
      .then(response => {
        setLabels(response.data)
      })
  }, [])

  useEffect(() => {
    axios.get('/api/getDeviceData', { timeout: TIME_OUT })
      .then(response => {
        if (Object.keys(response.data).length === 0) {
          return window.alert('Connected device not found.')
        }
        setDeviceData(response.data)
      })
      .catch((err) => {
        handleResponseErr(err)
      })
  }, [])

  useInterval(() => {
    getImageAndInference(setContext, selectedDeviceId, outputSubDirctory, context, labels, deserialize, drawBoundingBox, handleResponseErr)
  }, isPolling ? 5000 : null)

  return (
    <div className={styles.container}>
      <Head>
        <title>sampleApp</title>
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <main className={styles.main}>

        <div className={styles.grid}>
          <div className={styles.paramsArea}>
          <h2 id='param-lbl' className={styles.title}>Parameter</h2>
            <div className={styles.param}>
              <label id='device-id-lbl'><b>DeviceID</b></label>
              <DropDownList id={'device-id-list'} name={'deviceId'} className={styles.select} datas={deviceData} onChange={(event) => { handleOnChangeDeviceId(event, setStopBtnFlg, setSelectedDeviceId, deviceData, setVisibility) }}/>
            </div>

            <div className={visibility ? styles.buttonArea : `${styles.hidden} ${styles.buttonArea}`}>
              <Button id={'start-btn'} disabled={!startBtnFlg} className={!startBtnFlg ? `${styles.startButton} ${styles.disableButton}` : `${styles.startButton} ${styles.button}`} onClick={() => { handleOnClickStartBtn(selectedDeviceId, setStartBtnFlg, setStopBtnFlg, setOutputSubDirctory, setIsPolling, handleResponseErr) }} btnTxt={'START'}></Button>
              <Button id={'stop-btn'} disabled={!stopBtnFlg} className={!stopBtnFlg ? styles.disableButton : styles.button} onClick={() => { handleOnClickStopBtn(selectedDeviceId, setIsPolling, setStartBtnFlg, setStopBtnFlg, handleResponseErr) }} btnTxt={'STOP'}></Button>
            </div>
          </div>

          <div className={styles.paramsArea}>
            <h2 id='img-inference-lbl' className={styles.title}>Image/Inference</h2>
            <div className={styles.imgArea}>
              <canvas id="canvas" className={styles.canvas}></canvas>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
