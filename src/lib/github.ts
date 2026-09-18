export async function triggerHlsEncoding(opts: {
  r2Key: string;
  documentaryId: string;
}) {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_REPO_OWNER; // e.g. "Ambaza250"
  const repo = process.env.GITHUB_REPO_NAME;  // e.g. "ibyegeranyo"

  if (!token || !owner || !repo) {
    console.warn('GitHub token/repo not configured – skipping auto encoding');
    return;
  }

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/dispatches`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        event_type: 'encode-video',
        client_payload: {
          r2_key: opts.r2Key,
          documentary_id: opts.documentaryId,
        },
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to trigger GitHub Actions: ${res.status} ${text}`);
  }
}
