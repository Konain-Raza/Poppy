import { create } from 'zustand';

const useAppStore = create((set) => ({
  // State variables
  products: [],
  popups: [],
  metaobject: null,

  // Setters
  setProducts: (products) => set({ products }),
  setPopups: (popups) => set({ popups }),
  setMetaobject: (metaobject) => set({ metaobject }),
}));

export default useAppStore;
