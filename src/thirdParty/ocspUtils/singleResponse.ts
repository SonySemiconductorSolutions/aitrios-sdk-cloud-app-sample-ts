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
import { CertID } from './certId';
import { Extension } from './extension';
import { CertStatus } from './cert_status';

/**
 * ```
 * SingleResponse ::= SEQUENCE {
 *   certID                       CertID,
 *   certStatus                   CertStatus,
 *   thisUpdate                   GeneralizedTime,
 *   nextUpdate           [0]     EXPLICIT GeneralizedTime OPTIONAL,
 *   singleExtensions     [1]     EXPLICIT Extensions{{re-ocsp-crl |
 *                                             re-ocsp-archive-cutoff |
 *                                             CrlEntryExtensions, ...}
 *                                             } OPTIONAL }
 * ```
 */
export class SingleResponse {
    @AsnProp({ type: CertID })
    public certID = new CertID();

    @AsnProp({ type: CertStatus })
    public certStatus = new CertStatus();

    @AsnProp({ type: AsnPropTypes.GeneralizedTime })
    public thisUpdate = new Date();

    @AsnProp({ type: AsnPropTypes.GeneralizedTime, context: 0, optional: true })
    public nextUpdate?: Date;

    @AsnProp({
        type: Extension,
        context: 1,
        repeated: 'sequence',
        optional: true,
    })
    public singleExtensions?: Extension[];

    constructor(params: Partial<SingleResponse> = {}) {
        Object.assign(this, params);
    }
}
