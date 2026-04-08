let state = { id: 0, message: '', type: 'info' };
let timer = null;
const listeners = new Set();

const emit = () => {
  listeners.forEach((listener) => listener(state));
};

export const subscribeNotification = (listener) => {
  listeners.add(listener);
  listener(state);
  return () => listeners.delete(listener);
};

export const showNotification = (message, type = 'info') => {
  const id = Date.now();
  state = { id, message, type };
  emit();
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    if (state.id === id) {
      state = { id: Date.now(), message: '', type: 'info' };
      emit();
    }
  }, 1000);
};