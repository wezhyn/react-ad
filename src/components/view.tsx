import { message, Steps, Tabs } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import moment from 'moment';
import * as schedule from 'node-schedule';
import { SettingData } from './setting';
import { RouteComponentProps, useHistory } from 'react-router-dom';
import { Connection } from '../connection/connection';
import { DataFrame, Frame, FrameType } from '../connection/define';

const { Step } = Steps;
const { TabPane } = Tabs;


interface ViewTimeProps {
  // 距离开始的计数 ,每 5 分钟 +1
  timeCount: number,
  viewList: string[],

}


interface PaneProps extends RouteComponentProps<SettingData> {

}

let con: Connection;
let isConnected = false;


export const Navigation = (props: PaneProps) => {
    const history = useHistory();
    const [panes, setPanes] = useState<ViewTimeProps[]>([]);
    const setPanesCallback: any = useRef();
    let count = useRef(1);


    const addPane = (listView: string[]) => {
      if (listView.length > 0) {
        if (listView.length < 25) {
          listView.push(...Array(25 - listView.length).fill(''));
        }
        setPanes([...panes, { viewList: listView, timeCount: count.current } as ViewTimeProps]);
      }
      count.current += 1;
    };
    let frameContainers: DataFrame[] = [];

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
              if (repeatNum > 25 || repeatNum <= 0) {
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
      schedule.scheduleJob('navigation', '0 0/2 * * * ? ', () => {
        let frequency = 0;
        let listView: string[] = [];
        while (frequency <= 25 && frameContainers.length != 0) {
          let ele = frameContainers[0];
          let entry = ele.data();
          if (frequency + entry.repeatNum <= 25) {
            frequency += entry.repeatNum;
            listView.push(...Array(entry.repeatNum).fill(entry.content));
          } else {
            break;
          }
          frameContainers.shift();
        }
        setPanesCallback.current(listView);
      });
    }, []);

    return (
      <>
        <Tabs defaultActiveKey='1'>
          {
            panes.map((v, i) => {
              let tabTitle = `${(v.timeCount - 1) * 5 + 1}-${v.timeCount * 5} 时段`;
              return (
                <TabPane tab={tabTitle} key={i}>
                  <View viewList={v.viewList} timeCount={v.timeCount} />
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
      if (viewPercent >= 24) {
        schedule.cancelJob('view-' + props.timeCount);
      }
    };
    useEffect(() => {
      setPercentCallback.current = incr;
      return () => {
      };
    });

    useEffect(() => {
      schedule.scheduleJob('view-' + props.timeCount, '0/2 * * * * ? ', () => {
        setPercentCallback.current();
      });
    }, []);

    const stepRefs = [];
    const stepsRefs = [];
    for (let i = 1; i <= 5; i++) {
      for (let j = 1; j <= 5; j++) {
        let count = (i - 1) * 5 + j;
        let ele = React.createElement(Step, {
          // 'title': 'count',
          'description': props.viewList[count] == '' ? '空' : props.viewList[count],
          'key': count
        });
        stepRefs.push(ele);
      }
      let ele = React.createElement(Steps, {
        'progressDot': true,
        'current': i * 5 <= viewPercent ? 4 : ((i - 1) * 5 <= viewPercent ? viewPercent % 5 : -1),
        'key': i
      }, stepRefs.slice((i - 1) * 5, 5 * i));
      stepsRefs.push(ele);
    }
    return React.createElement('div', {}, stepsRefs);
  }
;
