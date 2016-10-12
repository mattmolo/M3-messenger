import React, { Component } from 'react';
import ipcRenderer from 'electron'
import './WindowControls.css';

class WindowControls extends Component {

    close() {
        const sendClose = ipcRenderer.send.bind('close');
        return (
            <div className="close" onClick={sendClose}>x</div>
        );
    };
    /*

    maximize() {
        const sendMaximize = ipcRenderer.send.bind('maximize');
        return (
            <div onClick={sendMaximize}>□</div>
        );
    };

    minimize() {
        //{this.maximize()} {this.minimize()} {this.close()}
        //{this.close()} {this.maximize()} {this.minimize()}
        //
        const sendMinimize = ipcRenderer.send.bind('minimize');
        return (
            <div onClick={sendMinimize}>□</div>
        );
    };
    */

    buttons = process.platform === "darwin" ? (
        <div className="WindowControls-buttons WindowControls-left">
            {this.close()}
        </div>
    ) : (
        <div className="WindowControls-buttons WindowControls-right">
        </div>
    );
    render() {
        return this.buttons;
    }

    componentDidMount() {
        console.log("Mounted");
    }
}

export default WindowControls;
