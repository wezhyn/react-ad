import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { Navigation } from './view';
import { Setting } from './setting';


export default function App() {
  return (
    <Router>
      <Switch>
        <Route path='/view' component={Navigation} />
        <Route path='/' component={Setting} />
      </Switch>
    </Router>
  );
}
