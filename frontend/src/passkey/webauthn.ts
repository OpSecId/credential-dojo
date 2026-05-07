function b64urlEncode(bytes: Uint8Array): string {
  let s = ''
  bytes.forEach((b) => (s += String.fromCharCode(b)))
  const b64 = btoa(s)
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4))
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function toArrayBuffer(u8: Uint8Array): ArrayBuffer {
  return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) as ArrayBuffer
}

export function isPasskeySupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    !!navigator.credentials
  )
}

export async function createLocalPasskey(options: {
  rpId?: string
  userName: string
  userDisplayName: string
}): Promise<{ credentialIdB64Url: string }> {
  if (!isPasskeySupported()) {
    throw new Error('Passkeys are not supported in this browser/device.')
  }

  const challenge = crypto.getRandomValues(new Uint8Array(32))
  const userId = crypto.getRandomValues(new Uint8Array(32))
  const rpId = options.rpId

  const cred = (await navigator.credentials.create({
    publicKey: {
      rp: {
        name: 'Credential Dojo',
        ...(rpId ? { id: rpId } : {}),
      },
      user: {
        id: userId,
        name: options.userName,
        displayName: options.userDisplayName,
      },
      challenge,
      pubKeyCredParams: [
        // ES256
        { type: 'public-key', alg: -7 },
        // RS256
        { type: 'public-key', alg: -257 },
      ],
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
      timeout: 60_000,
      attestation: 'none',
    },
  })) as PublicKeyCredential | null

  if (!cred) throw new Error('Passkey creation was cancelled or failed.')
  return { credentialIdB64Url: b64urlEncode(new Uint8Array(cred.rawId)) }
}

export async function assertLocalPasskey(credentialIdB64Url: string): Promise<void> {
  if (!isPasskeySupported()) {
    throw new Error('Passkeys are not supported in this browser/device.')
  }
  const challenge = crypto.getRandomValues(new Uint8Array(32))
  const allow = [
    {
      id: toArrayBuffer(b64urlDecode(credentialIdB64Url)),
      type: 'public-key' as const,
    },
  ]
  const res = (await navigator.credentials.get({
    publicKey: {
      challenge,
      allowCredentials: allow,
      timeout: 60_000,
      userVerification: 'preferred',
    },
  })) as PublicKeyCredential | null

  if (!res) throw new Error('Passkey assertion was cancelled or failed.')
}

