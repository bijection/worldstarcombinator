import React from 'react/addons'
var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup

import Router from 'react-router'
var { Route, DefaultRoute, RouteHandler, Link } = Router

import InfiniteScrollBuilder from 'react-infinite-scroll'
var InfiniteScroll = InfiniteScrollBuilder(React)

import store from './store.js'
import ago from './ago.js'
import {HNItem, WSItem} from './item.js'
import {BigLoading, SmallLoading} from './loading.js'

class HNComment extends React.Component {

    state = {
        data:{},
        hasData: false
    }

    componentDidMount() {
        var {id} = this.props
        store.fetchItem(id, item => {
            // console.log(item)
            this.setState({
                data: item,
                hasData: true
            })
        })
    }

    render() {
        var {data, hasData} = this.state

        if (hasData) {

            var {text, time, by} = data

            return <div className='comment'>
                <div>
                    <span className='comhead'>
                        {by} {ago(time)} ago
                    </span>
                </div>
                {data.deleted ? '[deleted]' : <div className='comment-body' dangerouslySetInnerHTML={{__html: this.state.data.text}}/>}
                {data.kids && data.kids.map( kid => <HNComment id={kid} key={kid}/>)}
            </div>
        }

        return <SmallLoading/>
    }
}

export class HNStory extends React.Component {

    static contextTypes = {
        router: React.PropTypes.func
    }

    state={
        data:{},
        hasData: false
    }

    componentDidMount() {
        if(store.ready){
            this.handleUpdate()
        }
        else {
            store.once('ready', () => this.handleUpdate())
        }
    }

    handleUpdate() {
        var {id} = this.context.router.getCurrentParams()
        store.fetchItem(id, item => {
            console.log(item)
            this.setState({
                data: item,
                hasData: true
            })
        })
    }

    render() {

        var {data, hasData} = this.state
        // {data.kids && data.kids.map( kid => <HNComment id={kid} key={kid}/> )}

        if(hasData) {
            // console.log(data)
            return <div className="hnstory">
                    <HNItem data={data}/>
                        {data.kids && data.kids.map( kid => <div><HNComment id={kid} key={kid}/></div> )}
                </div>
        }

        return <BigLoading />
    }
}






export class WSStory extends React.Component {

    static contextTypes = {
        router: React.PropTypes.func
    }

    state = {
        data:{},
        hasData: false,
        hasComments: true,
        cachedComments:[],        
        cachedCommentIds:{},
        hasNext: true,  
    }

    componentDidMount() {
        if(store.ready){
            this.init()
        }
        else {
            store.once('ready', () => this.init())
        }
    }

    init() {
        var {id} = this.context.router.getCurrentParams()
        store.fetchItem(id, item => {
            console.log(item)

            this.setState({ 
                data: item,
                hasData: true,
            })

        }) 
    }

    update() {
        var {videoUrl} = this.state.data
        store.fetchMoreComments(videoUrl.split('v=')[1], (comments, hasNext) => {
            this.setState({
                hasNext,
                cachedComments: comments,
                hasComments: true
            })
        })
    }


    render() {

        var {data, hasData, cachedComments, hasComments, hasNext} = this.state

        if(hasData) {

            var {videoFile} = data
            var video
            if(videoFile.indexOf('youtube')>-1) {
                video = <embed className='video' 
                               width="100%" 
                               height="100%" 
                               name="plugin" 
                               src={videoFile.split('?')[0]+'?autoplay=1&'+videoFile.split('?')[1]} 
                               type="application/x-shockwave-flash" />
            }
            else {
                video = <video className='video' src={videoFile} autoPlay={true} controls/>
            }

            // console.log('wsstory', data)
            // console.log(cachedComments)
            return <div className="hnstory">
                <WSItem data={data}/>
                <div className='video-container'>
                    {video}
                </div>
                <InfiniteScroll
                    loadMore={() => this.update()}
                    hasMore={hasNext}
                    loader={<BigLoading />}>
                    {hasComments && cachedComments.map(comment => <WSComment data={comment} key={comment.id} />)}
                </InfiniteScroll>
            </div>
        }

        return <BigLoading />
    }
}

// http://disqus.com/embed/comments/?
// &version=3aa223e9358fe29f29e60acc6f5afcd4
// &f=worldstar
// &t_u=http%3A%2F%2Fwww.worldstarhiphop.com%2Fvideos%2Fvideo.php%3Fv%3Dwshhp93Bc7ILk3NDMoGo


class WSComment extends React.Component {

    render() {
        var {author, message, depth, createdAt, children} = this.props.data

        return <div className='comment comment--worldstar'>
            <div className='comhead'>
                {author.name} {ago((new Date(createdAt)).getTime()/1000)} ago
            </div>
            <div className='comment-body' dangerouslySetInnerHTML={{__html: message}} />
            {children && children.map(comment => <WSComment data={comment} key={comment.id} />)}
        </div>
    }

}

