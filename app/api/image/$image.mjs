import asap from '@architect/asap'
const env = process.env.ARC_ENV 
const isLocal = env === 'testing'

const uploadFolderName = '.uploaded-images' 

export async function get (req) {
  try {
    if (isLocal){
      const {join} = await import('path')
      const {readFileSync} = await import('fs')
      const {default:url} = await import('url')
      const {fileTypeFromBuffer} = await import('file-type')
      const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
      const rootDir = join(__dirname,'..','..','..')
      const imageDir = join(rootDir,uploadFolderName)
      const imageFilename = req.params.image

      const buffer = readFileSync(join(imageDir,imageFilename))
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
      function escapeRegex (string) { return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }
      const pathPrefix = '/image' // partial path to remove
      const config = {
        assets: {},
        cacheControl: 'max-age=31536000',
      }
      req.rawPath = req.rawPath.replace(escapeRegex(pathPrefix), '/'+uploadFolderName)
      return asap(config)(req)
    }
  }
  catch(e) {
    return {
      statusCode:404
    }
  }

}


