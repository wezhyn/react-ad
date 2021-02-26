import { Steps } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import * as schedule from 'node-schedule';

const { Step } = Steps;


interface ViewProps {
  isEnd: boolean,
  viewList: string[],
}

const View = (props: ViewProps) => {
  const [viewPercent, setPercent] = useState(0);
  let setPercentCallback: any = useRef();
  const incr = () => {
    setPercent(viewPercent + 1);
    if (viewPercent >= 24) {
      schedule.cancelJob('view-1');
    }
  };
  useEffect(() => {
    setPercentCallback.current = incr;
    return () => {
    };
  });

  useEffect(() => {
    schedule.scheduleJob('view-1', '*/2 * * * * ? ', () => {
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
        'description': props.viewList[count],
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
};
