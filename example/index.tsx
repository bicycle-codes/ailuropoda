import { render } from 'preact'
import { example } from '../src/index.js'

example()

function Example () {
    return (<div>hello</div>)
}

render((<Example />), document.getElementById('root')!)
