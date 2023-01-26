import path from 'path'
import fs from 'fs'
import url from 'url';
import mimeTypes  from 'mime-types'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'

const env = process.env.ARC_ENV || process.env.NODE_ENV
const isLive = (env === 'staging' || env === 'production')
const Region = process.env.AWS_REGION
const fourOhFour = { statusCode: 404 }
const staticDir = process.env.ARC_STATIC_BUCKET

const imageFolder = '.uploaded-images'
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));



// function antiCache ({ mime }) {
//   return {
//     'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
//     'accept-ranges': 'bytes',
//     'content-type': `${mime}; charset=utf8`,
//   }
// }
function longCache ({ mime }) {
  return  {
    'cache-control': 'max-age=31536000',
    'content-type': `${mime}; charset=utf8`,
  }
}
function imageResponse ({ mime, buffer }){
  return { statusCode: 200,
    headers: longCache({ mime }),
    isBase64Encoded: true,
    body: buffer.toString('base64')
  }
}


export async function get (req) {
  let imageFilename = req.params.image.replace(/\/?image\//i, '')

  let mime, buffer
  try {
    if (isLive) {
      const client = new S3Client({ region: Region });
      const command = new GetObjectCommand({ Bucket:staticDir, Key:`${imageFolder}/${imageFilename}`})
      const result = await client.send(command)
      buffer = result.Body
      mime = result.ContentType
    }
    else {
    // read from local filesystem
      const imageDir = path.join(__dirname,'..','..','..',imageFolder)
      buffer = fs.readFileSync(path.join(imageDir,`${imageFilename}`))
      mime = mimeTypes.lookup(imageFilename)
    }
  }
  catch(e) {
    return fourOhFour
  }
  return imageResponse({ mime, buffer })
}


