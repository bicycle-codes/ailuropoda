import { test } from '@bicycle-codes/tapzero'
import { createCryptoComponent } from '@ssc-half-light/node-components'
import { Identity, create as createID } from '@bicycle-codes/identity'
import { Implementation } from '@oddjs/odd/lib/components/crypto/implementation'
import {
    create as createMsg,
    SignedPost,
    lipmaaLink,
    createBatch,
    getLipmaaPath,
    isValid,
    verifyLipmaas
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

    t.ok(post, 'should create a message')
})

let lipmaas:{ lipmaa:number, n:number }[]
test('get limpaa links', t => {
    const arr = [...Array(41).keys()]
    lipmaas = arr.map(n => {
        return { lipmaa: lipmaaLink(n), n }
    })

    console.log('lipmaas', lipmaas)

    t.deepEqual(lipmaas, expectedLipmas(),
        'should create a correct lipmaa list')
})

test('get lipmaa path', t => {
    const path = getLipmaaPath(5)
    t.deepEqual(path, [1, 4], 'should return the correct path for seq 5')
    const path2 = getLipmaaPath(40)
    t.deepEqual(path2, [1, 4, 13], 'should return the right path for seq 40')
    const path3 = getLipmaaPath(28)
    t.deepEqual(path3, [1, 4, 13, 26, 27],
        'should return the correct path for seq 28')
    console.log('lipmaa path', path2)
})

async function getKey (i:number, msgs:SignedPost[]):Promise<string|null> {
    const msg = msgs[i]
    if (!msg) return null
    return msg.metadata.key
}

let list:SignedPost[]
let list2:SignedPost[]
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

    console.log('**the list**', list)

    t.ok(list, 'should create a list')

    t.equal(list[3].metadata.lipmaalink, list[0].metadata.key,
        'should have the right links')

    const arr = ([...Array(41).keys()]).map(i => {
        return { content: { text: 'hello ' + i } }
    })

    // create a list with 40 items
    list2 = await createBatch(alice, alicesCrytpo, {
        getKeyFromIndex: getKey
    }, arr)

    t.equal(list2[39].metadata.lipmaalink, list2[12].metadata.key,
        'should have the right link 40 -> 13')

    t.equal(list2[38].metadata.lipmaalink, list2[25].metadata.key,
        'should have the right linkt 39 -> 26')

    t.equal(list2[12].metadata.lipmaalink, list2[3].metadata.key,
        'should have the right link 13 -> 4')
})

test('verify messages', async t => {
    const isOk = await isValid(post)
    t.ok(isOk, 'A message can be verified')

    const notOk = await isValid(
        {
            ...post,
            metadata: {
                ...post.metadata,
                signature: post.metadata.signature + 'abc'
            }
        }
    )

    t.ok(!notOk, 'should not verify an invalid signature')
})

async function messageFromKey (key) {
    return list2.find(post => {
        return post.metadata.key === key
    }) as SignedPost
}

test('verify lipmaa links', async t => {
    const { isOk, path } = await verifyLipmaas(list2, {
        messageFromKey
    }, list2[39])

    t.ok(isOk, 'should verify message 40')
    t.deepEqual(path, [40, 13, 4, 1], 'should return the expected path')

    const { isOk: isOk2, path: path2 } = await verifyLipmaas(list2, {
        messageFromKey
    }, list2[24])
    t.ok(isOk2, 'should verify message 26')

    console.log('path2', path2)
})

function expectedLipmas () {
    return [
        { lipmaa: 0, n: 0 },
        { lipmaa: 0, n: 1 },
        { lipmaa: 1, n: 2 },
        { lipmaa: 2, n: 3 },
        { lipmaa: 1, n: 4 },
        { lipmaa: 4, n: 5 },
        { lipmaa: 5, n: 6 },
        { lipmaa: 6, n: 7 },
        { lipmaa: 4, n: 8 },
        { lipmaa: 8, n: 9 },
        { lipmaa: 9, n: 10 },
        { lipmaa: 10, n: 11 },
        { lipmaa: 8, n: 12 },
        { lipmaa: 4, n: 13 },
        { lipmaa: 13, n: 14 },
        { lipmaa: 14, n: 15 },
        { lipmaa: 15, n: 16 },
        { lipmaa: 13, n: 17 },
        { lipmaa: 17, n: 18 },
        { lipmaa: 18, n: 19 },
        { lipmaa: 19, n: 20 },
        { lipmaa: 17, n: 21 },
        { lipmaa: 21, n: 22 },
        { lipmaa: 22, n: 23 },
        { lipmaa: 23, n: 24 },
        { lipmaa: 21, n: 25 },
        { lipmaa: 13, n: 26 },
        { lipmaa: 26, n: 27 },
        { lipmaa: 27, n: 28 },
        { lipmaa: 28, n: 29 },
        { lipmaa: 26, n: 30 },
        { lipmaa: 30, n: 31 },
        { lipmaa: 31, n: 32 },
        { lipmaa: 32, n: 33 },
        { lipmaa: 30, n: 34 },
        { lipmaa: 34, n: 35 },
        { lipmaa: 35, n: 36 },
        { lipmaa: 36, n: 37 },
        { lipmaa: 34, n: 38 },
        { lipmaa: 26, n: 39 },
        { lipmaa: 13, n: 40 }
    ]
}
