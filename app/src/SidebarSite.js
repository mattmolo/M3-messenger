import React, { Component } from 'react';
import './SidebarSite.css';

class SidebarSite extends Component {
    render() {
        const title = this.props.site.site;
        const icon = this.props.site.icon;
        const text = this.props.children ? <p>{this.props.children}</p> : '';

        return (
            <div className="SidebarSite" title={title}>
                <div className="SidebarSite-icon" onClick={this.props.select}>
                    <img className={!this.props.active ? 'SidebarSite-dark' : ''}
                         src={icon} alt=""/>
                 </div>
                 {text}
            </div>
        );
    }
}

SidebarSite.propTypes = {
    children: React.PropTypes.string
};


export default SidebarSite;
