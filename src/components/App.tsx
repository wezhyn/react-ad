import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { View } from './view';

const Hello = (props: any) => {
  const { child } = props;
  return <div>{child}</div>;
};

export default function App() {
  return (
    <Router>
      <Switch>
        <Route path='/' component={View} />
      </Switch>
    </Router>
  );
}
