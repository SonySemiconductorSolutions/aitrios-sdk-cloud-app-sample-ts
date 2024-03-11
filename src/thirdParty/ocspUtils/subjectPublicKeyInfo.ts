/*
 * Copyright 2023 Sony Semiconductor Solutions Corp. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { AsnProp, AsnPropTypes } from '@peculiar/asn1-schema';
import { AlgorithmIdentifier } from './algoIdentifier';

/**
 * ```
 * SubjectPublicKeyInfo  ::=  SEQUENCE  {
 *   algorithm            AlgorithmIdentifier,
 *   subjectPublicKey     BIT STRING  }
 * ```
 */
export class SubjectPublicKeyInfo {
    @AsnProp({ type: AlgorithmIdentifier })
    public algorithm = new AlgorithmIdentifier();

    @AsnProp({ type: AsnPropTypes.BitString })
    public subjectPublicKey: ArrayBuffer = new ArrayBuffer(0);

    constructor(params: Partial<SubjectPublicKeyInfo> = {}) {
        Object.assign(this, params);
    }
}
