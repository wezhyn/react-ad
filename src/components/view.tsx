import { Popover, Steps } from 'antd';
import React from 'react';
import 'antd/dist/antd.css';

const { Step } = Steps;

const customDot = (dot: React.ReactNode, { status, index }: any) => (
  <Popover
    content={
      <span>
        step {index} status: {status}
      </span>
    }
  >
    {dot}
  </Popover>
);

export const View = () => {

  return (
    <>
      <Steps progressDot current={1}>
        <Step title='Finished' description='This is a description.' />
        <Step title='In Progress' description='This is a description.' />
        <Step title='Waiting' description='This is a description.' />
      </Steps>
    </>
  );

};
