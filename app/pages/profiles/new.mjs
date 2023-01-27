// View documentation at: https://enhance.dev/docs/learn/starter-project/pages
/**
  * @type {import('@enhance/types').EnhanceElemFn}
  */
export default function Html ({ html, state }) {
  const { store } = state
  const profile = store.profile || {}

  return html`
    <main class="container">
      <article>
      <h1>New Profile</h1>
      <form action="/profiles/new" method="POST" enctype=multipart/form-data>
        <label>First Name
          <input type="text" name="firstname" value="${profile?.firstname}"/> 
        </label>
        <label>First Name
          <input type="text" name="lastname" value="${profile?.lastname}"/> 
        </label>
        <label>
          Profile Picture
          <input type="file" autocomplete="off" name="picture" />
        </label>
        <img class="hidden" id="profile-preview" alt="profile picture preview"/>
        <input type=file name="processed-picture" class="hidden"/>
        <button type=submit >Save</button>
    </form>
      </article>
  </main>

  <script type=module >
    class PageProfilesNew extends HTMLElement {
      constructor() {
        super()
        this.form = this.querySelector('form')
        this.submitButton = this.querySelector('button[type=submit]')
        this.imageInput = this.querySelector('input[name=picture]')
        this.imagePreview = this.querySelector('#profile-preview')
        this.scaledImageInput = this.querySelector('input[name=processed-picture]')

        this.resize = this.resize.bind(this)
        this.dataURLtoBlob = this.dataURLtoBlob.bind(this)
        this.tempDisableSubmit = this.tempDisableSubmit.bind(this)

        this.form.addEventListener('submit', this.tempDisableSubmit)
        this.imageInput.addEventListener('change', (e)=>this.resize(e))       
      }

      tempDisableSubmit() {
        this.submitButton.disabled = true
        setTimeout(() => {this.submitButton.disabled = false }, 5000)
      }

      resize(e) {
        if (!e.target.files.length) return; // for when input type=file is set to null
        if (e.target.files) {
          let imageFile = e.target.files[0]
          const reader = new FileReader()
          reader.onload =  (e)=>{
            let image = document.createElement("img")
            image.onload = (event) => {

              const size = 350
              const width = image.width
              const height = image.height
              const widthScale = size/width
              const heightScale = size/height
              const outputScale = Math.min(widthScale,heightScale)
              const outWidth = outputScale*width
              const outHeight= outputScale*height

              const canvas = document.createElement("canvas")
              canvas.width = outWidth
              canvas.height = outHeight
              const context = canvas.getContext("2d")
              context.drawImage(image, 0, 0, outWidth, outHeight)

              const dataurl = canvas.toDataURL(imageFile.type)

              this.imagePreview.src = dataurl
              this.imagePreview.classList.remove("hidden")

              let fileName = 'scaled-image'
              let blob = this.dataURLtoBlob(dataurl)
              let file = new File([blob], fileName,{type:blob.type, lastModified:new Date().getTime()}, 'utf-8')
              let container = new DataTransfer() 
              container.items.add(file)
              this.scaledImageInput.files = container.files
              this.imageInput.value = null
            }
            image.src = e.target.result
          }
          reader.readAsDataURL(imageFile)
        }
      }

      dataURLtoBlob(dataurl) {
        let arr = dataurl.split(',') 
        const mime = arr[0].match(/:(.*?);/)[1]
        const bstr = atob(arr[1])
        const u8arr = new Uint8Array(n);
        let n = bstr.length
        while(n--){
          u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], {type:mime});
      }
    }

    customElements.define("page-profiles-new", PageProfilesNew)
  </script>

  `
}


