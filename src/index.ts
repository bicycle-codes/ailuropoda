import ts from 'monotonic-timestamp'
import { type DID } from '@substrate-system/keys'
import { EccKeys, verify } from '@substrate-system/keys/ecc'
import { blake3 } from '@noble/hashes/blake3.js'
import { toString } from 'uint8arrays/to-string'
import stringify from '@substrate-system/json-canon'

export { EccKeys }
export type { DID }

export interface Metadata {
    timestamp:number;
    proof:string,
    key:string,
    seq:number;
    lipmaalink:string|null;
    prev:string|null;
    username:string;
    author:DID;
}

export type SignedMetadata = Metadata & { signature:string }

/**
 * A simple identity object containing user info.
 */
export interface Identity {
    did:DID;
    username:string;
}

/**
 * `alt` should be an array of 'alt' strings, in the same order as
 * the provided `mentions`.
 */
export interface Content {
    text:string,
    alt?:string[],
    mentions?:string[]
}

export type SignedPost = { metadata:SignedMetadata, content:Content }
export type EncryptedPost = { metadata:SignedMetadata, content:string }

/**
 * Create a new message by the given identity. This *does not* calculate the
 * lipmaa link; it must be passed in.
 *
 * @param {Identity} user The identity that is creating the message
 * @param {EccKeys} keys A keypair instance from @substrate-system/keys
 * @param opts Message data
 */
export async function create (
    user:Identity,
    keys:EccKeys,
    opts:{
        content:Content,
        limpaalink?:string|null,  // <-- the key of the lipmaa message
        seq:number,
        prev:SignedPost|null|undefined,
    }
):Promise<SignedPost> {
    const metadata:Partial<SignedMetadata> = {
        timestamp: ts(),
        proof: toString(
            blake3(new TextEncoder().encode(stringify(opts.content))),
            'base64pad'
        ),
        author: user.did,
        prev: opts.prev?.metadata.key || null,  // hash of the previous message
        lipmaalink: opts.limpaalink,
        username: user.username,
        seq: (opts.prev?.metadata.seq || 0) + 1,
    }

    metadata.signature = await keys.signAsString(stringify(metadata))
    const key = toString(
        blake3(new TextEncoder().encode(stringify(metadata))),
        'base64url'
    )

    return {
        metadata: { ...metadata, key } as SignedMetadata,
        content: opts.content
    }
}

/**
 * Check that a signature matches the given message,
 * and check that the message's hash is correct.
 *
 * @param {SignedPost} msg The message to check
 * @returns {Promise<boolean>} True or false if the message is valid
 */
export async function isValid (msg:SignedPost):Promise<boolean> {
    const { signature, key, ..._msg } = msg.metadata
    const str = stringify(_msg)
    const hash = toString(
        blake3(new TextEncoder().encode(stringify({ ..._msg, signature }))),
        'base64url'
    )
    if (hash !== key) return false
    const isOk = await verify(str, signature, msg.metadata.author)
    return isOk
}

/**
 * Check that the given message is valid
 * @param {{ messageFromKey }} opts A function that returns a message given
 *  a key
 * @param {SignedPost} msg The message to check
 * @param {number[]} [path] Used internally, for recursion
 * @returns {Promise<{ isOk:boolean, path:number[] }>} The validity and the
 * path through the list.
 */
export async function verifyLipmaas ({
    messageFromKey
}:{
    messageFromKey:(key:string)=>Promise<SignedPost>
}, msg:SignedPost, path?:number[]):Promise<{ isOk: boolean, path:number[] }> {
    // find the shortest path to the first message

    path = (path || []).concat(msg.metadata.seq)

    /**
     * @TODO
     * Check that the message at the index for the given message's `limpaa(seq)`
     * is the message given by the lipmaa link.
     */

    // check the message signature
    const isOk = await isValid(msg)
    if (!isOk) return { isOk: false, path }

    // we are at the first message
    if (!msg.metadata.lipmaalink) {
        return {
            // be sure there is not an invalid sequence
            isOk: isOk && msg.metadata.seq <= 1,
            path
        }
    }

    const next = await messageFromKey(msg.metadata.lipmaalink)

    return await verifyLipmaas({ messageFromKey }, next, path)
}

export async function createBatch (
    user:Identity,
    keys:EccKeys,
    opts: {
        getKeyFromIndex:(i:number, msgs:SignedPost[]) => Promise<string|null>
    },
    msgs:{
        content:Content,
        seq?:number,
        prev?:SignedPost|null|undefined,
    }[],
    _out?:SignedPost[]
):Promise<SignedPost[]> {
    const out = _out || []

    if (!msgs.length) return out

    const msg = msgs.shift()
    const lipmaaIndex = lipmaaLink(
        msg?.seq ?? out.length + 1
    )

    const lipmaaKey = lipmaaIndex ?
        (await opts.getKeyFromIndex(
            lipmaaIndex - 1 < 0 ? 0 : lipmaaIndex - 1,
            out
        )) :
        null

    const newMsg = await create(user, keys, {
        ...msg!,
        seq: out.length,
        prev: out[out.length - 1] || null,
        limpaalink: lipmaaKey
    })

    out.push(newMsg)

    return createBatch(user, keys, opts, msgs, out)
}

/**
 * Get the shortest path to the first entry.
 *
 * @param index The index to get a path for
 */
export function getLipmaaPath (index:number, prev?:number[]):number[] {
    const n = lipmaaLink(index)
    if (n <= 1 && index < 3) {
        return prev || []
    }

    return getLipmaaPath(n, [n].concat(prev || []))
}

/**
 * Create a new message following the given previous message.
 */
export async function append (
    user:Identity,
    keys:EccKeys,
    opts:{
        getBySeq:(seq:number) => Promise<SignedPost>
        content:Content,
        prev:SignedPost
    }
):Promise<SignedPost> {
    const newSeq = opts.prev.metadata.seq + 1
    const lipmaaNumber = lipmaaLink(newSeq)
    const newMsg = await create(user, keys, {
        seq: newSeq,
        content: opts.content,
        prev: opts.prev,
        limpaalink: (await opts.getBySeq(lipmaaNumber)).metadata.key
    })

    return newMsg
}

/**
 * Calculate the lipma link for any entry.
 * This returns the `seq` number of the entry to link to.
 *
 * @see {@link https://github.com/AljoschaMeyer/bamboo?tab=readme-ov-file#concepts-and-properties bamboo docs}
 *
 * @param n The sequence number to calculate the link for.
 */
export function lipmaaLink (n:number):number {
    let m = 1
    let po3 = 3
    let x = n

    // find k such that (3^k - 1)/2 >= n
    while (m < n) {
        po3 = po3 * 3
        m = Math.floor((po3 - 1) / 2)
    }

    po3 = Math.floor(po3 / 3)

    // find longest possible backjump
    if (m !== n) {
        while (x !== 0) {
            m = Math.floor((po3 - 1) / 2)
            po3 = Math.floor(po3 / 3)
            x = x % m
        }

        if (m !== po3) {
            po3 = m
        }
    }

    return (n - po3) < 0 ? 0 : n - po3
}
