import React from 'react';
import { Button, Form, Input } from 'antd';

const tailLayout = {
  wrapperCol: { offset: 8, span: 16 }
};

export function Setting() {
  const onFinish = (values: any) => {
    console.log('Success:', values);
  };

  const onFinishFailed = (errorInfo: any) => {
    console.log('Failed:', errorInfo);
  };
  return (
    <Form
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      name='basic'
      initialValues={{ remember: true, port: 3333, ip: '127.0.0.1' }}
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
        <Input.Password />
      </Form.Item>

      {/*<Form.Item {...tailLayout} name="remember" valuePropName="checked">*/}
      {/*  <Checkbox>Remember me</Checkbox>*/}
      {/*</Form.Item>*/}

      <Form.Item {...tailLayout}>
        <Button type='primary' htmlType='submit'>
          连接
        </Button>
      </Form.Item>
    </Form>
  );
}
