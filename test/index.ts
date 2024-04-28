import { test } from '@bicycle-codes/tapzero'
import { createCryptoComponent } from '@ssc-half-light/node-components'
import { Identity, create as createID } from '@bicycle-codes/identity'
import { Implementation } from '@oddjs/odd/lib/components/crypto/implementation'
import {
    create as createMsg,
    SignedPost,
    lipmaaLink,
    createBatch
} from '../src/index.js'

let alice:Identity
let alicesCrytpo:Implementation

test('setup', async t => {
    alicesCrytpo = await createCryptoComponent()

    alice = await createID(alicesCrytpo, {
        humanName: 'alice',
        humanReadableDeviceName: 'computer'
    })

    t.ok(alice, 'create an identity')
})

let post:SignedPost
test('create a new message', async t => {
    post = await createMsg(
        alice,
        alicesCrytpo,
        {
            seq: 1,
            prev: null,
            content: {
                text: 'hello'
            }
        }
    )

    console.log('**msg**', post)

    t.ok(post, 'should create a message')
})

test('get a limpaa link', t => {
    const link = lipmaaLink(1)
    console.log('**link**', link)
    const arr = [...Array(10).keys()]
    console.log('arrrr', arr.map(n => {
        return { lipmaa: lipmaaLink(n), index: n }
    }))
    t.ok(typeof link === 'number', 'should return a link')
})

test('create a linked list', async t => {
    const newMsgs = [
        { content: { text: 'hello1' } },
        { content: { text: 'hello1' } },
        { content: { text: 'hello1' } },
        { content: { text: 'hello1' } },
        { content: { text: 'hello1' } }
    ]

    const list = await createBatch(alice, alicesCrytpo, newMsgs)

    t.ok(list, 'should create a list')

    console.log('**the list**', list)
})
