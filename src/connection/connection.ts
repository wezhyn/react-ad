import * as net from 'net';
import * as schedule from 'node-schedule';
import { EventEmitter } from 'events';
import { LineBasedFrameDecoder, ProtocolFrameDecoder, ProtocolFrameEncoder } from './handle';
import { Frame, Gps, GpsFrame, HeartBeat } from './define';

export class Connection extends EventEmitter {

  public static FRAME_EVENT = 'frame';
  private readonly host: string;
  private readonly port: number;
  private readonly iemi: string;
  private client: net.Socket;
//创建一个TCP客户端实例
  private frameEncoder = new ProtocolFrameEncoder(0);
  private lineDecoder = new LineBasedFrameDecoder(0, '\n');
  private frameDecoder = new ProtocolFrameDecoder(1, 27, 4);

  constructor(host: string, port: number, imei: string) {
    super();
    this.host = host;
    this.port = port;
    this.iemi = imei;
    this.client = net.connect(port, host, function() {
      console.log(`Connect to ${host}:${port}`);
    });
    this.client.once('error', err => {
      this.emit('error', err);
    });
    this.client.setEncoding('ascii');
    this.start();
  }

  start() {
    this.client.on('data', data => {
      let str = this.lineDecoder.read(data);
      let frame = this.frameDecoder.read(str == null ? '' : str);
      if (frame != null) {
        this.emit(Connection.FRAME_EVENT, frame);
      }
    });

    //监听连接关闭事件
    this.client.on('end', function() {
      console.log('Server disconnected.');
      console.log();
    });
    schedule.scheduleJob('0 0/1 * * * ? ', () => this.writeFrame(new HeartBeat(this.iemi)));
    schedule.scheduleJob('0 0/2 * * * ? ', () => this.writeFrame(new GpsFrame(new Gps(3020.00001, 12000.00001), this.iemi)));
  }

  writeFrame(frame: Frame<any>) {
    let frameStr = this.frameEncoder.read(frame);
    if (frameStr == null) {
      return;
    }
    this.client.write(frameStr);
  }
}
