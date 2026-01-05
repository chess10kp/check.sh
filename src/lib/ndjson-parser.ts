export async function readNdjsonStream(
  response: Response,
  handler: (data: any) => void
): Promise<void> {
  const stream = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await stream.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split(/\r?\n/);
    buffer = parts.pop() || '';

    for (const part of parts.filter(p => p)) {
      try {
        handler(JSON.parse(part));
      } catch (e) {
        console.error('Malformed NDJSON line:', e);
      }
    }
  }
}
