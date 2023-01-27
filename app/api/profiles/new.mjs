import {join} from 'path'
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
  const token = crypto.randomUUID()
  return {
    session:{...req.session, profileSubmitToken:token}
  }
}


export async function post (req) {

  const profileSubmitToken = req.session.profileSubmitToken
  const ttl = (Date.now() / 1000) + (60 * 60 * 24 * 1) // One day
  const status = await data.get({table:'token', key:profileSubmitToken, ttl})
  if (status) {
    return {
      session:{...req.session, profileSubmitToken}, //submit token should already be present
      location: '/profiles'
    }
  }
  else {
    await data.set({table:'token', key:profileSubmitToken, ttl})

    const myReq = req
    myReq.body = req.rawBody
    const parsedUpload = await multipart.parse(myReq)

    let problems = {}
    let firstname, lastname, filename
    try {
      firstname = parsedUpload?.firstname
      if (firstname ==='') problems.firstname = 'First name should not be blank'
      lastname = parsedUpload?.lastname
      if (lastname ==='') problems.lastname = 'Last name should not be blank'

      filename = crypto.randomUUID()

      const preprocessed = parsedUpload.files?.find(file=>file.fieldname==='processed-picture')
      const unprocessed = parsedUpload.files?.find(file=>file.fieldname==='picture')

      const picture = preprocessed || unprocessed
      const pictureBuffer = picture.content
      const profilePicture = preprocessed ? pictureBuffer : await resize(pictureBuffer, 350)

      if (isLive) {
        const client = new S3Client({ region: REGION });
        const command = new PutObjectCommand({ Bucket:staticDir, Key:`${imageFolder}/${filename}`, Body: profilePicture})
        await client.send(command)
      }
      else {
        const imageDir = join(__dirname,'..','..','..',imageFolder)
        try {
          fs.mkdirSync(imageDir)
        } catch(e){
        }
        fs.writeFileSync(join(imageDir,`${filename}`),profilePicture)
      }

      await data.set({table:'profile', firstname, lastname, filename, submitToken:profileSubmitToken})
    }
    catch(error){
      problems.form = 'there was an error'
    }
    
    const {problems:oldProblems,...newSession} = req.session
    if (Object.keys(problems).length) {
      return {
        session: {...newSession, problems, profile:{firstname,lastname,filename}},
        location: '/profiles/new'
      }
    }
    else {
      return {
        session: {...newSession},
        location: '/profiles'
      }
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
