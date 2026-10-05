import { registerServiceFormAdapters } from './form-adapters';

const initialized = new WeakSet<Document>();

/** Adapters are stateless and belong to the document, not a routed page. */
export function initializeServiceForms(root: Document = document) {
  if (initialized.has(root)) return;
  initialized.add(root);
  registerServiceFormAdapters();
  root.addEventListener('treeseed:form-success', event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (form.hasAttribute('data-service-disconnect')) {
      window.location.assign('/app/services');
    } else if (form.matches('[data-service-settings], [data-service-credentials]')) {
      const url = new URL(window.location.pathname, window.location.origin);
      if (form.hasAttribute('data-service-settings')) url.searchParams.set('edit', 'true');
      url.searchParams.set('tsToastSuccess', (event as CustomEvent).detail?.message ?? 'Saved.');
      window.location.assign(url.href);
    }
  });
}
