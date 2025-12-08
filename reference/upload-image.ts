import type { IncomingMessage, ServerResponse } from "http";
import fs from "fs";
import path from "path";

interface RequestWithBody extends IncomingMessage {
  body?: {
    image: string;
    mimeType: string;
  }
}

// api/upload-image.ts
export default async function handler(req: RequestWithBody, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  try {
    const { image, mimeType } = req.body ?? {};

    if (!image || !mimeType) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Missing image or mimeType' }));
      return;
    }
    
    const base64Data = image.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    
    const extension = mimeType.split('/')[1];
    const filePath = path.join(process.cwd(), `uploaded_image.${extension}`);

    fs.writeFileSync(filePath, buffer);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: 'Image uploaded successfully' }));
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Internal Server Error' }));
  }
}
