import React from 'react'
import ago from './ago.js'

import Router from 'react-router'
var { Route, DefaultRoute, RouteHandler, Link } = Router


export class HNItem extends React.Component {
    render() {
        const {
            by,
            descendants,
            id,
            kids,
            score,
            time,
            title,
            type,
            url,
            rank,
        } = this.props.data
        
        var site = url.split('://')[1].split('/')[0]
        if (site.indexOf('www.') > -1) site = site.split('www.')[1]

        return <div className='item'>
            {rank && <div className="title rank">
                {rank}.
            </div>}
            <div className='right'>
                <span className="title">
                    <span className="deadmark"></span>
                    <a href={url}>{title}</a>
                    <span className="sitebit comhead"> ({site})</span>
                </span>
                <br />
                <span className="subtext">
                    <span className="score">{score} points</span>
                    {' by '}
                    <a href='#'>{by}</a> 
                    {' '}
                    <Link to="hnstory" params={{id}}>{ago(time)} ago</Link>
                    {' | '}
                    <Link to="hnstory" params={{id}}>{descendants} comments</Link>
                </span>
            </div>
        </div>
    }
}
  

export class WSItem extends React.Component {
    render() {
        const {
            description,
            imageUrl,
            numberOfViews,
            postedDate,
            ratingPercentage,
            subtitle,
            title,
            uncut,
            videoDuration,
            videoFile,
            videoUniqueId,
            videoUrl,
            rank,
        } = this.props.data
        
        var site = 'worldstarhiphop.com'

        var id = videoUniqueId
        var by = description.indexOf('Posted By ') > -1 ? description.split('Posted By ')[1].split(' ')[0] : 'worldstar'

        return <div className='item'>
            {rank && <div className="title rank">
                {rank}.
            </div>}
            <div className='right'>
                <span className="title">
                    <span className="deadmark"></span>
                    <Link to="wsstory" params={{id}}>{title}</Link>
                    <span className="sitebit comhead"> ({site})</span>
                </span>
                <br />
                <span className="subtext">
                    <span className="score">{Math.floor(numberOfViews/1000)} points</span>
                    {' by '}
                    <a href='#'>{by}</a>
                    {' '}
                    <Link to="wsstory" params={{id}}>{ago(Date.now()/1000 - Math.random()*86400/2)} ago</Link>
                    {' | '}
                    <Link to="wsstory" params={{id}}>a few comments</Link>
                </span>
            </div>
        </div>
    }
}
  