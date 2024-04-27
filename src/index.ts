import ts from 'monotonic-timestamp'
import type { Implementation } from '@oddjs/odd/components/crypto/implementation'
import { SignedMessage } from '@bicycle-codes/message'
import { createDebug } from '@nichoth/debug'
import { blake3 } from '@noble/hashes/blake3'
import { DID, Identity, sign } from '@bicycle-codes/identity'
import { toString } from 'uint8arrays/to-string'
import stringify from 'json-canon'
type KeyStore = Implementation['keystore']
const debug = createDebug()

export interface Metadata {
    timestamp:number;
    proof:string,
    key:string,
    seq:number;
    lipmalink:string;
    prev:string|null;
    username:string;
    author:DID;
}

export type SignedMetadata = SignedMessage<Metadata>

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
 * Create a new message by the given identity.
 *
 * @param user The identity that is creating the message
 * @param keystore A keystore instance
 * @param opts Message data
 */
export async function create (
    user:Identity,
    keystore:KeyStore,
    opts:{
        username:string,
        content:Content,
        seq:number,
        prev:SignedPost|null|undefined,  // the hash of the previous message
    }
):Promise<SignedPost> {
    const metadata:Partial<SignedMetadata> = {
        timestamp: ts(),
        proof: toString(blake3(stringify(opts.content)), 'base64pad'),
        author: user.rootDID,
        prev: '',
        lipmalink: '',
        username: user.username,
        seq: (opts.prev?.metadata.seq || 0) + 1,
    }

    const str = stringify(metadata)
    metadata.signature = toString(await sign(keystore, str), 'base64pad')
    const key = toString(blake3(str))

    return {
        metadata: { ...metadata, key } as SignedMetadata,
        content: opts.content
    }
}

/**
 * @see {@link https://github.com/AljoschaMeyer/bamboo?tab=readme-ov-file#concepts-and-properties bamboo docs}
 *
 * > Conceptually, an entry in the log is a tuple of
 *   - tag, either a zero byte (0x00) to indicate a regular log entry, or a one
 *     byte (0x01) to indicate an end-of-log marker. No other values are valid.
 *     This can serve as an extension point: Future protocols that should be
 *     compatible with bamboo can use different tag values to introduce new
 *     functionality, for example signing primitives other than ed25519.
 *   - author -- the public key
 *   - log ID -- a 64 bit integer serves to distinguish different logs by the
 *     same author, encoded as a canonical VarU64
 *   - sequence number of the entry (i.e. the offset in the log)
 *   - the backlink, a cryptographically secure hash of the previous entry in
 *     the log
 *   - the lipmaalink, a cryptographically secure hash of some older entry in
 *     the log, chosen such that there are short paths between any pair
 *     of entries
 *   - the hash of the actual payload of the entry
 *   - the size of the payload in bytes
 *   - a boolean that indicates whether this is a regular entry or an
 *     end-of-log marker
 *   - the digital signature of all the previous data, issued with the
 *     log's public key
 */

/**
 * Need to figure out the limpaa link.
 * Given a new entry and an existing log,
 * what is the lipma link in the new entry?
 */
