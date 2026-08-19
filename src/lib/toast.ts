export type ToastVariant = "success" | "error";
export type ToastMessage = { id: number; text: string; variant: ToastVariant };

type Listener = (toast: ToastMessage) => void;
const listeners = new Set<Listener>();
let counter = 0;

export function toast(text: string, variant: ToastVariant = "success") {
  const message: ToastMessage = { id: ++counter, text, variant };
  listeners.forEach((listener) => listener(message));
}

export function subscribeToast(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
