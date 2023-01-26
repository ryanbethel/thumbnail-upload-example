import data from '@begin/data'
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

export async function get (req) {
  const {profileSubmitToken, ...newSession} = req.session
  let profiles = await data.get({table:'profile'})
  if (profileSubmitToken) {
    const newProfile = profiles.find(p=>p.submitToken===profileSubmitToken)
    if (!newProfile) {
      await sleep(2000)
      profiles = await data.get({table:'profile'})
    }
  }
  return {
    session:newSession,
    json:{profiles}
  }
}

