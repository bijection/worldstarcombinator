//the hn part of this is partly canibalized from https://github.com/vuejs/vue-hackernews/blob/gh-pages/src/store.js

import Firebase from 'firebase'
var api = new Firebase('https://hacker-news.firebaseio.com/v0')

const storiesPerPage = 60

var cachedHNItemIds = []
var cachedWSItemIds = []
var cachedHNItems = {}
var cachedWSItems = {}

var cachedWSThreadURIs = {}
var cachedWSThreadComments = {}
var cachedWSThreadCommentIds = {}
var nextWSPagesToLoad = {}

import {EventEmitter as Emitter} from 'events'
var store = new Emitter()
store.ready = false


api.child('topstories').once('value', snapshot => {
    store.ready = true

    cachedHNItemIds = snapshot.val()

    var url = 'https://query.yahooapis.com/v1/public/yql?format=json&q=select%20%2a%20from%20json%20where%20url=%22http%3A%2F%2Fm.worldstarhiphop.com%2Fapi%2Fjs.1c.php%3Fn%3D0%26q%3Da%22'

    var oReq = new XMLHttpRequest();
    oReq.addEventListener('load', function() {

        const videos = JSON.parse(this.responseText).query.results.response.videos.video
        videos.forEach(video => {
            cachedWSItems[video.videoUniqueId] = video
            cachedWSItemIds.push(video.videoUniqueId)
        })

        store.emit('ready')
    })

    oReq.open("get", url, true);
    oReq.send();
})

store.fetchItem = (id, cb) => {
    if (cachedWSItems[id]) {
        cb(cachedWSItems[id])
    } else if (cachedHNItems[id]) {
        cb(cachedHNItems[id])
    } else {
        api.child('item/' + id).once('value', snapshot => {
            var story = snapshot.val()
            cachedHNItems[id] = story
            cb(story)
        })
    }
}

store.fetchItems = (ids, cb) => {
    if (!ids || !ids.length) return cb([])
    var items = new Array(ids.length)
    var numcomplete = 0
    ids.forEach( (id, i) => {
        store.fetchItem(id, item => {
            items[i] = item
            numcomplete++
            if (numcomplete >= ids.length) {
                cb(items)
            }
        })
    })
}


function shuffle(o){
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}

store.fetchItemsByPage = (page, cb) => {
    var start = (page - 1) * storiesPerPage
    var middle = page * storiesPerPage - Math.floor(storiesPerPage/2)
    var sids = cachedHNItemIds.slice(start, middle)
    var vids = cachedWSItemIds.slice(start, middle)

    var ids = shuffle(Array.from(new Array(storiesPerPage), (_,i) => i%2))
    .map(i => {
        if(i){
            return sids.shift()
        }
        return vids.shift()
    })

    store.fetchItems(ids, cb)
}

store.fetchUser = (id, cb) => {
    api.child('user/' + id).once('value', function (snapshot) {
        cb(snapshot.val())
    })
}


var _getWSThreadURI = (id, cb) => {
    var base = 'https://query.yahooapis.com/v1/public/yql?format=html&q=select%20%2a%20from%20html%20where%20url=%22http%3A%2F%2Fdisqus.com%2Fembed%2Fcomments%2F%3F%26version%3D3aa223e9358fe29f29e60acc6f5afcd4%26f%3Dworldstar%26t_u%3Dhttp%253A%252F%252Fwww.worldstarhiphop.com%252Fvideos%252Fvideo.php%253Fv%253D'
    var oReq = new XMLHttpRequest()
    oReq.addEventListener('load', function() {
        const thread = JSON.parse(this.responseText.split('"thread":"')[1].split('"')[0])
        cb(`https://query.yahooapis.com/v1/public/yql?format=json&q=select%20%2a%20from%20json%20where%20url=%22https%3A%2F%2Fdisqus.com%2Fapi%2F3.0%2Fthreads%2FlistPostsThreaded%3Flimit%3D50%26thread%3D${thread}%26forum%3Dworldstar%26order%3Ddesc%26api_key%3DE8Uh5l5fHZ6gD8U3KycjAIAk46f68Zw7C6eW8WSjZvCLXebZ7p0r1yrYDrLilk2F%26cursor%3D`)
    })
    oReq.open("get", base + id + '%22', true)
    oReq.send()
}

var nest = thread => {
    console.log(thread)
    var comments = {}
    thread.forEach(comment => {
        comments[comment.id] = comment
    })
    thread.forEach(comment => {
        var parentId = comment.parent
        if(parentId && comments[parentId]){
            var parent = comments[parentId]
            if(!parent.children) parent.children = []
            parent.children.push(comment)
        }            
    })
    return thread.filter(e=>!Boolean(Number(e.depth)))
}

var _fetchComments = (URI, page, cb) => {
    var oReq = new XMLHttpRequest()
    oReq.addEventListener('load', function() {
        const json = JSON.parse(this.responseText).query.results.json
        const {hasNext} = json.cursor
        const thread = nest(json.response)
        // cachedComments[thread]

        cb(thread, hasNext === 'true')
    })
    oReq.open("get", URI + page + '%3A0%3A0"', true)
    oReq.send()
}

var _toTime = comment => {
    if(!comment) return
    return new Date(comment.createdAt).getTime()
}

store.fetchMoreComments = (id, cb) => {
    var page = nextWSPagesToLoad[id] || 0

    var finishUp = (newComments, hasNext) => {

        var cachedComments = cachedWSThreadComments[id] || []
        var cachedCommentIds = cachedWSThreadCommentIds[id] || []
        var newCommentIds = newComments.map(c=>c.id)

        var index = cachedCommentIds.indexOf(newCommentIds[0])

        if(index > -1){
            console.log(1)
            var index2 = cachedCommentIds.indexOf(newCommentIds[newCommentIds.length -1])
            if (index2 > -1) {
                var i = index
                for (var comment of newComments) {
                    cachedComments[i] = comment
                    i++
                }
            }
            else {
                cachedComments = cachedComments.slice(0,index).concat(newComments)
                cachedCommentIds = cachedCommentIds.slice(0,index).concat(newCommentIds)
            }
        } else {
            index = cachedCommentIds.indexOf(newCommentIds[newCommentIds.length - 1])
            if (index > -1) {
                console.log(2)
                cachedComments = newComments.concat(cachedComments.slice(index))
                cachedCommentIds = newCommentIds.concat(cachedCommentIds.slice(index))
            }
            else {
                if( _toTime(cachedComments[0]) < _toTime(newComments[newComments.length -1]) ){
                    console.log(3)
                    cachedComments = newComments.concat(cachedComments)
                    cachedCommentIds = newCommentIds.concat(cachedCommentIds)
                }
                else {
                    console.log(4)
                    cachedComments = cachedComments.concat(newComments)
                    cachedCommentIds = cachedCommentIds.concat(newCommentIds)
                }
            }
        }

        cachedWSThreadComments[id] = cachedComments
        cachedWSThreadCommentIds[id] = cachedCommentIds

        // console.log(cachedCommentIds)

        if(hasNext){
            nextWSPagesToLoad[id] = page + 1
        }

        cb(cachedComments, hasNext)
    }


    if(cachedWSThreadURIs[id]){
        var URI = cachedWSThreadURIs[id]
        _fetchComments(URI, page, finishUp)    
    }
    else {
        _getWSThreadURI(id, URI => {
            cachedWSThreadURIs[id] = URI
            _fetchComments(URI, page, finishUp)
        })
    }
}

// export {store as default}
export default store