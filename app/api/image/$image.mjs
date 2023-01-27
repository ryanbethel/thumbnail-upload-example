import { join } from 'path'
import asap from '@architect/asap'
import fs from 'fs'
import url from 'url';
import { fileTypeFromBuffer } from 'file-type'

const env = process.env.ARC_ENV 
const isLocal = (env !== 'staging' && env !== 'production')

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

function escapeRegex (string) {return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }
const uploadFolderName = '.uploaded-images' 
const pathPrefix = '/image' // partial path to remove
const rootDir = join(__dirname,'..','..','..')
const imageDir = join(rootDir,uploadFolderName)

export async function get (req) {
  try {
    if (isLocal){
      let imageFilename = req.params.image

      const buffer = fs.readFileSync(join(imageDir,`${imageFilename}`))
      const mime = fileTypeFromBuffer(buffer)
      return { statusCode: 200,
        headers: {
         'cache-control': 'max-age=31536000',
         'content-type': `${mime}; charset=utf8`,
        },
        isBase64Encoded: true,
        body: buffer.toString('base64')
      }

    }
    else {
      const config = {
        assets: {},
        cacheControl: 'max-age=31536000',
      }
      req.rawPath = req.rawPath.replace(escapeRegex(pathPrefix), uploadFolderName)
      return asap(config)(req)
    }
  }
  catch(e) {
    return {
      statusCode:404
    }
  }

}


