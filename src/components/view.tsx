import { message, Steps, Tabs } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import moment from 'moment';
import * as schedule from 'node-schedule';
import { SettingData } from './setting';
import { RouteComponentProps, useHistory } from 'react-router-dom';
import { Connection } from '../connection/connection';
import { CompletionFrame, DataFrame, Frame, FrameType } from '../connection/define';

const { Step } = Steps;
const { TabPane } = Tabs;


interface ViewTimeProps {
  // 距离开始的计数 ,每 5 分钟 +1
  timeCount: number,
  viewList: string[],
  entryId: number[],
  iemi: string

}

const maxNum = 5;


interface PaneProps extends RouteComponentProps<SettingData> {

}

let con: Connection;
let isConnected = false;


export const Navigation = (props: PaneProps) => {
  const history = useHistory();
  const [panes, setPanes] = useState<ViewTimeProps[]>([]);
  const setPanesCallback: any = useRef();
  let count = useRef(1);
  let frameContainers: DataFrame[] = [];


  const addPane = (listView: string[], id: number[], im: string) => {
    if (listView.length > 0) {
      if (listView.length < maxNum) {
        listView.push(...Array(maxNum - listView.length).fill(''));
      }
      setPanes([...panes, {
        viewList: listView,
        timeCount: Math.round(count.current / 12),
        entryId: id,
        iemi: im
      } as ViewTimeProps]);
    }
    count.current += 1;
  };

  useEffect(() => {
    setPanesCallback.current = addPane;
  }, [panes]);

  // 创建连接
  useEffect(() => {
    if (!isConnected) {
      let { ip, port, imei } = props.location.state as SettingData;
      con = new Connection(ip, parseInt(port), imei);
        isConnected = true;
        con.once('error', err => {
          message.error(err.toString());
          history.push('/', props.location.state);
          isConnected = false;
        });
        con.on(Connection.FRAME_EVENT, (data: Frame<any>) => {
          switch (data.type()) {
            case FrameType.Data: {
              let dataFrame = data as DataFrame;
              let repeatNum = dataFrame.data().repeatNum;
              if (repeatNum > maxNum || repeatNum <= 0) {
                console.log(`错误的参数：${JSON.stringify(dataFrame.data())}`);
              } else {
                frameContainers.push(data as DataFrame);
                console.log(`${moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')} 接受 ${JSON.stringify(data.data())}`);
              }
              break;
            }
            default: {
            }
          }
        });
      }
    }, []);

    // 创建定时任务
    useEffect(() => {
      schedule.scheduleJob('navigation', '0/5 * * * * ? ', () => {
        let frequency = 0;
        let listView: string[] = [];
        let idSet = new Set();
        let iemi = null;
        while (frequency < maxNum && frameContainers.length != 0) {
          let ele = frameContainers[0];
          let entry = ele.data();
          if (entry.entryId != null) {
            idSet.add(entry.entryId);
          }
          if (iemi == null) {
            iemi = ele.equipmentImei();
          }
          let count = 0;
          if (frequency + entry.repeatNum > maxNum) {
            count = Math.min(maxNum - frequency, entry.repeatNum);
          } else {
            count = entry.repeatNum;
          }
          frameContainers[0].data().repeatNum -= count;
          frequency += count;
          if (entry.repeatNum <= 0) {
            frameContainers.shift();
          }
          listView.push(...Array(count).fill(entry.content));
        }
        setPanesCallback.current(listView, Array.from(idSet), iemi);
      });
    }, []);

    return (
      <>
        <Tabs defaultActiveKey='1'>
          {
            panes.map((v, i) => {
              let tabTitle = `${v.timeCount} 时段`;
              return (
                <TabPane tab={tabTitle} key={i}>
                  <View {...v} />
                </TabPane>
              );
            })
          }
        </Tabs>
      </>
    );
  }
;


export const View = (props: ViewTimeProps) => {
    const [viewPercent, setPercent] = useState(0);
    let setPercentCallback: any = useRef();
    const incr = () => {
      setPercent(viewPercent + 1);
      if (viewPercent >= maxNum - 2) {
        schedule.cancelJob('view-' + props.timeCount);
        // 发送完成事件
        props.entryId.forEach(id => con.writeFrame(new CompletionFrame(id, props.iemi)));
      }
    };
    useEffect(() => {
      setPercentCallback.current = incr;
      return () => {
      };
    });

    useEffect(() => {
      schedule.scheduleJob('view-' + props.timeCount, '0/12 * * * * ? ', () => {
        setPercentCallback.current();
      });
    }, []);

    const stepRefs = [];
    const stepsRefs = [];
    for (let i = 1; i <= 5; i++) {
      let count = i - 1;
      let countEle = React.createElement(Step, {
        // 'title': 'count',
        'description': props.viewList[count] == '' ? '空' : props.viewList[count],
        'key': count
      });
      stepRefs.push(countEle);
    }
    let ele = React.createElement(Steps, {
      'progressDot': true,
      'current': viewPercent,
      'key': 0
    }, stepRefs);
    stepsRefs.push(ele);
    return React.createElement('div', {}, stepsRefs);
  }
;
