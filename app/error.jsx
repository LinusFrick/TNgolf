'use client';

const ErrorPage = ({ statusCode }) => {
    return (
        <div>
            <h1>Error</h1>
            <p>{statusCode ? `Error occurred on the server: ${statusCode}` : 'Error occurred on the client'}</p>
            <button onClick={()=> window.location.reload()}>Try Again</button>
        </div>
    )
}