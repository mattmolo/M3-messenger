import React, { Component } from 'react';
import './WebFrame.css';

class WebFrame extends Component {
    render() {
        const webviews = this.props.sites.map((s, i) => {
            const hidden = this.props['active-site'] !== i ? 'hidden' : '';
            return (
                <webview src={s.url} className={hidden} key={i} allowpopups/>
            );
        });

        return (
            <div className="WebFrame">
                {webviews}
            </div>
        );
    }
}

export default WebFrame;
