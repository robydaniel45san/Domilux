import { Link } from 'react-router-dom'
import { PageTitle } from '../components/PageTitle'
import ProductCard from '../components/ProductCard'
import { useStore } from '../context/StoreContext'
import { products } from '../data/products'

export default function Wishlist() {
  const { wishlist } = useStore()
  const items = products.filter((p) => wishlist.includes(p.id))
  return (
    <>
      <PageTitle title="Lista de deseos" />
      <div className="container-x py-10">
        {items.length === 0 ? (
          <>
            <p>Tu lista de deseos está vacía.</p>
            <Link to="/tienda" className="btn btn-outline mt-4">Volver a la tienda</Link>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
        )}
      </div>
    </>
  )
}
