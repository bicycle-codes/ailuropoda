import { test } from '@bicycle-codes/tapzero'
import { createCryptoComponent } from '@ssc-half-light/node-components'
import { Identity, create as createID } from '@bicycle-codes/identity'
import { Implementation } from '@oddjs/odd/lib/components/crypto/implementation'
import {
    create as createMsg,
    SignedPost,
    lipmaaLink,
    createBatch,
    getLipmaaPath
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

let lipmaas:{ lipmaa:number, index:number }[]
test('get limpaa links', t => {
    const link = lipmaaLink(1)
    const arr = [...Array(41).keys()]
    lipmaas = arr.map(n => {
        return { lipmaa: lipmaaLink(n), index: n }
    })

    console.log('lipmaas', lipmaas)

    t.deepEqual(lipmaas, expectedLipmas(), 'should create a correct lipmaa list')

    t.ok(typeof link === 'number', 'should return a link')
})

test('get lipmaa path', t => {
    const path = getLipmaaPath(5)
    t.deepEqual(path, [1, 4], 'should return the correct path for seq 5')
    const path2 = getLipmaaPath(40)
    t.deepEqual(path2, [1, 4, 13], 'should return the right path for seq 40')
    const path3 = getLipmaaPath(28)
    t.deepEqual(path3, [1, 4, 13, 26, 27],
        'should return the correct path for seq 28')
})

async function getKey (i:number, msgs:SignedPost[]) {
    const msg = msgs[i + 1]  // 0 index vs 1 seq
    if (!msg) return null
    return msg.metadata.key
}

let list:SignedPost[]
test('create a linked list', async t => {
    const newMsgs = [
        { content: { text: 'hello 1' } },
        { content: { text: 'hello 2' } },
        { content: { text: 'hello 3' } },
        { content: { text: 'hello 4' } },
        { content: { text: 'hello 5' } }
    ]

    list = await createBatch(alice, alicesCrytpo, {
        getKeyFromIndex: getKey
    }, newMsgs)

    t.ok(list, 'should create a list')

    console.log('**the list**', list)
})

test('verify messages in the list', async t => {

})

function expectedLipmas () {
    return [
        { lipmaa: 0, index: 0 },
        { lipmaa: 0, index: 1 },
        { lipmaa: 1, index: 2 },
        { lipmaa: 2, index: 3 },
        { lipmaa: 1, index: 4 },
        { lipmaa: 4, index: 5 },
        { lipmaa: 5, index: 6 },
        { lipmaa: 6, index: 7 },
        { lipmaa: 4, index: 8 },
        { lipmaa: 8, index: 9 },
        { lipmaa: 9, index: 10 },
        { lipmaa: 10, index: 11 },
        { lipmaa: 8, index: 12 },
        { lipmaa: 4, index: 13 },
        { lipmaa: 13, index: 14 },
        { lipmaa: 14, index: 15 },
        { lipmaa: 15, index: 16 },
        { lipmaa: 13, index: 17 },
        { lipmaa: 17, index: 18 },
        { lipmaa: 18, index: 19 },
        { lipmaa: 19, index: 20 },
        { lipmaa: 17, index: 21 },
        { lipmaa: 21, index: 22 },
        { lipmaa: 22, index: 23 },
        { lipmaa: 23, index: 24 },
        { lipmaa: 21, index: 25 },
        { lipmaa: 13, index: 26 },
        { lipmaa: 26, index: 27 },
        { lipmaa: 27, index: 28 },
        { lipmaa: 28, index: 29 },
        { lipmaa: 26, index: 30 },
        { lipmaa: 30, index: 31 },
        { lipmaa: 31, index: 32 },
        { lipmaa: 32, index: 33 },
        { lipmaa: 30, index: 34 },
        { lipmaa: 34, index: 35 },
        { lipmaa: 35, index: 36 },
        { lipmaa: 36, index: 37 },
        { lipmaa: 34, index: 38 },
        { lipmaa: 26, index: 39 },
        { lipmaa: 13, index: 40 }
    ]
}
