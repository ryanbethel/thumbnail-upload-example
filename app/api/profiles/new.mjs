import { join } from 'path'
import multipart from 'lambda-multipart-parser'
import crypto from 'crypto'
import Vips from 'wasm-vips'
import data from '@begin/data'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import fs from 'fs'
const env = process.env.ARC_ENV
const isLive = (env === 'staging' || env === 'production')
const staticDir = process.env.ARC_STATIC_BUCKET
const imageFolder = '.uploaded-images'
const REGION = process.env.AWS_REGION
import url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));


export async function get (req) {
  const problems = req.session.problems || {}
  const profile = req.session.profile || {}
  const {problems:oldProblems, profile:oldProfile, ...newSession} = req.session
  const newToken = crypto.randomUUID()
  return {
    session:{...newSession, profileSubmitToken:newToken},
    json: {problems,profile}
  }
}

export async function post (req) {
  // remove profile meta data from session
  const {problems:oldProblems, profile:oldProfile, profileSubmitToken, ...newSession} = req.session

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

  let problems = {}
  let firstname, lastname, filename
  try {
    // Validation
    firstname = parsedForm?.firstname
    if (firstname ==='') problems.firstname = 'First name should not be blank'
    lastname = parsedForm?.lastname
    if (lastname ==='') problems.lastname = 'Last name should not be blank'

    // Get uploaded image
    const preprocessed = parsedForm.files?.find(file=>file.fieldname==='processed-picture')
    const unprocessed = parsedForm.files?.find(file=>file.fieldname==='picture')

    // Use clientside processed image or resize on server
    const picture = preprocessed || unprocessed
    const pictureBuffer = picture.content
    const profilePicture = preprocessed ? pictureBuffer : await resize(pictureBuffer, 350)

    // Save the image to S3 bucket (or temp folder for local dev)
    filename = crypto.randomUUID()
    if (isLive) {
      const client = new S3Client({ region: REGION });
      const command = new PutObjectCommand({ Bucket:staticDir, Key:`${imageFolder}/${filename}`, Body: profilePicture})
      await client.send(command)
    }
    else {
      const imageDir = join(__dirname,'..','..','..',imageFolder)
      try {
        fs.mkdirSync(imageDir)
      } catch(e){ }
      fs.writeFileSync(join(imageDir,`${filename}`),profilePicture)
    }

  }
  catch(error){
    problems.form = 'there was an error'
  }
  
  // If validation problems found redirect back
  if (Object.keys(problems).length) {
    return {
      session: {...newSession, problems, profile:{firstname,lastname}},
      location: '/profiles/new'
    }
  }
  // Store profile and redirect to profiles list view
  else {
    await data.set({table:'profile', firstname, lastname, filename, submitToken:profileSubmitToken})
    return {
      session: {...newSession},
      location: '/profiles'
    }
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
