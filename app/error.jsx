'use client';

export default function ErrorPage({ error, reset }) {
    return (
        <div>
            <h1>Error</h1>
            <p>{error?.message || 'An error occurred'}</p>
            <button onClick={() => reset()}>Try Again</button>
        </div>
    )
}