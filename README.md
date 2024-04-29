# ailuropoda

![tests](https://github.com/bicycle-codes/ailuropoda/actions/workflows/nodejs.yml/badge.svg)
[![types](https://img.shields.io/npm/types/@bicycle-codes/ailuropoda?style=flat-square)](README.md)
[![module](https://img.shields.io/badge/module-ESM%2FCJS-blue?style=flat-square)](README.md)
[![semantic versioning](https://img.shields.io/badge/semver-2.0.0-blue?logo=semver&style=flat-square)](https://semver.org/)
[![license](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](LICENSE)


Implementing [bamboo](https://github.com/AljoschaMeyer/bamboo), using only browser compatible cryptography.

Ailuropoda is the science name for a panda.

## install

```sh
npm i -S @bicycle-codes/ailuropoda
```

## use
Import types and functions.

```js
import {
    create as createMsg,
    SignedPost,
    lipmaaLink,
    createBatch,
    getLipmaaPath,
    isValid,
    verifyLipmaas
} from '@bicycle-codes/ailuropoda'
```

## data format
Log entries are `{ metadata, content }`, where metadata is
a signed object like below.

### Metadata
```ts
interface Metadata {
    timestamp:number;
    proof:string,
    key:string,
    seq:number;
    lipmaalink:string|null;
    prev:string|null;
    username:string;
    author:DID;
}
```

### SignedMetadata
```ts
import { SignedMessage } from '@bicycle-codes/message'

type SignedMetadata = SignedMessage<Metadata>
```

### Content
```ts
export interface Content {
    text:string,
    alt?:string[],
    mentions?:string[]
}
```

### SignedPost
```ts
type SignedPost = { metadata:SignedMetadata, content:Content }
```

## example
Use the function `createBatch` to create a list with lipmaa links.

See [the diagram](https://github.com/AljoschaMeyer/bamboo?tab=readme-ov-file#links-and-entry-verification) for a nice the list structure.

```ts
import { Identity, create as createID } from '@bicycle-codes/identity'
import { createCryptoComponent } from '@ssc-half-light/node-components'
import { createBatch } from '@bicycle-codes/ailuropoda'

const alicesCrytpo = await createCryptoComponent()
const alice = await createID(alicesCrytpo, {
    humanName: 'alice',
    humanReadableDeviceName: 'computer'
})

const newMsgs = [
    { content: { text: 'hello 1' } },
    { content: { text: 'hello 2' } },
    { content: { text: 'hello 3' } },
    { content: { text: 'hello 4' } },
    { content: { text: 'hello 5' } }
]

const list = await createBatch(alice, alicesCrytpo, {
    // we are just using an in-memory array of messages
    getKeyFromIndex: async (i:number, msgs:SignedPost[]) => {
        const msg = msgs[i]
        if (!msg) return null
        return msg.metadata.key
    }
}, newMsgs)  // pass in a list with message content
```

## API

### `create (user, crypto, opts)`
Create a message. This does not deal with lipmaa links. You would need to
pass them in.

```ts
async function create (
    user:Identity,
    crypto:Implementation,
    opts:{
        content:Content,
        limpaalink?:string|null,  // <-- the key of the lipmaa message
        seq:number,
        prev:SignedPost|null|undefined,
    }
):Promise<SignedPost>
```

```js
import { create as createMsg } from '@bicycle-codes/ailuropoda'

const post = await createMsg(
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
```

### `isValid (message)`

Verify a message. This does not look at links, only the signature.

```ts
async function isValid (msg:SignedPost):Promise<boolean>
```

```ts
const isOk = await isValid(post)
// => true
```

### `verifyLipmaas (list, { messageFromKey }, msg, path)`

Check that all the messages between the given message and message number 1 are
valid. This will use the shortest path from the given message to the
first message.

```ts
async function verifyLipmaas (
    list:SignedPost[],
    { messageFromKey }:{
        messageFromKey:(key:string)=>Promise<SignedPost>
    }, msg:SignedPost, path?:number[]
):Promise<{
    isOk: boolean,
    path:number[]
}>
```

```ts
const { isOk, path } = await verifyLipmaas(list2, {
    messageFromKey
}, list2[39])  // array is 0 indexed, so 39 is seq number 40

// isOk = true
// path = [40, 13, 4, 1]
```

### `getLipmaaPath (seq, prev)`
Get the shortest path between the given sequence number and
the first message.

```ts
function getLipmaaPath (seq:number, prev?:number[]):number[]
```

Return an array of sequence numbers, starting with the first:
```js
[ 1, 4, 13 ]
```

### `createBatch (user, crypto, opts, messages)`
Create a linked list of the given messages, with lipmaa links.

```ts
async function createBatch (
    user:Identity,
    crypto:Implementation,
    opts: {
        getKeyFromIndex:(i:number, msgs:SignedPost[]) => Promise<string|null>
    },
    msgs:{
        content:Content,
        seq?:number,
        prev?:SignedPost|null|undefined,
    }[],
    _out?:SignedPost[]
):Promise<SignedPost[]>
```

#### `createBatch` example

Create a linked list with in-memory content, starting from entry number 1.

Note in the example, `getKey` is synchronous, but we need to return a
promise because that's what the API expects.

Takes a parameter `getKeyFromIndex` that will return the key for an entry
given its index.

```ts
const newMsgs = [
    { content: { text: 'hello 1' } },
    { content: { text: 'hello 2' } },
    { content: { text: 'hello 3' } },
    { content: { text: 'hello 4' } },
    { content: { text: 'hello 5' } }
]

const list = await createBatch(alice, alicesCrytpo, {
    getKeyFromIndex: getKey
}, newMsgs)

async function getKey (i:number, msgs:SignedPost[]):Promise<string|null> {
    const msg = msgs[i]
    if (!msg) return null
    return msg.metadata.key
}
```

## docs
Generated via typescript.

[bicycle-codes.github.io/ailuropoda](https://bicycle-codes.github.io/ailuropoda/)
