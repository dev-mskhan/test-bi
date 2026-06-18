import crypto from 'crypto';
import { Request } from 'express';

export function verifySignature(req: Request, secret: string): void {
  const signature = req.headers['x-webhook-signature'] as string;
  if (!signature) throw new Error('Missing x-webhook-signature header');

  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  const sigBuffer  = Buffer.from(signature, 'hex');
  const expBuffer  = Buffer.from(expected,   'hex');

  if (
    sigBuffer.length !== expBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expBuffer)
  ) {
    throw new Error('Invalid signature');
  }
}