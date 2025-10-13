import React, { useState } from 'react'
import Link from 'next/link'

'use client'


export default function Page() {
    const [message, setMessage] = useState<string | null>(null)
    const [working, setWorking] = useState(false)

    const handleClear = async () => {
        setWorking(true)
        try {
            // temporary "delete" action: clear local/session storage and simulate an async op
            localStorage.clear()
            sessionStorage.clear()
            await new Promise((r) => setTimeout(r, 300))
            setMessage('Temporary data cleared.')
        } catch {
            setMessage('Could not clear temporary data.')
        } finally {
            setWorking(false)
        }
    }

    return (
        <main style={{ padding: 24, fontFamily: 'Inter, system-ui, sans-serif' }}>
            <h1 style={{ margin: 0 }}>Temporary Page</h1>
            <p style={{ marginTop: 8 }}>
                This is a temporary placeholder for /how-to-delete. Use the button below to simulate deleting
                temporary client data.
            </p>

            <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
                <button
                    onClick={handleClear}
                    disabled={working}
                    style={{
                        padding: '8px 12px',
                        background: '#ef4444',
                        border: 'none',
                        color: 'white',
                        borderRadius: 6,
                        cursor: working ? 'default' : 'pointer',
                        opacity: working ? 0.7 : 1,
                    }}
                >
                    {working ? 'Clearing…' : 'Clear temp data'}
                </button>

                <Link href="/">
                    <a style={{ color: '#2563eb', textDecoration: 'underline' }}>Go home</a>
                </Link>
            </div>

            {message && <p style={{ marginTop: 12 }}>{message}</p>}
        </main>
    )
}
