/**
 * These polyfills are required for React Native to run crypto apps.
 * It's browser-like environment, but certain things will be missing/
 */

// Buffer
import { Buffer } from 'buffer'
global.Buffer = global.Buffer || Buffer

// Expo Crypto, safe way to generate random numbers etc., but does not contain `subtle`, which makes it a challange
// to use libraries such as `xmtp` unless you eject from Expo (not really recommended)
import * as crypto from 'expo-crypto'
// @ts-ignore our Crypto polyfill doesn't include `subtle`
global.crypto = global.crypto || crypto

// Shims for Ethersproject
import '@ethersproject/shims'
