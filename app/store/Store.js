import { create } from 'zustand';

const useAppStore = create((set) => ({
  // State variables
  products: [],
  popups: [],
  metaobjects: [],
  collections: [],
  shop: {},
  plan:{},
  appEmbed:false,
  theme: "",
  setTheme:(theme)=> set({theme}),
  setAppEmbed:(appEmbed)=> set({appEmbed}),
  setPlan: (plan) => set({ plan }),

  setProducts: (products) => set({ products }),
  setPopups: (popups) => set({ popups }),
  setMetaobjects: (metaobjects) => set({ metaobjects }),
  setCollections: (collections) => set({ collections }),
  setShop: (shop) => set({ shop }),
}));

export default useAppStore;
