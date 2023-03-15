import { Buffer } from 'buffer'
global.Buffer = global.Buffer || Buffer

import * as crypto from 'expo-crypto'
// @ts-ignore our Crypto polyfill doesn't include `subtle`
global.crypto = global.crypto || crypto
