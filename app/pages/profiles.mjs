export default function Html ({ html, state }) {
  const { store } = state
  let profiles = store.profiles || []

  return html`
    <main class=container>
      <h1>Profiles page</h1>
      <a role=button href="/profiles/new">Add New Profile</a>
      ${profiles.map(item => `
        <article>
          <div>
            <p><strong class="capitalize">firstname: </strong>${item?.firstname || ''}</p>
            <p><strong class="capitalize">lastname: </strong>${item?.lastname || ''}</p>
            <p><strong class="capitalize">key: </strong>${item?.key || ''}</p>
            <img src="/image/${item?.filename}" alt="profile picture"/>
          </div>
        </article>
      `).join('\n')}
    </main>
  `
}
