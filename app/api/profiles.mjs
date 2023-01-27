import data from '@begin/data'

export async function get (req) {
  const {profileSubmitToken, problems, profile, ...newSession} = req.session
  let profiles = await data.get({table:'profile'})
  if (profileSubmitToken) {
    const newProfile = profiles.find(p=>p.submitToken===profileSubmitToken)
    if (!newProfile) {
      await new Promise(resolve => setTimeout(resolve, 2000)) // wait 2sec
      profiles = await data.get({table:'profile'})
    }
  }
  return {
    session:newSession,
    json:{profiles}
  }
}

