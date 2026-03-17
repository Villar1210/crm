import https from 'https';

type RequestOptions = {
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: string;
};

const readResponse = (res: any) =>
  new Promise<string>((resolve, reject) => {
    let data = '';
    res.on('data', (chunk: string) => {
      data += chunk;
    });
    res.on('end', () => resolve(data));
    res.on('error', reject);
  });

export const requestJson = async <T = any>(url: string, options: RequestOptions = {}): Promise<T> => {
  const { method = 'GET', headers = {}, body } = options;
  const target = new URL(url);

  const requestOptions: https.RequestOptions = {
    method,
    hostname: target.hostname,
    path: `${target.pathname}${target.search}`,
    headers
  };

  return new Promise<T>((resolve, reject) => {
    const req = https.request(requestOptions, async (res) => {
      try {
        const raw = await readResponse(res);
        const statusCode = res.statusCode || 0;
        let parsed: any = raw;

        if (raw) {
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = raw;
          }
        }

        if (statusCode < 200 || statusCode >= 300) {
          const message =
            typeof parsed === 'string'
              ? parsed
              : parsed?.error?.message || parsed?.error_description || 'Request failed';
          const error = new Error(message);
          (error as any).statusCode = statusCode;
          (error as any).payload = parsed;
          reject(error);
          return;
        }

        resolve(parsed as T);
      } catch (error) {
        reject(error);
      }
    });

    req.on('error', reject);

    if (body) {
      req.write(body);
    }

    req.end();
  });
};

