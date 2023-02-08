import multipart from 'lambda-multipart-parser'
import crypto from 'crypto'
import Vips from 'wasm-vips'
import data from '@begin/data'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
const env = process.env.ARC_ENV
const isLocal = env === 'testing' 
const staticDir = process.env.ARC_STATIC_BUCKET
const imageFolder = '.uploaded-images'
const REGION = process.env.AWS_REGION


export async function get (req) {
  const profile = req.session.profile || {}
  const {profile:oldProfile, ...newSession} = req.session
  const newToken = crypto.randomUUID()
  return {
    session:{...newSession, profileSubmitToken:newToken},
    json: {profile}
  }
}

export async function post (req) {
  // remove profile meta data from session
  const {profile:oldProfile, profileSubmitToken, ...newSession} = req.session

  const submitting = await data.get({table:'token', key:profileSubmitToken})
  if (submitting) {
    return {
      session:{...req.session, profileSubmitToken},  
      location: '/profiles'
    }
  }

  const ttl = (Date.now() / 1000) + (60 * 60 * 24 * 1) // One day
  await data.set({table:'token', key:profileSubmitToken, ttl})

  const parsedForm = await multipart.parse({...req, body:req.rawBody})

  const firstname = parsedForm?.firstname
  const lastname = parsedForm?.lastname

  // Get uploaded image
  const preprocessed = parsedForm.files?.find(file=>file.fieldname==='processed-picture')
  const unprocessed = parsedForm.files?.find(file=>file.fieldname==='picture')

  // Use clientside processed image or resize on server
  const picture = preprocessed || unprocessed
  const pictureBuffer = picture.content
  const profilePicture = preprocessed ? pictureBuffer : await resize(pictureBuffer, 350)

  // Save the image to S3 bucket (or temp folder for local dev)
  const filename = crypto.randomUUID()
  if (isLocal) {
    const {writeFileSync,mkdirSync} = await import('fs')
    const {join} = await import('path')
    const {default:url} = await import('url')
    const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
    const imageDir = join(__dirname,'..','..','..',imageFolder)
    try {
      mkdirSync(imageDir)
    } catch(e){ }
    writeFileSync(join(imageDir,filename+'.jpeg'),profilePicture)
  }
  else {
    const client = new S3Client({ region: REGION });
    const command = new PutObjectCommand({ Bucket:staticDir, Key:`${imageFolder}/${filename}.jpeg`, Body: profilePicture})
    await client.send(command)
  }

  // Store profile and redirect to profiles list view
  await data.set({table:'profile', firstname, lastname, filename, submitToken:profileSubmitToken})
  return {
    session: {...newSession},
    location: '/profiles'
  }
}

async function resize(buffer, size){
  const vips = await Vips()
  const image = vips.Image.newFromBuffer(buffer)
  const heightIn = image.height
  const widthIn = image.width
  const output = image.resize(Math.min(size/heightIn,size/widthIn))
  return output.writeToBuffer('.jpeg')
}
