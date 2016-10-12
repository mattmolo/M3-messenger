import React, { Component } from 'react';
import './Sidebar.css';

import SidebarSite from './SidebarSite'
import SidebarSelector from './SidebarSelector'

class Sidebar extends Component {
    yPosition(i) {
        /* This calculates the y position of the selection slider. A site with the
         * hotkey text is defined with withText and without the hotkey text is 
         * defined with withoutText. After 9 items in the list, there cannot be 
         * a Ctrl+10 hotkey, so we stop putting the text. This takes into account
         * the offset after 9 sites (which is why it's weird..)
         */
        const withTextMultiple = 80;
        const withoutTextMultiple = 55;

        const withTextCount = (i <= 9 ? i : 9);
        const withoutTextCount = (i > 9 ? i-9 : 0);

        return (withTextMultiple*withTextCount + withoutTextCount*withoutTextMultiple);
    };

    handleClick(i) {
        /* Some black magic scrolling code. This sees if the element is offscreen
         * and if so, scrolls to the top or bottom of element, depending on if it's
         * hiding above the screen or below
         */
        const sidebar = document.getElementsByClassName('Sidebar')[0];
        const yOffset = this.yPosition(i);
        let scrollPosition = sidebar.scrollTop;
        if (yOffset < sidebar.scrollTop) {
            scrollPosition = yOffset;
        }
        else if (this.yPosition(i+1) > sidebar.scrollTop + sidebar.offsetHeight) {
            scrollPosition = this.yPosition(1+i) - sidebar.offsetHeight;
            if (i >= 9) scrollPosition += 10;
        }

        sidebar.scrollTop = scrollPosition;

        this.props['set-state']({active: i});
    };

    render() {
        const sites = this.props.sites.map((s, i) => {
            const onclicked = this.handleClick.bind(this, i);
            const text = i < 9 ? `Ctrl + ${i+1}` : '';
            const active = (i === this.props['active-site']);
            return (
                <SidebarSite site={s} active={active} select={onclicked} key={i}>
                    {text}
                </SidebarSite>
            )
        });
        return (
            <div className="Sidebar">
                <SidebarSelector position={this.props['active-site']} />
                {sites}
            </div>
        );
    }
}

export default Sidebar;

