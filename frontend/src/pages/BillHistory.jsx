import { useEffect, useState } from 'react'
import { useProperty } from '../context/PropertyContext'
import { listBills, makePayment, getBillPdfUrl } from '../services/endpoints'
import { useToast } from '../context/ToastContext'
import { EmptyState, LoadingState, StatusTag } from '../components/UI'

const METHODS = ['UPI', 'Debit Card', 'Credit Card', 'Net Banking', 'QR Payment']

export default function BillHistory() {
  const { selectedProperty } = useProperty()
  const { showToast } = useToast()
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [payingBill, setPayingBill] = useState(null)
  const [method, setMethod] = useState('UPI')
  const [paying, setPaying] = useState(false)

  const load = () => {
    if (!selectedProperty) { setLoading(false); return }
    setLoading(true)
    listBills(selectedProperty.id).then((res) => setBills(res.data)).finally(() => setLoading(false))
  }
  useEffect(load, [selectedProperty])

  const handlePay = async () => {
    setPaying(true)
    try {
      const res = await makePayment({ bill_id: payingBill.id, method })
      showToast(`Payment successful! Ref: ${res.data.reference_id}`)
      setPayingBill(null)
      load()
    } catch (err) {
      showToast(err.response?.data?.detail || 'Payment failed', 'error')
    } finally {
      setPaying(false)
    }
  }

  if (!selectedProperty) return <EmptyState title="Select a property first" />
  if (loading) return <LoadingState />

  return (
    <div>
      <div className="page-header"><div className="page-title">Bill History — {selectedProperty.name}</div></div>
      {bills.length === 0 ? (
        <EmptyState title="No bills generated yet" subtitle="Use the Bill Estimator to generate your first bill." />
      ) : (
        <table className="table">
          <thead><tr><th>Cycle</th><th>Units</th><th>Total</th><th>Due Date</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {bills.map((b) => (
              <tr key={b.id}>
                <td>{b.cycle_start} to {b.cycle_end}</td>
                <td>{b.units_consumed} kWh</td>
                <td>₹{b.total_amount}</td>
                <td>{b.due_date}</td>
                <td><StatusTag status={b.status} /></td>
                <td style={{ display: 'flex', gap: 6 }}>
                  <a className="btn btn-outline btn-sm" href={getBillPdfUrl(b.id)} target="_blank" rel="noreferrer">PDF</a>
                  {b.status !== 'Paid' && (
                    <button className="btn btn-primary btn-sm" onClick={() => setPayingBill(b)}>Pay Now</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {payingBill && (
        <div className="modal-overlay" onClick={() => setPayingBill(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Pay Bill (Simulated)</h3>
            <p className="card-sub">Amount: ₹{payingBill.total_amount}</p>
            <div className="form-row">
              <label>Payment Method</label>
              <select value={method} onChange={(e) => setMethod(e.target.value)}>
                {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 16 }}>
              This is a simulated academic payment. No real card, UPI, or banking credentials are collected or stored.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setPayingBill(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handlePay} disabled={paying}>{paying ? 'Processing...' : 'Confirm Payment'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
