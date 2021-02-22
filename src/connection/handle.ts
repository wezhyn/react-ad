import { AbstractFrame, Frame, FrameFactory, FrameType } from './define';


export interface ChannelHandler<T> {
  acceptMessage(msg: T): boolean

  order(): number
}

/**
 * T：可接受的处理类型
 * B：转化后的结果
 * T -> B
 */
abstract class InboundChannelHandler<T, B> implements ChannelHandler<T> {

  private readonly _order: number;


  constructor(order: number) {
    this._order = order;
  }

  abstract read(msg: T): B | null

  abstract acceptMessage(msg: T): boolean


  order(): number {
    return this._order;
  }

}

export abstract class OutboundChannelHandler<T, B> implements ChannelHandler<T> {
  private readonly _order: number;


  constructor(order: number) {
    this._order = order;
  }

  abstract read(msg: T): B | null

  abstract acceptMessage(msg: T): boolean

  order(): number {
    return this._order;
  }
}


/**
 * byte-> string 包 -> FrameType 帧
 */
export class LineBasedFrameDecoder extends InboundChannelHandler<Buffer, string> {

  private tmp: string = '';
  private readonly delimiter: string;


  constructor(order: number, delimiter: string) {
    super(order);
    this.delimiter = delimiter;
  }

  read(msg: Buffer): string | null {
    let msgStr = msg.toString('ascii');
    this.tmp += msgStr;
    let result = null;
    let split = this.tmp.split(this.delimiter, 2);
    if (split.length == 2) {
      this.tmp = split[1];
      result = split[0];
    }
    return result;
  }

  acceptMessage(msg: any): boolean {
    return typeof msg == typeof Buffer;
  }

}

export class ProtocolFrameDecoder extends InboundChannelHandler<string, Frame<any>> {
  static BEGIN_FIELD = 'SOF';
  static END_FIELD = 'EOF';
  private static DELIMITER = ',';
  private readonly minLength: number;
  private readonly lenField: number;


  constructor(order: number, minLength: number, lenField: number) {
    super(order);
    this.minLength = minLength;
    this.lenField = lenField;
  }

  read(msg: string): Frame<any> | null {
    let sofIndex = this.beginOf(msg);
    if (sofIndex + this.minLength > msg.length) {
      return null;
    }

    let frameLength = this.frameLength(msg, sofIndex + ProtocolFrameDecoder.BEGIN_FIELD.length, this.lenField);
    if (frameLength <= 0 || !this.hasEOF(msg, sofIndex + frameLength - ProtocolFrameDecoder.END_FIELD.length)) {
      return this.read(msg.substr(sofIndex + ProtocolFrameDecoder.BEGIN_FIELD.length));
    }
    try {
      // EOF0000,imei,type,data,EOF\n 传入 imei 的 index
      return this.extractFrame(msg, sofIndex + ProtocolFrameDecoder.BEGIN_FIELD.length + this.lenField + ProtocolFrameDecoder.DELIMITER.length);
    } catch (e) {
      console.log(`错误解析 ${msg}`);
      return this.read(msg.substr(sofIndex + ProtocolFrameDecoder.BEGIN_FIELD.length));
    }
  }

  extractFrame(param: string, position: number): Frame<any> | null {
    let frameStr = param.substr(position, param.length - ProtocolFrameDecoder.END_FIELD.length - position - ProtocolFrameDecoder.DELIMITER.length);
    let frameData = frameStr.split(ProtocolFrameDecoder.DELIMITER);
    if (frameData.length < 4) {
      return null;
    }
    let imei = frameData[0];
    let type = frameData[1];
    let data = frameData.slice(2, frameData.length);
    // 客户端只需要解析   SystemConfirm[1],Data[3]
    let frameType;
    switch (parseInt(type, 10)) {
      case 1: {
        frameType = FrameType.SystemConfirm;
        break;
      }
      case 3: {
        frameType = FrameType.Data;
        break;
      }
      default: {
        return null;
      }
    }
    return FrameFactory.create(frameType, data, imei);
  }

  frameLength(param: string, start: number, length: number): number {
    let lengthStr = param.substr(start, length);
    return parseInt(lengthStr, 10);
  }

  hasEOF(param: string, position: number): boolean {
    let eofStr = param.substr(position, ProtocolFrameDecoder.END_FIELD.length);
    return eofStr === ProtocolFrameDecoder.END_FIELD;
  }

  beginOf(param: string): number {
    return param.indexOf(ProtocolFrameDecoder.BEGIN_FIELD);
  }

  acceptMessage(msg: any): boolean {
    return typeof msg == typeof String;
  }

}


export class ProtocolFrameEncoder extends OutboundChannelHandler<Frame<any>, string> {
  private static MIN_LEN = 32;

  read(msg: Frame<any>): string | null {
    return ''.concat(ProtocolFrameDecoder.BEGIN_FIELD,
      this.numStr(ProtocolFrameEncoder.MIN_LEN + msg.dataStr().length, 4), ',',
      msg.equipmentImei(), ',',
      msg.type().valueOf().toString(), ',',
      msg.dataStr(), ',',
      ProtocolFrameDecoder.END_FIELD, '\n'
    );
  }

  acceptMessage(msg: any): boolean {
    return msg instanceof AbstractFrame;
  }

  numStr(number: Number, base: number): string {
    let numStr = number.toString();
    let result = numStr;
    for (let i = 0; i < base - numStr.length; i++) {
      result = '0' + result;
    }
    return result;
  }

}
