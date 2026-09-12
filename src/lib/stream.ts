const accountId = () => {
  const id = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!id) throw new Error('CLOUDFLARE_ACCOUNT_ID is not set');
  return id;
};

const streamToken = () => {
  const token = process.env.CLOUDFLARE_STREAM_API_TOKEN;
  if (!token) throw new Error('CLOUDFLARE_STREAM_API_TOKEN is not set');
  return token;
};

export function streamCustomerCode() {
  const code = process.env.CLOUDFLARE_STREAM_CUSTOMER_CODE;
  if (!code) throw new Error('CLOUDFLARE_STREAM_CUSTOMER_CODE is not set');
  return code;
}

type StreamCopyResult = {
  uid: string;
  readyToStream: boolean;
  status?: { state?: string };
};

/**
 * Tell Cloudflare Stream to pull a video from a temporary signed R2 URL
 * and encode it into adaptive qualities. Encoding is free.
 */
export async function copyVideoToStream(opts: {
  sourceUrl: string;
  name: string;
  requireSignedURLs?: boolean;
}): Promise<StreamCopyResult> {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId()}/stream/copy`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${streamToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: opts.sourceUrl,
        meta: { name: opts.name },
        requireSignedURLs: opts.requireSignedURLs ?? true,
      }),
    }
  );

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(
      `Stream copy failed: ${JSON.stringify(data.errors || data)}`
    );
  }

  return {
    uid: data.result.uid as string,
    readyToStream: Boolean(data.result.readyToStream),
    status: data.result.status,
  };
}

/**
 * Short-lived signed token so only authorized users can play a private Stream video.
 * Default expiry: 2 hours.
 */
export async function createStreamSignedToken(
  uid: string,
  expiresInSeconds = 2 * 60 * 60
): Promise<string> {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId()}/stream/${uid}/token`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${streamToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
      }),
    }
  );

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(
      `Stream token failed: ${JSON.stringify(data.errors || data)}`
    );
  }

  return data.result.token as string;
}

export function streamIframeSrc(tokenOrUid: string) {
  return `https://customer-${streamCustomerCode()}.cloudflarestream.com/${tokenOrUid}/iframe`;
}

export function streamHlsUrl(tokenOrUid: string) {
  return `https://customer-${streamCustomerCode()}.cloudflarestream.com/${tokenOrUid}/manifest/video.m3u8`;
}
