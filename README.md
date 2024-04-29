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

## example

Use the function `createBatch` to create a list with lipmaa links.

See [the diagram](https://github.com/AljoschaMeyer/bamboo?tab=readme-ov-file#links-and-entry-verification) of the list structure.

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

### create
Create a message.

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