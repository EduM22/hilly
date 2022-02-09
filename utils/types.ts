export interface Product {
  id: string
  name: string
  image: Array<string>
  price: number
}

export interface Offer {
  id: string
  name: string
  products: Array<Product>
  currency: string
}

export interface Team {
  id: string
  name: string
  stripe: {
    id: string
  }
}