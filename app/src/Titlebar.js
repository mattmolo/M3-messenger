import React, { Component } from 'react';
import './Titlebar.css';

import WindowControls from './WindowControls'

class Titlebar extends Component {
    render() {
        let children = this.props.children;
        return (
            <div className="Titlebar">
                <WindowControls></WindowControls>
                <p>{children}</p>
            </div>
        );
    }
}

Titlebar.propTypes = {
    children: React.PropTypes.string
};

export default Titlebar;
