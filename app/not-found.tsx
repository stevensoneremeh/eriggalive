// Completely static 404 page - no imports from our components
export default function NotFound() {
  return (
    <html lang="en">
      <head>
        <title>404 - Page Not Found</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style
          dangerouslySetInnerHTML={{
            __html: `
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: #ffffff;
              color: #000000;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            
            @media (prefers-color-scheme: dark) {
              body {
                background: #000000;
                color: #ffffff;
              }
            }
            
            .container {
              text-align: center;
              padding: 2rem;
              max-width: 600px;
            }
            
            .error-code {
              font-size: 6rem;
              font-weight: bold;
              color: #f97316;
              margin-bottom: 1rem;
            }
            
            .error-title {
              font-size: 2rem;
              font-weight: 600;
              margin-bottom: 1rem;
            }
            
            .error-description {
              font-size: 1rem;
              opacity: 0.7;
              margin-bottom: 2rem;
              line-height: 1.5;
            }
            
            .button-group {
              display: flex;
              gap: 1rem;
              justify-content: center;
              flex-wrap: wrap;
            }
            
            .button {
              display: inline-flex;
              align-items: center;
              gap: 0.5rem;
              padding: 0.75rem 1.5rem;
              border-radius: 0.375rem;
              text-decoration: none;
              font-weight: 500;
              transition: all 0.2s;
              border: 1px solid transparent;
            }
            
            .button-primary {
              background: #84cc16;
              color: #134e4a;
            }
            
            .button-primary:hover {
              background: #65a30d;
            }
            
            .button-secondary {
              background: transparent;
              color: currentColor;
              border-color: currentColor;
              opacity: 0.7;
            }
            
            .button-secondary:hover {
              opacity: 1;
              background: rgba(255, 255, 255, 0.1);
            }
            
            @media (prefers-color-scheme: dark) {
              .button-secondary:hover {
                background: rgba(0, 0, 0, 0.1);
              }
            }
            
            .icon {
              width: 1rem;
              height: 1rem;
            }
            
            .footer-text {
              margin-top: 2rem;
              font-size: 0.875rem;
              opacity: 0.6;
            }
          `,
          }}
        />
      </head>
      <body>
        <div className="container">
          <div className="error-code">404</div>
          <h1 className="error-title">Page Not Found</h1>
          <p className="error-description">The page you're looking for doesn't exist or has been moved.</p>

          <div className="button-group">
            <a href="/" className="button button-primary">
              <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Return Home
            </a>

            <a href="/dashboard" className="button button-secondary">
              <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Go to Dashboard
            </a>
          </div>

          <p className="footer-text">If you believe this is an error, please contact support.</p>
        </div>
      </body>
    </html>
  )
}
