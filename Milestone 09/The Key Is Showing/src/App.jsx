import { useState } from 'react';

function App() {
  const [notes, setNotes] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSummarize = async () => {
    if (!notes.trim()) return;
    
    setLoading(true);
    setError(null);
    setSummary('');

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      });

      const json = await response.json();
      if (!response.ok || json?.success === false) {
        throw new Error(json?.error || 'Failed to fetch summary');
      }

      setSummary(json.data.summary);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '600px',
      margin: '40px auto',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>NoteSnap</h1>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <textarea
          style={{
            width: '100%',
            height: '200px',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #ccc',
            fontSize: '16px',
            fontFamily: 'inherit',
            resize: 'vertical'
          }}
          placeholder="Paste your study notes here..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        
        <button
          onClick={handleSummarize}
          disabled={loading}
          style={{
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#007bff',
            color: 'white',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Summarising...' : 'Summarise Notes'}
        </button>
      </div>

      {error && (
        <div style={{
          marginTop: '20px',
          padding: '12px',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '8px',
          border: '1px solid #ef9a9a'
        }}>
          {error}
        </div>
      )}

      {summary && (
        <div style={{
          marginTop: '30px',
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e9ecef',
          lineHeight: '1.6'
        }}>
          <h2 style={{ marginTop: 0, fontSize: '18px' }}>Summary</h2>
          <div style={{ whiteSpace: 'pre-wrap' }}>{summary}</div>
        </div>
      )}
    </div>
  );
}

export default App;
