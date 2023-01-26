export default function ModalDialogTemplate({ html, state = {} }) {
  const { name = "" } = state.attrs;
  const mainContent = state.attrs?.["main-content-class"];
  return html`
    <style scope="global">
      body {
        position: relative;
      }
    </style>

    <style>
      :host > div {
        display: none;
        height: 100vh;
        width: 100vw;
        position: absolute;
      }

      :host > div > button.modal-overlay {
        height: 100vh;
        width: 100vw;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        opacity: 0.6;
        background-color: black;
      }

      :host > div > .modal-body {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        padding: 1rem;
        background: white;
      }

    </style>
    <span>
      <style>
        ${"." + mainContent} {
          position: absolute;
        }
        /* Set main to visibility hidden if modal open */
        /* :not([inert]) so when PE inert added visibility is not used */
        ${"." +
          mainContent}:not([inert]):has(input[form="${`modal-form-${name}`}"]:checked) {
          visibility: hidden;
        }
        /* Set modal to visible if modal open */
        body:has(input[form="${"modal-form-" + name}"]:checked)
          #modal-container-${name} {
          display: block;
        }
        button#modal-form-${name}-xclose {
        background-color:var(--secondary);
        width: 24px;
        height: 24px;
        padding: 0;
        float: right;

        }
      </style>
    </span>

    <div id="modal-container-${name}">
      <button
        class="modal-overlay"
        tabindex="-1"
        form="modal-form-${name}"
        type="reset"
      ></button>
      <div class="modal-body">
        <button tabindex="-1" form="modal-form-${name}" type="reset" id="modal-form-${name}-xclose" >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <slot></slot>
      </div>
      <form id="modal-form-${name}"></form>
    </div>

    <script type="module">
      class DialogModal extends HTMLElement {
        constructor() {
          super();
          this.form = this.querySelector("form#modal-form-${name}");
          this.inertMain = this.inertMain.bind(this);
          this.unInertMain = this.unInertMain.bind(this);
          this.escClose = this.escClose.bind(this);
          this.enterOpen = this.enterOpen.bind(this);
          this.form.addEventListener("reset", this.unInertMain);
          window.addEventListener("keyup", this.escClose);
        }
        connectedCallback() {
          this.mainContentClass = this.getAttribute("main-content-class");
          this.mainContent = document.querySelector(
            "." + this.mainContentClass
          );
          this.name = this.getAttribute("name");
          this.allTriggers = document.querySelectorAll(
            "input[type=checkbox][form=modal-form-" + this.name + "]"
          );
          this.allTriggers.forEach((trigger) => {
            trigger.addEventListener("change", this.inertMain);
            trigger.addEventListener("keydown", this.enterOpen);
          });
        }
        disconnectedCallback() {
          this.allTriggers.forEach((trigger) => {
            trigger.removeEventListener("change", this.inertMain);
            trigger.removeEventListener("keydown", this.enterOpen);
          });
          this.form.removeEventListener("reset", this.unInertMain);
          window.removeEventListener("keyup", this.escClose);
        }
        inertMain() {
          console.log("main is inert")
          this.mainContent.setAttribute("inert", "");
        }
        unInertMain() {
          console.log("main is uninerted")
          this.mainContent.removeAttribute("inert");
        }
        enterOpen(e) {
          if (e.code === "Enter") {
            e.target.checked = true;
            this.inertMain();
          }
        }
        escClose(e) {
          if (e.code === "Escape") {
            this.form.reset();
          }
        }
      }
      customElements.define("modal-dialog", DialogModal);
    </script>
  `;
}

