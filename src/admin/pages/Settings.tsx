import { Database, RotateCcw } from 'lucide-react'
import { resetCatalog } from '../../data/products'
import { couponStore } from '../../store/coupons'
import { orderStore } from '../../store/orders'
import { defaultSettings, payLabels, settingsStore, updateSettings, useSettings, type PayMethod } from '../../store/settings'
import { Card, Field, PageHeader, Toggle } from '../ui'

export default function SettingsPage() {
  const s = useSettings()

  const resetAll = () => {
    if (!confirm('Esto borra pedidos, cupones, ajustes y cambios de catálogo de este navegador y vuelve a los datos de demostración. ¿Continuar?')) return
    resetCatalog()
    orderStore.reset()
    couponStore.reset()
    settingsStore.set(defaultSettings())
  }

  return (
    <>
      <PageHeader title="Configuración" desc="Pagos, inventario y datos de demostración." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Métodos de pago habilitados en el checkout">
          <ul className="divide-y divide-neutral-100">
            {(Object.keys(payLabels) as PayMethod[]).map((m) => (
              <li key={m} className="flex items-center justify-between py-3 text-sm">
                <span>{payLabels[m]}</span>
                <Toggle checked={s.payments[m]} onChange={(v) => updateSettings((x) => ({ ...x, payments: { ...x.payments, [m]: v } }))} label={payLabels[m]} />
              </li>
            ))}
          </ul>
          {!Object.values(s.payments).some(Boolean) && <p className="mt-2 text-sm text-red-600">Sin métodos de pago, nadie podrá finalizar una compra.</p>}
        </Card>

        <Card title="Inventario">
          <Field label="Alerta de stock bajo (unidades)" hint="Los productos con este stock o menos aparecen en alertas y en la lista de reposición.">
            <input type="number" min={0} className="input w-32" value={s.lowStock} onChange={(e) => updateSettings((x) => ({ ...x, lowStock: Math.max(0, Number(e.target.value)) }))} />
          </Field>
        </Card>

        <Card title="Datos y almacenamiento" className="lg:col-span-2">
          <div className="flex items-start gap-3 text-sm text-neutral-600">
            <Database className="mt-0.5 shrink-0 text-brand" size={20} />
            <p>Este panel es un <b>mockup sin backend</b>: pedidos, cupones, ajustes y ediciones de productos se guardan en el <code>localStorage</code> de este navegador. Los pedidos con la marca “demostración” se generan automáticamente para ver el panel con datos. Para producción, estas secciones se conectarían a la API de WooCommerce o a un backend propio (ver <code>ENV.md</code>).</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button onClick={() => confirm('¿Restablecer solo el catálogo (precios, stock, productos nuevos y eliminados)?') && resetCatalog()} className="btn btn-outline"><RotateCcw size={16} /> Restablecer catálogo</button>
            <button onClick={() => confirm('¿Regenerar los pedidos de demostración? Se pierden los pedidos actuales.') && orderStore.reset()} className="btn btn-outline"><RotateCcw size={16} /> Regenerar pedidos demo</button>
            <button onClick={resetAll} className="btn border border-red-300 text-red-700 hover:bg-red-50"><RotateCcw size={16} /> Restablecer todo</button>
          </div>
        </Card>
      </div>
    </>
  )
}
