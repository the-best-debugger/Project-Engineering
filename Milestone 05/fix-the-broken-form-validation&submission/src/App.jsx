// ============================================================
//  TrackFlow – Bug Report Form
//  Validation, submission lifecycle, and error handling.
//  Do NOT modify api.js or index.css.
// ============================================================

import { useState } from 'react'
import { submitBugReport } from './api'

const SEVERITIES = ['Critical', 'High', 'Medium', 'Low']
const COMPONENTS = ['Authentication', 'Dashboard', 'Billing', 'API', 'Notifications', 'Settings']

const EMPTY_FORM = {
  title: '',
  severity: '',
  component: '',
  description: '',
  steps: '',
  stepsCount: '',
}

/** @returns {Record<string, string>} field key → error message (empty object if valid) */
function validate(data) {
  const e = {}

  if (!data.title.trim()) {
    e.title = 'Bug title is required.'
  }
  if (!data.severity) {
    e.severity = 'Please select a severity.'
  }
  if (!data.component) {
    e.component = 'Please select an affected component.'
  }
  if (!data.description.trim()) {
    e.description = 'Description is required.'
  }

  const raw = data.stepsCount
  if (raw === '' || raw == null) {
    e.stepsCount = 'Number of steps is required.'
  } else {
    const n = Number(raw)
    if (!Number.isInteger(n) || n < 1) {
      e.stepsCount = 'Enter a whole number of steps (at least 1).'
    }
  }

  return e
}

function fieldBorderStyle(fieldName, errors) {
  return errors[fieldName] ? { borderColor: 'var(--danger)' } : undefined
}

export default function App() {
  const [form, setForm] = useState({ ...EMPTY_FORM })

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState(null)

  const [submitted, setSubmitted] = useState([])
  const [successId, setSuccessId] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    setErrors((prev) => {
      if (!prev[name]) return prev
      const next = { ...prev }
      delete next[name]
      return next
    })
    setServerError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setServerError(null)

    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length > 0) {
      return
    }

    setSuccessId(null)
    setLoading(true)
    try {
      const result = await submitBugReport(form)
      setSuccessId(result.id)
      setSubmitted((prev) => [result, ...prev])
      setForm({ ...EMPTY_FORM })
      setErrors({})
    } catch (err) {
      if (err && typeof err === 'object' && err.field) {
        setErrors((prev) => ({ ...prev, [err.field]: err.message || 'Invalid value.' }))
      } else {
        const msg =
          err && typeof err === 'object' && err.message
            ? err.message
            : 'Something went wrong. Please try again.'
        setServerError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const errTextStyle = { fontSize: 12, color: 'var(--danger)', marginTop: 6 }

  const sevClass = (s) =>
    ({ Critical: 'sev-critical', High: 'sev-high', Medium: 'sev-medium', Low: 'sev-low' }[s] ?? '')

  return (
    <div className="app-wrapper">
      <header className="app-header">
        <div className="badge">⬡ TrackFlow Internal Tools</div>
        <h1>Report a Bug</h1>
        <p>
          You're on the <strong>QA Engineering</strong> team at <strong>TrackFlow Inc.</strong> The
          team uses this form to log bugs before sprint planning every Monday. Help your teammates
          by making sure the form works correctly.
        </p>
      </header>

      <div className="card">
        <p className="section-label">New Bug Report</p>
        <form onSubmit={handleSubmit} noValidate>
          {successId && (
            <div
              style={{
                background: 'rgba(76,175,125,0.1)',
                border: '1px solid rgba(76,175,125,0.3)',
                borderRadius: 8,
                padding: '12px 16px',
                marginBottom: 20,
                fontSize: 14,
                color: '#4caf7d',
              }}
            >
              ✓ Bug <strong>{successId}</strong> filed successfully!
            </div>
          )}

          {serverError && (
            <div
              style={{
                background: 'rgba(247,95,95,0.1)',
                border: '1px solid rgba(247,95,95,0.3)',
                borderRadius: 8,
                padding: '12px 16px',
                marginBottom: 20,
                fontSize: 14,
                color: '#f75f5f',
              }}
            >
              {serverError}
            </div>
          )}

          <div className="form-group">
            <label>
              Bug Title <span className="req">*</span>
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Checkout button unresponsive on mobile Safari"
              style={fieldBorderStyle('title', errors)}
            />
            {errors.title && <p style={errTextStyle}>{errors.title}</p>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                Severity <span className="req">*</span>
              </label>
              <select name="severity" value={form.severity} onChange={handleChange} style={fieldBorderStyle('severity', errors)}>
                <option value="">— Select —</option>
                {SEVERITIES.map((s) => (
                  <option key={s}>
                    {s}
                  </option>
                ))}
              </select>
              {errors.severity && <p style={errTextStyle}>{errors.severity}</p>}
            </div>
            <div className="form-group">
              <label>
                Affected Component <span className="req">*</span>
              </label>
              <select name="component" value={form.component} onChange={handleChange} style={fieldBorderStyle('component', errors)}>
                <option value="">— Select —</option>
                {COMPONENTS.map((c) => (
                  <option key={c}>
                    {c}
                  </option>
                ))}
              </select>
              {errors.component && <p style={errTextStyle}>{errors.component}</p>}
            </div>
          </div>

          <div className="form-group">
            <label>
              Description <span className="req">*</span>
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe what's happening and what the expected behaviour should be…"
              style={fieldBorderStyle('description', errors)}
            />
            {errors.description && <p style={errTextStyle}>{errors.description}</p>}
          </div>

          <hr className="divider" />

          <div className="form-row">
            <div className="form-group">
              <label>Steps to Reproduce</label>
              <textarea
                name="steps"
                value={form.steps}
                onChange={handleChange}
                style={{ minHeight: 72 }}
                placeholder={'1. Go to…\n2. Click…\n3. Observe…'}
              />
            </div>
            <div className="form-group">
              <label>
                No. of Steps <span className="req">*</span>
              </label>
              <input
                type="number"
                name="stepsCount"
                value={form.stepsCount}
                onChange={handleChange}
                placeholder="e.g. 3"
                style={fieldBorderStyle('stepsCount', errors)}
              />
              {errors.stepsCount && <p style={errTextStyle}>{errors.stepsCount}</p>}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Submitting…' : 'Submit Bug Report'}
          </button>
        </form>
      </div>

      {submitted.length > 0 && (
        <div className="submitted-list">
          <p className="section-label" style={{ marginBottom: 8 }}>
            Filed This Session
          </p>
          {submitted.map((bug, i) => (
            <div key={i} className="submitted-item">
              <div>
                <div className="title">{bug.title}</div>
                <div className="meta">
                  {bug.component} · {bug.stepsCount} steps
                </div>
              </div>
              <span className={`severity-badge ${sevClass(bug.severity)}`}>{bug.severity}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
