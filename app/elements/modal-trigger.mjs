export default function ModalTrigger({ html, state = {} }) {
  const { name = "" } = state.attrs;
  return html`
    <style>
      label > input {
        opacity: 0;
        position: absolute;
        height: 1px;
        width: 1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
        clip-path: inset(50%);
      }
    </style>
    <label>
      <slot></slot>
      <input type="checkbox" role="button" form="modal-form-${name}" />
    </label>
  `;
}

