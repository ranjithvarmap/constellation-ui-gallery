/* Elements a <label for> can name (HTML "labelable elements", less the rare
   ones). A label pointing anywhere else names nothing: clicking it does not
   focus anything, and a screen reader does not read it with the content. */
const LABELABLE = new Set(['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'METER', 'OUTPUT', 'PROGRESS']);

/**
 * Describes each `<label for>` under `container` that names nothing: its
 * target is missing, or is not a form control. Tests expect an empty list.
 *
 * A Cosmos `FormField` renders `<label for={id}>`. Around a control that
 * takes an id, give both the same `id`; around anything else (a canvas, an
 * image, a chart, a `role` div), pass `labelAs='span'` and let the content
 * name itself.
 */
export const brokenLabelLinks = (container: ParentNode): string[] =>
  Array.from(container.querySelectorAll('label[for]')).flatMap((label) => {
    const target = label.ownerDocument.getElementById(label.getAttribute('for') ?? '');
    if (target && LABELABLE.has(target.tagName)) return [];
    return [`"${label.textContent}" -> ${target ? target.tagName.toLowerCase() : 'nothing'}`];
  });
