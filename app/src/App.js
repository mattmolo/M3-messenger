import React, { Component } from 'react';
import './App.css';

import Titlebar from './Titlebar'
import Sidebar from './Sidebar'
import WebFrame from './WebFrame'

let Sites;

class App extends Component {
    state = {
        active: 0,
        sites: Sites
    };

    render() {
        document.title = this.state.sites[this.state.active].site;
        return (
            <div className="App">
                <div className="App-titlebar">
                    <Titlebar>
                        {this.state.sites[this.state.active].site}
                    </Titlebar>
                </div>
                <div className="App-contents">
                    <Sidebar active-site={this.state.active} set-state={this.setState.bind(this)} sites={Sites} />
                    <WebFrame active-site={this.state.active} sites={Sites} />
                </div>
            </div>
        );
    }
}

export default App;
