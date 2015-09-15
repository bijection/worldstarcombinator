import React from 'react/addons'

import Router from 'react-router'
var { Route, DefaultRoute, RouteHandler, Link } = Router

import "babel/polyfill"

import store from './store.js'
import {WSItem, HNItem} from './item.js'
import {WSStory, HNStory} from './story.js'
import About from './about.js'  

import {BigLoading} from './loading.js'

import ago from './ago.js'
import ga from 'react-ga'


class App extends React.Component {
    // <Test />    

    render() {

        return (
            <div>
            <div className="App">
                <Header />
                <div className="Detail">
                    <RouteHandler/>
                </div>
                <Footer />
            </div>
            </div>
        )
    }
}

class Footer extends React.Component {
    render() {
        return <div className='footer'>
            Applications are open for WSC Winter 2016.
            <br />
            <a href='https://docs.google.com/forms/d/1tsOcHOsE66ZSadwsAWVWGBl-HfuQvbydPfgYUVQua4Y/viewform?usp=send_form'>Submit your Mixtape</a>
        </div>
    }
}

class Header extends React.Component {
    // <a href="newest">new</a> | 
            // <a href="newcomments">comments</a> | 
            // <a href="show">show</a> |
            // <a href="ask">ask</a> | <a href="jobs">jobs</a> |
            // <a href="submit">submit</a>
    render() {
        return <div className='header'>
            <img height="18" src="/img/y18.gif" className='logo' width="18" />

            <span className="pagetop">
            <b><Link to="/">World Star Combinator</Link></b>
            <Link to="about"><span className='about'>about</span></Link>

            </span>

        </div>
    }
}


class News extends React.Component {
    
    state={
        items: [],
        page: 1
    }

    componentDidMount() {
        if(store.ready){
            this.handleUpdate()
        }
        else{
            store.once('ready', () => this.handleUpdate())
        }
    }

    handleUpdate() {
        store.fetchItemsByPage(this.state.page, items => {
            this.setState({
                items: items
            })
        })
    }
        
    render() {

        var links = this.state.items.map((item, i) => {
            if(item.url && item.url.length) {
                return <HNItem key={i} data={{...item, rank:i+1}}/>
            }
            else if(item.videoFile) {
                return <WSItem key={i} data={{...item, rank:i+1}}/>
            }
        })
        return <div className='news'>{links.length?links:<BigLoading />}</div>
    }
}

class ErrorNotFoundPage extends React.Component {
    render() {
        return <div className='not-found'>Errour four ouh four</div>
    }
}

var routes = (
    <Route handler={App} path='/'>
        <DefaultRoute handler={News}/>
        <Route handler={HNStory} name='hnstory' path='hnstory/:id'/>
        <Route handler={WSStory} name='wsstory' path='wsstory/:id'/>
        <Route handler={About} name='about' path='about'/>
    </Route>
)

ga.initialize('UA-67384215-1')
Router.run(routes, Router.HistoryLocation, function (Handler, state) {
// Router.run(routes, function (Handler) {
    ga.pageview(state.pathname)
    React.render(<Handler/>, document.body)
})