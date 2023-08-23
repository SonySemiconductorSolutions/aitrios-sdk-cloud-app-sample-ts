/*
 * Copyright 2023 Sony Semiconductor Solutions Corp. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// automatically generated by the FlatBuffers compiler, do not modify

import * as flatbuffers from 'flatbuffers'

import { ObjectDetectionData } from './object-detection-data'

export class ObjectDetectionTop {
  bb: flatbuffers.ByteBuffer|null = null
  bb_pos = 0
  __init (i:number, bb:flatbuffers.ByteBuffer):ObjectDetectionTop {
    this.bb_pos = i
    this.bb = bb
    return this
  }

  static getRootAsObjectDetectionTop (bb:flatbuffers.ByteBuffer, obj?:ObjectDetectionTop):ObjectDetectionTop {
    return (obj || new ObjectDetectionTop()).__init(bb.readInt32(bb.position()) + bb.position(), bb)
  }

  static getSizePrefixedRootAsObjectDetectionTop (bb:flatbuffers.ByteBuffer, obj?:ObjectDetectionTop):ObjectDetectionTop {
    bb.setPosition(bb.position() + flatbuffers.SIZE_PREFIX_LENGTH)
    return (obj || new ObjectDetectionTop()).__init(bb.readInt32(bb.position()) + bb.position(), bb)
  }

  perception (obj?:ObjectDetectionData):ObjectDetectionData|null {
    const offset = this.bb!.__offset(this.bb_pos, 4)
    return offset ? (obj || new ObjectDetectionData()).__init(this.bb!.__indirect(this.bb_pos + offset), this.bb!) : null
  }

  static startObjectDetectionTop (builder:flatbuffers.Builder) {
    builder.startObject(1)
  }

  static addPerception (builder:flatbuffers.Builder, perceptionOffset:flatbuffers.Offset) {
    builder.addFieldOffset(0, perceptionOffset, 0)
  }

  static endObjectDetectionTop (builder:flatbuffers.Builder):flatbuffers.Offset {
    const offset = builder.endObject()
    return offset
  }

  static finishObjectDetectionTopBuffer (builder:flatbuffers.Builder, offset:flatbuffers.Offset) {
    builder.finish(offset)
  }

  static finishSizePrefixedObjectDetectionTopBuffer (builder:flatbuffers.Builder, offset:flatbuffers.Offset) {
    builder.finish(offset, undefined, true)
  }

  static createObjectDetectionTop (builder:flatbuffers.Builder, perceptionOffset:flatbuffers.Offset):flatbuffers.Offset {
    ObjectDetectionTop.startObjectDetectionTop(builder)
    ObjectDetectionTop.addPerception(builder, perceptionOffset)
    return ObjectDetectionTop.endObjectDetectionTop(builder)
  }
}
