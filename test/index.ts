import { test } from '@bicycle-codes/tapzero'
import { components } from '@ssc-half-light/node-components'
import * as odd from '@oddjs/odd'
import { create as createMsg, SignedPost } from '../src/index.js'
import { create as createID, Identity } from '@bicycle-codes/identity'

let program:odd.Program
let alice:Identity

test('setup', async t => {
    program = await odd.assemble({
        namespace: { creator: 'test', name: 'testing' },
        debug: false
    }, components)

    alice = await createID(program.components.crypto, {
        humanName: 'alice',
        humanReadableDeviceName: 'computer'
    })

    t.ok(program, 'create a program')
    t.ok(alice, 'create an identity')
})

let post:SignedPost
test('create a new message', async t => {
    post = await createMsg(
        alice,
        program.components.crypto.keystore,
        {
            username: 'alice',
            seq: 1,
            prev: null,
            content: {
                text: 'hello'
            }
        }
    )

    t.ok(post, 'should create a message')
})
