import { useEffect, useState } from 'react'
import { useProperty } from '../context/PropertyContext'
import { listPayments, getReceiptUrl } from '../services/endpoints'
import { EmptyState, LoadingState, StatusTag } from '../components/UI'

export default function PaymentHistory() {
  const { selectedProperty } = useProperty()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!selectedProperty) { setLoading(false); return }
    setLoading(true)
    listPayments(selectedProperty.id).then((res) => setPayments(res.data)).finally(() => setLoading(false))
  }, [selectedProperty])

  if (!selectedProperty) return <EmptyState title="Select a property first" />
  if (loading) return <LoadingState />

  return (
    <div>
      <div className="page-header"><div className="page-title">Payment History — {selectedProperty.name}</div></div>
      {payments.length === 0 ? <EmptyState title="No payments made yet" /> : (
        <table className="table">
          <thead><tr><th>Reference</th><th>Amount</th><th>Method</th><th>Status</th><th>Paid At</th><th></th></tr></thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td>{p.reference_id}</td>
                <td>₹{p.amount}</td>
                <td>{p.method}</td>
                <td><StatusTag status={p.status} /></td>
                <td>{p.paid_at ? new Date(p.paid_at).toLocaleString() : '-'}</td>
                <td><a className="btn btn-outline btn-sm" href={getReceiptUrl(p.id)} target="_blank" rel="noreferrer">Receipt</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
