import dayjs from 'dayjs';
import * as iconv from 'iconv-lite';

const customParseFormat = require('dayjs/plugin/customParseFormat');

export enum FrameType {
  /**
   * 设备端类型
   */
  GPS = 3,
  HeartBeat = 2,
  ClientConfirm = 1,
  Notification = 4,
  /**
   * 服务器端类型
   */
  SystemConfirm,
  Data
}


/**
 * 帧类型定义
 */
export interface Frame<T> {
  /**
   * 获取当前帧类型
   */
  type(): FrameType


  /**
   * 设备的编号
   *
   */
  equipmentImei(): string

  data(): T

  dataStr(): string

}

export interface SystemFrame {
  serverTime(): Date
}


class Env {

  imei: string;
  remoteAddress: string;
  remotePort: number;

  constructor(imei: string, remoteAddress: string, remotePort: number) {
    this.imei = imei;
    this.remoteAddress = remoteAddress;
    this.remotePort = remotePort;
  }
}


export abstract class AbstractFrame<T> implements Frame<T> {

  private readonly netData: T;
  private readonly frameType: FrameType;
  private imei = '';

  constructor(data: T, type: FrameType, imei ?: string) {
    this.netData = data;
    this.frameType = type;
    this.imei = imei == undefined ? '' : imei;
  }

  equipmentImei(): string {
    return this.imei;
  }

  data(): T {
    return this.netData;
  }

  type(): FrameType {
    return this.frameType;
  }

  dataStr(): string {
    return '';
  }

}

export class Gps {
  /**
   * 纬度 N
   */
  latitude: number = 0;

  /**
   * 经度 E
   */
  longitude: number = 0;

  constructor(latitude: number, longitude: number) {
    this.latitude = latitude;
    this.longitude = longitude;
  }
}

export class GpsFrame extends AbstractFrame<Gps> {

  constructor(gps: Gps, imei?: string) {
    super(gps, FrameType.GPS, imei);
  }


  dataStr(): string {
    let gps = this.data();
    return ''.concat(gps.longitude.toString(), ',E,', gps.latitude.toString(), ',N');
  }
}

export class HeartBeat extends AbstractFrame<void> {
  constructor(imei?: string) {
    super(undefined, FrameType.HeartBeat, imei);
  }
}

export class ClientConfirmFrame extends AbstractFrame<void> {
  constructor(imei?: string) {
    super(undefined, FrameType.ClientConfirm, imei);
  }
}

export class CompletionFrame extends AbstractFrame<number> {
  constructor(entry: number, imei?: string) {
    super(entry, FrameType.Notification, imei);
  }
}

export class SystemConfirmFrame extends AbstractFrame<void> implements SystemFrame {
  private readonly _serverTime: Date;

  constructor(_serverTime: Date, imei: string) {
    super(undefined, FrameType.SystemConfirm, imei);
    this._serverTime = _serverTime;
  }

  serverTime(): Date {
    return this._serverTime;
  }
}

export class AdEntry {
  /**
   * 条目编号,相对于每个设备而言的唯一标识
   */
  entryId: number;

  /**
   * 该条目广告播放多少次
   */
  repeatNum: number;

  /**
   * 是否垂直播放：true：上下滚动 返回2  false，左右滚动，返回1
   */
  verticalView: boolean;

  /**
   * 显示字符长度（3个字节，表示显示数据字节数，最大112)
   * 每个汉字为两个字节，其它字母及数字为一个字节
   * UTF-8 编码？
   */
  viewLength: number;

  content: string;


  constructor(entryId: number, repeatNum: number, verticalView: boolean, viewLength: number, content: string) {
    this.entryId = entryId;
    this.repeatNum = repeatNum;
    this.verticalView = verticalView;
    this.viewLength = viewLength;
    this.content = content;
  }
}

export class DataFrame extends AbstractFrame<AdEntry> {

  constructor(data: AdEntry, imei?: string) {

    super(data, FrameType.Data, imei);
  }
}


export class FrameFactory<T> {

  static create(type: FrameType, data: string[], imei: string): Frame<any> | null {
    if (data.length == 0) {
      return null;
    }
    // 20190628123040
    let dateStr = data[data.length - 1];
    dayjs.extend(customParseFormat);
    let serverTime = dayjs(dateStr, 'YYYYMMddHHmmss').toDate();
    switch (type) {
      case FrameType.SystemConfirm: {
        return new SystemConfirmFrame(serverTime, imei);
      }
      case FrameType.Data: {
        if (data.length < 5) {
          return null;
        }
        return new DataFrame(new AdEntry(parseInt(data[0]), parseInt(data[1]),
          parseInt(data[2]) == 1, parseInt(data[3]), GB2312.code2string(data[4])), imei);
      }

      default: {
        return null;
      }

    }
  }

}

class GB2312 {
  static gb2312code(str: string): string {
    let encodeBuf = iconv.encode(str, 'gb2312');
    let result = '';
    for (let i = 0; i < encodeBuf.length; i++) {
      let b = encodeBuf[i];
      let a;
      if (b < 127 && b > 0) {
        a = b;
      } else {
        a = 256 + b;
      }
      result = result.concat(a.toString(16).toUpperCase());
    }
    return result;
  }

  static number2byte(num: number): number {
    return num & 0x000000ff;
  }

  static code2string(code: string): string {
    let buf = Buffer.alloc(code.length / 2);
    for (let i = 0; i < code.length; i += 2) {
      let a;
      let b = parseInt(code.substr(i, 2), 16);
      b = this.number2byte(b);
      if (b > 0 && b < 127) {
        a = b;
      } else {
        a = b - 256;
      }
      buf.writeInt8(a, i / 2);
    }
    return iconv.decode(buf, 'gb2312');
  }

}







