// View documentation at: https://enhance.dev/docs/learn/starter-project/pages
/**
  * @type {import('@enhance/types').EnhanceElemFn}
  */
export default function Html ({ html, state }) {
  const { store } = state
  let profiles = store.profiles || []

  return html`<enhance-page-container>
  <main>
    <h1 class="mb1 font-semibold text3">Profiles page</h1>
    ${profiles.map(item => `<article class="mb2">
<div class="mb0">
  <p class="pb-2"><strong class="capitalize">firstname: </strong>${item?.firstname || ''}</p>
  <p class="pb-2"><strong class="capitalize">lastname: </strong>${item?.lastname || ''}</p>
  <p class="pb-2"><strong class="capitalize">key: </strong>${item?.key || ''}</p>
  <img src="/image/${item?.filename}" alt="profile picture"/>
</div>
<p class="mb-1">
  <enhance-link href="/profiles/${item.key}">Edit this profile</enhance-link>
</p>
<form action="/profiles/${item.key}/delete" method="POST" class="mb-1">
  <enhance-submit-button><span slot="label">Delete this profile</span></enhance-submit-button>
</form>
</article>`).join('\n')}
</main>
</enhance-page-container>
  `
}
