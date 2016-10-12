import React, { Component } from 'react';
import './SidebarSelector.css';

class SidebarSelector extends Component {
    yPosition() {
        /* This calculates the y position of the selection slider. A site with the
         * hotkey text is defined with withText and without the hotkey text is 
         * defined with withoutText. After 9 items in the list, there cannot be 
         * a Ctrl+10 hotkey, so we stop putting the text. This takes into account
         * the offset after 9 sites (which is why it's weird..)
         */
        const topOffset = 15;

        const withTextMultiple = 80;
        const withoutTextMultiple = 55;

        const withTextCount = (this.props.position <= 9 ? this.props.position : 9);
        const withoutTextCount = (this.props.position > 9 ? this.props.position-9 : 0);

        return topOffset + (withTextMultiple*withTextCount + withoutTextCount*withoutTextMultiple)
    };
    render() {
        return (
            <div className="SidebarSelector" style={{top: this.yPosition()}} />
        );
    }
}

export default SidebarSelector;
