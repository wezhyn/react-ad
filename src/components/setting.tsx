import React from 'react';
import { Button, Form, Input } from 'antd';
import { RouteComponentProps, useHistory } from 'react-router-dom';

const tailLayout = {
  wrapperCol: { offset: 8, span: 16 }
};

export interface SettingData {
  ip: string;
  port: string
  imei: string
}

interface SettingProps extends RouteComponentProps<SettingData> {

}

export function Setting(props: SettingProps) {
  let history = useHistory();
  const [form] = Form.useForm();
  const onFinish = (values: SettingData) => {
    history.push('/view', values);
  };
  const onFinishFailed = (errorInfo: any) => {
    console.log('Failed:', errorInfo);
  };
  let transferData = props.location.state == null ? {
    ip: 'wezhyn.izhaoo.com',
    port: '8888',
    imei: '000000000001000'
  } : props.location.state;

  let { ip: defaultIp, port: defaultPort, imei: defaultImei } = transferData as SettingData;
  return (
    <Form
      form={form}
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      name='basic'
      initialValues={{ remember: true, port: defaultPort, ip: defaultIp, imei: defaultImei }}
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
    >
      <Form.Item
        label='IP'
        name='ip'
        rules={[{ required: true, message: '输入服务器连接地址' }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label='Port'
        name='port'
        rules={[{ required: true, message: '输入服务器连接端口' }]}
      >
        <input />
      </Form.Item>

      <Form.Item
        label='Imei'
        name='imei'
        rules={[{ required: true, message: '输入模拟 IMEI[15位]', min: 15, max: 15 }]}
      >
        <input />
      </Form.Item>
      {/*<Form.Item {...tailLayout} name="remember" valuePropName="checked">*/}
      {/*  <Checkbox>Remember me</Checkbox>*/}
      {/*</Form.Item>*/}

      <Form.Item {...tailLayout}>
        <Button type='primary' htmlType='submit'>连接</Button>
      </Form.Item>
    </Form>
  );
}
