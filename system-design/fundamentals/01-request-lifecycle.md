# Request Lifecycle: TLS Handshake Overview

## TLS 1.2 vs TLS 1.3

This section explains how TLS establishes a secure connection and why TLS 1.3 is faster and safer than TLS 1.2.

### TLS 1.2 handshake flow (2 RTT)

1. **ClientHello**
   - Client sends supported TLS versions, cipher suites, random bytes, and supported extensions such as SNI and ALPN.
2. **ServerHello**
   - Server selects the TLS version and cipher suite, sends its random bytes, and replies with its certificate.
3. **Certificate**
   - Server sends its certificate chain for authentication.
4. **ServerKeyExchange**
   - Server sends key exchange parameters (for ECDHE) signed with its private key.
5. **ServerHelloDone**
   - Server signals the end of its initial handshake messages.
6. **ClientKeyExchange**
   - Client sends its ephemeral public key for key agreement.
7. **ChangeCipherSpec**
   - Client switches to encrypted mode.
8. **Finished**
   - Client sends a MAC over the handshake transcript.
9. **ChangeCipherSpec**
   - Server switches to encrypted mode.
10. **Finished**
   - Server sends its own MAC over the handshake transcript.

After this, application data can flow encrypted.

### TLS 1.3 handshake flow (1 RTT)

1. **ClientHello**
   - Client sends supported versions, cipher suites (AEAD only), random bytes, key-share for ECDHE, and extensions.
2. **ServerHello**
   - Server replies with chosen cipher suite, server random, and its key-share.
3. **Encrypted extensions**
   - Encrypted handshake extensions are sent.
4. **Certificate**
   - Server sends its certificate chain inside encrypted messages.
5. **CertificateVerify**
   - Server proves possession of the private key by signing the handshake transcript.
6. **Finished**
   - Server sends a MAC over the transcript.
7. **Finished**
   - Client sends its MAC and the connection is established.

Application data can start immediately after the handshake completes.

### Why TLS 1.3 is better

- **Fewer round trips**: TLS 1.3 reduces the handshake from 2 RTT to 1 RTT in the normal case.
- **Encrypted handshake**: More handshake messages are encrypted by default, protecting metadata and reducing downgrade attack surface.
- **Simpler key schedule**: Uses HKDF and a clear secret derivation path, improving forward secrecy and reducing protocol complexity.
- **Safer ciphers**: TLS 1.3 removes legacy, insecure options like static RSA key transport and weak MACs.

### Key differences at a glance

- TLS 1.2 uses a separate `ServerKeyExchange` message and exposes more handshake details in plaintext.
- TLS 1.3 encrypts certificate and verification messages after the initial `ServerHello`.
- TLS 1.3 can support 0-RTT data for resumed sessions, while TLS 1.2 cannot.
- TLS 1.3 simplifies the handshake and removes older cipher suites such as CBC-based MACs.

### When a resend occurs: HelloRetryRequest

- TLS 1.3 has a special exception called `HelloRetryRequest`.
- If the server does not accept the client's initial key-share group, the server requests a retry.
- This adds another round trip and effectively makes the connection require 2 RTT in that case.

## Summary

For modern secure request lifecycles, TLS 1.3 is the preferred handshake protocol because it is faster, more secure by design, and encrypts more of the negotiation compared to TLS 1.2.
