import React from 'react'
import Spinner from 'react-spinner'

export class BigLoading extends React.Component {
    render() {
        return <div className='loading'><Spinner/></div>
    }
}

export class SmallLoading extends React.Component {
    render() {
        return <div className='loading-small'><Spinner/></div>
    }
}